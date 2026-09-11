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

    // Check stock for all items
    const populatedItems: IOrderItem[] = [];
    let calculatedTotal = 0;

    for (const item of items) {
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
      calculatedTotal += itemPrice * item.quantity;

      populatedItems.push({
        productId: product._id as any,
        name: product.name,
        image: product.images[0] || '',
        quantity: item.quantity,
        price: itemPrice,
        category: product.category,
      });
    }

    // Generate unique order code: TG + YYMMDD + 4 random digits
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `TG${dateStr}-${randSuffix}`;

    // Deduct stock and increment soldCount
    for (const item of populatedItems) {
      const product = await Product.findById(item.productId);
      if (product) {
        const prevStock = product.stock;
        product.stock -= item.quantity;
        product.soldCount += item.quantity;
        await product.save();

        await InventoryLog.create({
          productId: product._id,
          productName: product.name,
          changeAmount: -item.quantity,
          previousStock: prevStock,
          newStock: product.stock,
          reason: 'order_deduction',
          note: `Đơn hàng ${orderCode}`,
          updatedBy: req.user?.email || 'Customer',
        });
      }
    }

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
      totalAmount: calculatedTotal,
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
        amount: calculatedTotal,
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

    // If order was not cancelled previously but is now being cancelled -> restore stock
    if (orderStatus === 'cancelled' && order.orderStatus !== 'cancelled') {
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
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

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
