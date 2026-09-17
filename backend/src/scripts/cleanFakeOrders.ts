import { connectDB, disconnectDB } from '../config/db';
import '../models/User';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { InventoryLog } from '../models/InventoryLog';
import { User } from '../models/User';

const MOCK_NAME_REGEX = /(tester|test|racer|0084|staff override|customer receipt|guest tracking|refund lifecycle|cod lifecycle|payment fail|test limit|invalid hop)/i;
const MOCK_PHONE_REGEX = /^(090000000|0999888777|0911223344|0977665544|0966554433|0912987654|0912\.345\.678|0084|0977112233|0999999999|0988776655)/;

async function cleanFakeOrders() {
  await connectDB();
  console.log('--- STARTING CLEANUP OF FAKE TEST ORDERS ---');

  const realCustomer = await User.findOne({ email: 'trunglengoc220324@gmail.com' });
  const testBuyer = await User.findOne({ email: 'test.buyer@techgear.vn' });

  const allOrders = await Order.find();
  console.log(`Total orders found in DB before cleanup: ${allOrders.length}`);

  // Identify fake orders dynamically by test patterns & test accounts
  const fakeOrders = allOrders.filter((o) => {
    const custName = o.customerInfo?.name || '';
    const custPhone = o.customerInfo?.phone || '';
    const isTestBuyer = testBuyer && o.userId && o.userId.toString() === testBuyer._id.toString();

    // Any order belonging to test buyer account is a test order
    if (isTestBuyer) return true;

    // Any order with mock test name or mock phone pattern is a fake test order
    if (MOCK_NAME_REGEX.test(custName)) return true;
    if (MOCK_PHONE_REGEX.test(custPhone)) return true;

    return false;
  });

  console.log(`Fake test orders identified to delete: ${fakeOrders.length}`);

  const fakeOrderCodes = fakeOrders.map((o) => o.orderCode);
  const fakeOrderIds = fakeOrders.map((o) => o._id);

  // Restore product stock and adjust soldCount safely
  for (const ord of fakeOrders) {
    if (ord.orderStatus !== 'cancelled') {
      for (const item of ord.items) {
        if (item.productId) {
          const product = await Product.findById(item.productId);
          if (product) {
            product.stock += item.quantity;
            product.soldCount = Math.max(0, product.soldCount - item.quantity);
            await product.save();
            console.log(`Restored stock for ${product.name}: stock=${product.stock}, soldCount=${product.soldCount}`);
          }
        }
      }
    }
  }

  // Delete inventory logs related to fake orders
  if (fakeOrderCodes.length > 0) {
    const deletedLogs = await InventoryLog.deleteMany({
      $or: [
        { note: { $in: fakeOrderCodes.map((code) => `Đơn hàng ${code}`) } },
        { note: { $in: fakeOrderCodes.map((code) => `Hủy đơn hàng ${code}`) } },
        { note: { $regex: fakeOrderCodes.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') } },
      ],
    });
    console.log(`Deleted inventory logs count: ${deletedLogs.deletedCount}`);
  }

  // Delete all fake orders
  if (fakeOrderIds.length > 0) {
    const deletedOrders = await Order.deleteMany({ _id: { $in: fakeOrderIds } });
    console.log(`Deleted fake orders count: ${deletedOrders.deletedCount}`);
  }

  // Verify remaining orders
  const remainingOrders = await Order.find().populate('userId', 'fullName email phone');
  console.log(`Remaining orders in DB: ${remainingOrders.length}`);
  for (const o of remainingOrders) {
    console.log(`  Order: ${o.orderCode} | Customer: ${o.customerInfo?.name} | Phone: ${o.customerInfo?.phone} | Account: ${(o.userId as any)?.fullName || 'Guest'}`);
  }

  // Verify Lê Ngọc Trung orders
  if (realCustomer) {
    const trungOrders = await Order.find({ userId: realCustomer._id });
    console.log(`Remaining orders for Lê Ngọc Trung (${realCustomer.email}): ${trungOrders.length}`);
  }

  await disconnectDB();
  console.log('--- CLEANUP COMPLETE ---');
}

cleanFakeOrders().catch((err) => {
  console.error('Cleanup error:', err);
  process.exit(1);
});

