import crypto from 'crypto';
import { ENV } from '../config/env';

export interface CreatePaymentUrlParams {
  orderId: string;
  amount: number;
  orderInfo: string;
  ipAddr: string;
  returnUrl?: string;
}

export const createVnpayPaymentUrl = (params: CreatePaymentUrlParams): string => {
  const date = new Date();
  const createDate = formatDate(date);

  const tmnCode = ENV.VNPAY.tmnCode;
  const secretKey = ENV.VNPAY.hashSecret;
  const vnpUrl = ENV.VNPAY.url;
  const returnUrl = params.returnUrl || ENV.VNPAY.returnUrl;

  const vnp_Params: Record<string, string | number> = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: params.orderId,
    vnp_OrderInfo: params.orderInfo,
    vnp_OrderType: 'other',
    vnp_Amount: params.amount * 100, // VNPAY expects amount * 100
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: params.ipAddr || '127.0.0.1',
    vnp_CreateDate: createDate,
  };

  const sortedParams = sortObject(vnp_Params);
  const signData = Object.entries(sortedParams)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const paymentUrl = `${vnpUrl}?${signData}&vnp_SecureHash=${signed}`;
  return paymentUrl;
};

export const verifyVnpaySignature = (queryParams: Record<string, any>): { isValid: boolean; orderId: string; responseCode: string; transactionNo: string } => {
  const secureHash = queryParams.vnp_SecureHash;
  const cloneParams = { ...queryParams };
  delete cloneParams.vnp_SecureHash;
  delete cloneParams.vnp_SecureHashType;

  const sortedParams = sortObject(cloneParams);
  const signData = Object.entries(sortedParams)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', ENV.VNPAY.hashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  let isValid = false;
  try {
    if (typeof secureHash === 'string' && typeof signed === 'string') {
      const bufA = Buffer.from(secureHash.toLowerCase(), 'hex');
      const bufB = Buffer.from(signed.toLowerCase(), 'hex');
      if (bufA.length > 0 && bufA.length === bufB.length) {
        isValid = crypto.timingSafeEqual(bufA, bufB);
      }
    }
  } catch {
    isValid = false;
  }

  return {
    isValid,
    orderId: queryParams.vnp_TxnRef,
    responseCode: queryParams.vnp_ResponseCode,
    transactionNo: queryParams.vnp_TransactionNo || '',
  };
};

/**
 * Verify incoming payment webhook with HMAC SHA256 signature
 */
export const verifyWebhookSignature = (payload: string | object, signature: string): boolean => {
  if (!signature || typeof signature !== 'string') return false;
  const rawData = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const expectedHash = crypto
    .createHmac('sha256', ENV.VNPAY.hashSecret)
    .update(rawData)
    .digest('hex');

  try {
    const bufA = Buffer.from(signature.toLowerCase(), 'hex');
    const bufB = Buffer.from(expectedHash.toLowerCase(), 'hex');
    if (bufA.length === 0 || bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
};

function sortObject(obj: Record<string, any>): Record<string, any> {
  const sorted: Record<string, any> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[encodeURIComponent(key)] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+');
  }
  return sorted;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}
