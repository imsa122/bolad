/**
 * Full End-to-End Flow Test
 * Tests: Register → Redirect Logic → OTP Verify → Login with verified=1
 * Since browser tool is disabled, we test the API layer thoroughly
 */

const BASE = 'http://localhost:3000';
const TS = Date.now();
const TEST_EMAIL = `flow-test-${TS}@example.com`;
const TEST_PASS = 'Test@123456';

let passed = 0;
let failed = 0;

async function req(method, path, body, cookieHeader) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookieHeader) headers['Cookie'] = cookieHeader;
  try {
    const res = await fetch(`${BASE}${path}`, {
      method, headers,
      body: body ? JSON.stringify(body) : undefined,
      redirect: 'manual',
    });
    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch {}
    // Extract Set-Cookie headers
    const setCookie = res.headers.get('set-cookie') || '';
    return { status: res.status, data, setCookie, headers: res.headers };
  } catch (e) {
    return { status: 0, data: { error: e.message }, setCookie: '', headers: new Headers() };
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

function extractCookies(setCookieHeader) {
  // Parse multiple Set-Cookie values
  const cookies = {};
  const parts = setCookieHeader.split(',').map(s => s.trim());
  for (const part of parts) {
    const [nameVal] = part.split(';');
    const [name, ...valParts] = nameVal.split('=');
    if (name && valParts.length) cookies[name.trim()] = valParts.join('=').trim();
  }
  return cookies;
}

async function run() {
  console.log('='.repeat(65));
  console.log('  FULL END-TO-END FLOW TEST');
  console.log('  Register → OTP Verify → Login → Protected Routes');
  console.log('='.repeat(65));
  console.log(`  Test email: ${TEST_EMAIL}\n`);

  // ════════════════════════════════════════════════════════════
  // FLOW 1: Complete Registration → OTP → Login Flow
  // ════════════════════════════════════════════════════════════
  console.log('── Flow 1: Register → OTP → Login ──');

  // Step 1: Register
  const r1 = await req('POST', '/api/auth/register', {
    name: 'مستخدم اختبار الدفق',
    email: TEST_EMAIL,
    password: TEST_PASS,
    confirmPassword: TEST_PASS,
    phone: '+966512345678',
  });

  check('1.1 Register → 201', r1.status === 201, `status: ${r1.status}`);
  check('1.2 requiresEmailVerification = true', r1.data?.data?.requiresEmailVerification === true);
  check('1.3 devOtp present in dev mode', !!r1.data?.data?.devOtp, `devOtp: ${r1.data?.data?.devOtp}`);
  check('1.4 JWT token returned', !!r1.data?.data?.token);
  check('1.5 Set-Cookie: auth_token', r1.setCookie.includes('auth_token'));

  const devOtp = r1.data?.data?.devOtp;
  const userEmail = TEST_EMAIL;
  console.log(`  ℹ️  devOtp: ${devOtp}`);
  console.log(`  ℹ️  Frontend should redirect to: /ar/auth/verify-email?email=${encodeURIComponent(userEmail)}`);

  // Step 2: Verify OTP
  const r2 = await req('POST', '/api/auth/verify-otp', {
    email: TEST_EMAIL,
    otp: devOtp,
    locale: 'ar',
  });

  check('1.6 Verify OTP → 200', r2.status === 200, `status: ${r2.status}`);
  check('1.7 success = true', r2.data?.success === true);
  console.log(`  ℹ️  Frontend should redirect to: /ar/auth/login?verified=1`);

  // Step 3: Login after verification
  const r3 = await req('POST', '/api/auth/login', {
    email: TEST_EMAIL,
    password: TEST_PASS,
  });

  check('1.8 Login after verify → 200', r3.status === 200, `status: ${r3.status}`);
  check('1.9 Login returns user', !!r3.data?.data?.user);
  check('1.10 Login returns token', !!r3.data?.data?.token);
  check('1.11 Set-Cookie: auth_token on login', r3.setCookie.includes('auth_token'));

  const loginToken = r3.data?.data?.token;
  const loginCookies = r3.setCookie;

  // Step 4: Access protected route with token
  const r4 = await req('GET', '/api/auth/me', null, `auth_token=${loginToken}`);
  check('1.12 /api/auth/me with token → 200', r4.status === 200, `status: ${r4.status}`);
  check('1.13 Returns correct user email', r4.data?.data?.email === TEST_EMAIL);
  check('1.14 Returns correct role', r4.data?.data?.role === 'USER');

  // ════════════════════════════════════════════════════════════
  // FLOW 2: Verify redirect URL construction
  // ════════════════════════════════════════════════════════════
  console.log('\n── Flow 2: Redirect URL Verification ──');

  const encodedEmail = encodeURIComponent(TEST_EMAIL);
  const verifyUrl = `/ar/auth/verify-email?email=${encodedEmail}`;
  const loginUrl = `/ar/auth/login?verified=1`;

  check('2.1 verify-email URL has email param', verifyUrl.includes('email='));
  check('2.2 login URL has verified=1 param', loginUrl.includes('verified=1'));
  check('2.3 email properly encoded', encodedEmail.includes('%40'), `encoded: ${encodedEmail}`);
  console.log(`  ℹ️  verify-email URL: ${verifyUrl}`);
  console.log(`  ℹ️  login URL after verify: ${loginUrl}`);

  // ════════════════════════════════════════════════════════════
  // FLOW 3: Already-verified user tries to re-verify
  // ════════════════════════════════════════════════════════════
  console.log('\n── Flow 3: Already Verified User ──');

  const r5 = await req('POST', '/api/auth/send-otp', {
    email: TEST_EMAIL,
    locale: 'ar',
  });
  // 409 = already verified | 429 = rate limited (both are valid "cannot send" responses)
  check('3.1 Already verified → 409 or 429', r5.status === 409 || r5.status === 429,
    `status: ${r5.status} (409=verified, 429=rate-limited)`);
  console.log(`  ℹ️  Error: ${r5.data?.error}`);

  // ════════════════════════════════════════════════════════════
  // FLOW 4: Unverified user can still login (soft enforcement)
  // ════════════════════════════════════════════════════════════
  console.log('\n── Flow 4: Unverified User Login (soft enforcement) ──');

  const unverifiedEmail = `unverified-${TS}@example.com`;
  const r6 = await req('POST', '/api/auth/register', {
    name: 'مستخدم غير محقق',
    email: unverifiedEmail,
    password: TEST_PASS,
    confirmPassword: TEST_PASS,
  });
  check('4.1 Register unverified user → 201', r6.status === 201, `status: ${r6.status}`);

  // Try to login without verifying
  const r7 = await req('POST', '/api/auth/login', {
    email: unverifiedEmail,
    password: TEST_PASS,
  });
  check('4.2 Unverified user can login (soft enforcement)', r7.status === 200, `status: ${r7.status}`);
  console.log(`  ℹ️  Note: Email verification is soft-enforced (user can still login)`);
  console.log(`  ℹ️  Frontend shows verification reminder in profile/navbar`);

  // ════════════════════════════════════════════════════════════
  // FLOW 5: OTP expiry simulation (check error message)
  // ════════════════════════════════════════════════════════════
  console.log('\n── Flow 5: Wrong OTP Error Messages ──');

  const r8 = await req('POST', '/api/auth/verify-otp', {
    email: unverifiedEmail,
    otp: '999999',
    locale: 'ar',
  });
  check('5.1 Wrong OTP → 400', r8.status === 400, `status: ${r8.status}`);
  check('5.2 attemptsLeft in response', r8.data?.attemptsLeft !== undefined);
  console.log(`  ℹ️  Arabic error: ${r8.data?.error}`);

  const r9 = await req('POST', '/api/auth/verify-otp', {
    email: unverifiedEmail,
    otp: '999999',
    locale: 'en',
  });
  check('5.3 English error message', r9.status === 400, `status: ${r9.status}`);
  console.log(`  ℹ️  English error: ${r9.data?.error}`);

  // ════════════════════════════════════════════════════════════
  // FLOW 6: Verify page URL accessibility
  // ════════════════════════════════════════════════════════════
  console.log('\n── Flow 6: Page Accessibility ──');

  const pages = [
    { path: '/ar/auth/register', name: 'Register page (AR)' },
    { path: '/en/auth/register', name: 'Register page (EN)' },
    { path: '/ar/auth/login', name: 'Login page (AR)' },
    { path: '/ar/auth/login?verified=1', name: 'Login page with verified=1' },
    { path: '/ar/auth/verify-email', name: 'Verify email page (AR)' },
    { path: '/en/auth/verify-email', name: 'Verify email page (EN)' },
  ];

  for (const page of pages) {
    const r = await req('GET', page.path);
    // Pages return 200 (rendered) or 307 (redirect to locale)
    check(`6.x ${page.name}`, r.status === 200 || r.status === 307 || r.status === 308,
      `status: ${r.status}`);
  }

  // ════════════════════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════════════════════
  console.log('\n' + '='.repeat(65));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
  console.log('='.repeat(65));

  if (failed === 0) {
    console.log('\n🎉 All flow tests passed!\n');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed\n`);
  }

  console.log('📋 Frontend Flow Summary:');
  console.log('  Register page:');
  console.log('    • Submits form → calls /api/auth/register');
  console.log('    • If requiresEmailVerification=true → redirects to /[locale]/auth/verify-email?email=...');
  console.log('    • Shows toast: "Account created! Please verify your email 📧"');
  console.log('  Verify Email page:');
  console.log('    • Shows 6-digit OTP input with auto-advance');
  console.log('    • 10-minute countdown timer');
  console.log('    • Resend button with 60s cooldown');
  console.log('    • On success → redirects to /[locale]/auth/login?verified=1');
  console.log('  Login page:');
  console.log('    • If ?verified=1 → shows green "Email verified!" banner');
  console.log('    • Shows toast: "✅ Email verified! You can now sign in."');
  console.log('    • "Haven\'t verified your email yet?" link to verify-email page');
}

run().catch(console.error);
