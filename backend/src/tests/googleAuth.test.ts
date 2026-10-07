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
  getMe,
  updateProfile,
  authInternals,
} from '../controllers/authController';
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

async function runGoogleAuthTests() {
  console.log('🧪 Starting Google Authentication Test Suite...\n');

  const mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  const originalClientId = ENV.GOOGLE_CLIENT_ID;
  const originalGoogleClient = authInternals.getGoogleClient();

  try {
    // -------------------------------------------------------------
    // Test 1: Service Unavailable when GOOGLE_CLIENT_ID is not set
    // -------------------------------------------------------------
    console.log('1. Testing GOOGLE_CLIENT_ID missing configuration (HTTP 503)...');
    (ENV as any).GOOGLE_CLIENT_ID = '';
    const req1: any = { body: { credential: 'dummy_token' } };
    const res1 = createMockResponse();
    await googleLogin(req1, res1 as any);
    assert.strictEqual(res1.statusCode, 503);
    assert.strictEqual(res1.data.success, false);
    assert.ok(res1.data.message.includes('chưa được cấu hình'));
    console.log('   ✅ PASS: Returns 503 when GOOGLE_CLIENT_ID is missing');

    // Restore GOOGLE_CLIENT_ID for remaining tests
    (ENV as any).GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';

    // -------------------------------------------------------------
    // Test 2: Missing or invalid credential body
    // -------------------------------------------------------------
    console.log('2. Testing missing or invalid credential parameter (HTTP 400)...');
    const req2a: any = { body: {} };
    const res2a = createMockResponse();
    await googleLogin(req2a, res2a as any);
    assert.strictEqual(res2a.statusCode, 400);
    assert.ok(res2a.data.message.includes('Thiếu thông tin'));

    const req2b: any = { body: { credential: 12345 } };
    const res2b = createMockResponse();
    await googleLogin(req2b, res2b as any);
    assert.strictEqual(res2b.statusCode, 400);
    console.log('   ✅ PASS: Returns 400 on empty or non-string credential');

    // -------------------------------------------------------------
    // Test 3: Invalid token verification failure (Google rejects)
    // -------------------------------------------------------------
    console.log('3. Testing invalid Google token verification (HTTP 401)...');
    authInternals.setGoogleClient({
      verifyIdToken: async () => {
        throw new Error('Token signature invalid');
      },
    });
    const req3: any = { body: { credential: 'invalid_expired_token' } };
    const res3 = createMockResponse();
    await googleLogin(req3, res3 as any);
    assert.strictEqual(res3.statusCode, 401);
    assert.ok(res3.data.message.includes('không hợp lệ'));
    console.log('   ✅ PASS: Returns 401 when Google token verification fails');

    // -------------------------------------------------------------
    // Test 4: Payload validation (missing sub, email, or unverified)
    // -------------------------------------------------------------
    console.log('4. Testing unverified email or incomplete payload (HTTP 401)...');
    authInternals.setGoogleClient({
      verifyIdToken: async () => ({
        getPayload: () => ({ sub: 'sub123', email: 'unverified@gmail.com', email_verified: false }),
      }),
    });
    const req4: any = { body: { credential: 'unverified_token' } };
    const res4 = createMockResponse();
    await googleLogin(req4, res4 as any);
    assert.strictEqual(res4.statusCode, 401);
    assert.ok(res4.data.message.includes('chưa xác minh email'));
    console.log('   ✅ PASS: Returns 401 when email is not verified');

    // -------------------------------------------------------------
    // Test 5: Successful brand-new customer creation via Google
    // -------------------------------------------------------------
    console.log('5. Testing first-time Google sign-in (new customer)...');
    authInternals.setGoogleClient({
      verifyIdToken: async () => ({
        getPayload: () => ({
          sub: 'google_sub_001',
          email: 'NewUser@gmail.com',
          email_verified: true,
          name: 'Nguyen Van New',
        }),
      }),
    });
    const req5: any = { body: { credential: 'valid_new_token' } };
    const res5 = createMockResponse();
    await googleLogin(req5, res5 as any);
    assert.strictEqual(res5.statusCode, 200);
    assert.strictEqual(res5.data.success, true);
    assert.ok(res5.data.data.token, 'Must return JWT token');
    assert.strictEqual(res5.data.data.user.email, 'newuser@gmail.com');
    assert.strictEqual(res5.data.data.user.fullName, 'Nguyen Van New');
    assert.strictEqual(res5.data.data.user.role, 'customer');
    assert.strictEqual(res5.data.data.user.isGoogleLinked, true);

    // Verify user in database
    const dbUser1 = await User.findOne({ email: 'newuser@gmail.com' });
    assert.ok(dbUser1);
    assert.strictEqual(dbUser1.googleId, 'google_sub_001');
    assert.strictEqual(dbUser1.phone, '');
    assert.strictEqual(dbUser1.isActive, true);

    // Verify JWT payload
    const decoded1: any = jwt.verify(res5.data.data.token, ENV.JWT_SECRET);
    assert.strictEqual(decoded1.email, 'newuser@gmail.com');
    assert.strictEqual(decoded1.role, 'customer');
    console.log('   ✅ PASS: New customer created with Google account and valid JWT');

    // -------------------------------------------------------------
    // Test 6: Subsequent login with same Google account
    // -------------------------------------------------------------
    console.log('6. Testing returning Google user login...');
    const req6: any = { body: { credential: 'valid_existing_token' } };
    const res6 = createMockResponse();
    await googleLogin(req6, res6 as any);
    assert.strictEqual(res6.statusCode, 200);
    assert.strictEqual(res6.data.data.user.id.toString(), dbUser1._id.toString());
    assert.strictEqual(res6.data.data.user.isGoogleLinked, true);
    console.log('   ✅ PASS: Returning user successfully logs in');

    // -------------------------------------------------------------
    // Test 7: Pre-account hijacking protection for customer accounts
    // -------------------------------------------------------------
    console.log('7. Testing pre-account hijacking protection on Gmail linking...');
    // Attacker pre-registered victim's Gmail with password 'attacker_password'
    const victimOldPassword = 'attacker_password';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(victimOldPassword, salt);
    const victim = await User.create({
      fullName: 'Victim Customer',
      email: 'victim@gmail.com',
      passwordHash: hash,
      role: 'customer',
      isActive: true,
    });

    // Real victim logs in via Google
    authInternals.setGoogleClient({
      verifyIdToken: async () => ({
        getPayload: () => ({
          sub: 'victim_google_sub_777',
          email: 'victim@gmail.com',
          email_verified: true,
          name: 'Real Victim Name',
        }),
      }),
    });
    const req7: any = { body: { credential: 'victim_google_token' } };
    const res7 = createMockResponse();
    await googleLogin(req7, res7 as any);
    assert.strictEqual(res7.statusCode, 200);

    // Check that victim's account is linked to Google
    const updatedVictim = await User.findById(victim._id);
    assert.strictEqual(updatedVictim?.googleId, 'victim_google_sub_777');

    // Check that old pre-registered password CANNOT be used anymore!
    const isOldPasswordStillUsable = await updatedVictim!.comparePassword(victimOldPassword);
    assert.strictEqual(isOldPasswordStillUsable, false, 'Pre-registered password must be invalidated');
    console.log('   ✅ PASS: Pre-registered password safely scrambled on first Google sign-in');

    // -------------------------------------------------------------
    // Test 8: Staff account preserves password and staff role
    // -------------------------------------------------------------
    console.log('8. Testing staff account Google linking (preserves password)...');
    const staffPassword = 'staff_secure_password';
    const staffHash = await bcrypt.hash(staffPassword, salt);
    const staff = await User.create({
      fullName: 'Warehouse Manager',
      email: 'warehouse.staff@gmail.com',
      passwordHash: staffHash,
      role: 'staff',
      permissions: ['inventory'],
      isActive: true,
    });

    authInternals.setGoogleClient({
      verifyIdToken: async () => ({
        getPayload: () => ({
          sub: 'staff_google_sub_888',
          email: 'warehouse.staff@gmail.com',
          email_verified: true,
          name: 'Warehouse Manager Google',
        }),
      }),
    });
    const req8: any = { body: { credential: 'staff_token' } };
    const res8 = createMockResponse();
    await googleLogin(req8, res8 as any);
    assert.strictEqual(res8.statusCode, 200);
    assert.strictEqual(res8.data.data.user.role, 'staff');

    // Verify staff password is STILL VALID
    const updatedStaff = await User.findById(staff._id);
    assert.strictEqual(updatedStaff?.googleId, 'staff_google_sub_888');
    const isStaffPasswordStillValid = await updatedStaff!.comparePassword(staffPassword);
    assert.strictEqual(isStaffPasswordStillValid, true, 'Staff password must be preserved');
    console.log('   ✅ PASS: Staff role and password preserved upon Google link');

    // -------------------------------------------------------------
    // Test 9: Non-Google domain does not auto-link without hd
    // -------------------------------------------------------------
    console.log('9. Testing rejection of non-Google domain auto-linking (HTTP 409)...');
    await User.create({
      fullName: 'Yahoo User',
      email: 'user@yahoo.com',
      passwordHash: hash,
      role: 'customer',
      isActive: true,
    });

    authInternals.setGoogleClient({
      verifyIdToken: async () => ({
        getPayload: () => ({
          sub: 'yahoo_fake_sub_999',
          email: 'user@yahoo.com',
          email_verified: true,
          name: 'Yahoo Person',
        }),
      }),
    });
    const req9: any = { body: { credential: 'yahoo_token' } };
    const res9 = createMockResponse();
    await googleLogin(req9, res9 as any);
    assert.strictEqual(res9.statusCode, 409);
    assert.ok(res9.data.message.includes('đăng nhập bằng mật khẩu'));
    console.log('   ✅ PASS: Non-Google domain rejects auto-linking to avoid spoofing');

    // -------------------------------------------------------------
    // Test 10: Email already linked to a different Google account
    // -------------------------------------------------------------
    console.log('10. Testing email already linked to different Google account (HTTP 409)...');
    authInternals.setGoogleClient({
      verifyIdToken: async () => ({
        getPayload: () => ({
          sub: 'DIFFERENT_GOOGLE_SUB_123',
          email: 'newuser@gmail.com', // Already linked to google_sub_001
          email_verified: true,
          name: 'Different Sub',
        }),
      }),
    });
    const req10: any = { body: { credential: 'conflict_token' } };
    const res10 = createMockResponse();
    await googleLogin(req10, res10 as any);
    assert.strictEqual(res10.statusCode, 409);
    assert.ok(res10.data.message.includes('liên kết với một tài khoản Google khác'));
    console.log('   ✅ PASS: Conflicting Google sub on existing email returns 409');

    // -------------------------------------------------------------
    // Test 11: Locked account rejected
    // -------------------------------------------------------------
    console.log('11. Testing locked account rejection (HTTP 403)...');
    await User.updateOne({ email: 'newuser@gmail.com' }, { isActive: false });
    authInternals.setGoogleClient({
      verifyIdToken: async () => ({
        getPayload: () => ({
          sub: 'google_sub_001',
          email: 'newuser@gmail.com',
          email_verified: true,
        }),
      }),
    });
    const req11: any = { body: { credential: 'locked_token' } };
    const res11 = createMockResponse();
    await googleLogin(req11, res11 as any);
    assert.strictEqual(res11.statusCode, 403);
    assert.ok(res11.data.message.includes('khóa'));
    console.log('   ✅ PASS: Locked account returns 403 Forbidden');
    // Re-activate
    await User.updateOne({ email: 'newuser@gmail.com' }, { isActive: true });

    // -------------------------------------------------------------
    // Test 12: Register form with existing Google email
    // -------------------------------------------------------------
    console.log('12. Testing normal register with Google email (HTTP 400 with helpful UX)...');
    const req12: any = {
      body: {
        fullName: 'Test Dup',
        email: 'newuser@gmail.com',
        password: 'password123',
      },
    };
    const res12 = createMockResponse();
    await register(req12, res12 as any);
    assert.strictEqual(res12.statusCode, 400);
    assert.ok(res12.data.message.includes('liên kết với tài khoản Google'));
    console.log('   ✅ PASS: Normal register guides user to Google login');

    // -------------------------------------------------------------
    // Test 13: Password login for customer Google account with invalid pass
    // -------------------------------------------------------------
    console.log('13. Testing password login attempt on Google-only customer...');
    const req13: any = {
      body: {
        email: 'newuser@gmail.com',
        password: 'any_random_password',
      },
    };
    const res13 = createMockResponse();
    await login(req13, res13 as any);
    assert.strictEqual(res13.statusCode, 401);
    assert.ok(res13.data.message.includes('đăng ký bằng Google'));
    console.log('   ✅ PASS: Password login guides user to use Google Sign-in button');

    // -------------------------------------------------------------
    // Test 14: Profile endpoints return isGoogleLinked
    // -------------------------------------------------------------
    console.log('14. Testing getMe and updateProfile isGoogleLinked flags...');
    const googleUser = await User.findOne({ email: 'newuser@gmail.com' });
    assert.ok(googleUser);

    // getMe
    const req14a: any = { user: { id: googleUser._id.toString() } };
    const res14a = createMockResponse();
    await getMe(req14a, res14a as any);
    assert.strictEqual(res14a.statusCode, 200);
    assert.strictEqual(res14a.data.data.isGoogleLinked, true);
    assert.strictEqual(res14a.data.data.passwordHash, undefined, 'passwordHash must never be exposed');

    // updateProfile
    const req14b: any = {
      user: { id: googleUser._id.toString() },
      body: { fullName: 'Nguyen Van New Updated', phone: '0988776655' },
    };
    const res14b = createMockResponse();
    await updateProfile(req14b, res14b as any);
    assert.strictEqual(res14b.statusCode, 200);
    assert.strictEqual(res14b.data.data.fullName, 'Nguyen Van New Updated');
    assert.strictEqual(res14b.data.data.phone, '0988776655');
    assert.strictEqual(res14b.data.data.isGoogleLinked, true);
    assert.ok(Array.isArray(res14b.data.data.permissions), 'Permissions must be included in updateProfile');

    const reloaded = await User.findById(googleUser._id);
    assert.strictEqual(reloaded?.phone, '0988776655');
    console.log('   ✅ PASS: Profile accurately tracks isGoogleLinked, updates phone, and retains permissions');

    // -------------------------------------------------------------
    // Test 15: Email trimming resilience in register and login
    // -------------------------------------------------------------
    console.log('15. Testing whitespace-padded email normalization in register and login...');
    const req15a: any = {
      body: {
        fullName: 'Trimmed Test User',
        email: '  padded.user@techgear.vn  ',
        password: 'securepassword123',
        phone: '  0909999999  ',
      },
    };
    const res15a = createMockResponse();
    await register(req15a, res15a as any);
    assert.strictEqual(res15a.statusCode, 201);
    assert.strictEqual(res15a.data.data.user.email, 'padded.user@techgear.vn');

    // Login with differently padded email
    const req15b: any = {
      body: {
        email: '  PADDED.USER@techgear.vn ',
        password: 'securepassword123',
      },
    };
    const res15b = createMockResponse();
    await login(req15b, res15b as any);
    assert.strictEqual(res15b.statusCode, 200);
    assert.strictEqual(res15b.data.data.user.email, 'padded.user@techgear.vn');
    console.log('   ✅ PASS: Whitespace-padded emails normalized cleanly in register & login');

    console.log('\n🎉 ALL GOOGLE AUTHENTICATION TESTS PASSED PERFECTLY!\n');
  } finally {
    // Restore environment & internals
    (ENV as any).GOOGLE_CLIENT_ID = originalClientId;
    authInternals.setGoogleClient(originalGoogleClient);
    await mongoose.disconnect();
    await mongoServer.stop();
  }
}

runGoogleAuthTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
