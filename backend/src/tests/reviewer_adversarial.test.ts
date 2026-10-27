import assert from 'assert';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { InventoryLog } from '../models/InventoryLog';
import { getOrderById, getAllOrders, updateOrderStatus, notifyPaid, confirmOrderReceipt, handlePaymentWebhook } from '../controllers/orderController';
import { updateStock, updateProduct, deleteProduct, toggleHotStatus, getProducts } from '../controllers/productController';
import { updateUserStatus } from '../controllers/adminController';
import { createRateLimiter } from '../middlewares/rateLimiter';
import crypto from 'crypto';
import { ENV } from '../config/env';

const BASE_URL = 'http://localhost:5000/api';

async function runAdversarialAudit() {
  console.log('🧪 Starting Adversarial Reviewer Verification Suite...\n');

  // Test 1: getOrderById guest order IDOR protection
  console.log('1. Testing getOrderById Guest Order IDOR Protection...');
  const mockGuestOrder = {
    _id: new mongoose.Types.ObjectId('666666666666666666666666'),
    orderCode: 'TG-GUEST-SECRET-123',
    userId: null,
    customerInfo: { name: 'Guest Buyer', phone: '0912345678', address: '123 Guest St' },
    items: [],
    totalAmount: 100000,
    paymentStatus: 'pending',
    orderStatus: 'pending',
  };

  const origFindById = Order.findById;
  const origFindOne = Order.findOne;

  (Order as any).findById = async (id: any) => {
    if (String(id) === '666666666666666666666666') return mockGuestOrder;
    return null;
  };
  (Order as any).findOne = async (filter: any) => {
    if (filter.orderCode === 'TG-GUEST-SECRET-123') return mockGuestOrder;
    return null;
  };

  try {
    // 1a. Unauthenticated lookup by _id -> must be 401
    let status = 0;
    let resData: any = null;
    const mockRes: any = {
      status(c: number) { status = c; return this; },
      json(d: any) { resData = d; return this; },
    };

    await getOrderById({ params: { id: '666666666666666666666666' } } as any, mockRes);
    assert.strictEqual(status, 401, 'Unauthenticated lookup of guest order by _id must return 401');

    // 1b. Customer (non-owner, non-staff) lookup of guest order by _id -> MUST BE 403 (IDOR block)
    status = 0;
    await getOrderById({
      params: { id: '666666666666666666666666' },
      user: { id: 'attacker_cust_999', role: 'customer' },
    } as any, mockRes);
    assert.strictEqual(status, 403, 'Customer looking up guest order by MongoDB _id must receive 403 Forbidden');

    // 1c. Public lookup by orderCode (for VietQR payment screen) -> 200
    status = 0;
    resData = null;
    await getOrderById({ params: { id: 'TG-GUEST-SECRET-123' } } as any, mockRes);
    assert.strictEqual(resData?.success, true, 'Public lookup of guest order by orderCode must return 200');

    // 1d. Staff/Admin lookup by _id -> 200
    status = 0;
    resData = null;
    await getOrderById({
      params: { id: '666666666666666666666666' },
      user: { id: 'admin_1', role: 'admin' },
    } as any, mockRes);
    assert.strictEqual(resData?.success, true, 'Admin lookup of guest order by _id must return 200');

    console.log('   ✅ PASS: Guest orders are protected against customer IDOR scanning by _id while allowing orderCode payment lookup.');
  } finally {
    Order.findById = origFindById;
    Order.findOne = origFindOne;
  }

  // Test 2: Product & Admin controller invalid ObjectId 400 validations (no 500 CastError)
  console.log('\n2. Testing Invalid ObjectId Robustness on Product & Admin Endpoints...');
  let statusCode = 0;
  let responseBody: any = null;
  const mockResObj: any = {
    status(c: number) { statusCode = c; return this; },
    json(d: any) { responseBody = d; return this; },
  };

  // 2a. updateStock with invalid id
  statusCode = 0;
  await updateStock({ params: { id: 'invalid-stock-id' }, body: { changeAmount: 5 } } as any, mockResObj);
  assert.strictEqual(statusCode, 400, 'updateStock with invalid ID must return 400');
  assert.strictEqual(responseBody?.success, false);

  // 2b. updateProduct with invalid id
  statusCode = 0;
  await updateProduct({ params: { id: 'invalid-prod-id' }, body: { name: 'Test' } } as any, mockResObj);
  assert.strictEqual(statusCode, 400, 'updateProduct with invalid ID must return 400');

  // 2c. deleteProduct with invalid id
  statusCode = 0;
  await deleteProduct({ params: { id: 'invalid-prod-id' } } as any, mockResObj);
  assert.strictEqual(statusCode, 400, 'deleteProduct with invalid ID must return 400');

  // 2d. toggleHotStatus with invalid id
  statusCode = 0;
  await toggleHotStatus({ params: { id: 'invalid-prod-id' }, body: { isHot: true } } as any, mockResObj);
  assert.strictEqual(statusCode, 400, 'toggleHotStatus with invalid ID must return 400');

  // 2e. updateUserStatus with invalid id
  statusCode = 0;
  await updateUserStatus({ params: { id: 'invalid-user-id' }, body: { isActive: false } } as any, mockResObj);
  assert.strictEqual(statusCode, 400, 'updateUserStatus with invalid ID must return 400');

  console.log('   ✅ PASS: All product & admin ID-based routes safely return 400 on malformed ObjectIds.');

  // Test 3: Admin self-lockout check with string "false"
  console.log('\n3. Testing Admin Self-Lockout with string "false"...');
  const mockAdminUser = {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
    role: 'admin',
    isActive: true,
    save: async () => {},
  };
  const origUserFindById = User.findById;
  (User as any).findById = async () => mockAdminUser;

  try {
    statusCode = 0;
    await updateUserStatus({
      params: { id: '507f1f77bcf86cd799439011' },
      body: { isActive: 'false' },
      user: { id: '507f1f77bcf86cd799439011', role: 'admin' },
    } as any, mockResObj);
    assert.strictEqual(statusCode, 400, 'Admin setting isActive: "false" on self must return 400');
    assert.ok(responseBody?.message.includes('chính mình'));

    // Self-demote attempt
    statusCode = 0;
    await updateUserStatus({
      params: { id: '507f1f77bcf86cd799439011' },
      body: { role: 'staff' },
      user: { id: '507f1f77bcf86cd799439011', role: 'admin' },
    } as any, mockResObj);
    assert.strictEqual(statusCode, 400, 'Admin demoting self to staff must return 400');
    console.log('   ✅ PASS: Admin self-lockout and self-demotion guards fully effective with boolean and string types.');
  } finally {
    User.findById = origUserFindById;
  }

  // Test 4: getProducts bounded limit
  console.log('\n4. Testing Pagination Limit Bounds in getProducts...');
  const origProdFind = Product.find;
  const origProdCount = Product.countDocuments;
  let receivedLimit = 0;
  (Product as any).find = () => ({
    sort: () => ({
      skip: () => ({
        limit: (l: number) => {
          receivedLimit = l;
          return Promise.resolve([]);
        },
      }),
    }),
  });
  (Product as any).countDocuments = async () => 0;

  try {
    await getProducts({ query: { limit: '999999' } } as any, mockResObj);
    assert.strictEqual(receivedLimit, 100, `Expected limit bounded to 100, got ${receivedLimit}`);
    console.log('   ✅ PASS: getProducts limit properly capped at 100.');
  } finally {
    Product.find = origProdFind;
    Product.countDocuments = origProdCount;
  }

  // Test 5: updateProduct delayed InventoryLog (prevent orphan log)
  console.log('\n5. Testing updateProduct Orphan Inventory Log Prevention...');
  const mockProduct = {
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'),
    name: 'Test Mech Keyboard',
    stock: 10,
    category: 'keyboard',
  };
  const origProdFindById = Product.findById;
  const origProdFindByIdAndUpdate = Product.findByIdAndUpdate;
  const origLogCreate = InventoryLog.create;

  let logCreated = false;
  (Product as any).findById = async () => mockProduct;
  (Product as any).findByIdAndUpdate = async () => {
    throw new Error('Validation failed: category is invalid');
  };
  (InventoryLog as any).create = async () => {
    logCreated = true;
  };

  try {
    statusCode = 0;
    await updateProduct({
      params: { id: '507f1f77bcf86cd799439012' },
      body: { stock: 25, category: 'invalid' },
      user: { email: 'admin@techgear.vn' },
    } as any, mockResObj);

    assert.strictEqual(statusCode, 500, 'Failed update must return error');
    assert.strictEqual(logCreated, false, 'InventoryLog MUST NOT be created when Product update fails!');
    console.log('   ✅ PASS: Orphan InventoryLog prevented on product update validation failure.');
  } finally {
    Product.findById = origProdFindById;
    Product.findByIdAndUpdate = origProdFindByIdAndUpdate;
    InventoryLog.create = origLogCreate;
  }

  // Test 6: getAllOrders whitespace search safety
  console.log('\n6. Testing getAllOrders Whitespace Search Safety...');
  let userFindCalled = false;
  const origUserFind = User.find;
  (User as any).find = () => {
    userFindCalled = true;
    return { select: () => Promise.resolve([]) };
  };
  const origOrderFind = Order.find;
  const origOrderCount = Order.countDocuments;
  let orderFilterPassed: any = null;

  (Order as any).find = (f: any) => {
    orderFilterPassed = f;
    return {
      populate: () => ({
        sort: () => ({
          skip: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      }),
    };
  };
  (Order as any).countDocuments = async () => 0;

  try {
    await getAllOrders({ query: { search: '    ' } } as any, mockResObj);
    assert.strictEqual(userFindCalled, false, 'User.find should NOT be called for whitespace search query');
    assert.strictEqual(orderFilterPassed.$or, undefined, '$or should not contain empty regex on whitespace query');
    console.log('   ✅ PASS: Whitespace search safely ignored without full collection scan.');
  } finally {
    User.find = origUserFind;
    Order.find = origOrderFind;
    Order.countDocuments = origOrderCount;
  }

  // Test 7: Rate Limiter X-Real-IP Spoofing & Array Header Crash Immunity (HIGH-01)
  console.log('\n7. Testing Rate Limiter X-Real-IP Spoofing & Duplicate Header Immunity (HIGH-01)...');
  const testLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 2, message: 'Rate limited' });
  let limiterBlocked = false;
  for (let i = 0; i < 3; i++) {
    let nextCalled = false;
    let rlStatus = 0;
    const rlRes: any = {
      setHeader() { return this; },
      status(c: number) { rlStatus = c; return this; },
      json() { return this; },
    };
    // Attacker rotates X-Real-IP and even passes an array on iteration 1 while coming from same req.ip
    const spoofedHeader = i === 1 ? ['1.1.1.1', '2.2.2.2'] : `10.0.0.${i + 1}`;
    testLimiter(
      {
        ip: '203.0.113.50',
        headers: { 'x-real-ip': spoofedHeader },
        socket: { remoteAddress: '203.0.113.50' },
      } as any,
      rlRes,
      () => { nextCalled = true; }
    );
    if (rlStatus === 429 && !nextCalled) {
      limiterBlocked = true;
    }
  }
  assert.strictEqual(limiterBlocked, true, 'Rate limiter must enforce limit per req.ip despite rotated or array X-Real-IP headers');
  console.log('   ✅ PASS: Rate limiter blocks spoofed X-Real-IP rotation and handles array headers without crashing.');

  // Test 8: notifyPaid Unauthenticated OrderCode Lookup Without Phone (CRIT-01 #2)
  console.log('\n8. Testing notifyPaid Rejects Unauthenticated Call Without Phone (CRIT-01 #2)...');
  const origFindOne8 = Order.findOne;
  const mockPendingOrder = {
    _id: new mongoose.Types.ObjectId('666666666666666666666667'),
    orderCode: 'TG-NOTIFY-TEST',
    userId: null,
    customerInfo: { name: 'Buyer', phone: '0912345678', address: 'HN' },
    orderStatus: 'pending',
    paymentStatus: 'pending',
    save: async () => {},
  };
  (Order as any).findOne = async () => mockPendingOrder;
  try {
    statusCode = 0;
    await notifyPaid(
      { params: { id: 'TG-NOTIFY-TEST' }, body: {}, user: undefined } as any,
      mockResObj
    );
    assert.strictEqual(statusCode, 403, 'Unauthenticated notifyPaid with omitted phone must return 403');
    assert.strictEqual(mockPendingOrder.orderStatus, 'pending', 'Order status must remain pending');
    console.log('   ✅ PASS: notifyPaid blocks unauthenticated calls when phone is omitted.');
  } finally {
    Order.findOne = origFindOne8;
  }

  // Test 9: handlePaymentWebhook Protects Already Paid Order & Rejects Empty Amount (HIGH-02)
  console.log('\n9. Testing handlePaymentWebhook Paid Order Protection & Empty Amount Validation (HIGH-02)...');
  const origFindOne9 = Order.findOne;
  const mockPaidOrder = {
    _id: new mongoose.Types.ObjectId('666666666666666666666668'),
    orderCode: 'TG-PAID-PROTECT',
    totalAmount: 500000,
    orderStatus: 'processing',
    paymentStatus: 'paid',
    items: [],
    save: async () => {},
  };
  (Order as any).findOne = async () => mockPaidOrder;
  try {
    const signWebhook = (p: object) =>
      crypto.createHmac('sha256', ENV.VNPAY.hashSecret).update(JSON.stringify(p)).digest('hex');

    // 9a. Empty amount "" must return 400 (even if order totalAmount were 0)
    statusCode = 0;
    const payload9a = { orderCode: 'TG-PAID-PROTECT', paymentStatus: 'paid', amount: '' };
    await handlePaymentWebhook(
      {
        headers: { 'x-signature': signWebhook(payload9a) },
        body: payload9a,
      } as any,
      mockResObj
    );
    assert.strictEqual(statusCode, 400, 'Webhook with empty string amount must return 400');

    // 9b. Failure webhook on already paid order must NOT downgrade paymentStatus to failed
    statusCode = 0;
    const payload9b = { orderCode: 'TG-PAID-PROTECT', paymentStatus: 'failed', amount: 500000 };
    await handlePaymentWebhook(
      {
        headers: { 'x-signature': signWebhook(payload9b) },
        body: payload9b,
      } as any,
      mockResObj
    );
    assert.strictEqual(mockPaidOrder.paymentStatus, 'paid', 'Paid order must never be downgraded to failed');
    console.log('   ✅ PASS: Paid orders are protected against late failure webhooks and empty amounts are rejected.');
  } finally {
    Order.findOne = origFindOne9;
  }

  // Test 10: confirmOrderReceipt Blocks Wrong Logged-In Customer (CRIT-01)
  console.log('\n10. Testing confirmOrderReceipt Wrong Customer Rejection...');
  const origFindOne10 = Order.findOne;
  const mockShippingOrder = {
    _id: new mongoose.Types.ObjectId('666666666666666666666669'),
    orderCode: 'TG-SHIP-TEST',
    userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439099'),
    customerInfo: { name: 'Real Owner', phone: '0912345678', address: 'HCM' },
    orderStatus: 'shipping',
    paymentStatus: 'paid',
    save: async () => {},
  };
  (Order as any).findOne = async () => mockShippingOrder;
  try {
    statusCode = 0;
    await confirmOrderReceipt(
      {
        params: { id: 'TG-SHIP-TEST' },
        body: { phone: '0912345678' },
        user: { id: 'attacker_other_customer', role: 'customer' },
      } as any,
      mockResObj
    );
    assert.strictEqual(statusCode, 403, 'Wrong logged-in customer must receive 403 on confirmOrderReceipt');
    assert.strictEqual(mockShippingOrder.orderStatus, 'shipping', 'Order status must remain shipping');
    console.log('   ✅ PASS: confirmOrderReceipt blocks non-owner logged-in customers with 403.');
  } finally {
    Order.findOne = origFindOne10;
  }

  console.log('\n🎉 ALL ADVERSARIAL REVIEWER VERIFICATION TESTS PASSED!\n');
}

runAdversarialAudit().catch((err) => {
  console.error('❌ Adversarial Audit Failed:', err);
  process.exit(1);
});
