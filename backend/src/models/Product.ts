import { Schema, model, Document } from 'mongoose';

export type ProductCategory = 'monitor' | 'keyboard' | 'mouse' | 'headphone';

export interface IProduct extends Document {
  name: string;
  slug: string;
  category: ProductCategory;
  brand: string;
  price: number;
  discountPrice?: number;
  stock: number;
  soldCount: number;
  isHot: boolean;
  hotOrder: number;
  images: string[];
  specs: {
    switch?: string;
    refreshRate?: string;
    connection?: string;
    resolution?: string;
    sensor?: string;
    weight?: string;
    battery?: string;
    layout?: string;
    panelType?: string;
    rgb?: boolean | string;
    [key: string]: any;
  };
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['monitor', 'keyboard', 'mouse', 'headphone'],
      index: true,
    },
    brand: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: 0, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    soldCount: { type: Number, default: 0, min: 0 },
    isHot: { type: Boolean, default: false, index: true },
    hotOrder: { type: Number, default: 0, index: true },
    images: { type: [String], default: [] },
    specs: { type: Schema.Types.Mixed, default: {} },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', brand: 'text', description: 'text' });

export const Product = model<IProduct>('Product', productSchema);
