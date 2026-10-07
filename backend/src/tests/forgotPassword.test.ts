import assert from 'assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import {
  register,
  login,
  googleLogin,
  forgotPassword,
  resetPassword,
  authInternals,
} from '../controllers/authController';
import { emailInternals } from '../services/emailService';
import { ENV } from '../config/env';

interface MockResponse {
  statusCode: number;
  data: any;
  status(code: number): MockResponse;
  json(body: any): MockResponse;
}

function createMockResponse(): MockResponse {
  const res: MockResponse = {
    statusCode: 200,
    data: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: any) {
      this.data = body;
      return this;
    },
  };
  return res;
}

async function runForgotPasswordTests() {
  console.log('🧪 Starting Forgot & Reset Password Test Suite...\n');

  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Mock email transporter so no actual SMTP network calls are made
  let sentEmails: any[] = [];
  emailInternals.transporterOverride = {
    sendMail: async (options: any) => {
      sentEmails.push(options);
      return { messageId: 'mock-msg-id-123' };
    },
  };

  try {
    // -------------------------------------------------------------
    // Test 1: forgotPassword - Missing or invalid email (HTTP 400)
    // -------------------------------------------------------------
    console.log('1. Testing forgotPassword with missing or empty email (HTTP 400)...');
    const req1a: any = { body: {} };
    const res1a = createMockResponse();
    await forgotPassword(req1a, res1a as any);
    assert.strictEqual(res1a.statusCode, 400);
    assert.strictEqual(res1a.data.success, false);
    assert.ok(res1a.data.message.includes('email'));

    const req1b: any = { body: { email: '   ' } };
    const res1b = createMockResponse();
    await forgotPassword(req1b, res1b as any);
    assert.strictEqual(res1b.statusCode, 400);
    console.log('   ✅ PASS: Returns 400 for empty or invalid email parameter');

    // -------------------------------------------------------------
    // Test 2: forgotPassword - Non-existent email (HTTP 404)
    // -------------------------------------------------------------
    console.log('2. Testing forgotPassword with non-existent email (HTTP 404)...');
    const req2: any = { body: { email: 'nonexistent@example.com' } };
    const res2 = createMockResponse();
    await forgotPassword(req2, res2 as any);
    assert.strictEqual(res2.statusCode, 404);
    assert.strictEqual(res2.data.success, false);
    console.log('   ✅ PASS: Returns 404 when email is not registered');

    // -------------------------------------------------------------
    // Test 3: forgotPassword - Locked user rejection (HTTP 403)
    // -------------------------------------------------------------
    console.log('3. Testing forgotPassword with locked user (HTTP 403)...');
    const lockedUser = await User.create({
      fullName: 'Locked User',
      email: 'locked@example.com',
      passwordHash: 'dummyhash',
      isActive: false,
    });
    const req3: any = { body: { email: 'locked@example.com' } };
    const res3 = createMockResponse();
    await forgotPassword(req3, res3 as any);
    assert.strictEqual(res3.statusCode, 403);
    assert.ok(res3.data.message.includes('khóa'));
    console.log('   ✅ PASS: Returns 403 when user account is inactive/locked');

    // -------------------------------------------------------------
    // Test 4: forgotPassword - Successful OTP generation & email dispatch
    // -------------------------------------------------------------
    console.log('4. Testing forgotPassword valid request for normal user...');
    sentEmails = [];
    const normalUser = await User.create({
      fullName: 'Nguyen Van Test',
      email: 'testuser@techgear.vn',
      passwordHash: await bcrypt.hash('oldPassword123', 10),
      isActive: true,
      role: 'customer',
    });

    const req4: any = { body: { email: '  TestUser@Techgear.vn  ' } };
    const res4 = createMockResponse();
    await forgotPassword(req4, res4 as any);
    assert.strictEqual(res4.statusCode, 200);
    assert.strictEqual(res4.data.success, true);
    assert.ok(res4.data.message.includes('Mã xác thực OTP đã được gửi'));

    // Verify user record in database has 6-digit OTP and 10-minute expiry
    const dbUser4 = await User.findById(normalUser._id);
    assert.ok(dbUser4?.resetPasswordOtp, 'OTP must be stored');
    assert.strictEqual(dbUser4!.resetPasswordOtp!.length, 6, 'OTP must be 6 digits');
    assert.ok(/^\d{6}$/.test(dbUser4!.resetPasswordOtp!), 'OTP must contain only digits');
    assert.ok(dbUser4?.resetPasswordOtpExpires, 'OTP expires must be set');
    const expiresInMs = dbUser4!.resetPasswordOtpExpires!.getTime() - Date.now();
    assert.ok(expiresInMs > 9 * 60 * 1000 && expiresInMs <= 10 * 60 * 1000, 'Expiry should be ~10 minutes');

    // Verify mock email was dispatched with the OTP
    assert.strictEqual(sentEmails.length, 1);
    assert.strictEqual(sentEmails[0].to, 'testuser@techgear.vn');
    assert.ok(sentEmails[0].text.includes(dbUser4!.resetPasswordOtp!));
    assert.ok(sentEmails[0].html.includes(dbUser4!.resetPasswordOtp!));
    console.log('   ✅ PASS: OTP generated, saved with 10-min expiry, and sent via email');

    // -------------------------------------------------------------
    // Test 5: forgotPassword - Google-registered user can also request OTP
    // -------------------------------------------------------------
    console.log('5. Testing forgotPassword for Google-registered account...');
    const googleUser = await User.create({
      fullName: 'Google User',
      email: 'googleuser@gmail.com',
      googleId: 'google_user_sub_12345',
      passwordHash: await bcrypt.hash('random_unusable_hash', 10),
      isActive: true,
      hasCustomPassword: false,
    });

    const req5: any = { body: { email: 'googleuser@gmail.com' } };
    const res5 = createMockResponse();
    await forgotPassword(req5, res5 as any);
    assert.strictEqual(res5.statusCode, 200);
    assert.strictEqual(res5.data.success, true);

    const dbGoogleUser = await User.findById(googleUser._id);
    assert.ok(dbGoogleUser?.resetPasswordOtp);
    console.log('   ✅ PASS: Google-registered accounts can request OTP recovery');

    // -------------------------------------------------------------
    // Test 6: resetPassword - Missing parameters or short password (HTTP 400)
    // -------------------------------------------------------------
    console.log('6. Testing resetPassword validation errors (HTTP 400)...');
    const req6a: any = { body: { email: 'testuser@techgear.vn', otp: '123456' } }; // missing newPassword
    const res6a = createMockResponse();
    await resetPassword(req6a, res6a as any);
    assert.strictEqual(res6a.statusCode, 400);

    const req6b: any = { body: { email: 'testuser@techgear.vn', otp: '123456', newPassword: '123' } }; // < 6 chars
    const res6b = createMockResponse();
    await resetPassword(req6b, res6b as any);
    assert.strictEqual(res6b.statusCode, 400);
    assert.ok(res6b.data.message.includes('tối thiểu 6 ký tự'));
    console.log('   ✅ PASS: Returns 400 on missing fields or password < 6 characters');

    // -------------------------------------------------------------
    // Test 7: resetPassword - Incorrect OTP (HTTP 400)
    // -------------------------------------------------------------
    console.log('7. Testing resetPassword with incorrect OTP (HTTP 400)...');
    const req7: any = {
      body: {
        email: 'testuser@techgear.vn',
        otp: '000000', // wrong otp
        newPassword: 'newStrongPassword123',
      },
    };
    const res7 = createMockResponse();
    await resetPassword(req7, res7 as any);
    assert.strictEqual(res7.statusCode, 400);
    assert.ok(res7.data.message.includes('không chính xác'));
    console.log('   ✅ PASS: Returns 400 on incorrect OTP');

    // -------------------------------------------------------------
    // Test 8: resetPassword - Expired OTP (HTTP 400)
    // -------------------------------------------------------------
    console.log('8. Testing resetPassword with expired OTP (HTTP 400)...');
    // Set expiry in the past
    await User.updateOne(
      { email: 'testuser@techgear.vn' },
      { resetPasswordOtpExpires: new Date(Date.now() - 1000) }
    );
    const req8: any = {
      body: {
        email: 'testuser@techgear.vn',
        otp: dbUser4!.resetPasswordOtp!,
        newPassword: 'newStrongPassword123',
      },
    };
    const res8 = createMockResponse();
    await resetPassword(req8, res8 as any);
    assert.strictEqual(res8.statusCode, 400);
    assert.ok(res8.data.message.includes('hết hạn'));

    // Check that expired OTP was cleared from database
    const dbUser8 = await User.findOne({ email: 'testuser@techgear.vn' });
    assert.strictEqual(dbUser8?.resetPasswordOtp, undefined);
    assert.strictEqual(dbUser8?.resetPasswordOtpExpires, undefined);
    console.log('   ✅ PASS: Returns 400 on expired OTP and clears expired token from database');

    // -------------------------------------------------------------
    // Test 9: Successful resetPassword flow
    // -------------------------------------------------------------
    console.log('9. Testing successful resetPassword and automatic JWT issuance...');
    // Generate fresh OTP
    const req9_forgot: any = { body: { email: 'testuser@techgear.vn' } };
    const res9_forgot = createMockResponse();
    await forgotPassword(req9_forgot, res9_forgot as any);
    assert.strictEqual(res9_forgot.statusCode, 200);

    const userWithFreshOtp = await User.findOne({ email: 'testuser@techgear.vn' });
    const freshOtp = userWithFreshOtp!.resetPasswordOtp!;

    // Perform reset with valid OTP
    const newPassword = 'myBrandNewPassword2026';
    const req9_reset: any = {
      body: {
        email: '  TESTUSER@techgear.vn ',
        otp: `  ${freshOtp}  `,
        newPassword,
      },
    };
    const res9_reset = createMockResponse();
    await resetPassword(req9_reset, res9_reset as any);
    assert.strictEqual(res9_reset.statusCode, 200);
    assert.strictEqual(res9_reset.data.success, true);
    assert.ok(res9_reset.data.data.token, 'Must return JWT token');
    assert.strictEqual(res9_reset.data.data.user.email, 'testuser@techgear.vn');
    assert.strictEqual(res9_reset.data.data.user.isGoogleLinked, false);

    // Verify JWT token is valid
    const decoded: any = jwt.verify(res9_reset.data.data.token, ENV.JWT_SECRET);
    assert.strictEqual(decoded.email, 'testuser@techgear.vn');

    // Verify database state: OTP cleared, password updated
    const updatedUser = await User.findOne({ email: 'testuser@techgear.vn' });
    assert.strictEqual(updatedUser?.resetPasswordOtp, undefined);
    assert.strictEqual(updatedUser?.resetPasswordOtpExpires, undefined);
    assert.strictEqual(updatedUser?.hasCustomPassword, true);

    const isOldPasswordMatch = await updatedUser!.comparePassword('oldPassword123');
    assert.strictEqual(isOldPasswordMatch, false, 'Old password must no longer work');
    const isNewPasswordMatch = await updatedUser!.comparePassword(newPassword);
    assert.strictEqual(isNewPasswordMatch, true, 'New password must match');
    console.log('   ✅ PASS: Password successfully reset and JWT returned');

    // -------------------------------------------------------------
    // Test 10: Sign in using the new password
    // -------------------------------------------------------------
    console.log('10. Testing regular login with newly set password...');
    const req10_old: any = {
      body: { email: 'testuser@techgear.vn', password: 'oldPassword123' },
    };
    const res10_old = createMockResponse();
    await login(req10_old, res10_old as any);
    assert.strictEqual(res10_old.statusCode, 401);

    const req10_new: any = {
      body: { email: 'testuser@techgear.vn', password: newPassword },
    };
    const res10_new = createMockResponse();
    await login(req10_new, res10_new as any);
    assert.strictEqual(res10_new.statusCode, 200);
    assert.strictEqual(res10_new.data.success, true);
    assert.ok(res10_new.data.data.token);
    console.log('   ✅ PASS: New password works for subsequent logins; old password rejected');

    // -------------------------------------------------------------
    // Test 11: Google user can set password via reset and sign in with both!
    // -------------------------------------------------------------
    console.log('11. Testing Google user setting password via reset & dual-login...');
    const googleFresh = await User.findOne({ email: 'googleuser@gmail.com' });
    const googleOtp = googleFresh!.resetPasswordOtp!;
    const googleNewPassword = 'googleUserCustomPass123';

    const req11_reset: any = {
      body: {
        email: 'googleuser@gmail.com',
        otp: googleOtp,
        newPassword: googleNewPassword,
      },
    };
    const res11_reset = createMockResponse();
    await resetPassword(req11_reset, res11_reset as any);
    assert.strictEqual(res11_reset.statusCode, 200);
    assert.strictEqual(res11_reset.data.data.user.isGoogleLinked, true);

    // 11a: Login with password
    const req11_passLogin: any = {
      body: { email: 'googleuser@gmail.com', password: googleNewPassword },
    };
    const res11_passLogin = createMockResponse();
    await login(req11_passLogin, res11_passLogin as any);
    assert.strictEqual(res11_passLogin.statusCode, 200);
    assert.strictEqual(res11_passLogin.data.data.user.isGoogleLinked, true);

    // 11b: Login with Google OAuth ticket still works!
    (ENV as any).GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
    authInternals.setGoogleClient({
      verifyIdToken: async () => ({
        getPayload: () => ({
          sub: 'google_user_sub_12345',
          email: 'googleuser@gmail.com',
          email_verified: true,
          name: 'Google User',
        }),
      }),
    });
    const req11_googleLogin: any = { body: { credential: 'google_token_xyz' } };
    const res11_googleLogin = createMockResponse();
    await googleLogin(req11_googleLogin, res11_googleLogin as any);
    assert.strictEqual(res11_googleLogin.statusCode, 200);
    assert.strictEqual(res11_googleLogin.data.data.user.isGoogleLinked, true);
    console.log('   ✅ PASS: Google account can sign in with BOTH password and Google OAuth');

    // -------------------------------------------------------------
    // Test 12: OTP brute-force protection (5 failed attempts invalidation)
    // -------------------------------------------------------------
    console.log('12. Testing OTP brute force protection (5 failed attempts invalidates OTP)...');
    const bfUser = await User.create({
      fullName: 'Brute Force Target',
      email: 'bruteforce@techgear.vn',
      passwordHash: await bcrypt.hash('secret123', 10),
      isActive: true,
    });
    const req12_forgot: any = { body: { email: 'bruteforce@techgear.vn' } };
    const res12_forgot = createMockResponse();
    await forgotPassword(req12_forgot, res12_forgot as any);
    assert.strictEqual(res12_forgot.statusCode, 200);

    // Enter wrong OTP 4 times - should remain valid with remaining attempts message
    for (let i = 1; i <= 4; i++) {
      const reqFail: any = {
        body: { email: 'bruteforce@techgear.vn', otp: '999999', newPassword: 'newStrongPassword123' },
      };
      const resFail = createMockResponse();
      await resetPassword(reqFail, resFail as any);
      assert.strictEqual(resFail.statusCode, 400);
      assert.ok(resFail.data.message.includes(`Bạn còn ${5 - i} lần thử`));
    }

    // 5th wrong attempt - should invalidate OTP
    const reqFail5: any = {
      body: { email: 'bruteforce@techgear.vn', otp: '999999', newPassword: 'newStrongPassword123' },
    };
    const resFail5 = createMockResponse();
    await resetPassword(reqFail5, resFail5 as any);
    assert.strictEqual(resFail5.statusCode, 400);
    assert.ok(resFail5.data.message.includes('quá 5 lần'));

    // Check DB that OTP was wiped
    const dbBfUser = await User.findById(bfUser._id);
    assert.strictEqual(dbBfUser?.resetPasswordOtp, undefined);
    assert.strictEqual(dbBfUser?.resetPasswordOtpExpires, undefined);
    console.log('   ✅ PASS: OTP is cleared and destroyed after 5 failed guesses');

    // -------------------------------------------------------------
    // Test 13: Numeric type OTP input acceptance
    // -------------------------------------------------------------
    console.log('13. Testing numeric type OTP acceptance...');
    const numUser = await User.create({
      fullName: 'Numeric OTP User',
      email: 'numeric@techgear.vn',
      passwordHash: await bcrypt.hash('secret123', 10),
      isActive: true,
    });
    const req13_forgot: any = { body: { email: 'numeric@techgear.vn' } };
    const res13_forgot = createMockResponse();
    await forgotPassword(req13_forgot, res13_forgot as any);
    const dbNumUser = await User.findById(numUser._id);
    const validNumericOtp = Number(dbNumUser!.resetPasswordOtp);

    const req13_reset: any = {
      body: { email: 'numeric@techgear.vn', otp: validNumericOtp, newPassword: 'validPassword123' },
    };
    const res13_reset = createMockResponse();
    await resetPassword(req13_reset, res13_reset as any);
    assert.strictEqual(res13_reset.statusCode, 200);
    assert.strictEqual(res13_reset.data.success, true);
    console.log('   ✅ PASS: Numeric-type OTP parameters are properly supported');

    // -------------------------------------------------------------
    // Test 14: Additional boundary edge cases
    // -------------------------------------------------------------
    console.log('14. Testing boundary validations (whitespace email, password > 128 chars)...');
    // Whitespace-only email in resetPassword
    const req14_ws: any = {
      body: { email: '   ', otp: '123456', newPassword: 'validPassword123' },
    };
    const res14_ws = createMockResponse();
    await resetPassword(req14_ws, res14_ws as any);
    assert.strictEqual(res14_ws.statusCode, 400);

    // Password > 128 characters
    const req14_long: any = {
      body: { email: 'numeric@techgear.vn', otp: '123456', newPassword: 'a'.repeat(129) },
    };
    const res14_long = createMockResponse();
    await resetPassword(req14_long, res14_long as any);
    assert.strictEqual(res14_long.statusCode, 400);
    assert.ok(res14_long.data.message.includes('128 ký tự'));
    console.log('   ✅ PASS: Edge boundaries cleanly handled');

    console.log('\n🎉 ALL FORGOT & RESET PASSWORD TESTS PASSED PERFECTLY!\n');
  } finally {
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

runForgotPasswordTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
