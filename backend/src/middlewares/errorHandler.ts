import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error Middleware]:', err);

  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Đã có lỗi xảy ra trên hệ thống',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
