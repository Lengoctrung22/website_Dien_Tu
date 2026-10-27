import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;
  max?: number;
  maxRequests?: number;
  message: string;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

const MAX_ENTRIES = 10000;

export const createRateLimiter = (options: RateLimitOptions) => {
  const store = new Map<string, RequestRecord>();
  const maxLimit = options.maxRequests ?? options.max ?? 60;

  // Cleanup expired records periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(key);
      }
    }
  }, 60000).unref(); // unref prevents interval from keeping process alive

  return (req: Request, res: Response, next: NextFunction) => {
    const rawIp =
      req.ip ||
      req.socket?.remoteAddress ||
      (typeof req.headers['x-real-ip'] === 'string' ? req.headers['x-real-ip'] : '') ||
      'unknown-ip';
    const ip = String(rawIp).trim() || 'unknown-ip';

    const now = Date.now();
    const record = store.get(ip);

    if (!record || now > record.resetTime) {
      if (store.size >= MAX_ENTRIES && !store.has(ip)) {
        for (const [k, v] of store.entries()) {
          if (now > v.resetTime) store.delete(k);
        }
        if (store.size >= MAX_ENTRIES) {
          const oldestKey = store.keys().next().value;
          if (oldestKey) store.delete(oldestKey);
        }
      }

      store.set(ip, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      return next();
    }

    if (record.count >= maxLimit) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        success: false,
        message: options.message || 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
        retryAfterSeconds: retryAfter,
      });
    }

    record.count++;
    return next();
  };
};

export const orderRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // max 120 orders per minute per IP
  message: 'Bạn đã tạo quá nhiều đơn hàng liên tiếp. Vui lòng chờ 1 phút trước khi thử lại.',
});

export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // max 100 login/register attempts per minute per IP
  message: 'Quá nhiều yêu cầu đăng nhập/đăng ký. Vui lòng thử lại sau 1 phút.',
});

export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // max 60 uploads per minute per IP
  message: 'Bạn đã tải lên quá nhiều hình ảnh liên tiếp. Vui lòng chờ 1 phút trước khi thử lại.',
});

export const chatRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // max 30 chat requests per minute per IP
  message: 'Bạn đã gửi tin nhắn quá nhanh. Vui lòng thử lại sau 1 phút.',
});
