import assert from 'node:assert';

const BASE_URL = 'http://localhost:5000/api';

async function runChallengerStressTests() {
  console.log('🚀 [CHALLENGER 1] Starting Empirical Adversarial & Stress Testing for VietQR...\n');

  let passed = 0;
  let failed = 0;
  const anomalies: string[] = [];

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name} ->`, err.message);
      failed++;
    }
  }

  // --- Auth Setup ---
  let adminToken = '';
  let customerToken = '';
  let ordersStaffToken = '';
  let warehouseStaffToken = '';

  await test('Auth: Log in Admin, Customer, Orders Staff, Warehouse Staff', async () => {
    // Admin
    const aRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@techgear.vn', password: 'admin123' }),
    });
    const aJson: any = await aRes.json();
    assert.strictEqual(aJson.success, true, 'Admin login should succeed');
    adminToken = aJson.data.token;

    // Customer
    const cRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'trunglengoc220324@gmail.com', password: '123456' }),
    });
    const cJson: any = await cRes.json();
    assert.strictEqual(cJson.success, true, 'Customer login should succeed');
    customerToken = cJson.data.token;

    // Orders Staff
    const oRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'orders@techgear.vn', password: 'staff123' }),
    });
    const oJson: any = await oRes.json();
    assert.strictEqual(oJson.success, true, 'Orders staff login should succeed');
    ordersStaffToken = oJson.data.token;

    // Warehouse Staff
    const wRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'warehouse@techgear.vn', password: 'staff123' }),
    });
    const wJson: any = await wRes.json();
    assert.strictEqual(wJson.success, true, 'Warehouse staff login should succeed');
    warehouseStaffToken = wJson.data.token;
  });

  // Helper: Create an ONLINE order dynamically picking available product
  async function createTestOrder(paymentMethod = 'ONLINE') {
    const pRes = await fetch(`${BASE_URL}/products?limit=24`);
    const pJson: any = await pRes.json();
    const targetProduct = pJson.data.products.find((p: any) => p.stock > 0);
    if (!targetProduct) throw new Error('No product with stock > 0 found in catalog');

    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        customerInfo: {
          name: 'Challenger Tester',
          phone: '0901234567',
          address: '123 Stress Test Road, HN',
          note: 'Empirical Verification',
        },
        items: [{ productId: targetProduct._id, quantity: 1 }],
        paymentMethod,
      }),
    });
    const json: any = await res.json();
    if (!json.success || !json.data.order) {
      throw new Error(`Order creation failed: ${JSON.stringify(json)}`);
    }
    return json.data;
  }

  // =========================================================================
  // SUITE 1: Dual Lookup & Formatting Robustness (GET /orders/:id)
  // =========================================================================
  console.log('\n--- SUITE 1: Dual Lookup & Input Robustness ---');
  let order1Data: any = null;

  await test('Create base test order with ONLINE payment and verify paymentUrl', async () => {
    order1Data = await createTestOrder('ONLINE');
    assert.ok(order1Data.paymentUrl, 'paymentUrl must be returned for ONLINE order');
    assert.strictEqual(
      order1Data.paymentUrl,
      `/payment-qr?orderCode=${order1Data.order.orderCode}`,
      'paymentUrl must match /payment-qr?orderCode=...'
    );
  });

  await test('Lookup by exact MongoDB _id', async () => {
    const res = await fetch(`${BASE_URL}/orders/${order1Data.order._id}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 200);
    const json: any = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data._id, order1Data.order._id);
  });

  await test('Lookup by exact orderCode', async () => {
    const res = await fetch(`${BASE_URL}/orders/${order1Data.order.orderCode}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 200);
    const json: any = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.orderCode, order1Data.order.orderCode);
  });

  await test('Lookup by lowercase orderCode (case insensitivity)', async () => {
    const lowerCode = order1Data.order.orderCode.toLowerCase();
    const res = await fetch(`${BASE_URL}/orders/${lowerCode}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 200);
    const json: any = await res.json();
    assert.strictEqual(json.data.orderCode, order1Data.order.orderCode);
  });

  await test('Lookup with leading hash (#TG...) and whitespace padding', async () => {
    const paddedCode = `  #${order1Data.order.orderCode}  `;
    const res = await fetch(`${BASE_URL}/orders/${encodeURIComponent(paddedCode)}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 200);
    const json: any = await res.json();
    assert.strictEqual(json.data.orderCode, order1Data.order.orderCode);
  });

  await test('Lookup with non-existent alphanumeric orderCode returns 404', async () => {
    const res = await fetch(`${BASE_URL}/orders/TG-NONEXISTENT-9999`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 404);
  });

  await test('Lookup with non-existent valid ObjectId returns 404', async () => {
    const res = await fetch(`${BASE_URL}/orders/507f1f77bcf86cd799439011`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 404);
  });

  // =========================================================================
  // SUITE 2: POST /api/orders/:id/notify-paid Boundary & State Transitions
  // =========================================================================
  console.log('\n--- SUITE 2: POST /api/orders/:id/notify-paid ---');

  await test('notify-paid with valid orderCode transitions order to processing & pending', async () => {
    const orderData = await createTestOrder('ONLINE');
    const code = orderData.order.orderCode;

    const res = await fetch(`${BASE_URL}/orders/${code}/notify-paid`, {
      method: 'POST',
    });
    assert.strictEqual(res.status, 200);
    const json: any = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.orderStatus, 'processing');
    assert.strictEqual(json.data.paymentStatus, 'pending');
  });

  await test('notify-paid with MongoDB _id transitions order to processing & pending', async () => {
    const orderData = await createTestOrder('ONLINE');
    const mongoId = orderData.order._id;

    const res = await fetch(`${BASE_URL}/orders/${mongoId}/notify-paid`, {
      method: 'POST',
    });
    assert.strictEqual(res.status, 200);
    const json: any = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.orderStatus, 'processing');
    assert.strictEqual(json.data.paymentStatus, 'pending');
  });

  await test('notify-paid with lowercase code and # prefix works', async () => {
    const orderData = await createTestOrder('ONLINE');
    const inputId = `#${orderData.order.orderCode.toLowerCase()}`;

    const res = await fetch(`${BASE_URL}/orders/${encodeURIComponent(inputId)}/notify-paid`, {
      method: 'POST',
    });
    assert.strictEqual(res.status, 200);
    const json: any = await res.json();
    assert.strictEqual(json.data.orderStatus, 'processing');
  });

  await test('notify-paid is idempotent when called repeatedly', async () => {
    const orderData = await createTestOrder('ONLINE');
    const code = orderData.order.orderCode;

    const res1 = await fetch(`${BASE_URL}/orders/${code}/notify-paid`, { method: 'POST' });
    assert.strictEqual(res1.status, 200);

    const res2 = await fetch(`${BASE_URL}/orders/${code}/notify-paid`, { method: 'POST' });
    assert.strictEqual(res2.status, 200);
    const json2: any = await res2.json();
    assert.strictEqual(json2.data.orderStatus, 'processing');
    assert.strictEqual(json2.data.paymentStatus, 'pending');
  });

  await test('notify-paid preserves paid paymentStatus if order was already paid', async () => {
    const orderData = await createTestOrder('ONLINE');
    const code = orderData.order.orderCode;

    // Staff marks paid
    const vRes = await fetch(`${BASE_URL}/orders/${code}/verify-payment`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ordersStaffToken}` },
    });
    assert.strictEqual(vRes.status, 200);

    // Customer calls notify-paid afterwards
    const nRes = await fetch(`${BASE_URL}/orders/${code}/notify-paid`, { method: 'POST' });
    assert.strictEqual(nRes.status, 200);
    const nJson: any = await nRes.json();
    assert.strictEqual(nJson.data.paymentStatus, 'paid', 'paymentStatus must remain paid, NOT reverted to pending');
  });

  await test('notify-paid with invalid orderCode returns 404', async () => {
    const res = await fetch(`${BASE_URL}/orders/TG-INVALID-CODE-404/notify-paid`, {
      method: 'POST',
    });
    assert.strictEqual(res.status, 404);
    const json: any = await res.json();
    assert.strictEqual(json.success, false);
  });

  await test('notify-paid with non-existent valid ObjectId returns 404', async () => {
    const res = await fetch(`${BASE_URL}/orders/507f1f77bcf86cd799439011/notify-paid`, {
      method: 'POST',
    });
    assert.strictEqual(res.status, 404);
    const json: any = await res.json();
    assert.strictEqual(json.success, false);
  });

  await test('notify-paid REJECTS cancelled order with 400 Bad Request', async () => {
    const orderData = await createTestOrder('ONLINE');
    const orderId = orderData.order._id;
    const orderCode = orderData.order.orderCode;

    // Cancel order via admin
    const cRes = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ orderStatus: 'cancelled' }),
    });
    assert.strictEqual(cRes.status, 200);

    // Attempt notify-paid by orderCode
    const nRes1 = await fetch(`${BASE_URL}/orders/${orderCode}/notify-paid`, { method: 'POST' });
    assert.strictEqual(nRes1.status, 400, 'Must return 400 when order is cancelled');
    const nJson1: any = await nRes1.json();
    assert.strictEqual(nJson1.success, false);
    assert.ok(nJson1.message.includes('hủy'), 'Error message should mention cancelled order');

    // Attempt notify-paid by Mongo _id
    const nRes2 = await fetch(`${BASE_URL}/orders/${orderId}/notify-paid`, { method: 'POST' });
    assert.strictEqual(nRes2.status, 400, 'Must return 400 when order is cancelled');
  });

  await test('notify-paid REJECTS delivered order with 400 Bad Request', async () => {
    const orderData = await createTestOrder('ONLINE');
    const orderId = orderData.order._id;
    const orderCode = orderData.order.orderCode;

    // Advance order to processing -> shipping -> delivered
    for (const status of ['processing', 'shipping', 'delivered']) {
      const sRes = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ orderStatus: status }),
      });
      assert.strictEqual(sRes.status, 200, `Transition to ${status} should succeed`);
    }

    // Attempt notify-paid by orderCode
    const nRes1 = await fetch(`${BASE_URL}/orders/${orderCode}/notify-paid`, { method: 'POST' });
    assert.strictEqual(nRes1.status, 400, 'Must return 400 when order is delivered');
    const nJson1: any = await nRes1.json();
    assert.strictEqual(nJson1.success, false);
    assert.ok(nJson1.message.includes('hoàn tất'), 'Error message should mention delivered order');

    // Attempt notify-paid by Mongo _id
    const nRes2 = await fetch(`${BASE_URL}/orders/${orderId}/notify-paid`, { method: 'POST' });
    assert.strictEqual(nRes2.status, 400, 'Must return 400 when order is delivered');
  });

  // Edge Case: Shipping Order behavior on notify-paid
  await test('Edge Case: notify-paid behavior when order is in shipping state', async () => {
    const orderData = await createTestOrder('ONLINE');
    const orderId = orderData.order._id;
    const orderCode = orderData.order.orderCode;

    // Advance to processing -> shipping
    await fetch(`${BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ orderStatus: 'processing' }),
    });
    await fetch(`${BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ orderStatus: 'shipping' }),
    });

    const res = await fetch(`${BASE_URL}/orders/${orderCode}/notify-paid`, { method: 'POST' });
    const json: any = await res.json();
    if (json.data?.orderStatus === 'processing') {
      anomalies.push(
        'MINOR ANOMALY: When orderStatus is shipping, calling notifyPaid resets orderStatus back to processing instead of preserving shipping.'
      );
    }
  });

  // =========================================================================
  // SUITE 3: POST /api/orders/:id/verify-payment Security & Permissions & Idempotency
  // =========================================================================
  console.log('\n--- SUITE 3: POST /api/orders/:id/verify-payment ---');

  await test('verify-payment REJECTS unauthenticated requests (HTTP 401)', async () => {
    const orderData = await createTestOrder('ONLINE');
    const res = await fetch(`${BASE_URL}/orders/${orderData.order.orderCode}/verify-payment`, {
      method: 'POST',
    });
    assert.strictEqual(res.status, 401, 'Unauthenticated request must be 401');
  });

  await test('verify-payment REJECTS customer token (HTTP 403)', async () => {
    const orderData = await createTestOrder('ONLINE');
    const res = await fetch(`${BASE_URL}/orders/${orderData.order.orderCode}/verify-payment`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 403, 'Customer token must be 403');
  });

  await test('verify-payment REJECTS warehouse staff without orders permission (HTTP 403)', async () => {
    const orderData = await createTestOrder('ONLINE');
    const res = await fetch(`${BASE_URL}/orders/${orderData.order.orderCode}/verify-payment`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${warehouseStaffToken}` },
    });
    assert.strictEqual(res.status, 403, 'Warehouse staff must be 403');
  });

  await test('verify-payment SUCCEEDS with orders staff token using orderCode', async () => {
    const orderData = await createTestOrder('ONLINE');
    const res = await fetch(`${BASE_URL}/orders/${orderData.order.orderCode}/verify-payment`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ordersStaffToken}` },
    });
    assert.strictEqual(res.status, 200);
    const json: any = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.paymentStatus, 'paid');
    assert.strictEqual(json.data.orderStatus, 'processing', 'Pending order must advance to processing upon verification');
  });

  await test('verify-payment SUCCEEDS with orders staff token using Mongo _id', async () => {
    const orderData = await createTestOrder('ONLINE');
    const res = await fetch(`${BASE_URL}/orders/${orderData.order._id}/verify-payment`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ordersStaffToken}` },
    });
    assert.strictEqual(res.status, 200);
    const json: any = await res.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.paymentStatus, 'paid');
  });

  await test('verify-payment SUCCEEDS with admin token', async () => {
    const orderData = await createTestOrder('ONLINE');
    const res = await fetch(`${BASE_URL}/orders/${orderData.order.orderCode}/verify-payment`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const json: any = await res.json();
    assert.strictEqual(json.data.paymentStatus, 'paid');
  });

  await test('verify-payment is idempotent when repeated', async () => {
    const orderData = await createTestOrder('ONLINE');
    const code = orderData.order.orderCode;

    const res1 = await fetch(`${BASE_URL}/orders/${code}/verify-payment`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ordersStaffToken}` },
    });
    assert.strictEqual(res1.status, 200);

    const res2 = await fetch(`${BASE_URL}/orders/${code}/verify-payment`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ordersStaffToken}` },
    });
    assert.strictEqual(res2.status, 200);
    const json2: any = await res2.json();
    assert.strictEqual(json2.success, true);
    assert.strictEqual(json2.data.paymentStatus, 'paid');
    assert.ok(json2.message.includes('trước đó'), 'Message should note already verified');
  });

  await test('verify-payment on non-existent order returns 404', async () => {
    const res = await fetch(`${BASE_URL}/orders/TG-NOTFOUND-999/verify-payment`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${ordersStaffToken}` },
    });
    assert.strictEqual(res.status, 404);
  });

  // =========================================================================
  // SUITE 4: Concurrency & Race Condition Stress Harness
  // =========================================================================
  console.log('\n--- SUITE 4: Concurrency & Stress Testing ---');

  await test('Stress: 25 simultaneous concurrent notify-paid requests', async () => {
    const orderData = await createTestOrder('ONLINE');
    const code = orderData.order.orderCode;

    const promises = Array.from({ length: 25 }, () =>
      fetch(`${BASE_URL}/orders/${code}/notify-paid`, { method: 'POST' })
    );

    const responses = await Promise.all(promises);
    const statusCodes = responses.map((r) => r.status);
    const all200 = statusCodes.every((s) => s === 200);
    assert.ok(all200, `All 25 concurrent requests must return 200 OK. Received: ${[...new Set(statusCodes)]}`);

    // Verify final state
    const checkRes = await fetch(`${BASE_URL}/orders/${code}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const checkJson: any = await checkRes.json();
    assert.strictEqual(checkJson.data.orderStatus, 'processing');
    assert.strictEqual(checkJson.data.paymentStatus, 'pending');
  });

  await test('Stress: 25 simultaneous concurrent verify-payment requests', async () => {
    const orderData = await createTestOrder('ONLINE');
    const code = orderData.order.orderCode;

    const promises = Array.from({ length: 25 }, () =>
      fetch(`${BASE_URL}/orders/${code}/verify-payment`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ordersStaffToken}` },
      })
    );

    const responses = await Promise.all(promises);
    const statusCodes = responses.map((r) => r.status);
    const all200 = statusCodes.every((s) => s === 200);
    assert.ok(all200, `All 25 concurrent verify requests must return 200 OK. Received: ${[...new Set(statusCodes)]}`);

    const checkRes = await fetch(`${BASE_URL}/orders/${code}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const checkJson: any = await checkRes.json();
    assert.strictEqual(checkJson.data.paymentStatus, 'paid');
    assert.strictEqual(checkJson.data.orderStatus, 'processing');
  });

  await test('Race Condition: 15 notify-paid vs 15 verify-payment concurrently', async () => {
    const orderData = await createTestOrder('ONLINE');
    const code = orderData.order.orderCode;

    const mixedRequests: Promise<Response>[] = [];
    for (let i = 0; i < 15; i++) {
      mixedRequests.push(fetch(`${BASE_URL}/orders/${code}/notify-paid`, { method: 'POST' }));
      mixedRequests.push(
        fetch(`${BASE_URL}/orders/${code}/verify-payment`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${ordersStaffToken}` },
        })
      );
    }

    const responses = await Promise.all(mixedRequests);
    assert.ok(responses.every((r) => r.status === 200), 'All 30 mixed requests must return 200 OK');

    // Crucial: paymentStatus must converge to 'paid', NEVER reverted to 'pending'!
    const checkRes = await fetch(`${BASE_URL}/orders/${code}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const checkJson: any = await checkRes.json();
    assert.strictEqual(
      checkJson.data.paymentStatus,
      'paid',
      'CRITICAL: paymentStatus must be paid after verify-payment, even if notify-paid arrived concurrently!'
    );
    assert.strictEqual(checkJson.data.orderStatus, 'processing');
  });

  // =========================================================================
  // Summary
  // =========================================================================
  console.log('\n======================================================');
  console.log(`🎯 [CHALLENGER 1 SUMMARY] Passed: ${passed} | Failed: ${failed}`);
  if (anomalies.length > 0) {
    console.log('⚠️ [ANOMALIES DETECTED]:');
    for (const a of anomalies) {
      console.log('  -', a);
    }
  } else {
    console.log('✨ [NO ANOMALIES DETECTED]');
  }
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runChallengerStressTests().catch((err) => {
  console.error('Fatal stress test runner error:', err);
  process.exit(1);
});
