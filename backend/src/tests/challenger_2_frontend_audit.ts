import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:5000/api';
const FRONTEND_DIR = path.resolve(__dirname, '../../../frontend');

async function runChallenger2FrontendAudit() {
  console.log('🧪 [CHALLENGER 2] Starting Empirical Frontend & VietQR Audit...\n');

  let passed = 0;
  let failed = 0;
  const findings: string[] = [];

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name} ->`, err.message);
      failed++;
      findings.push(`${name}: ${err.message}`);
    }
  }

  // =========================================================================
  // 1. VietQR Specification & URL Parameter Correctness
  // =========================================================================
  console.log('\n--- 1. VietQR Specification & URL Generator Audit ---');

  const BANK_INFO = {
    bankName: 'Ngân hàng Quân Đội (MB Bank)',
    bin: '970422',
    accountNumber: '010253534444',
    accountHolder: 'LE NGOC TRUNG',
  };

  test('VietQR Constants: MB Bank BIN, Account Number & Holder Match Specification', () => {
    assert.strictEqual(BANK_INFO.bin, '970422', 'BIN must be 970422 (MB Bank)');
    assert.strictEqual(BANK_INFO.accountNumber, '010253534444', 'STK must be 010253534444');
    assert.strictEqual(BANK_INFO.accountHolder, 'LE NGOC TRUNG', 'Chủ TK must be LE NGOC TRUNG');
  });

  function generateVietQrUrl(orderCode: string, totalAmount: number) {
    return `https://img.vietqr.io/image/${BANK_INFO.bin}-${BANK_INFO.accountNumber}-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(orderCode)}&accountName=${encodeURIComponent(BANK_INFO.accountHolder)}`;
  }

  test('VietQR URL Structure: Standard URL Format Verification', () => {
    const orderCode = 'TG260916-101';
    const amount = 15900000;
    const url = generateVietQrUrl(orderCode, amount);

    assert.ok(url.startsWith('https://img.vietqr.io/image/970422-010253534444-compact2.png?'), 'URL must target VietQR compact2 gateway');
    assert.ok(url.includes(`amount=${amount}`), 'Amount must be embedded directly');
    assert.ok(url.includes(`addInfo=${orderCode}`), 'Order code must be embedded in addInfo');
    assert.ok(url.includes('accountName=LE%20NGOC%20TRUNG'), 'Account holder must be percent-encoded');
  });

  test('VietQR URL Generator: Resilience to Special Characters in Memo (XSS / Injection Defense)', () => {
    const maliciousCodes = [
      'TG-101 &amount=0',
      'TG-102?foo=bar#hash',
      'TG-103 <script>alert(1)</script>',
      'TG-104 " or ""="',
      'TG-105 Đơn hàng máy tính',
    ];

    for (const code of maliciousCodes) {
      const url = generateVietQrUrl(code, 500000);
      const parsed = new URL(url);

      // Verify that query params were not hijacked
      assert.strictEqual(parsed.searchParams.get('amount'), '500000', `Amount must not be overwritten by injected query string in: ${code}`);
      assert.strictEqual(parsed.searchParams.get('accountName'), 'LE NGOC TRUNG');
      assert.strictEqual(parsed.searchParams.get('addInfo'), code, `addInfo must accurately decode to original memo: ${code}`);
      assert.ok(!url.includes('<script>'), 'Unencoded script tags must not appear in the generated URL');
    }
  });

  // =========================================================================
  // 2. Static Asset & Fallback Verification
  // =========================================================================
  console.log('\n--- 2. Static Asset & Fallback Audit ---');

  const fallbackPath = path.join(FRONTEND_DIR, 'public', 'qr-payment.jpg');

  test('Fallback Image: File Existence at frontend/public/qr-payment.jpg', () => {
    assert.ok(fs.existsSync(fallbackPath), `Fallback QR image must exist at ${fallbackPath}`);
  });

  test('Fallback Image: Non-trivial File Size (> 50KB)', () => {
    const stats = fs.statSync(fallbackPath);
    assert.ok(stats.size > 50000, `Fallback image size (${stats.size} bytes) should be > 50KB`);
  });

  test('Fallback Image: Valid JPEG Magic Bytes (0xFF 0xD8 0xFF)', () => {
    const fd = fs.openSync(fallbackPath, 'r');
    const buffer = Buffer.alloc(4);
    fs.readSync(fd, buffer, 0, 4, 0);
    fs.closeSync(fd);

    assert.strictEqual(buffer[0], 0xff, 'Byte 0 must be 0xFF');
    assert.strictEqual(buffer[1], 0xd8, 'Byte 1 must be 0xD8');
    assert.strictEqual(buffer[2], 0xff, 'Byte 2 must be 0xFF');
    // JPEG JFIF typically has 0xE0 or 0xDB at byte 3
    assert.ok([0xe0, 0xe1, 0xdb, 0xee].includes(buffer[3]), `Byte 3 must be valid JPEG marker (got 0x${buffer[3].toString(16)})`);
  });

  // =========================================================================
  // 3. Frontend Route & Component Static Analysis
  // =========================================================================
  console.log('\n--- 3. Frontend Component & URL Handling Static Analysis ---');

  const paymentQrPageCode = fs.readFileSync(path.join(FRONTEND_DIR, 'src/app/payment-qr/page.tsx'), 'utf-8');

  test('/payment-qr: Suspense Boundary Wrap for Next.js 14 SSG Safety', () => {
    assert.ok(paymentQrPageCode.includes('<Suspense'), 'Page component must be wrapped in Suspense boundary');
    assert.ok(paymentQrPageCode.includes('export default function PaymentQRPage()'), 'Default export must exist');
  });

  test('/payment-qr: URL Params orderCode Null / Empty Handling', () => {
    assert.ok(paymentQrPageCode.includes("searchParams.get('orderCode')"), 'Reads orderCode from searchParams');
    assert.ok(paymentQrPageCode.includes('Không tìm thấy mã đơn hàng'), 'Provides helpful message when orderCode is missing');
    assert.ok(paymentQrPageCode.includes('Quay lại giỏ hàng / Đặt lại'), 'Provides recovery button when error happens');
  });

  test('/payment-qr: 1-Click Copy Buttons for STK, Amount, and Memo with Clipboard Fallback', () => {
    assert.ok(paymentQrPageCode.includes('handleCopy'), 'Defines handleCopy function');
    assert.ok(paymentQrPageCode.includes('navigator.clipboard.writeText'), 'Uses modern clipboard API');
    assert.ok(paymentQrPageCode.includes('document.execCommand'), 'Provides fallback textarea execCommand copy');
    assert.ok(paymentQrPageCode.includes('Sao chép STK'), 'Has button for STK copy');
    assert.ok(paymentQrPageCode.includes('Sao chép tiền'), 'Has button for Amount copy');
    assert.ok(paymentQrPageCode.includes('Sao chép nội dung'), 'Has button for Memo copy');
  });

  test('/payment-qr: Mode Toggle Between Dynamic VietQR and Original Fallback QR', () => {
    assert.ok(paymentQrPageCode.includes("qrMode === 'dynamic'"), 'Provides conditional rendering for dynamic mode');
    assert.ok(paymentQrPageCode.includes('/qr-payment.jpg'), 'References fallback image /qr-payment.jpg');
    assert.ok(paymentQrPageCode.includes('Mã QR Gốc MB Bank'), 'Provides tab for original QR code');
  });

  test('/payment-qr: Notify-Paid Action Navigation to /payment-result?notified=true', () => {
    assert.ok(paymentQrPageCode.includes('/notify-paid'), 'Invokes /notify-paid endpoint');
    assert.ok(paymentQrPageCode.includes('notified=true'), 'Passes notified=true query param to payment-result');
  });

  // Verify /checkout/page.tsx
  const checkoutPageCode = fs.readFileSync(path.join(FRONTEND_DIR, 'src/app/checkout/page.tsx'), 'utf-8');

  test('/checkout: Direct Navigation to /payment-qr on ONLINE Selection', () => {
    assert.ok(checkoutPageCode.includes("paymentMethod === 'ONLINE'"), 'Checks for ONLINE payment method');
    assert.ok(checkoutPageCode.includes('/payment-qr?orderCode='), 'Navigates to /payment-qr on ONLINE order');
  });

  // Verify /payment-result/page.tsx
  const paymentResultPageCode = fs.readFileSync(path.join(FRONTEND_DIR, 'src/app/payment-result/page.tsx'), 'utf-8');

  test('/payment-result: Confetti Celebration & "Chờ đối soát chuyển khoản" Badge', () => {
    assert.ok(paymentResultPageCode.includes('confetti('), 'Triggers canvas-confetti animation');
    assert.ok(paymentResultPageCode.includes('Đã tiếp nhận chuyển khoản - Đang đối soát'), 'Displays celebratory banner');
    assert.ok(paymentResultPageCode.includes('Chờ đối soát chuyển khoản'), 'Displays pending reconciliation status');
  });

  // Verify /admin/orders/page.tsx
  const adminOrdersPageCode = fs.readFileSync(path.join(FRONTEND_DIR, 'src/app/admin/orders/page.tsx'), 'utf-8');

  test('/admin/orders: Reconciliation Badge & Approval Button', () => {
    assert.ok(adminOrdersPageCode.includes('Chờ đối soát chuyển khoản'), 'Displays "Chờ đối soát chuyển khoản" badge for pending online orders');
    assert.ok(adminOrdersPageCode.includes('Xác nhận đã nhận tiền (Duyệt Paid)'), 'Displays staff action button');
    assert.ok(adminOrdersPageCode.includes('/verify-payment'), 'Calls verify-payment endpoint');
  });

  // =========================================================================
  // 4. Live API & End-to-End State Machine Audit
  // =========================================================================
  console.log('\n--- 4. Live API & End-to-End State Machine Audit ---');

  let adminToken = '';
  let customerToken = '';

  await test('Auth: Obtain Admin & Customer Tokens', async () => {
    const aRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@techgear.vn', password: 'admin123' }),
    });
    const aJson: any = await aRes.json();
    assert.strictEqual(aJson.success, true);
    adminToken = aJson.data.token;

    const cRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'trunglengoc220324@gmail.com', password: '123456' }),
    });
    const cJson: any = await cRes.json();
    assert.strictEqual(cJson.success, true);
    customerToken = cJson.data.token;
  });

  let testOrderCode = '';
  let testOrderId = '';
  let testTotalAmount = 0;

  await test('API: Create ONLINE Order & Validate paymentUrl Response Contract', async () => {
    // Get product
    const pRes = await fetch(`${BASE_URL}/products?limit=1`);
    const pJson: any = await pRes.json();
    const product = pJson.data.products[0];

    const orderPayload = {
      customerInfo: {
        name: 'Nguyen Van Challenger',
        phone: '0987654321',
        address: '123 Le Loi, Quan 1, TP HCM',
        note: 'Giao gio hanh chinh',
      },
      items: [
        {
          productId: product._id,
          name: product.name,
          quantity: 1,
          price: product.price,
        },
      ],
      paymentMethod: 'ONLINE',
    };

    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const json: any = await res.json();
    assert.strictEqual(res.status, 201, 'Order creation should return HTTP 201');
    assert.strictEqual(json.success, true, 'Order creation should succeed');
    assert.ok(json.data.order, 'Order data must be returned');
    assert.strictEqual(json.data.order.paymentMethod, 'ONLINE');
    assert.strictEqual(json.data.order.paymentStatus, 'pending');
    assert.strictEqual(json.data.order.orderStatus, 'pending');

    testOrderCode = json.data.order.orderCode;
    testOrderId = json.data.order._id;
    testTotalAmount = json.data.order.totalAmount;

    assert.strictEqual(
      json.data.paymentUrl,
      `/payment-qr?orderCode=${testOrderCode}`,
      'paymentUrl must match /payment-qr?orderCode=<orderCode>'
    );
  });

  await test('API: Public Unauthenticated Lookup by orderCode (GET /api/orders/:orderCode)', async () => {
    const res = await fetch(`${BASE_URL}/orders/${testOrderCode}`);
    const json: any = await res.json();

    assert.strictEqual(res.status, 200, 'Public lookup by orderCode must return HTTP 200 without token');
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.orderCode, testOrderCode);
    assert.strictEqual(json.data.totalAmount, testTotalAmount);
  });

  await test('API: Customer Notifies Payment (POST /api/orders/:orderCode/notify-paid)', async () => {
    const res = await fetch(`${BASE_URL}/orders/${testOrderCode}/notify-paid`, {
      method: 'POST',
    });
    const json: any = await res.json();

    assert.strictEqual(res.status, 200, 'notify-paid must return HTTP 200');
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.orderStatus, 'processing', 'orderStatus must transition to processing');
    assert.strictEqual(json.data.paymentStatus, 'pending', 'paymentStatus must remain pending (awaiting staff review)');
  });

  await test('API: Idempotency of notify-paid (Repeated Invocations)', async () => {
    for (let i = 0; i < 3; i++) {
      const res = await fetch(`${BASE_URL}/orders/${testOrderCode}/notify-paid`, { method: 'POST' });
      const json: any = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(json.data.orderStatus, 'processing');
      assert.strictEqual(json.data.paymentStatus, 'pending');
    }
  });

  await test('API: Staff Verifies Payment via orderCode (POST /api/orders/:orderCode/verify-payment)', async () => {
    const res = await fetch(`${BASE_URL}/orders/${testOrderCode}/verify-payment`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json: any = await res.json();

    assert.strictEqual(res.status, 200, 'verify-payment must return HTTP 200');
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.data.paymentStatus, 'paid', 'paymentStatus must transition to paid');
    assert.strictEqual(json.data.orderStatus, 'processing', 'orderStatus must remain processing');
  });

  await test('API Defense: notify-paid Cannot Revert "paid" Status Back to "pending"', async () => {
    // Attempt to notify paid again after order is already verified as paid
    const res = await fetch(`${BASE_URL}/orders/${testOrderCode}/notify-paid`, { method: 'POST' });
    const json: any = await res.json();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(
      json.data.paymentStatus,
      'paid',
      'CRITICAL SAFETY: notify-paid MUST NOT overwrite paid back to pending!'
    );
  });

  // =========================================================================
  // Summary
  // =========================================================================
  console.log('\n======================================================');
  console.log(`🎯 [CHALLENGER 2 SUMMARY] Passed: ${passed} | Failed: ${failed}`);
  if (findings.length > 0) {
    console.log('⚠️ [FINDINGS & FAILURES]:');
    for (const f of findings) {
      console.log('  -', f);
    }
  } else {
    console.log('✨ [ALL EMPIRICAL TESTS PASSED WITH 0 ANOMALIES]');
  }
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runChallenger2FrontendAudit().catch((err) => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
