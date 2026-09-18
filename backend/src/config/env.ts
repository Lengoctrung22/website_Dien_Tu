import dotenv from 'dotenv';
import path from 'path';

// 1. Load from current working directory
dotenv.config();
// 2. Explicitly load from backend/.env so variables are populated even if CWD is the repository root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  PORT: Number(process.env.PORT) || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/website_dien_tu',
  JWT_SECRET: process.env.JWT_SECRET || 'techgear_super_secret_jwt_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  VNPAY: {
    tmnCode: process.env.VNPAY_TMN_CODE || 'TECHGEAR',
    hashSecret: process.env.VNPAY_HASH_SECRET || 'VNPAYTECHGEARSECRETKEY2026SANDBOX',
    url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payment-result',
  },
};
