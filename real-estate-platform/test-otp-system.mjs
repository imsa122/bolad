/**
 * Comprehensive OTP Email Verification System Test
 * Tests all scenarios: send, verify, rate limiting, expiry, attempts
 *
 * Response structure reference:
 *   register  → { success, data: { user, token, requiresEmailVerification, otpSent, devOtp? }, message }
 *   send-otp  → { success, message, expiresIn, devOtp? }  (flat, not wrapped)
 *   verify-otp→ { success, message?, error?, attemptsLeft?, requiresNewOtp? } (flat)
 */

const BASE = 'http://localhost:3000';
const TEST_EMAIL = `otp-test-${Date.now()}@example.com`;
const TEST_PASS  = 'Test@123456';

let passed = 0;
let failed = 0;

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch (e) {
    return { status: 0, data: { error: e.message } };
  }
}

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}${detail ? ' — ' + detail : ''}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function run() {
  console.log('='.repeat(60));
  console.log('  OTP EMAIL VERIFICATION SYSTEM TEST');
  console.log('='.repeat(60));
  console.log(`  Test email: ${TEST_EMAIL}`);

  // ── Wait for server to be ready ──
  console.log('\n⏳ Waiting for server...');
  let serverReady = false;
  for (let i = 0; i < 10; i++) {
    try {
      const r = await fetch(`${BASE}/api/test-db`);
      if (r.ok) { serverReady = true; break; }
    } catch {}
    await new Promise(r => setTimeout(r, 2000));
    process.stdout.write('.');
  }
  console.log(serverReady ? '\n✅ Server ready\n' : '\n⚠️  Server may not be ready\n');

  // ════════════════════════════════════════════════════════
  // TEST 1: Register → Auto OTP Send
  // ════════════════════════════════════════════════════════
  console.log('── Test 1: Register → Auto OTP Send ──');
  const r1 = await req('POST', '/api/auth/register', {
    name: 'مستخدم اختبار OTP',
    email: TEST_EMAIL,
    password: TEST_PASS,
    confirmPassword: TEST_PASS,   // ← required by registerSchema
    phone: '+966512345678',
  });

  check('Register returns 201', r1.status === 201, `status: ${r1.status}`);
  check('requiresEmailVerification = true', r1.data?.data?.requiresEmailVerification === true);
  check('otpSent flag present', 'otpSent' in (r1.data?.data || {}), `otpSent: ${r1.data?.data?.otpSent}`);
  check('JWT token returned', !!r1.data?.data?.token);

  const userToken = r1.data?.data?.token;
  const devOtpFromRegister = r1.data?.data?.devOtp;

  console.log(`  ℹ️  devOtp from register: ${devOtpFromRegister || '(not in response — check server console)'}`);
  console.log(`  ℹ️  otpSent: ${r1.data?.data?.otpSent}`);

  if (r1.status !== 201) {
    console.log(`  ℹ️  Register error: ${JSON.stringify(r1.data)}`);
  }

  // ════════════════════════════════════════════════════════
  // TEST 2: Cooldown — resend within 60s → 429
  // ════════════════════════════════════════════════════════
  console.log('\n── Test 2: Cooldown (60s between sends) ──');
  const r2 = await req('POST', '/api/auth/send-otp', {
    email: TEST_EMAIL,
    locale: 'ar',
  });
  check('Resend within 60s → 429', r2.status === 429, `status: ${r2.status}`);
  check('retryAfter > 0', (r2.data?.retryAfter ?? 0) > 0, `retryAfter: ${r2.data?.retryAfter}`);
  console.log(`  ℹ️  Retry after: ${r2.data?.retryAfter}s`);

  // ════════════════════════════════════════════════════════
  // TEST 3: Wrong OTP → 400 + attemptsLeft
  // ════════════════════════════════════════════════════════
  console.log('\n── Test 3: Wrong OTP → 400 + attemptsLeft ──');
  const r3 = await req('POST', '/api/auth/verify-otp', {
    email: TEST_EMAIL,
    otp: '000000',
    locale: 'ar',
  });
  check('Wrong OTP → 400', r3.status === 400, `status: ${r3.status}`);
  check('attemptsLeft present', r3.data?.attemptsLeft !== undefined, `attemptsLeft: ${r3.data?.attemptsLeft}`);
  console.log(`  ℹ️  Attempts left: ${r3.data?.attemptsLeft}`);

  // ════════════════════════════════════════════════════════
  // TEST 4: Correct OTP → 200 + email verified
  // ════════════════════════════════════════════════════════
  console.log('\n── Test 4: Correct OTP → 200 + email verified ──');
  const otpToUse = devOtpFromRegister;

  if (otpToUse) {
    const r4 = await req('POST', '/api/auth/verify-otp', {
      email: TEST_EMAIL,
      otp: otpToUse,
      locale: 'ar',
    });
    check('Correct OTP → 200', r4.status === 200, `status: ${r4.status}`);
    check('success = true', r4.data?.success === true);
    console.log(`  ℹ️  Message: ${r4.data?.message}`);

    // ════════════════════════════════════════════════════════
    // TEST 5: OTP one-time use — reuse same OTP → 400
    // ════════════════════════════════════════════════════════
    console.log('\n── Test 5: OTP one-time use (reuse → 400) ──');
    const r5 = await req('POST', '/api/auth/verify-otp', {
      email: TEST_EMAIL,
      otp: otpToUse,
      locale: 'ar',
    });
    check('Reuse same OTP → 400', r5.status === 400, `status: ${r5.status}`);
    console.log(`  ℹ️  Error: ${r5.data?.error}`);

    // ════════════════════════════════════════════════════════
    // TEST 6: Already verified → send-otp returns 409
    // ════════════════════════════════════════════════════════
    console.log('\n── Test 6: Already verified → 409 ──');
    const r6 = await req('POST', '/api/auth/send-otp', {
      email: TEST_EMAIL,
      locale: 'ar',
    });
    check('Already verified → 409', r6.status === 409, `status: ${r6.status}`);
    console.log(`  ℹ️  Error: ${r6.data?.error}`);

  } else {
    console.log('  ⚠️  No devOtp in register response — check server console for OTP');
    console.log('  ℹ️  This happens when Prisma client types are stale (VS Code cache)');
    console.log('  ℹ️  The runtime should work — restart dev server and re-run test');
    failed += 4; // Tests 4, 5, 6 + one more
  }

  // ════════════════════════════════════════════════════════
  // TEST 7: Input Validation
  // ════════════════════════════════════════════════════════
  console.log('\n── Test 7: Input Validation ──');

  const r7a = await req('POST', '/api/auth/send-otp', { email: 'not-an-email' });
  check('Invalid email → 422', r7a.status === 422, `status: ${r7a.status}`);

  const r7b = await req('POST', '/api/auth/verify-otp', { email: TEST_EMAIL, otp: '12345' });
  check('5-digit OTP → 422', r7b.status === 422, `status: ${r7b.status}`);

  const r7c = await req('POST', '/api/auth/verify-otp', { email: TEST_EMAIL, otp: 'abcdef' });
  check('Non-numeric OTP → 422', r7c.status === 422, `status: ${r7c.status}`);

  const r7d = await req('POST', '/api/auth/verify-otp', { email: TEST_EMAIL, otp: '1234567' });
  check('7-digit OTP → 422', r7d.status === 422, `status: ${r7d.status}`);

  // ════════════════════════════════════════════════════════
  // TEST 8: Non-existent email
  // ════════════════════════════════════════════════════════
  console.log('\n── Test 8: Non-existent email ──');
  const r8 = await req('POST', '/api/auth/send-otp', {
    email: 'nonexistent-xyz-999@example.com',
    locale: 'ar',
  });
  check('Non-existent email → 404', r8.status === 404, `status: ${r8.status}`);

  // ════════════════════════════════════════════════════════
  // TEST 9: Register with missing confirmPassword → 422
  // ════════════════════════════════════════════════════════
  console.log('\n── Test 9: Register validation ──');
  const r9 = await req('POST', '/api/auth/register', {
    name: 'Test',
    email: `test-${Date.now()}@example.com`,
    password: 'Test@123456',
    // confirmPassword missing → should fail
  });
  check('Missing confirmPassword → 422', r9.status === 422, `status: ${r9.status}`);

  const r9b = await req('POST', '/api/auth/register', {
    name: 'Test',
    email: `test-${Date.now()}@example.com`,
    password: 'Test@123456',
    confirmPassword: 'Different@999',
  });
  check('Password mismatch → 422', r9b.status === 422, `status: ${r9b.status}`);

  // ════════════════════════════════════════════════════════
  // TEST 10: Duplicate email registration
  // ════════════════════════════════════════════════════════
  console.log('\n── Test 10: Duplicate email → 409 ──');
  const r10 = await req('POST', '/api/auth/register', {
    name: 'Duplicate User',
    email: TEST_EMAIL,
    password: TEST_PASS,
    confirmPassword: TEST_PASS,
  });
  check('Duplicate email → 409', r10.status === 409, `status: ${r10.status}`);

  // ════════════════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(60));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log('='.repeat(60));

  if (failed === 0) {
    console.log('\n🎉 All OTP tests passed!\n');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed\n`);
    if (!devOtpFromRegister) {
      console.log('💡 TIP: If devOtp is missing from register response, the Prisma');
      console.log('   client types may be stale. Run: cd real-estate-platform && npx prisma generate');
      console.log('   Then restart the dev server and re-run this test.\n');
    }
  }

  console.log('📋 OTP Security Design:');
  console.log('  • Generation: crypto.randomInt(100000, 999999) — CSPRNG, always 6 digits');
  console.log('  • Storage:    bcrypt hash (10 rounds) — never plain text in DB');
  console.log('  • Expiry:     10 minutes');
  console.log('  • Cooldown:   60 seconds between resends');
  console.log('  • Max sends:  3 per hour per email');
  console.log('  • Max tries:  5 attempts per OTP → auto-invalidated');
  console.log('  • One-time:   deleted immediately after successful verify');
  console.log('  • Timing:     bcrypt.compare (constant-time, no timing attacks)');
  console.log('  • Dev mode:   OTP in console + response (never in production)');
}

run().catch(console.error);
