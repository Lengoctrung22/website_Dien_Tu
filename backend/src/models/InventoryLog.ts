import { Schema, model, Document, Types } from 'mongoose';

export interface IInventoryLog extends Document {
  productId: Types.ObjectId;
  productName: string;
  changeAmount: number;
  previousStock: number;
  newStock: number;
  reason: 'restock' | 'manual_adjustment' | 'order_deduction' | 'order_cancellation';
  note?: string;
  updatedBy?: string;
  createdAt: Date;
}

const inventoryLogSchema = new Schema<IInventoryLog>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productName: { type: String, required: true },
    changeAmount: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    reason: {
      type: String,
      enum: ['restock', 'manual_adjustment', 'order_deduction', 'order_cancellation'],
      required: true,
    },
    note: { type: String, default: '' },
    updatedBy: { type: String, default: 'System' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

inventoryLogSchema.index({ createdAt: -1 });

export const InventoryLog = model<IInventoryLog>('InventoryLog', inventoryLogSchema);
