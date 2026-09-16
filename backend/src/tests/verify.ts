/**
 * Verification Test Suite for TechGear E-Commerce Platform
 */
import crypto from 'crypto';

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 [TEST SUITE] Starting comprehensive verification tests...\n');
  let passed = 0;
  let failed = 0;

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

  // 1. Health Check
  await test('Backend Health Check', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data: any = await res.json();
    if (data.status !== 'ok') throw new Error('Health check status is not ok');
  });

  // 2. Fetch Products and Filters
  await test('Fetch Products Catalog & Pagination', async () => {
    const res = await fetch(`${BASE_URL}/products?limit=5`);
    const json: any = await res.json();
    if (!json.success || json.data.products.length !== 5 || json.data.pagination.total < 20) {
      throw new Error('Products catalog pagination failed');
    }
  });

  await test('Filter Products by Category & Specs', async () => {
    const res = await fetch(`${BASE_URL}/products?category=keyboard&switchType=Magnetic`);
    const json: any = await res.json();
    if (!json.success || json.data.products.length === 0) {
      throw new Error('Filter by keyboard and magnetic switch failed');
    }
  });

  await test('Filter Products by Refresh Rate', async () => {
    const res = await fetch(`${BASE_URL}/products?category=monitor&refreshRate=240Hz`);
    const json: any = await res.json();
    if (!json.success || json.data.products.length === 0) {
      throw new Error('Filter by monitor refreshRate 240Hz failed');
    }
  });

  await test('Filter Metadata (Categories & Brands)', async () => {
    const res = await fetch(`${BASE_URL}/products/filters`);
    const json: any = await res.json();
    if (!json.success || !json.data.brands || Object.keys(json.data.categoriesCount).length < 4) {
      throw new Error('Filter metadata missing brands or categories');
    }
  });

  // 3. Auth Tests
  let adminToken = '';
  let customerToken = '';

  await test('Admin Login', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@techgear.vn', password: 'admin123' }),
    });
    const json: any = await res.json();
    if (!json.success || json.data.user.role !== 'admin') {
      throw new Error('Admin login failed');
    }
    adminToken = json.data.token;
  });

  await test('Customer Login', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'trunglengoc220324@gmail.com', password: '123456' }),
    });
    const json: any = await res.json();
    if (!json.success || json.data.user.role !== 'customer') {
      throw new Error('Customer login failed');
    }
    customerToken = json.data.token;
  });

  // 4. Order Creation, Stock Deduction & Stock Limit Check
  let testOrderCode = '';
  let testProductId = '';
  let stockBefore = 0;

  await test('Order Creation & Stock Check', async () => {
    const pRes = await fetch(`${BASE_URL}/products?limit=1`);
    const pJson: any = await pRes.json();
    const product = pJson.data.products[0];
    testProductId = product._id;
    stockBefore = product.stock;

    const oRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        customerInfo: {
          name: 'Nguyễn Test Order',
          phone: '0999888777',
          address: '123 Đường Test, Quận 1',
          note: 'Giao nhanh test',
        },
        items: [{ productId: product._id, quantity: 1 }],
        paymentMethod: 'ONLINE',
      }),
    });

    const oJson: any = await oRes.json();
    if (!oJson.success || !oJson.data.order || !oJson.data.paymentUrl) {
      throw new Error('Order creation failed or paymentUrl missing');
    }
    testOrderCode = oJson.data.order.orderCode;

    // Check stock was deducted
    const pAfterRes = await fetch(`${BASE_URL}/products/${product.slug}`);
    const pAfterJson: any = await pAfterRes.json();
    if (pAfterJson.data.product.stock !== stockBefore - 1) {
      throw new Error(`Stock deduction failed: was ${stockBefore}, now ${pAfterJson.data.product.stock}`);
    }
  });

  await test('Stock Validation Boundary (Prevent Over-ordering)', async () => {
    const oRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerInfo: { name: 'Test Limit', phone: '0999888777', address: 'HN' },
        items: [{ productId: testProductId, quantity: 99999 }],
        paymentMethod: 'COD',
      }),
    });
    const oJson: any = await oRes.json();
    if (oJson.success) {
      throw new Error('Order should have failed due to insufficient stock!');
    }
  });

  // 5. Concurrency Race Condition Safety Test
  await test('Concurrent Order Race Condition Safety (Zero Overselling)', async () => {
    // Create or adjust a test product with stock = 1
    const pRes = await fetch(`${BASE_URL}/products?limit=10`);
    const pJson: any = await pRes.json();
    const targetProduct = pJson.data.products.find((p: any) => p.stock > 0);
    if (!targetProduct) throw new Error('No product available for concurrency test');

    // Temporarily set stock to exactly 1
    await fetch(`${BASE_URL}/products/${targetProduct._id}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ changeAmount: 1 - targetProduct.stock }),
    });

    // Fire 5 concurrent order attempts simultaneously for the single remaining stock
    const orderPromises = Array.from({ length: 5 }, (_, i) =>
      fetch(`${BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerInfo: { name: `Racer ${i}`, phone: `090000000${i}`, address: 'HCMC' },
          items: [{ productId: targetProduct._id, quantity: 1 }],
          paymentMethod: 'COD',
        }),
      }).then((r) => r.json() as Promise<any>)
    );

    const results = await Promise.all(orderPromises);
    const successfulOrders = results.filter((r) => r.success === true);
    const failedOrders = results.filter((r) => r.success === false);

    if (successfulOrders.length !== 1) {
      throw new Error(`Race condition bug: expected exactly 1 order to succeed, got ${successfulOrders.length}`);
    }
    if (failedOrders.length !== 4) {
      throw new Error(`Expected 4 orders to fail due to stock depletion, got ${failedOrders.length}`);
    }

    // Check stock is exactly 0 and NEVER negative
    const pCheckRes = await fetch(`${BASE_URL}/products/${targetProduct.slug}`);
    const pCheckJson: any = await pCheckRes.json();
    if (pCheckJson.data.product.stock < 0) {
      throw new Error(`Race condition fatal error: negative stock detected: ${pCheckJson.data.product.stock}`);
    }

    // Restore stock
    await fetch(`${BASE_URL}/products/${targetProduct._id}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ changeAmount: targetProduct.stock }),
    });
  });

  // 6. Order Tracking Lookup
  await test('Public Order Tracking Lookup', async () => {
    const res = await fetch(`${BASE_URL}/orders/lookup?orderCode=${testOrderCode}&phone=0999888777`);
    const json: any = await res.json();
    if (!json.success || json.data.orderCode !== testOrderCode) {
      throw new Error('Order tracking lookup failed');
    }
  });

  // 7. Payment Gateway Webhook Confirmation
  await test('Payment Gateway HMAC SHA256 Webhook Confirmation', async () => {
    const hashSecret = process.env.VNPAY_HASH_SECRET || 'VNPAYTECHGEARSECRETKEY2026SANDBOX';
    const payload = {
      orderCode: testOrderCode,
      paymentStatus: 'paid',
      transactionNo: `VNPAY_TXN_${Date.now()}`,
    };
    const signature = crypto
      .createHmac('sha256', hashSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const res = await fetch(`${BASE_URL}/orders/payment/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': signature,
      },
      body: JSON.stringify(payload),
    });
    const json: any = await res.json();
    if (!json.success || json.data?.paymentStatus !== 'paid') {
      throw new Error('Payment webhook confirmation failed to set status to paid');
    }
  });

  // 8. VNPAY IPN & Webhook Handling
  await test('VNPAY IPN Checksum & Confirmation Webhook', async () => {
    // Test invalid checksum
    const invalidIpnRes = await fetch(`${BASE_URL}/orders/payment/vnpay-ipn?vnp_TxnRef=${testOrderCode}&vnp_SecureHash=invalid_hash`);
    const invalidIpnJson: any = await invalidIpnRes.json();
    if (invalidIpnJson.RspCode !== '97') {
      throw new Error(`Expected RspCode 97 for invalid checksum, got ${invalidIpnJson.RspCode}`);
    }
  });

  await test('HMAC SHA256 Payment Webhook Handler', async () => {
    const hashSecret = process.env.VNPAY_HASH_SECRET || 'VNPAYTECHGEARSECRETKEY2026SANDBOX';
    const payload = {
      orderCode: testOrderCode,
      paymentStatus: 'paid',
      transactionNo: 'VNPAY_WEBHOOK_123456',
    };
    const signature = crypto
      .createHmac('sha256', hashSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const res = await fetch(`${BASE_URL}/orders/payment/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': signature,
      },
      body: JSON.stringify(payload),
    });
    const json: any = await res.json();
    if (!json.success || json.data?.paymentStatus !== 'paid') {
      throw new Error('HMAC SHA256 Webhook processing failed');
    }
  });

  // 9. Order Cancellation & Stock Restoration
  await test('Order Cancellation & Stock Restoration', async () => {
    const lookupRes = await fetch(`${BASE_URL}/orders/lookup?orderCode=${testOrderCode}&phone=0999888777`);
    const lookupJson: any = await lookupRes.json();
    const orderId = lookupJson.data._id;

    const res = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ orderStatus: 'cancelled' }),
    });

    const json: any = await res.json();
    if (!json.success || json.data.orderStatus !== 'cancelled') {
      throw new Error('Failed to cancel order');
    }

    // Verify stock restored
    const pCheck = await fetch(`${BASE_URL}/products/${lookupJson.data.items[0].productId._id || lookupJson.data.items[0].productId}`);
    const pCheckJson: any = await pCheck.json();
    if (pCheckJson.data.product.stock !== stockBefore) {
      throw new Error(`Stock not restored: expected ${stockBefore}, got ${pCheckJson.data.product.stock}`);
    }
  });

  // 9b. Sequential Order Lifecycle Transitions & COD Auto-Paid
  await test('Sequential Order Lifecycle Transitions & COD Auto-Paid', async () => {
    const pRes = await fetch(`${BASE_URL}/products?limit=20`);
    const pJson: any = await pRes.json();
    const productFor9b = pJson.data.products.find((p: any) => p.stock >= 2) || pJson.data.products[0];

    // 1. Create COD order
    const oRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        customerInfo: {
          name: 'COD Lifecycle Tester',
          phone: '0988776655',
          address: '456 Le Loi, Quan 1, HCMC',
        },
        items: [{ productId: productFor9b._id, quantity: 1 }],
        paymentMethod: 'COD',
      }),
    });
    const oJson: any = await oRes.json();
    if (!oJson.success || !oJson.data?.order) {
      throw new Error(`Failed to create COD order for lifecycle test: ${oJson.message || 'unknown'}`);
    }
    const codOrderId = oJson.data.order._id;
    if (oJson.data.order.paymentStatus !== 'pending' || oJson.data.order.orderStatus !== 'pending') {
      throw new Error('New COD order must have pending payment and orderStatus');
    }

    // Step 1: pending -> processing
    const step1Res = await fetch(`${BASE_URL}/orders/${codOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ orderStatus: 'processing' }),
    });
    const step1Json: any = await step1Res.json();
    if (!step1Json.success || step1Json.data.orderStatus !== 'processing') {
      throw new Error('Step 1 (pending -> processing) failed');
    }

    // Step 2: processing -> shipping
    const step2Res = await fetch(`${BASE_URL}/orders/${codOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ orderStatus: 'shipping' }),
    });
    const step2Json: any = await step2Res.json();
    if (!step2Json.success || step2Json.data.orderStatus !== 'shipping') {
      throw new Error('Step 2 (processing -> shipping) failed');
    }

    // Step 3: shipping -> delivered (COD auto-paid check)
    const step3Res = await fetch(`${BASE_URL}/orders/${codOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ orderStatus: 'delivered' }),
    });
    const step3Json: any = await step3Res.json();
    if (!step3Json.success || step3Json.data.orderStatus !== 'delivered') {
      throw new Error('Step 3 (shipping -> delivered) failed');
    }
    if (step3Json.data.paymentStatus !== 'paid') {
      throw new Error(`COD auto-payment failed: expected paymentStatus 'paid', got '${step3Json.data.paymentStatus}'`);
    }

    // Step 4: Verify terminal state protection on delivered order
    const terminalAttempt = await fetch(`${BASE_URL}/orders/${codOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ orderStatus: 'cancelled' }),
    });
    const termJson: any = await terminalAttempt.json();
    if (terminalAttempt.status !== 400 || termJson.success !== false) {
      throw new Error('Delivered order should reject status modifications with 400');
    }
  });

  // 9c. Order Lifecycle Integrity Protection (Reject Invalid Non-sequential Transitions)
  await test('Order Lifecycle Integrity Protection (Reject Non-sequential Transitions)', async () => {
    const pRes = await fetch(`${BASE_URL}/products?limit=20`);
    const pJson: any = await pRes.json();
    const productFor9c = pJson.data.products.find((p: any) => p.stock >= 2) || pJson.data.products[0];

    // Create new order
    const oRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerInfo: { name: 'Invalid Hop Tester', phone: '0911223344', address: 'Da Nang' },
        items: [{ productId: productFor9c._id, quantity: 1 }],
        paymentMethod: 'COD',
      }),
    });
    const oJson: any = await oRes.json();
    if (!oJson.success || !oJson.data?.order) {
      throw new Error(`Failed to create order for 9c: ${oJson.message || 'unknown'}`);
    }
    const hopOrderId = oJson.data.order._id;

    // Attempt illegal transition: pending -> delivered directly
    const badHop = await fetch(`${BASE_URL}/orders/${hopOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ orderStatus: 'delivered' }),
    });
    const badHopJson: any = await badHop.json();
    if (badHop.status !== 400 || badHopJson.success !== false) {
      throw new Error('Pending -> Delivered illegal transition was not rejected');
    }

    // Cancel from pending (legal)
    const cancelRes = await fetch(`${BASE_URL}/orders/${hopOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ orderStatus: 'cancelled' }),
    });
    const cancelJson: any = await cancelRes.json();
    if (!cancelJson.success || cancelJson.data.orderStatus !== 'cancelled') {
      throw new Error('Cancellation from pending failed');
    }

    // Attempt modification on cancelled order (terminal)
    const afterCancelHop = await fetch(`${BASE_URL}/orders/${hopOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ orderStatus: 'processing' }),
    });
    if (afterCancelHop.status !== 400) {
      throw new Error('Modifying cancelled order should be rejected with 400');
    }

    // Attempt modifying paymentStatus on cancelled order (terminal)
    const cancelPayHop = await fetch(`${BASE_URL}/orders/${hopOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ paymentStatus: 'paid' }),
    });
    if (cancelPayHop.status !== 400) {
      throw new Error('Modifying paymentStatus on cancelled order must be rejected with 400');
    }

    // Attempt empty body
    const emptyHop = await fetch(`${BASE_URL}/orders/${hopOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({}),
    });
    if (emptyHop.status !== 400) {
      throw new Error('Empty status update request must be rejected with 400');
    }
  });

  // 9d. Automatic Refund on Paid Order Cancellation
  await test('Automatic Refund on Paid Order Cancellation', async () => {
    const pRes = await fetch(`${BASE_URL}/products?limit=20`);
    const pJson: any = await pRes.json();
    const productFor9d = pJson.data.products.find((p: any) => p.stock >= 2) || pJson.data.products[0];

    // 1. Create order
    const oRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerInfo: { name: 'Refund Lifecycle Tester', phone: '0977665544', address: 'Can Tho' },
        items: [{ productId: productFor9d._id, quantity: 1 }],
        paymentMethod: 'ONLINE',
      }),
    });
    const oJson: any = await oRes.json();
    if (!oJson.success || !oJson.data?.order) {
      throw new Error(`Failed to create order for 9d: ${oJson.message || 'unknown'}`);
    }
    const refundOrderId = oJson.data.order._id;
    const refundOrderCode = oJson.data.order.orderCode;

    // 2. Real Payment Webhook confirmation -> paid & processing
    const hashSecret = process.env.VNPAY_HASH_SECRET || 'VNPAYTECHGEARSECRETKEY2026SANDBOX';
    const payload = {
      orderCode: refundOrderCode,
      paymentStatus: 'paid',
      transactionNo: `VNPAY_${Date.now()}`,
    };
    const signature = crypto
      .createHmac('sha256', hashSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const payRes = await fetch(`${BASE_URL}/orders/payment/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': signature,
      },
      body: JSON.stringify(payload),
    });
    const payJson: any = await payRes.json();
    if (!payJson.success || payJson.data?.paymentStatus !== 'paid' || payJson.data?.orderStatus !== 'processing') {
      throw new Error('Payment webhook failed to set paid & processing');
    }

    // 3. Cancel order -> automatically set paymentStatus = 'refunded'
    const cancelRes = await fetch(`${BASE_URL}/orders/${refundOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ orderStatus: 'cancelled' }),
    });
    const cancelJson: any = await cancelRes.json();
    if (!cancelJson.success || cancelJson.data.orderStatus !== 'cancelled') {
      throw new Error('Failed to cancel paid order');
    }
    if (cancelJson.data.paymentStatus !== 'refunded') {
      throw new Error(`Expected paymentStatus 'refunded' on cancelled paid order, got '${cancelJson.data.paymentStatus}'`);
    }

    // 4. Verify terminal lock on cancelled refunded order
    const lockCheck = await fetch(`${BASE_URL}/orders/${refundOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ orderStatus: 'processing' }),
    });
    if (lockCheck.status !== 400) {
      throw new Error('Cancelled refunded order should reject status updates with 400');
    }
  });

  await test('Online Payment Failure Auto-Cancellation & Stock Restoration', async () => {
    // 1. Get initial stock
    const pRes = await fetch(`${BASE_URL}/products?limit=1`);
    const pJson: any = await pRes.json();
    const targetProduct = pJson.data.products[0];
    const initialStock = targetProduct.stock;

    // 2. Create online order
    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerInfo: { name: 'Payment Fail Tester', phone: '0911223344', address: 'Da Nang' },
        items: [{ productId: targetProduct._id, quantity: 2 }],
        paymentMethod: 'ONLINE',
      }),
    });
    const orderJson: any = await orderRes.json();
    if (!orderJson.success) throw new Error('Failed to create online order for fail test');
    const failedOrderCode = orderJson.data.order.orderCode;

    // Check stock decremented
    const pMidRes = await fetch(`${BASE_URL}/products/${targetProduct.slug}`);
    const pMidJson: any = await pMidRes.json();
    if (pMidJson.data.product.stock !== initialStock - 2) {
      throw new Error('Stock was not decremented upon order creation');
    }

    // 3. Simulate failed payment webhook
    const hashSecret = process.env.VNPAY_HASH_SECRET || 'VNPAYTECHGEARSECRETKEY2026SANDBOX';
    const payload = {
      orderCode: failedOrderCode,
      paymentStatus: 'failed',
    };
    const signature = crypto
      .createHmac('sha256', hashSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    const failWebRes = await fetch(`${BASE_URL}/orders/payment/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': signature,
      },
      body: JSON.stringify(payload),
    });
    const failWebJson: any = await failWebRes.json();
    if (!failWebJson.success || failWebJson.data.paymentStatus !== 'failed' || failWebJson.data.orderStatus !== 'cancelled') {
      throw new Error('Payment failure did not auto-cancel the pending order');
    }

    // 4. Verify stock was restored to initialStock
    const pAfterRes = await fetch(`${BASE_URL}/products/${targetProduct.slug}`);
    const pAfterJson: any = await pAfterRes.json();
    if (pAfterJson.data.product.stock !== initialStock) {
      throw new Error(`Stock was not restored after payment failure! Expected ${initialStock}, got ${pAfterJson.data.product.stock}`);
    }
  });

  // 9f. Customer & Guest Confirm Receipt Endpoint (POST /api/orders/:id/confirm-receipt)
  await test('Customer & Guest Confirm Receipt & Auto-Paid COD', async () => {
    const pRes = await fetch(`${BASE_URL}/products?limit=20`);
    const pJson: any = await pRes.json();
    const targetProduct = pJson.data.products.find((p: any) => p.stock >= 3) || pJson.data.products[0];

    // Case 1: Logged-in Customer flow
    const custOrderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        customerInfo: { name: 'Customer Receipt Tester', phone: '0966554433', address: '789 Tran Hung Dao, Q5' },
        items: [{ productId: targetProduct._id, quantity: 1 }],
        paymentMethod: 'COD',
      }),
    });
    const custOrderJson: any = await custOrderRes.json();
    if (!custOrderJson.success) throw new Error('Failed to create customer order for receipt test');
    const custOrderId = custOrderJson.data.order._id;

    // 1a. Cannot confirm when still pending
    const prematureConfirm = await fetch(`${BASE_URL}/orders/${custOrderId}/confirm-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
    });
    const prematureJson: any = await prematureConfirm.json();
    if (prematureConfirm.status !== 400 || prematureJson.success !== false) {
      throw new Error('Confirming receipt on pending order must fail with 400');
    }

    // 1b. Advance to shipping
    await fetch(`${BASE_URL}/orders/${custOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ orderStatus: 'processing' }),
    });
    await fetch(`${BASE_URL}/orders/${custOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ orderStatus: 'shipping' }),
    });

    // 1c. Unauthorized confirmation attempt (no token, wrong phone)
    const unauthorizedConfirm = await fetch(`${BASE_URL}/orders/${custOrderId}/confirm-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0900000000' }),
    });
    if (unauthorizedConfirm.status !== 403) {
      throw new Error(`Unauthorized receipt confirmation should fail with 403, got ${unauthorizedConfirm.status}`);
    }

    // 1d. Customer confirms receipt with valid customerToken
    const validCustConfirm = await fetch(`${BASE_URL}/orders/${custOrderId}/confirm-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
    });
    const validCustJson: any = await validCustConfirm.json();
    if (!validCustJson.success || validCustJson.data.orderStatus !== 'delivered') {
      throw new Error('Customer receipt confirmation failed to set orderStatus to delivered');
    }
    if (validCustJson.data.paymentStatus !== 'paid') {
      throw new Error('Customer receipt confirmation failed to automatically mark COD payment as paid');
    }

    // 1e. Re-confirming delivered order fails with 400
    const duplicateConfirm = await fetch(`${BASE_URL}/orders/${custOrderId}/confirm-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
    });
    if (duplicateConfirm.status !== 400) {
      throw new Error('Re-confirming already delivered order should fail with 400');
    }

    // Case 2: Guest order tracking flow (phone-based verification without token)
    const guestOrderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerInfo: { name: 'Guest Tracking Tester', phone: '0912987654', address: '123 Hai Ba Trung' },
        items: [{ productId: targetProduct._id, quantity: 1 }],
        paymentMethod: 'COD',
      }),
    });
    const guestOrderJson: any = await guestOrderRes.json();
    if (!guestOrderJson.success) throw new Error('Failed to create guest order');
    const guestOrderId = guestOrderJson.data.order._id;
    const guestOrderCode = guestOrderJson.data.order.orderCode;

    // Advance to shipping
    await fetch(`${BASE_URL}/orders/${guestOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ orderStatus: 'processing' }),
    });
    await fetch(`${BASE_URL}/orders/${guestOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ orderStatus: 'shipping' }),
    });

    // Confirm receipt using orderCode and phone verification without login
    const guestConfirmRes = await fetch(`${BASE_URL}/orders/${guestOrderCode}/confirm-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0912987654' }),
    });
    const guestConfirmJson: any = await guestConfirmRes.json();
    if (!guestConfirmJson.success || guestConfirmJson.data.orderStatus !== 'delivered') {
      throw new Error('Guest receipt confirmation with matching phone failed');
    }
    if (guestConfirmJson.data.paymentStatus !== 'paid') {
      throw new Error('Guest receipt confirmation failed to auto-mark COD as paid');
    }

    // Case 3: Phone normalization edge cases (+84, 0084, spaces, dashes) & # prefix in orderCode
    const guestOrderRes2 = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerInfo: { name: 'Phone Format Tester', phone: '0988776655', address: '456 Le Loi, Q1' },
        items: [{ productId: targetProduct._id, quantity: 1 }],
        paymentMethod: 'COD',
      }),
    });
    const guestOrderJson2: any = await guestOrderRes2.json();
    const guestOrderId2 = guestOrderJson2.data.order._id;
    const guestOrderCode2 = guestOrderJson2.data.order.orderCode;

    // Advance to shipping via processing
    await fetch(`${BASE_URL}/orders/${guestOrderId2}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ orderStatus: 'processing' }),
    });
    await fetch(`${BASE_URL}/orders/${guestOrderId2}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ orderStatus: 'shipping' }),
    });

    // 3a. Confirm using `#` prefix on orderCode (URL-encoded as %23) and `+84` with spaces on phone
    const formattedPhoneConfirm = await fetch(`${BASE_URL}/orders/${encodeURIComponent('#' + guestOrderCode2)}/confirm-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+84 988 776 655' }),
    });
    const formattedPhoneJson: any = await formattedPhoneConfirm.json();
    if (!formattedPhoneJson.success || formattedPhoneJson.data.orderStatus !== 'delivered') {
      throw new Error(`Receipt confirmation with #orderCode and +84 phone format failed: ${formattedPhoneJson.message || JSON.stringify(formattedPhoneJson)}`);
    }

    // 3b. Confirm using 0084 prefix on another order
    const guestOrderRes3 = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerInfo: { name: '0084 Format Tester', phone: '0933221100', address: '12 Vo Van Kiet' },
        items: [{ productId: targetProduct._id, quantity: 1 }],
        paymentMethod: 'COD',
      }),
    });
    const guestOrderJson3: any = await guestOrderRes3.json();
    const guestOrderId3 = guestOrderJson3.data.order._id;
    const guestOrderCode3 = guestOrderJson3.data.order.orderCode;

    await fetch(`${BASE_URL}/orders/${guestOrderId3}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ orderStatus: 'processing' }),
    });
    await fetch(`${BASE_URL}/orders/${guestOrderId3}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ orderStatus: 'shipping' }),
    });

    const prefix0084Confirm = await fetch(`${BASE_URL}/orders/${guestOrderCode3}/confirm-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0084933221100' }),
    });
    const prefix0084Json: any = await prefix0084Confirm.json();
    if (!prefix0084Json.success || prefix0084Json.data.orderStatus !== 'delivered') {
      throw new Error('Receipt confirmation with 0084 phone prefix failed');
    }

    // Case 4: Staff manual override from shipping to delivered with autoAdvance
    const staffOrderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        customerInfo: { name: 'Staff Override Tester', phone: '0977112233', address: '101 Nguyen Hue' },
        items: [{ productId: targetProduct._id, quantity: 1 }],
        paymentMethod: 'COD',
      }),
    });
    const staffOrderJson: any = await staffOrderRes.json();
    const staffOrderId = staffOrderJson.data.order._id;

    await fetch(`${BASE_URL}/orders/${staffOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ orderStatus: 'processing' }),
    });
    await fetch(`${BASE_URL}/orders/${staffOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ orderStatus: 'shipping' }),
    });

    const staffOverrideRes = await fetch(`${BASE_URL}/orders/${staffOrderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ autoAdvance: true }),
    });
    const staffOverrideJson: any = await staffOverrideRes.json();
    if (!staffOverrideJson.success || staffOverrideJson.data.orderStatus !== 'delivered') {
      throw new Error('Staff manual override from shipping to delivered failed');
    }
    if (staffOverrideJson.data.paymentStatus !== 'paid') {
      throw new Error('Staff override to delivered failed to mark COD payment as paid');
    }
  });

  // 10. HOT Products Batch Reorder
  await test('HOT Products Drag-and-Drop Batch Reorder', async () => {
    const pRes = await fetch(`${BASE_URL}/products?isHot=true&limit=3`);
    const pJson: any = await pRes.json();
    const hotItems = pJson.data.products;
    if (hotItems.length >= 2) {
      const reordered = [
        { id: hotItems[0]._id, hotOrder: 10 },
        { id: hotItems[1]._id, hotOrder: 20 },
      ];

      const reorderRes = await fetch(`${BASE_URL}/products/hot/reorder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ items: reordered }),
      });
      const reorderJson: any = await reorderRes.json();
      if (!reorderJson.success) {
        throw new Error('Batch reorder hot products endpoint failed');
      }
    }
  });

  // 11. Admin Analytics Endpoints
  await test('Admin Analytics Summary', async () => {
    const res = await fetch(`${BASE_URL}/admin/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json: any = await res.json();
    if (!json.success || json.data.totalRevenue <= 0 || json.data.totalOrders <= 0) {
      throw new Error('Admin summary failed');
    }
  });

  await test('Admin Periodic Revenue (Weekly, Monthly, Yearly)', async () => {
    for (const p of ['weekly', 'monthly', 'yearly']) {
      const res = await fetch(`${BASE_URL}/admin/periodic-revenue?period=${p}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const json: any = await res.json();
      if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
        throw new Error(`Periodic revenue ${p} returned empty`);
      }
    }
  });

  await test('Admin Quarterly Revenue (Q1, Q2, Q3, Q4)', async () => {
    const res = await fetch(`${BASE_URL}/admin/quarterly-revenue`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json: any = await res.json();
    if (!json.success || json.data.quarters.length !== 4) {
      throw new Error('Quarterly revenue does not have 4 quarters');
    }
  });

  await test('Admin Daily Categories Breakdown', async () => {
    const res = await fetch(`${BASE_URL}/admin/daily-categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json: any = await res.json();
    if (!json.success || json.data.categories.length < 4) {
      throw new Error('Daily categories breakdown missing data');
    }
  });

  await test('Admin Low Stock Inventory & Logs', async () => {
    const res = await fetch(`${BASE_URL}/admin/inventory?lowStockOnly=true`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json: any = await res.json();
    if (!json.success || !Array.isArray(json.data.products) || !Array.isArray(json.data.recentLogs)) {
      throw new Error('Inventory endpoint failed');
    }
    for (const p of json.data.products) {
      if (p.stock >= 5) throw new Error(`Product ${p.name} has stock >= 5 in lowStockOnly filter!`);
    }
  });

  await test('Admin Users & Customer LTV', async () => {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json: any = await res.json();
    if (!json.success || json.data.length === 0) {
      throw new Error('Users endpoint failed');
    }
    const customer = json.data.find((u: any) => u.role === 'customer');
    if (!customer || customer.totalSpent === undefined) {
      throw new Error('Customer LTV not calculated');
    }
  });

  await test('Admin RBAC Staff Role & Permissions Update', async () => {
    const usersRes = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersJson: any = await usersRes.json();
    const staffUser = usersJson.data.find((u: any) => u.email === 'warehouse@techgear.vn');
    if (staffUser) {
      const originalPermissions = staffUser.permissions ? [...staffUser.permissions] : ['inventory'];
      const updateRes = await fetch(`${BASE_URL}/admin/users/${staffUser._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          role: 'staff',
          permissions: ['inventory', 'orders', 'products'],
        }),
      });
      const updateJson: any = await updateRes.json();
      if (!updateJson.success || !updateJson.data.permissions.includes('inventory')) {
        throw new Error('Failed to update staff permissions');
      }

      // Restore clean original permissions
      await fetch(`${BASE_URL}/admin/users/${staffUser._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          role: 'staff',
          permissions: originalPermissions,
        }),
      });
    }
  });

  await test('Rate Limiter Protection (HTTP 429 on spam)', async () => {
    const { createRateLimiter } = await import('../middlewares/rateLimiter');
    const limiter = createRateLimiter({
      windowMs: 1000,
      max: 2,
      message: 'Rate limit exceeded',
    });

    const mockReq = { headers: {}, socket: { remoteAddress: '10.99.99.99' } } as any;
    let statusSent = 0;
    let jsonSent: any = null;
    const mockRes = {
      setHeader: () => {},
      status: (s: number) => {
        statusSent = s;
        return {
          json: (j: any) => {
            jsonSent = j;
          },
        };
      },
    } as any;

    let nextCount = 0;
    const next = () => {
      nextCount++;
    };

    limiter(mockReq, mockRes, next); // 1 - pass
    limiter(mockReq, mockRes, next); // 2 - pass
    limiter(mockReq, mockRes, next); // 3 - blocked with 429

    if (nextCount !== 2 || statusSent !== 429 || !jsonSent || jsonSent.success !== false) {
      throw new Error(`Rate limiter failed: nextCount=${nextCount}, status=${statusSent}`);
    }
  });

  // 13. Image Upload Module & Static File Serving Tests
  let uploadedImageUrl = '';
  let uploadedImageFilename = '';

  await test('Image Upload API (POST /api/upload) - Valid Multipart Image', async () => {
    // 1x1 valid PNG in hex
    const pngBuffer = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
      'hex'
    );
    const blob = new Blob([pngBuffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', blob, 'techgear-unit-test.png');

    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: formData,
    });

    const json: any = await res.json();
    if (!json.success || !json.data?.url || !json.data?.filename) {
      throw new Error(`Image upload failed: ${json.message || 'No URL returned'}`);
    }

    uploadedImageUrl = json.data.url;
    uploadedImageFilename = json.data.filename;

    if (!uploadedImageUrl.includes('/uploads/')) {
      throw new Error(`Image URL does not contain /uploads/: ${uploadedImageUrl}`);
    }
  });

  await test('Express Static Middleware - Access Uploaded Image File Directly', async () => {
    if (!uploadedImageUrl) throw new Error('No uploaded image URL from previous test');

    const res = await fetch(uploadedImageUrl);
    if (res.status !== 200) {
      throw new Error(`Failed to fetch uploaded image from static server: HTTP ${res.status}`);
    }

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('image/png')) {
      throw new Error(`Expected image/png content type, got: ${contentType}`);
    }
  });

  await test('Image Upload API - Reject Invalid File Extension & Format', async () => {
    const textBlob = new Blob(['sample-malicious-content'], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', textBlob, 'hack.txt');

    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    const json: any = await res.json();
    if (res.status !== 400 || json.success !== false) {
      throw new Error('Image upload should have rejected text/plain file with 400');
    }
  });

  await test('Image Upload API - Reject Empty Body Without Files', async () => {
    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
    });

    const json: any = await res.json();
    if (res.status !== 400 || json.success !== false) {
      throw new Error('Image upload should have rejected empty request with 400');
    }
  });

  await test('Image Upload API - Reject 0-byte Empty/Corrupt Files', async () => {
    const emptyBlob = new Blob([], { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', emptyBlob, 'corrupted-empty.png');

    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    const json: any = await res.json();
    if (res.status !== 400 || json.success !== false) {
      throw new Error('Image upload should have rejected 0-byte file with 400');
    }
  });

  let uploadedJpgFilename = '';
  await test('Image Upload API - Accept JPG with image/jpg MIME Type', async () => {
    const jpgBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
    const jpgBlob = new Blob([jpgBuffer], { type: 'image/jpg' });
    const formData = new FormData();
    formData.append('file', jpgBlob, 'photo.jpg');

    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    const json: any = await res.json();
    if (res.status !== 200 || !json.success || !json.data?.url) {
      throw new Error(`Image upload with image/jpg failed: ${json.message}`);
    }
    uploadedJpgFilename = json.data.filename;
  });

  let uploadedVnFilename = '';
  await test('Image Upload API - Normalize Vietnamese Accents in Filename', async () => {
    const pngBuffer = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
      'hex'
    );
    const pngBlob = new Blob([pngBuffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', pngBlob, 'bàn phím cơ gaming.png');

    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    const json: any = await res.json();
    if (res.status !== 200 || !json.success || !json.data?.filename) {
      throw new Error(`Vietnamese upload failed: ${json.message}`);
    }
    uploadedVnFilename = json.data.filename;
    // Filename should not have triple underscores or unnormalized accents
    if (uploadedVnFilename.includes('___')) {
      throw new Error(`Filename contains triple underscores: ${uploadedVnFilename}`);
    }
  });

  let uploadedUpperFilename = '';
  await test('Image Upload API - Handle Uppercase Extension Without Duplication', async () => {
    const pngBuffer = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
      'hex'
    );
    const pngBlob = new Blob([pngBuffer], { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', pngBlob, 'SAMPLE_PHOTO.PNG');

    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    const json: any = await res.json();
    if (res.status !== 200 || !json.success || !json.data?.filename) {
      throw new Error(`Uppercase extension upload failed: ${json.message}`);
    }
    uploadedUpperFilename = json.data.filename;
    if (uploadedUpperFilename.toLowerCase().includes('_png-')) {
      throw new Error(`Filename duplicated extension into basename: ${uploadedUpperFilename}`);
    }
  });

  // 21. RBAC Multi-Role Verification (Super Admin, Warehouse Staff, Orders Staff)
  let warehouseToken = '';
  let ordersToken = '';

  await test('RBAC Role Logins & Permissions Alignment', async () => {
    // Warehouse Staff Login
    const wRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'warehouse@techgear.vn', password: 'staff123' }),
    });
    const wJson: any = await wRes.json();
    if (!wJson.success || wJson.data.user.role !== 'staff' || !wJson.data.user.permissions?.includes('inventory')) {
      throw new Error('Warehouse staff login or permissions incorrect');
    }
    warehouseToken = wJson.data.token;

    // Orders Staff Login
    const oRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'orders@techgear.vn', password: 'staff123' }),
    });
    const oJson: any = await oRes.json();
    if (!oJson.success || oJson.data.user.role !== 'staff' || !oJson.data.user.permissions?.includes('orders')) {
      throw new Error('Orders staff login or permissions incorrect');
    }
    ordersToken = oJson.data.token;
  });

  await test('RBAC Super Admin Universal Access Rights', async () => {
    // Financial Reports
    const repRes = await fetch(`${BASE_URL}/admin/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (repRes.status !== 200) throw new Error('Super Admin denied on /admin/summary');

    // Inventory
    const invRes = await fetch(`${BASE_URL}/admin/inventory`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (invRes.status !== 200) throw new Error('Super Admin denied on /admin/inventory');

    // Users
    const usrRes = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (usrRes.status !== 200) throw new Error('Super Admin denied on /admin/users');

    // Orders
    const ordRes = await fetch(`${BASE_URL}/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (ordRes.status !== 200) throw new Error('Super Admin denied on /orders');
  });

  await test('RBAC Warehouse Staff Boundary Enforcement', async () => {
    // 1. CAN access inventory
    const invRes = await fetch(`${BASE_URL}/admin/inventory`, {
      headers: { Authorization: `Bearer ${warehouseToken}` },
    });
    if (invRes.status !== 200) throw new Error('Warehouse staff should have access to inventory');

    // 2. CAN update stock
    const pRes = await fetch(`${BASE_URL}/products?limit=1`);
    const pJson: any = await pRes.json();
    const prodId = pJson.data.products[0]._id;

    const stockRes = await fetch(`${BASE_URL}/products/${prodId}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${warehouseToken}`,
      },
      body: JSON.stringify({
        changeAmount: 5,
        reason: 'restock',
        note: 'Warehouse staff test restock',
      }),
    });
    if (stockRes.status !== 200) throw new Error('Warehouse staff should be able to update stock');

    // 3. CANNOT access financial reports (HTTP 403)
    const repRes = await fetch(`${BASE_URL}/admin/summary`, {
      headers: { Authorization: `Bearer ${warehouseToken}` },
    });
    if (repRes.status !== 403) throw new Error(`Warehouse staff must be blocked from /admin/summary, got ${repRes.status}`);

    // 4. CANNOT access user management (HTTP 403)
    const usrRes = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${warehouseToken}` },
    });
    if (usrRes.status !== 403) throw new Error(`Warehouse staff must be blocked from /admin/users, got ${usrRes.status}`);

    // 5. CANNOT modify orders (HTTP 403)
    const ordRes = await fetch(`${BASE_URL}/orders`, {
      headers: { Authorization: `Bearer ${warehouseToken}` },
    });
    if (ordRes.status !== 403) throw new Error(`Warehouse staff must be blocked from /orders, got ${ordRes.status}`);

    // 6. CANNOT create products directly (HTTP 403)
    const createProdRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${warehouseToken}`,
      },
      body: JSON.stringify({ name: 'Unauthorized Gear', price: 1000000, category: 'mouse', brand: 'Test' }),
    });
    if (createProdRes.status !== 403) throw new Error(`Warehouse staff must be blocked from creating products, got ${createProdRes.status}`);
  });

  await test('RBAC Orders Staff Boundary Enforcement', async () => {
    // 1. CAN access orders
    const ordRes = await fetch(`${BASE_URL}/orders`, {
      headers: { Authorization: `Bearer ${ordersToken}` },
    });
    if (ordRes.status !== 200) throw new Error('Orders staff should have access to /orders');

    // 2. CANNOT access financial reports (HTTP 403)
    const repRes = await fetch(`${BASE_URL}/admin/summary`, {
      headers: { Authorization: `Bearer ${ordersToken}` },
    });
    if (repRes.status !== 403) throw new Error(`Orders staff must be blocked from /admin/summary, got ${repRes.status}`);

    // 3. CANNOT access user management (HTTP 403)
    const usrRes = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${ordersToken}` },
    });
    if (usrRes.status !== 403) throw new Error(`Orders staff must be blocked from /admin/users, got ${usrRes.status}`);

    // 4. CANNOT access inventory management (HTTP 403)
    const invRes = await fetch(`${BASE_URL}/admin/inventory`, {
      headers: { Authorization: `Bearer ${ordersToken}` },
    });
    if (invRes.status !== 403) throw new Error(`Orders staff must be blocked from /admin/inventory, got ${invRes.status}`);

    // 5. CANNOT adjust inventory stock (HTTP 403)
    const pRes = await fetch(`${BASE_URL}/products?limit=1`);
    const pJson: any = await pRes.json();
    const prodId = pJson.data.products[0]._id;

    const stockRes = await fetch(`${BASE_URL}/products/${prodId}/stock`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ordersToken}`,
      },
      body: JSON.stringify({
        changeAmount: 10,
        reason: 'restock',
      }),
    });
    if (stockRes.status !== 403) throw new Error(`Orders staff must be blocked from stock adjustment, got ${stockRes.status}`);

    // 6. CANNOT create products directly (HTTP 403)
    const createProdRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ordersToken}`,
      },
      body: JSON.stringify({ name: 'Unauthorized Gear', price: 1000000, category: 'mouse', brand: 'Test' }),
    });
    if (createProdRes.status !== 403) throw new Error(`Orders staff must be blocked from creating products, got ${createProdRes.status}`);
  });

  // Clean up test images
  const filesToClean = [
    uploadedImageFilename,
    uploadedJpgFilename,
    uploadedVnFilename,
    uploadedUpperFilename,
  ].filter(Boolean);

  for (const filename of filesToClean) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.resolve(__dirname, '../../uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch {
      // ignore cleanup errors
    }
  }

  console.log(`\n🎉 [TEST SUITE SUMMARY] Passed: ${passed} | Failed: ${failed}`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
