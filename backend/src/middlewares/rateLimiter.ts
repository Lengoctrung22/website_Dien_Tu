import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: string;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

export const createRateLimiter = (options: RateLimitOptions) => {
  const store = new Map<string, RequestRecord>();

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
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown-ip';

    const now = Date.now();
    const record = store.get(ip);

    if (!record || now > record.resetTime) {
      store.set(ip, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      return next();
    }

    if (record.count >= options.max) {
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
  max: 30, // max 30 orders per minute per IP
  message: 'Bạn đã tạo quá nhiều đơn hàng liên tiếp. Vui lòng chờ 1 phút trước khi thử lại.',
});

export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // max 20 login/register attempts per minute per IP
  message: 'Quá nhiều yêu cầu đăng nhập/đăng ký. Vui lòng thử lại sau 1 phút.',
});

export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // max 60 uploads per minute per IP
  message: 'Bạn đã tải lên quá nhiều hình ảnh liên tiếp. Vui lòng chờ 1 phút trước khi thử lại.',
});
