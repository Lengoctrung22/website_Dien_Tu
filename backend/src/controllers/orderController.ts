import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Order, IOrderItem } from '../models/Order';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { InventoryLog } from '../models/InventoryLog';
import { createVnpayPaymentUrl, verifyVnpaySignature } from '../utils/vnpay';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { customerInfo, items, paymentMethod = 'COD' } = req.body;

    let customerName = customerInfo?.name?.trim() || '';
    let customerPhone = customerInfo?.phone?.trim() || '';
    const customerAddress = customerInfo?.address?.trim() || '';
    const customerNote = customerInfo?.note?.trim() || '';

    // If customer is authenticated, auto-fill from user profile if not provided
    if (req.user?.id) {
      const dbUser = await User.findById(req.user.id);
      if (dbUser) {
        if (!customerName && dbUser.fullName) {
          customerName = dbUser.fullName.trim();
        }
        if (!customerPhone && dbUser.phone) {
          customerPhone = dbUser.phone.trim();
        }
      }
    }

    if (!customerInfo || !customerName || !customerPhone || !customerAddress) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống, không thể đặt hàng' });
    }

    // Pre-validate product existence and stock availability
    const verifiedItems: { product: any; quantity: number; itemPrice: number }[] = [];
    let calculatedSubtotal = 0;

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Dữ liệu sản phẩm không hợp lệ' });
      }

      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${item.name || item.productId}" không tồn tại hoặc đã ngừng kinh doanh`,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Sản phẩm "${product.name}" chỉ còn ${product.stock} chiếc trong kho, không đủ số lượng ${item.quantity} yêu cầu`,
        });
      }

      const itemPrice = product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;
      calculatedSubtotal += itemPrice * item.quantity;
      verifiedItems.push({ product, quantity: item.quantity, itemPrice });
    }

    // Concurrency-safe atomic reservation loop with automatic rollback on race conditions
    const successfullyDecremented: { productId: any; quantity: number; prevStock: number; newStock: number; productName: string }[] = [];

    for (const entry of verifiedItems) {
      const updated = await Product.findOneAndUpdate(
        { _id: entry.product._id, stock: { $gte: entry.quantity }, isActive: true },
        { $inc: { stock: -entry.quantity, soldCount: entry.quantity } },
        { new: false }
      );

      if (!updated) {
        // Rollback already decremented items in this transaction batch
        for (const rolled of successfullyDecremented) {
          await Product.findByIdAndUpdate(rolled.productId, {
            $inc: { stock: rolled.quantity, soldCount: -rolled.quantity },
          });
        }

        return res.status(400).json({
          success: false,
          message: `Rất tiếc, sản phẩm "${entry.product.name}" vừa hết hàng hoặc không đủ tồn kho do có khách đặt cùng lúc. Vui lòng thử lại.`,
        });
      }

      successfullyDecremented.push({
        productId: entry.product._id,
        quantity: entry.quantity,
        prevStock: updated.stock,
        newStock: updated.stock - entry.quantity,
        productName: entry.product.name,
      });
    }

    // Generate unique order code: TG + YYMMDD + random digits (guaranteed collision-free)
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    let orderCode = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 20) {
      attempts++;
      const randSuffix = attempts < 10
        ? Math.floor(1000 + Math.random() * 9000)
        : Math.floor(10000 + Math.random() * 90000);
      const candidateCode = `TG${dateStr}-${randSuffix}`;
      const existing = await Order.findOne({ orderCode: candidateCode });
      if (!existing) {
        orderCode = candidateCode;
        isUnique = true;
      }
    }

    // Record inventory logs for each decremented product
    for (const log of successfullyDecremented) {
      await InventoryLog.create({
        productId: log.productId,
        productName: log.productName,
        changeAmount: -log.quantity,
        previousStock: log.prevStock,
        newStock: log.newStock,
        reason: 'order_deduction',
        note: `Đơn hàng ${orderCode}`,
        updatedBy: req.user?.email || 'Customer',
      });
    }

    // Consistent shipping fee: Free for subtotal >= 1,000,000, else 30,000
    const shippingFee = calculatedSubtotal >= 1000000 || calculatedSubtotal === 0 ? 0 : 30000;
    const finalTotal = calculatedSubtotal + shippingFee;

    const populatedItems: IOrderItem[] = verifiedItems.map((entry) => ({
      productId: entry.product._id as any,
      name: entry.product.name,
      image: entry.product.images[0] || '',
      quantity: entry.quantity,
      price: entry.itemPrice,
      category: entry.product.category,
    }));

    let order;
    try {
      order = await Order.create({
        orderCode,
        userId: req.user ? req.user.id : null,
        customerInfo: {
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
          note: customerNote,
        },
        items: populatedItems,
        totalAmount: finalTotal,
        shippingFee,
        paymentMethod,
        paymentStatus: 'pending',
        orderStatus: 'pending',
        vnpayTxnRef: orderCode,
      });
    } catch (orderCreateErr) {
      // Rollback decremented stock if Order document creation fails
      for (const rolled of successfullyDecremented) {
        await Product.findByIdAndUpdate(rolled.productId, {
          $inc: { stock: rolled.quantity, soldCount: -rolled.quantity },
        });
      }
      throw orderCreateErr;
    }

    let paymentUrl = null;
    if (paymentMethod === 'ONLINE') {
      paymentUrl = `/payment-qr?orderCode=${orderCode}`;
    }

    return res.status(201).json({
      success: true,
      message: 'Đặt hàng thành công',
      data: {
        order,
        paymentUrl,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const lookupOrder = async (req: Request, res: Response) => {
  try {
    const { orderCode, phone } = req.query;

    if (!orderCode || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp cả Mã đơn hàng và Số điện thoại đặt hàng',
      });
    }

    const cleanOrderCode = String(orderCode).trim().toUpperCase();
    const cleanPhone = String(phone).trim();

    const order = await Order.findOne({
      orderCode: cleanOrderCode,
      'customerInfo.phone': cleanPhone,
    }).populate('items.productId', 'slug category brand images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng phù hợp với mã và số điện thoại đã cung cấp',
      });
    }

    return res.json({ success: true, data: order });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
    }

    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json({ success: true, data: orders });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { status, paymentStatus, search, page = '1', limit = '10' } = req.query;
    const filter: Record<string, any> = {};

    if (status) filter.orderStatus = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      const matchingUsers = await User.find({
        $or: [{ fullName: searchRegex }, { email: searchRegex }],
      }).select('_id');
      const matchingUserIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { orderCode: searchRegex },
        { 'customerInfo.name': searchRegex },
        { 'customerInfo.phone': searchRegex },
        { 'customerInfo.address': searchRegex },
        ...(matchingUserIds.length > 0 ? [{ userId: { $in: matchingUserIds } }] : []),
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page)) || 1);
    const limitNum = Math.max(1, parseInt(String(limit)) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter).populate('userId', 'fullName email phone').sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Order.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cleanId = String(id).trim().toUpperCase().replace(/^#/, '');

    let order = null;
    if (Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ orderCode: cleanId });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // Only allow owner or staff/admin to view
    if (req.user?.role === 'customer' && order.userId?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Không có quyền xem đơn hàng này' });
    }

    return res.json({ success: true, data: order });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus, autoAdvance } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // Terminal state protection: if already delivered or cancelled, forbid any modification
    if (order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng đã ở trạng thái "${order.orderStatus}", không thể thay đổi trạng thái nữa.`,
      });
    }

    // If autoAdvance requested: automatically determine next lifecycle status
    let targetOrderStatus = orderStatus;
    if (autoAdvance) {
      if (order.orderStatus === 'pending') targetOrderStatus = 'processing';
      else if (order.orderStatus === 'processing') targetOrderStatus = 'shipping';
      else if (order.orderStatus === 'shipping') targetOrderStatus = 'delivered';
    }

    if (!targetOrderStatus && !paymentStatus) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp trạng thái đơn hàng (orderStatus) hoặc trạng thái thanh toán (paymentStatus)',
      });
    }

    let message = 'Cập nhật đơn hàng thành công';

    // 1. Process paymentStatus update if provided
    if (paymentStatus && paymentStatus !== order.paymentStatus) {
      if (paymentStatus === 'paid') {
        order.paymentStatus = 'paid';
        // Auto-progress order from pending to processing upon payment
        if (order.orderStatus === 'pending' && !targetOrderStatus) {
          targetOrderStatus = 'processing';
          message = 'Tự động xác nhận thanh toán thành công và chuyển đơn sang "Đang xử lý"';
        } else {
          message = 'Xác nhận thanh toán thành công';
        }
      } else if (paymentStatus === 'failed') {
        await handleFailedPaymentOrder(order, 'Hủy đơn do thanh toán thất bại');
        return res.json({ success: true, message: 'Đã cập nhật thanh toán thất bại và tự động hoàn kho', data: order });
      } else {
        order.paymentStatus = paymentStatus;
      }
    }

    // 2. Process orderStatus transition if requested
    if (targetOrderStatus && targetOrderStatus !== order.orderStatus) {
      const ALLOWED_TRANSITIONS: Record<string, string[]> = {
        pending: ['processing', 'cancelled'],
        processing: ['shipping', 'cancelled'],
        shipping: ['delivered', 'cancelled'],
        delivered: [],
        cancelled: [],
      };

      const allowed = ALLOWED_TRANSITIONS[order.orderStatus] || [];
      if (!allowed.includes(targetOrderStatus)) {
        return res.status(400).json({
          success: false,
          message: `Không thể chuyển trạng thái đơn hàng từ "${order.orderStatus}" sang "${targetOrderStatus}".`,
        });
      }

      // If cancelling: restore stock and mark as refunded if already paid
      if (targetOrderStatus === 'cancelled') {
        for (const item of order.items) {
          const product = await Product.findById(item.productId);
          if (product) {
            const prev = product.stock;
            product.stock += item.quantity;
            product.soldCount = Math.max(0, product.soldCount - item.quantity);
            await product.save();

            await InventoryLog.create({
              productId: product._id,
              productName: product.name,
              changeAmount: item.quantity,
              previousStock: prev,
              newStock: product.stock,
              reason: 'order_cancellation',
              note: `Hủy đơn hàng ${order.orderCode}`,
              updatedBy: req.user?.email || 'Staff',
            });
          }
        }

        if (order.paymentStatus === 'paid') {
          order.paymentStatus = 'refunded';
        }
      }

      // Auto-confirm payment as 'paid' when delivered (e.g. COD collected on delivery)
      if (targetOrderStatus === 'delivered') {
        order.paymentStatus = 'paid';
        message = 'Đã giao hàng thành công và tự động xác nhận thanh toán (COD/Đã thu tiền)';
      }

      order.orderStatus = targetOrderStatus;
    }

    await order.save();
    return res.json({ success: true, message, data: order });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const handleFailedPaymentOrder = async (order: any, note: string) => {
  order.paymentStatus = 'failed';
  if (order.orderStatus === 'pending') {
    order.orderStatus = 'cancelled';
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        const prev = product.stock;
        product.stock += item.quantity;
        product.soldCount = Math.max(0, product.soldCount - item.quantity);
        await product.save();

        await InventoryLog.create({
          productId: product._id,
          productName: product.name,
          changeAmount: item.quantity,
          previousStock: prev,
          newStock: product.stock,
          reason: 'order_cancellation',
          note: `${note} ${order.orderCode}`,
          updatedBy: 'Payment Gateway',
        });
      }
    }
  }
  await order.save();
};

export const handleVnpayReturn = async (req: Request, res: Response) => {
  try {
    const query = req.query;
    const { isValid, orderId, responseCode, transactionNo } = verifyVnpaySignature(query);

    const order = await Order.findOne({ orderCode: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (isValid && responseCode === '00') {
      order.paymentStatus = 'paid';
      order.vnpayTransactionNo = transactionNo;
      if (order.orderStatus === 'pending') {
        order.orderStatus = 'processing';
      }
      await order.save();
      return res.json({ success: true, message: 'Thanh toán thành công qua VNPAY', data: order });
    } else {
      await handleFailedPaymentOrder(order, 'Hủy đơn do thanh toán VNPAY không thành công');
      return res.status(400).json({
        success: false,
        message: 'Thanh toán không thành công hoặc chữ ký không hợp lệ',
        data: order,
      });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Server-to-server VNPAY IPN Webhook handler
 * Responds with standard VNPAY IPN JSON schema: { RspCode: string, Message: string }
 */
export const handleVnpayIpn = async (req: Request, res: Response) => {
  try {
    const query = Object.keys(req.query).length > 0 ? req.query : req.body;
    const { isValid, orderId, responseCode, transactionNo } = verifyVnpaySignature(query);

    if (!isValid) {
      return res.status(200).json({ RspCode: '97', Message: 'Invalid Checksum' });
    }

    const order = await Order.findOne({ orderCode: orderId });
    if (!order) {
      return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
    }

    if (responseCode === '00') {
      order.paymentStatus = 'paid';
      order.vnpayTransactionNo = transactionNo;
      if (order.orderStatus === 'pending') {
        order.orderStatus = 'processing';
      }
      await order.save();
      return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
    } else {
      await handleFailedPaymentOrder(order, 'Hủy đơn do VNPAY IPN báo thanh toán thất bại');
      return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
    }
  } catch (error: any) {
    return res.status(200).json({ RspCode: '99', Message: error.message || 'Unknown Error' });
  }
};

/**
 * Standard Payment Gateway Webhook with HMAC SHA256 signature verification
 */
export const handlePaymentWebhook = async (req: Request, res: Response) => {
  try {
    const signature = (req.headers['x-signature'] as string) || req.body?.signature || '';
    const payload = req.body;

    const { verifyWebhookSignature } = await import('../utils/vnpay');
    const isValid = verifyWebhookSignature(payload, signature);

    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Chữ ký HMAC SHA256 không hợp lệ' });
    }

    const { orderCode, paymentStatus, transactionNo } = payload;
    const order = await Order.findOne({ orderCode });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (paymentStatus === 'paid') {
      order.paymentStatus = 'paid';
      if (transactionNo) order.vnpayTransactionNo = transactionNo;
      if (order.orderStatus === 'pending') order.orderStatus = 'processing';
      await order.save();
    } else if (paymentStatus === 'failed') {
      await handleFailedPaymentOrder(order, 'Hủy đơn do Webhook báo thanh toán thất bại');
    }

    return res.json({
      success: true,
      message: 'Xử lý webhook thanh toán thành công',
      data: order,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Auto-verify payment status for an order and auto-advance status
 */
export const verifyOrderPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cleanId = String(id).trim().toUpperCase().replace(/^#/, '');

    let order = null;
    if (Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ orderCode: cleanId });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (order.paymentStatus === 'paid') {
      return res.json({
        success: true,
        message: 'Đơn hàng đã được xác nhận thanh toán trước đó',
        data: order,
      });
    }

    // Auto verify payment: update to paid and auto-progress status to processing if pending
    order.paymentStatus = 'paid';
    if (!order.vnpayTransactionNo) {
      order.vnpayTransactionNo = `VERIFIED-${Date.now().toString().slice(-8)}`;
    }
    if (order.orderStatus === 'pending') {
      order.orderStatus = 'processing';
    }

    await order.save();

    return res.json({
      success: true,
      message: `Đã tự động xác nhận thanh toán thành công! Đơn hàng đã chuyển sang trạng thái "Đang xử lý".`,
      data: order,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Customer notifies online transfer completed
 * Endpoint: POST /api/orders/:id/notify-paid
 */
export const notifyPaid = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cleanId = String(id).trim().toUpperCase().replace(/^#/, '');

    let order = null;
    if (Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ orderCode: cleanId });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // Terminal states check
    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã bị hủy, không thể thông báo chuyển khoản.',
      });
    }

    if (order.orderStatus === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã được hoàn tất trước đó.',
      });
    }

    // Update status to processing and paymentStatus to pending (if not already paid)
    order.orderStatus = 'processing';
    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = 'pending';
    }

    await order.save();

    return res.json({
      success: true,
      message: 'Thông báo chuyển khoản thành công! Đơn hàng đã được chuyển sang trạng thái "Đang xử lý" để nhân viên đối soát.',
      data: order,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Customer / Guest confirm receipt of goods
 * Endpoint: POST /api/orders/:id/confirm-receipt
 * When confirmed: order transitions from `shipping` to `delivered`.
 * If payment is COD and paymentStatus === 'pending', automatically mark paymentStatus = 'paid'.
 */
export const confirmOrderReceipt = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { phone } = req.body || {};

    const cleanId = String(id).trim().toUpperCase().replace(/^#/, '');

    let order = null;
    if (Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }
    if (!order) {
      order = await Order.findOne({ orderCode: cleanId });
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // Authorization verification:
    // 1. Staff or Admin: authorized
    // 2. Logged-in customer matching order.userId: authorized
    // 3. Guest or Customer providing matching order phone: authorized
    const isStaffOrAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'staff');
    const isOwnerUser = Boolean(req.user && order.userId && req.user.id === order.userId.toString());

    const normalizePhone = (p: string | undefined | null) => {
      if (!p) return '';
      let cleaned = String(p).replace(/\D/g, '');
      if (cleaned.startsWith('0084')) {
        cleaned = '0' + cleaned.slice(4);
      } else if (cleaned.startsWith('84')) {
        cleaned = '0' + cleaned.slice(2);
      }
      if (cleaned.length === 9 && !cleaned.startsWith('0')) {
        cleaned = '0' + cleaned;
      }
      return cleaned;
    };
    const orderPhone = normalizePhone(order.customerInfo?.phone);
    const bodyPhone = normalizePhone(phone);
    const isMatchingPhone = Boolean(bodyPhone && orderPhone && bodyPhone === orderPhone);

    if (!isStaffOrAdmin && !isOwnerUser && !isMatchingPhone) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xác nhận đơn hàng này. Vui lòng xác thực số điện thoại đặt hàng.',
      });
    }

    // Terminal states check
    if (order.orderStatus === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã được xác nhận nhận hàng trước đó.',
        data: order,
      });
    }

    if (order.orderStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Đơn hàng đã bị hủy, không thể xác nhận nhận hàng.',
      });
    }

    // Order must be in shipping state to be confirmed as received
    if (order.orderStatus !== 'shipping') {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng đang ở trạng thái "${order.orderStatus}". Chỉ có thể xác nhận khi đơn đang được giao hàng (shipping).`,
      });
    }

    // Transition order to delivered
    order.orderStatus = 'delivered';

    // If payment is COD and paymentStatus is pending, automatically mark as paid
    if (order.paymentMethod?.toUpperCase() === 'COD' && order.paymentStatus === 'pending') {
      order.paymentStatus = 'paid';
    }

    await order.save();

    return res.json({
      success: true,
      message: 'Xác nhận đã nhận hàng thành công! Cảm ơn bạn đã mua sắm tại TechGear.',
      data: order,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

