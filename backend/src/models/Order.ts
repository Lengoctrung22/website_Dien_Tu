import { Schema, model, Document, Types } from 'mongoose';
import './User';

export type PaymentMethod = 'COD' | 'ONLINE';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatus = 'pending' | 'processing' | 'shipping' | 'delivered' | 'cancelled';

export interface IOrderItem {
  productId: Types.ObjectId;
  name: string;
  image: string;
  quantity: number;
  price: number;
  category: string;
}

export interface ICustomerInfo {
  name: string;
  phone: string;
  address: string;
  note?: string;
}

export interface IOrder extends Document {
  orderCode: string;
  userId?: Types.ObjectId | null;
  customerInfo: ICustomerInfo;
  items: IOrderItem[];
  totalAmount: number;
  shippingFee: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  vnpayTxnRef?: string;
  vnpayTransactionNo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
  },
  { _id: false }
);

const customerInfoSchema = new Schema<ICustomerInfo>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    address: { type: String, required: true, trim: true },
    note: { type: String, default: '' },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    customerInfo: { type: customerInfoSchema, required: true },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['COD', 'ONLINE'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipping', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    vnpayTxnRef: { type: String },
    vnpayTransactionNo: { type: String },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderStatus: 1, paymentStatus: 1, createdAt: -1 });

export const Order = model<IOrder>('Order', orderSchema);
