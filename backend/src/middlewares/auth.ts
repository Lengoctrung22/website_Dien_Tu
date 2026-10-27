import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { ENV } from '../config/env';
import { User } from '../models/User';

export interface AuthUserPayload {
  id: string;
  email: string;
  role: 'customer' | 'staff' | 'admin';
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Yêu cầu xác thực đăng nhập' });
  }

  let decoded: AuthUserPayload;
  try {
    decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthUserPayload;
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' });
  }

  if (mongoose.connection.readyState !== 1 || !mongoose.isValidObjectId(decoded.id)) {
    req.user = decoded;
    return next();
  }

  return User.findById(decoded.id)
    .select('email role permissions isActive')
    .lean()
    .then((dbUser) => {
      if (!dbUser) {
        return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại hoặc đã bị xóa' });
      }
      if (!dbUser.isActive) {
        return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa' });
      }
      req.user = {
        id: String(dbUser._id),
        email: dbUser.email,
        role: dbUser.role,
        permissions: dbUser.permissions || [],
      };
      next();
    })
    .catch(() => {
      return res.status(401).json({ success: false, message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' });
    });
};

export const optionalAuthenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  let decoded: AuthUserPayload;
  try {
    decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthUserPayload;
  } catch {
    return next();
  }

  if (mongoose.connection.readyState !== 1 || !mongoose.isValidObjectId(decoded.id)) {
    req.user = decoded;
    return next();
  }

  return User.findById(decoded.id)
    .select('email role permissions isActive')
    .lean()
    .then((dbUser) => {
      if (dbUser && dbUser.isActive) {
        req.user = {
          id: String(dbUser._id),
          email: dbUser.email,
          role: dbUser.role,
          permissions: dbUser.permissions || [],
        };
      }
      next();
    })
    .catch(() => {
      next();
    });
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện thao tác này',
      });
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập' });
    }

    if (req.user.role === 'admin') {
      return next();
    }

    if (req.user.permissions?.includes('all') || req.user.permissions?.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Bạn không có quyền: ${permission}`,
    });
  };
};
