/**
 * Verification Test Suite for TechGear E-Commerce Platform
 */
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
    const data = await res.json();
    if (data.status !== 'ok') throw new Error('Health check status is not ok');
  });

  // 2. Fetch Products and Filters
  await test('Fetch Products Catalog & Pagination', async () => {
    const res = await fetch(`${BASE_URL}/products?limit=5`);
    const json = await res.json();
    if (!json.success || json.data.products.length !== 5 || json.data.pagination.total < 20) {
      throw new Error('Products catalog pagination failed');
    }
  });

  await test('Filter Products by Category & Specs', async () => {
    const res = await fetch(`${BASE_URL}/products?category=keyboard&switchType=Magnetic`);
    const json = await res.json();
    if (!json.success || json.data.products.length === 0) {
      throw new Error('Filter by keyboard and magnetic switch failed');
    }
  });

  await test('Filter Products by Refresh Rate', async () => {
    const res = await fetch(`${BASE_URL}/products?category=monitor&refreshRate=240Hz`);
    const json = await res.json();
    if (!json.success || json.data.products.length === 0) {
      throw new Error('Filter by monitor refreshRate 240Hz failed');
    }
  });

  await test('Filter Metadata (Categories & Brands)', async () => {
    const res = await fetch(`${BASE_URL}/products/filters`);
    const json = await res.json();
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
    const json = await res.json();
    if (!json.success || json.data.user.role !== 'admin') {
      throw new Error('Admin login failed');
    }
    adminToken = json.data.token;
  });

  await test('Customer Login', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@gmail.com', password: 'customer123' }),
    });
    const json = await res.json();
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
    // Get product to order
    const pRes = await fetch(`${BASE_URL}/products?limit=1`);
    const pJson = await pRes.json();
    const product = pJson.data.products[0];
    testProductId = product._id;
    stockBefore = product.stock;

    // Place order
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

    const oJson = await oRes.json();
    if (!oJson.success || !oJson.data.order || !oJson.data.paymentUrl) {
      throw new Error('Order creation failed or paymentUrl missing');
    }
    testOrderCode = oJson.data.order.orderCode;

    // Check stock was deducted
    const pAfterRes = await fetch(`${BASE_URL}/products/${product.slug}`);
    const pAfterJson = await pAfterRes.json();
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
    const oJson = await oRes.json();
    if (oJson.success) {
      throw new Error('Order should have failed due to insufficient stock!');
    }
  });

  // 5. Order Tracking Lookup
  await test('Public Order Tracking Lookup', async () => {
    const res = await fetch(`${BASE_URL}/orders/lookup?orderCode=${testOrderCode}&phone=0999888777`);
    const json = await res.json();
    if (!json.success || json.data.orderCode !== testOrderCode) {
      throw new Error('Order tracking lookup failed');
    }
  });

  // 6. Mock Payment Simulation
  await test('Mock Payment Success Simulation', async () => {
    const res = await fetch(`${BASE_URL}/orders/payment/mock-pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderCode: testOrderCode, status: 'success' }),
    });
    const json = await res.json();
    if (!json.success || json.data.paymentStatus !== 'paid') {
      throw new Error('Mock payment failed to set status to paid');
    }
  });

  // 7. Order Cancellation & Stock Restoration
  await test('Order Cancellation & Stock Restoration', async () => {
    const cancelRes = await fetch(`${BASE_URL}/orders/${testOrderCode}/status`, {
      // Find order by id or fetch first
    });
    // Let's get order id from lookup
    const lookupRes = await fetch(`${BASE_URL}/orders/lookup?orderCode=${testOrderCode}&phone=0999888777`);
    const lookupJson = await lookupRes.json();
    const orderId = lookupJson.data._id;

    const res = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ orderStatus: 'cancelled' }),
    });

    const json = await res.json();
    if (!json.success || json.data.orderStatus !== 'cancelled') {
      throw new Error('Failed to cancel order');
    }

    // Verify stock restored
    const pCheck = await fetch(`${BASE_URL}/products/${lookupJson.data.items[0].productId._id || lookupJson.data.items[0].productId}`);
    const pCheckJson = await pCheck.json();
    if (pCheckJson.data.product.stock !== stockBefore) {
      throw new Error(`Stock not restored: expected ${stockBefore}, got ${pCheckJson.data.product.stock}`);
    }
  });

  // 8. Admin Analytics Endpoints
  await test('Admin Analytics Summary', async () => {
    const res = await fetch(`${BASE_URL}/admin/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json = await res.json();
    if (!json.success || json.data.totalRevenue <= 0 || json.data.totalOrders <= 0) {
      throw new Error('Admin summary failed');
    }
  });

  await test('Admin Periodic Revenue (Weekly, Monthly, Yearly)', async () => {
    for (const p of ['weekly', 'monthly', 'yearly']) {
      const res = await fetch(`${BASE_URL}/admin/periodic-revenue?period=${p}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const json = await res.json();
      if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
        throw new Error(`Periodic revenue ${p} returned empty`);
      }
    }
  });

  await test('Admin Quarterly Revenue (Q1, Q2, Q3, Q4)', async () => {
    const res = await fetch(`${BASE_URL}/admin/quarterly-revenue`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json = await res.json();
    if (!json.success || json.data.quarters.length !== 4) {
      throw new Error('Quarterly revenue does not have 4 quarters');
    }
  });

  await test('Admin Daily Categories Breakdown', async () => {
    const res = await fetch(`${BASE_URL}/admin/daily-categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json = await res.json();
    if (!json.success || json.data.categories.length < 4) {
      throw new Error('Daily categories breakdown missing data');
    }
  });

  await test('Admin Low Stock Inventory & Logs', async () => {
    const res = await fetch(`${BASE_URL}/admin/inventory?lowStockOnly=true`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json = await res.json();
    if (!json.success || !Array.isArray(json.data.products) || !Array.isArray(json.data.recentLogs)) {
      throw new Error('Inventory endpoint failed');
    }
    // Verify each product has stock < 5
    for (const p of json.data.products) {
      if (p.stock >= 5) throw new Error(`Product ${p.name} has stock >= 5 in lowStockOnly filter!`);
    }
  });

  await test('Admin Users & Customer LTV', async () => {
    const res = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json = await res.json();
    if (!json.success || json.data.length === 0) {
      throw new Error('Users endpoint failed');
    }
    const customer = json.data.find((u: any) => u.role === 'customer');
    if (!customer || customer.totalSpent === undefined) {
      throw new Error('Customer LTV not calculated');
    }
  });

  console.log(`\n🎉 [TEST SUITE SUMMARY] Passed: ${passed} | Failed: ${failed}`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
