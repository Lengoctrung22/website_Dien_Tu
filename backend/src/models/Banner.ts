import { Schema, model, Document, Types } from 'mongoose';

export type BannerThemeKey = 'purple' | 'blue' | 'cyan' | 'rose' | 'emerald' | 'amber' | 'dark';
export type BannerImageFit = 'contain' | 'cover';

export interface IBanner extends Document {
  title: string;
  subtitle: string;
  desc: string;
  badge: string;
  tag: string;
  image: string;
  imageFit: BannerImageFit;
  theme: BannerThemeKey;
  cta: string;
  link: string;
  showSecondaryBtn: boolean;
  secondaryCta: string;
  secondaryLink: string;
  productId?: Types.ObjectId | null;
  removeWhiteBg: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bannerSchema = new Schema<IBanner>(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '', trim: true },
    desc: { type: String, default: '', trim: true },
    badge: { type: String, default: '', trim: true },
    tag: { type: String, default: '', trim: true },
    image: { type: String, required: true, trim: true },
    imageFit: {
      type: String,
      enum: ['contain', 'cover'],
      default: 'contain',
    },
    theme: {
      type: String,
      enum: ['purple', 'blue', 'cyan', 'rose', 'emerald', 'amber', 'dark'],
      default: 'purple',
      index: true,
    },
    cta: { type: String, default: 'Khám Phá Ngay', trim: true },
    link: { type: String, default: '/products', trim: true },
    showSecondaryBtn: { type: Boolean, default: true },
    secondaryCta: { type: String, default: 'Xem tất cả sản phẩm', trim: true },
    secondaryLink: { type: String, default: '/products', trim: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    removeWhiteBg: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

bannerSchema.index({ displayOrder: 1, createdAt: -1 });

export const Banner = model<IBanner>('Banner', bannerSchema);
