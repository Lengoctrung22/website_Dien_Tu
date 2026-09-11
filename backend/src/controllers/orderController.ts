import { Request, Response } from 'express';
import { Order, IOrderItem } from '../models/Order';
import { Product } from '../models/Product';
import { InventoryLog } from '../models/InventoryLog';
import { createVnpayPaymentUrl, verifyVnpaySignature } from '../utils/vnpay';

export const createOrder = async (req: Request, res: Response) => {
  try {
    const { customerInfo, items, paymentMethod = 'COD' } = req.body;

    if (!customerInfo || !customerInfo.name || !customerInfo.phone || !customerInfo.address) {
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

    // Generate unique order code: TG + YYMMDD + 4 random digits
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `TG${dateStr}-${randSuffix}`;

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

    const order = await Order.create({
      orderCode,
      userId: req.user ? req.user.id : null,
      customerInfo: {
        name: customerInfo.name,
        phone: customerInfo.phone,
        address: customerInfo.address,
        note: customerInfo.note || '',
      },
      items: populatedItems,
      totalAmount: finalTotal,
      shippingFee,
      paymentMethod,
      paymentStatus: 'pending',
      orderStatus: 'pending',
      vnpayTxnRef: orderCode,
    });

    let paymentUrl = null;
    if (paymentMethod === 'ONLINE') {
      const ipAddr = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      paymentUrl = createVnpayPaymentUrl({
        orderId: orderCode,
        amount: finalTotal,
        orderInfo: `Thanh toan don hang TechGear ${orderCode}`,
        ipAddr: ipAddr.split(',')[0].trim(),
      });
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
      filter.$or = [
        { orderCode: searchRegex },
        { 'customerInfo.name': searchRegex },
        { 'customerInfo.phone': searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page)) || 1);
    const limitNum = Math.max(1, parseInt(String(limit)) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
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
    const order = await Order.findById(id);

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
    const { orderStatus, paymentStatus } = req.body;

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

    if (!orderStatus) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp trạng thái đơn hàng (orderStatus) cần cập nhật',
      });
    }

    if (orderStatus === order.orderStatus) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng hiện tại đã ở trạng thái "${orderStatus}".`,
      });
    }

    // Sequential lifecycle transitions
    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      pending: ['processing', 'cancelled'],
      processing: ['shipping', 'cancelled'],
      shipping: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: [],
    };

    const allowed = ALLOWED_TRANSITIONS[order.orderStatus] || [];
    if (!allowed.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Không thể chuyển trạng thái đơn hàng từ "${order.orderStatus}" sang "${orderStatus}".`,
      });
    }

    // If order is now being cancelled -> restore stock & handle automatic refund
    if (orderStatus === 'cancelled') {
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

      // If order was paid, mark as refunded
      if (order.paymentStatus === 'paid') {
        order.paymentStatus = 'refunded';
      }
    }

    order.orderStatus = orderStatus;

    // Auto-confirm payment as 'paid' when delivered (e.g. COD collected)
    if (orderStatus === 'delivered') {
      order.paymentStatus = 'paid';
    }

    await order.save();
    return res.json({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công', data: order });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
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
      order.paymentStatus = 'failed';
      await order.save();
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

export const handleMockPayment = async (req: Request, res: Response) => {
  try {
    const { orderCode, status = 'success' } = req.body;
    const order = await Order.findOne({ orderCode: orderCode?.trim().toUpperCase() });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    if (status === 'success') {
      order.paymentStatus = 'paid';
      order.vnpayTransactionNo = `MOCK_${Date.now()}`;
      if (order.orderStatus === 'pending') {
        order.orderStatus = 'processing';
      }
      await order.save();
      return res.json({ success: true, message: 'Mô phỏng thanh toán thành công!', data: order });
    } else {
      order.paymentStatus = 'failed';
      await order.save();
      return res.json({ success: false, message: 'Mô phỏng thanh toán thất bại', data: order });
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
      order.paymentStatus = 'failed';
      await order.save();
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
      order.paymentStatus = 'failed';
      await order.save();
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
