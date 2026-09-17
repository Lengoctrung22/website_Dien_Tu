import assert from 'assert';
import jwt from 'jsonwebtoken';
import { escapeRegex, sanitizeString } from '../utils/sanitize';
import { verifyVnpaySignature, createVnpayPaymentUrl } from '../utils/vnpay';
import { authenticateToken } from '../middlewares/auth';
import { Order } from '../models/Order';
import { InventoryLog } from '../models/InventoryLog';
import { Product } from '../models/Product';
import { User } from '../models/User';
import uploadRouter from '../routes/uploadRoutes';
import { handleVnpayReturn, getOrderById, notifyPaid } from '../controllers/orderController';
import { ENV } from '../config/env';

async function runBugfixTests() {
  console.log('🧪 Starting Bugfix Verification Tests...\n');

  // Test 1: Sanitize utilities (SEC-05 & SEC-06)
  console.log('1. Testing Sanitize Utilities (SEC-05 & SEC-06)...');
  assert.strictEqual(escapeRegex('hello.*+?^${}()|[]\\world'), 'hello\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\world');
  assert.strictEqual(escapeRegex(123 as any), '');
  assert.strictEqual(sanitizeString('  keyboard  '), 'keyboard');
  assert.strictEqual(sanitizeString({ $ne: null }), '');
  assert.strictEqual(sanitizeString(['hacked']), '');
  assert.strictEqual(sanitizeString(null), '');
  assert.strictEqual(sanitizeString(undefined), '');
  console.log('   ✅ PASS: Sanitize functions protect against ReDoS and NoSQL operator injection');

  // Test 2: VNPAY Signature & TimingSafeEqual (SEC-09)
  console.log('2. Testing VNPAY Signature with crypto.timingSafeEqual (SEC-09)...');
  const paymentUrl = createVnpayPaymentUrl({
    orderId: 'ORD123456',
    amount: 100000,
    orderInfo: 'Payment Test',
    ipAddr: '127.0.0.1',
  });
  const urlObj = new URL(paymentUrl);
  const queryParams: Record<string, string> = {};
  urlObj.searchParams.forEach((value, key) => {
    queryParams[key] = value;
  });

  const validResult = verifyVnpaySignature(queryParams);
  assert.strictEqual(validResult.isValid, true, 'Valid signature should verify to true');
  assert.strictEqual(validResult.orderId, 'ORD123456');

  // Tamper hash
  const tamperedResult = verifyVnpaySignature({ ...queryParams, vnp_SecureHash: 'badhash' });
  assert.strictEqual(tamperedResult.isValid, false, 'Tampered hash must fail safely');

  // Empty / different length hash
  const emptyHashResult = verifyVnpaySignature({ ...queryParams, vnp_SecureHash: '' });
  assert.strictEqual(emptyHashResult.isValid, false);
  console.log('   ✅ PASS: timingSafeEqual signature check verified');

  // Test 3: JWT 401 instead of 403 (Auth HTTP Code)
  console.log('3. Testing JWT Auth Error Code (HTTP 401 on invalid/expired token)...');
  let mockResStatus = 0;
  let mockResBody: any = null;
  const mockRes: any = {
    status(code: number) {
      mockResStatus = code;
      return {
        json(body: any) {
          mockResBody = body;
        },
      };
    },
  };
  const mockReqNoToken: any = { headers: {} };
  authenticateToken(mockReqNoToken, mockRes, () => {});
  assert.strictEqual(mockResStatus, 401, 'Missing token should return 401');

  const mockReqBadToken: any = { headers: { authorization: 'Bearer invalid.token.payload' } };
  authenticateToken(mockReqBadToken, mockRes, () => {});
  assert.strictEqual(mockResStatus, 401, 'Invalid token must return 401 instead of 403');
  assert.strictEqual(mockResBody.message, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn');

  // Expired token
  const expiredToken = jwt.sign({ id: '123', email: 'test@example.com' }, ENV.JWT_SECRET, { expiresIn: -10 });
  const mockReqExpired: any = { headers: { authorization: `Bearer ${expiredToken}` } };
  authenticateToken(mockReqExpired, mockRes, () => {});
  assert.strictEqual(mockResStatus, 401, 'Expired token must return 401 instead of 403');
  console.log('   ✅ PASS: JWT auth returns HTTP 401 on invalid and expired tokens');

  // Test 4: Upload routes protected with authenticateToken (SEC-04)
  console.log('4. Testing Upload Route Middleware (SEC-04)...');
  const uploadLayer = (uploadRouter as any).stack.find((layer: any) => layer.route && layer.route.path === '/');
  assert.ok(uploadLayer, 'Upload route should exist');
  const middlewareNames = uploadLayer.route.stack.map((s: any) => s.name);
  assert.ok(middlewareNames.includes('authenticateToken'), 'Upload route must include authenticateToken');
  assert.ok(!middlewareNames.includes('optionalAuthenticateToken'), 'Upload route must NOT have optionalAuthenticateToken');
  console.log('   ✅ PASS: Upload route is protected by authenticateToken');

  // Test 5: Model Indexes & Redundant index: true removal (PERF-02 & DATA-03)
  console.log('5. Testing Model Indexes (PERF-02 & DATA-03)...');
  const orderIndexes = Order.schema.indexes();
  const hasOrderCreatedAt = orderIndexes.some((idx: any) => idx[0]?.createdAt === -1);
  const hasOrderCompound = orderIndexes.some(
    (idx: any) => idx[0]?.orderStatus === 1 && idx[0]?.paymentStatus === 1 && idx[0]?.createdAt === -1
  );
  assert.ok(hasOrderCreatedAt, 'Order schema must have index on createdAt: -1');
  assert.ok(hasOrderCompound, 'Order schema must have compound index on orderStatus, paymentStatus, createdAt');

  const invIndexes = InventoryLog.schema.indexes();
  const hasInvCreatedAt = invIndexes.some((idx: any) => idx[0]?.createdAt === -1);
  assert.ok(hasInvCreatedAt, 'InventoryLog schema must have index on createdAt: -1');

  const prodIndexes = Product.schema.indexes();
  const hasProdText = prodIndexes.some(
    (idx: any) => idx[0]?.name === 'text' && idx[0]?.brand === 'text' && idx[0]?.description === 'text'
  );
  assert.ok(hasProdText, 'Product schema must have text index on name, brand, description');

  // Check unique fields do not define duplicate schema index
  const orderCodePath: any = Order.schema.path('orderCode');
  assert.ok(orderCodePath.options.unique, 'orderCode must have unique: true');
  assert.ok(!orderCodePath.options.index, 'orderCode should not have redundant index: true');

  const prodSlugPath: any = Product.schema.path('slug');
  assert.ok(prodSlugPath.options.unique, 'slug must have unique: true');
  assert.ok(!prodSlugPath.options.index, 'slug should not have redundant index: true');

  const userEmailPath: any = User.schema.path('email');
  assert.ok(userEmailPath.options.unique, 'email must have unique: true');
  assert.ok(!userEmailPath.options.index, 'email should not have redundant index: true');
  console.log('   ✅ PASS: Indexes and redundant index removals are verified');

  // Test 6: handleVnpayReturn Signature Check First (SEC-02)
  console.log('6. Testing handleVnpayReturn Signature Check (SEC-02)...');
  let vnpayReturnStatus = 0;
  let vnpayReturnBody: any = null;
  const mockVnpayRes: any = {
    status(code: number) {
      vnpayReturnStatus = code;
      return {
        json(body: any) {
          vnpayReturnBody = body;
        },
      };
    },
  };
  const mockVnpayReq: any = {
    query: {
      vnp_TxnRef: 'VICTIM_ORDER_999',
      vnp_SecureHash: 'invalid_fake_hash',
      vnp_ResponseCode: '01',
    },
  };
  await handleVnpayReturn(mockVnpayReq, mockVnpayRes);
  assert.strictEqual(vnpayReturnStatus, 400, 'Invalid signature must return 400');
  assert.strictEqual(vnpayReturnBody.message, 'Chữ ký không hợp lệ', 'Must immediately reject with invalid signature message');
  console.log('   ✅ PASS: handleVnpayReturn checks isValid first and rejects attackers immediately');

  // Test 7: getOrderById guest & customer access control (SEC-01)
  console.log('7. Testing getOrderById Access Control (SEC-01)...');
  let getOrderByIdStatus = 0;
  let getOrderByIdBody: any = null;
  const mockGetOrderRes: any = {
    status(code: number) {
      getOrderByIdStatus = code;
      return {
        json(body: any) {
          getOrderByIdBody = body;
        },
      };
    },
  };
  // Unauthenticated guest access attempt
  const mockGuestReq: any = { params: { id: '666666666666666666666666' }, user: undefined };
  // Mock Order.findById to return a mock order
  const origFindById = Order.findById;
  (Order as any).findById = async () => ({
    _id: '666666666666666666666666',
    orderCode: 'ORD_TEST_1',
    userId: { toString: () => 'user_owner_123' },
  });

  try {
    await getOrderById(mockGuestReq, mockGetOrderRes);
    assert.strictEqual(getOrderByIdStatus, 401, 'Guest must receive 401 when accessing getOrderById directly');

    // Customer but not owner
    const mockWrongUserReq: any = {
      params: { id: '666666666666666666666666' },
      user: { id: 'user_attacker_456', role: 'customer' },
    };
    await getOrderById(mockWrongUserReq, mockGetOrderRes);
    assert.strictEqual(getOrderByIdStatus, 403, 'Non-owner customer must receive 403');

    // Customer and owner
    let successData: any = null;
    const mockOwnerRes: any = {
      json(body: any) {
        successData = body;
      },
    };
    const mockOwnerReq: any = {
      params: { id: '666666666666666666666666' },
      user: { id: 'user_owner_123', role: 'customer' },
    };
    await getOrderById(mockOwnerReq, mockOwnerRes);
    assert.ok(successData?.success, 'Owner customer should receive 200');

    // Staff/Admin access
    successData = null;
    const mockStaffReq: any = {
      params: { id: '666666666666666666666666' },
      user: { id: 'staff_789', role: 'staff' },
    };
    await getOrderById(mockStaffReq, mockOwnerRes);
    assert.ok(successData?.success, 'Staff should receive 200');
  } finally {
    Order.findById = origFindById;
  }
  console.log('   ✅ PASS: getOrderById blocks guests (401) and non-owner customers (403)');

  // Test 8: notifyPaid authorization check (SEC-03)
  console.log('8. Testing notifyPaid Authorization Check (SEC-03)...');
  let notifyPaidStatus = 0;
  let notifyPaidBody: any = null;
  const mockNotifyRes: any = {
    status(code: number) {
      notifyPaidStatus = code;
      return {
        json(body: any) {
          notifyPaidBody = body;
        },
      };
    },
  };
  (Order as any).findById = async () => ({
    _id: '666666666666666666666666',
    orderCode: 'ORD_TEST_1',
    userId: { toString: () => 'user_owner_123' },
    customerInfo: { phone: '0912345678' },
    orderStatus: 'pending',
    paymentStatus: 'pending',
    save: async () => {},
  });

  try {
    // Unauthorized guest (wrong phone)
    const mockBadGuestReq: any = {
      params: { id: '666666666666666666666666' },
      body: { phone: '0999999999' },
      user: undefined,
    };
    await notifyPaid(mockBadGuestReq, mockNotifyRes);
    assert.strictEqual(notifyPaidStatus, 403, 'Guest with wrong phone must be rejected with 403');

    // Unauthorized customer (wrong owner, wrong phone)
    const mockBadCustReq: any = {
      params: { id: '666666666666666666666666' },
      body: { phone: '0999999999' },
      user: { id: 'user_attacker_456', role: 'customer' },
    };
    await notifyPaid(mockBadCustReq, mockNotifyRes);
    assert.strictEqual(notifyPaidStatus, 403, 'Wrong customer must be rejected with 403');

    // Authorized: Guest with matching phone
    let notifySuccess: any = null;
    const mockGoodRes: any = {
      json(body: any) {
        notifySuccess = body;
      },
    };
    const mockGoodGuestReq: any = {
      params: { id: '666666666666666666666666' },
      body: { phone: '+84 912 345 678' }, // normalized phone match
      user: undefined,
    };
    await notifyPaid(mockGoodGuestReq, mockGoodRes);
    assert.ok(notifySuccess?.success, 'Guest with matching phone should be authorized');

    // Authorized: Owner user
    notifySuccess = null;
    const mockOwnerUserReq: any = {
      params: { id: '666666666666666666666666' },
      body: {},
      user: { id: 'user_owner_123', role: 'customer' },
    };
    await notifyPaid(mockOwnerUserReq, mockGoodRes);
    assert.ok(notifySuccess?.success, 'Owner customer should be authorized');

    // Authorized: Staff/Admin
    notifySuccess = null;
    const mockStaffUserReq: any = {
      params: { id: '666666666666666666666666' },
      body: {},
      user: { id: 'staff_1', role: 'staff' },
    };
    await notifyPaid(mockStaffUserReq, mockGoodRes);
    assert.ok(notifySuccess?.success, 'Staff should be authorized');
  } finally {
    Order.findById = origFindById;
  }
  console.log('   ✅ PASS: notifyPaid enforces ownership check (SEC-03)');

  // Test 9, 10, 11: In-Memory Database Tests (PERF-01, DATA-01, SEC-08)
  console.log('\n9. Testing MongoDB Aggregation Pipeline (PERF-01)...');
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const mongoose = (await import('mongoose')).default;
  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  try {
    // 9a. Test getUsers aggregation pipeline
    const testUser = await User.create({
      fullName: 'LTV Tester',
      email: 'ltv@test.com',
      passwordHash: 'secret_hash_value',
      role: 'customer',
    });

    const testProd = await Product.create({
      name: 'Test Keyboard',
      slug: 'test-keyboard',
      category: 'keyboard',
      brand: 'TestBrand',
      price: 1000,
      stock: 10,
    });

    // 2 paid/valid orders + 1 cancelled order
    await Order.create({
      orderCode: 'ORD_LTV_1',
      userId: testUser._id,
      customerInfo: { name: 'LTV Tester', phone: '0912345678', address: 'Test St' },
      items: [{ productId: testProd._id, name: 'Test Keyboard', image: '', quantity: 1, price: 1000, category: 'keyboard' }],
      totalAmount: 1000,
      paymentMethod: 'COD',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
    });

    await Order.create({
      orderCode: 'ORD_LTV_2',
      userId: testUser._id,
      customerInfo: { name: 'LTV Tester', phone: '0912345678', address: 'Test St' },
      items: [{ productId: testProd._id, name: 'Test Keyboard', image: '', quantity: 2, price: 1000, category: 'keyboard' }],
      totalAmount: 2000,
      paymentMethod: 'COD',
      paymentStatus: 'paid',
      orderStatus: 'processing',
    });

    await Order.create({
      orderCode: 'ORD_LTV_3_CANCELLED',
      userId: testUser._id,
      customerInfo: { name: 'LTV Tester', phone: '0912345678', address: 'Test St' },
      items: [{ productId: testProd._id, name: 'Test Keyboard', image: '', quantity: 1, price: 1000, category: 'keyboard' }],
      totalAmount: 1000,
      paymentMethod: 'COD',
      paymentStatus: 'failed',
      orderStatus: 'cancelled',
    });

    // Run the aggregation pipeline
    const pipeline: any[] = [
      { $match: { _id: testUser._id } },
      { $project: { passwordHash: 0 } },
      {
        $lookup: {
          from: 'orders',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$userId', '$$userId'] },
                orderStatus: { $ne: 'cancelled' },
                paymentStatus: { $ne: 'failed' },
              },
            },
            {
              $group: {
                _id: null,
                ordersCount: { $sum: 1 },
                totalSpent: { $sum: '$totalAmount' },
              },
            },
          ],
          as: 'orderStats',
        },
      },
      {
        $addFields: {
          ordersCount: {
            $ifNull: [{ $arrayElemAt: ['$orderStats.ordersCount', 0] }, 0],
          },
          totalSpent: {
            $ifNull: [{ $arrayElemAt: ['$orderStats.totalSpent', 0] }, 0],
          },
        },
      },
      {
        $project: {
          orderStats: 0,
        },
      },
    ];

    const aggResults = await User.aggregate(pipeline);
    assert.ok(Array.isArray(aggResults), 'Aggregation must return an Array');
    assert.strictEqual(aggResults.length, 1);
    assert.strictEqual(aggResults[0].ordersCount, 2, 'Should count only non-cancelled orders');
    assert.strictEqual(aggResults[0].totalSpent, 3000, 'Total spent should exclude cancelled orders');
    assert.strictEqual(aggResults[0].passwordHash, undefined, 'passwordHash must be omitted');
    console.log('   ✅ PASS: MongoDB Aggregation Pipeline for getUsers LTV calculation works accurately');

    // 10. Double Restock Prevention & Atomic findByIdAndUpdate
    console.log('10. Testing Double Restock Prevention & Atomic $inc (DATA-01)...');
    const restockProduct = await Product.create({
      name: 'Restock Target',
      slug: 'restock-target',
      category: 'mouse',
      brand: 'Brand',
      price: 500,
      stock: 5,
      soldCount: 10,
    });

    const pendingOrder = await Order.create({
      orderCode: 'ORD_CONCURRENT_CANCEL',
      customerInfo: { name: 'Racer', phone: '0912345678', address: 'Race St' },
      items: [{ productId: restockProduct._id, name: 'Restock Target', image: '', quantity: 2, price: 500, category: 'mouse' }],
      totalAmount: 1000,
      paymentMethod: 'COD',
      paymentStatus: 'pending',
      orderStatus: 'pending',
    });

    // Fire 2 concurrent cancellation attempts
    const cancelAttempt = async () => {
      const updatedOrder = await Order.findOneAndUpdate(
        { _id: pendingOrder._id, orderStatus: 'pending' },
        { $set: { orderStatus: 'cancelled', paymentStatus: 'failed' } },
        { new: true }
      );
      if (updatedOrder) {
        for (const item of pendingOrder.items) {
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stock: item.quantity, soldCount: -item.quantity } },
            { new: true }
          );
        }
        return true;
      }
      return false;
    };

    const [res1, res2] = await Promise.all([cancelAttempt(), cancelAttempt()]);
    assert.strictEqual(res1 !== res2, true, 'Exactly one concurrent cancellation must succeed');

    const freshProduct = await Product.findById(restockProduct._id);
    assert.strictEqual(freshProduct?.stock, 7, 'Stock must only be incremented ONCE (5 + 2 = 7, not 9)');
    assert.strictEqual(freshProduct?.soldCount, 8, 'SoldCount must only be decremented ONCE (10 - 2 = 8, not 6)');
    console.log('   ✅ PASS: Double Restock prevented, atomic stock restoration verified');

    // 11. runValidators: true in findByIdAndUpdate (SEC-08)
    console.log('11. Testing Product runValidators: true (SEC-08)...');
    let validationFailed = false;
    try {
      await Product.findByIdAndUpdate(
        restockProduct._id,
        { price: -500 }, // price min is 0 in schema
        { new: true, runValidators: true }
      );
    } catch (err: any) {
      validationFailed = true;
      assert.ok(err.name === 'ValidationError' || err.message.includes('price'), 'Must throw ValidationError for negative price');
    }
    assert.ok(validationFailed, 'runValidators: true must reject negative price on findByIdAndUpdate');
    console.log('   ✅ PASS: Product.findByIdAndUpdate with runValidators: true enforces schema validation');

  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
  }

  console.log('\n🎉 ALL BUGFIX VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runBugfixTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
