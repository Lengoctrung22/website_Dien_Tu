import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { User } from '../models/User';
import { ENV } from '../config/env';
import { sendOtpEmail } from '../services/emailService';

export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, phone } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu' });
    }

    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.googleId) {
        return res.status(400).json({
          success: false,
          message: 'Email này đã được liên kết với tài khoản Google. Vui lòng đăng nhập bằng Google.',
        });
      }
      return res.status(400).json({ success: false, message: 'Email này đã được đăng ký trên hệ thống' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName: typeof fullName === 'string' ? fullName.trim() : fullName,
      email: normalizedEmail,
      phone: typeof phone === 'string' ? phone.trim() : '',
      passwordHash,
      role: 'customer',
      permissions: [],
      hasCustomPassword: true,
      isActive: true,
    });

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role, permissions: newUser.permissions },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      data: {
        token,
        user: {
          id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          permissions: newUser.permissions,
          isGoogleLinked: false,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
    }

    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      if (user.googleId && user.role === 'customer' && !user.hasCustomPassword) {
        return res.status(401).json({
          success: false,
          message: 'Tài khoản này được đăng ký bằng Google. Vui lòng chọn "Đăng nhập với Google".',
        });
      }
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, permissions: user.permissions },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          permissions: user.permissions,
          isGoogleLinked: Boolean(user.googleId),
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

let googleClient = new OAuth2Client();

export const authInternals = {
  getGoogleClient: () => googleClient,
  setGoogleClient: (client: any) => {
    googleClient = client;
  },
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    if (!ENV.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ success: false, message: 'Đăng nhập Google chưa được cấu hình trên máy chủ' });
    }

    const { credential } = req.body || {};
    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin xác thực Google' });
    }

    let payload: TokenPayload | undefined;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: ENV.GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ success: false, message: 'Xác thực Google không hợp lệ hoặc đã hết hạn' });
    }

    if (!payload || !payload.sub || !payload.email || payload.email_verified !== true) {
      return res.status(401).json({ success: false, message: 'Tài khoản Google chưa xác minh email' });
    }

    const email = payload.email.toLowerCase().trim();
    const googleSub = payload.sub;
    let user = await User.findOne({ googleId: googleSub });

    if (!user) {
      const existing = await User.findOne({ email });
      if (existing) {
        if (existing.googleId && existing.googleId !== googleSub) {
          return res.status(409).json({ success: false, message: 'Email này đã liên kết với một tài khoản Google khác' });
        }
        // Google is only authoritative for Gmail addresses or Google Workspace (hd) accounts;
        // for other domains we don't auto-link to an existing password account.
        const googleOwnsEmail = email.endsWith('@gmail.com') || email.endsWith('@googlemail.com') || Boolean(payload.hd);
        if (!googleOwnsEmail) {
          return res.status(409).json({
            success: false,
            message: 'Email này đã được đăng ký. Vui lòng đăng nhập bằng mật khẩu.',
          });
        }
        existing.googleId = googleSub;
        // Self-registered (customer) accounts never proved ownership of their email (register has no
        // email verification). Someone could pre-register a victim's Gmail with a password they know;
        // invalidate that password on first Google link so the pre-registered password can't be used
        // to access the real owner's account (pre-account-hijacking). Staff/admin accounts are created
        // by trusted admins/seed, so their password is kept.
        if (existing.role === 'customer') {
          existing.passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
          existing.hasCustomPassword = false;
        }
        try {
          await existing.save();
          user = existing;
        } catch (err: any) {
          if (err?.code !== 11000) throw err;
          // Concurrent request already linked this Google account
          user = await User.findOne({ googleId: googleSub });
        }
      } else {
        // Random unusable password: Google users sign in via Google only.
        const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
        try {
          user = await User.create({
            fullName: (payload.name || email.split('@')[0]).trim(),
            email,
            phone: '',
            passwordHash,
            googleId: googleSub,
            role: 'customer',
            permissions: [],
            isActive: true,
          });
        } catch (err: any) {
          if (err?.code !== 11000) throw err;
          // Concurrent first-time Google login for the same account created it first
          user = await User.findOne({ googleId: googleSub });
        }
      }

      if (!user) {
        return res.status(409).json({ success: false, message: 'Xung đột tài khoản, vui lòng thử lại' });
      }
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, permissions: user.permissions },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Đăng nhập Google thành công',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          permissions: user.permissions,
          isGoogleLinked: true,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    const userObj = user.toObject();
    return res.json({
      success: true,
      data: {
        ...userObj,
        id: user._id,
        isGoogleLinked: Boolean(user.googleId),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const { fullName, phone } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    if (fullName) user.fullName = fullName.trim();
    if (phone !== undefined) user.phone = phone.trim();
    await user.save();

    return res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions,
        isGoogleLinked: Boolean(user.googleId),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp địa chỉ email hợp lệ' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản với email này' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' });
    }

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    user.resetPasswordOtpAttempts = 0;
    await user.save();

    await sendOtpEmail({
      to: user.email,
      otp,
      fullName: user.fullName,
    });

    return res.json({
      success: true,
      message: 'Mã xác thực OTP đã được gửi đến email của bạn. Mã có hiệu lực trong 10 phút.',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body || {};

    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
    const trimmedOtp = otp != null ? String(otp).trim() : '';

    if (!normalizedEmail || !trimmedOtp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ email, mã OTP và mật khẩu mới',
      });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có tối thiểu 6 ký tự',
      });
    }

    if (newPassword.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới không được vượt quá 128 ký tự',
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản với email này' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' });
    }

    if (!user.resetPasswordOtp || !user.resetPasswordOtpExpires) {
      return res.status(400).json({
        success: false,
        message: 'Chưa có yêu cầu đặt lại mật khẩu hoặc mã OTP không tồn tại. Vui lòng gửi lại yêu cầu.',
      });
    }

    if (Date.now() > user.resetPasswordOtpExpires.getTime()) {
      user.resetPasswordOtp = undefined;
      user.resetPasswordOtpExpires = undefined;
      user.resetPasswordOtpAttempts = 0;
      await user.save();
      return res.status(400).json({
        success: false,
        message: 'Mã xác thực OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã mới.',
      });
    }

    if (user.resetPasswordOtp !== trimmedOtp) {
      user.resetPasswordOtpAttempts = (user.resetPasswordOtpAttempts || 0) + 1;
      if (user.resetPasswordOtpAttempts >= 5) {
        user.resetPasswordOtp = undefined;
        user.resetPasswordOtpExpires = undefined;
        user.resetPasswordOtpAttempts = 0;
        await user.save();
        return res.status(400).json({
          success: false,
          message:
            'Bạn đã nhập sai mã OTP quá 5 lần. Mã xác thực đã bị hủy để đảm bảo an toàn. Vui lòng yêu cầu mã mới.',
        });
      }
      await user.save();
      const remaining = 5 - user.resetPasswordOtpAttempts;
      return res.status(400).json({
        success: false,
        message: `Mã xác thực OTP không chính xác. Bạn còn ${remaining} lần thử.`,
      });
    }

    // OTP is valid - update password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    user.passwordHash = passwordHash;
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;
    user.resetPasswordOtpAttempts = 0;
    user.hasCustomPassword = true;
    await user.save();

    // Generate JWT token so user is automatically authenticated upon reset
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, permissions: user.permissions },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          permissions: user.permissions,
          isGoogleLinked: Boolean(user.googleId),
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

