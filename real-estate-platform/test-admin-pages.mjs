/**
 * Test: Admin Pages & API Routes
 * Tests: /api/admin/users, /api/admin/contacts, /api/bookings (fixed), page accessibility
 */

const BASE = 'http://localhost:3000';
let passed = 0;
let failed = 0;

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}${detail ? ' — ' + detail : ''}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function req(method, path, body, cookie) {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers['Cookie'] = cookie;
  try {
    const res = await fetch(`${BASE}${path}`, {
      method, headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch {}
    return { status: res.status, data };
  } catch (e) {
    return { status: 0, data: { error: e.message } };
  }
}

async function run() {
  console.log('='.repeat(60));
  console.log('  ADMIN PAGES & API ROUTES TEST');
  console.log('='.repeat(60));

  // ── Login as admin ──
  const login = await req('POST', '/api/auth/login', {
    email: 'admin@realestate.sa',
    password: 'Admin@123456',
  });
  check('Admin login → 200', login.status === 200, `status: ${login.status}`);
  const token = login.data?.data?.token;
  check('Token received', !!token);
  const cookie = `auth_token=${token}`;

  // ── GET /api/admin/users ──
  console.log('\n── Admin Users API ──');
  const users = await req('GET', '/api/admin/users', null, cookie);
  check('GET /api/admin/users → 200', users.status === 200, `status: ${users.status}`);
  check('Returns data array', Array.isArray(users.data?.data?.data), `type: ${typeof users.data?.data?.data}`);
  check('Returns total count', typeof users.data?.data?.total === 'number', `total: ${users.data?.data?.total}`);
  console.log(`  ℹ️  Users found: ${users.data?.data?.total}`);

  // ── GET /api/admin/users with role filter ──
  const adminUsers = await req('GET', '/api/admin/users?role=ADMIN', null, cookie);
  check('GET /api/admin/users?role=ADMIN → 200', adminUsers.status === 200);
  const adminList = adminUsers.data?.data?.data || [];
  check('All returned users are ADMIN', adminList.every(u => u.role === 'ADMIN'), `count: ${adminList.length}`);

  // ── GET /api/admin/contacts ──
  console.log('\n── Admin Contacts API ──');
  const contacts = await req('GET', '/api/admin/contacts', null, cookie);
  check('GET /api/admin/contacts → 200', contacts.status === 200, `status: ${contacts.status}`);
  check('Returns data array', Array.isArray(contacts.data?.data?.data));
  check('Returns total count', typeof contacts.data?.data?.total === 'number', `total: ${contacts.data?.data?.total}`);

  // ── GET /api/bookings (fixed data structure) ──
  console.log('\n── Bookings API (data structure fix) ──');
  const bookings = await req('GET', '/api/bookings?limit=50', null, cookie);
  check('GET /api/bookings → 200', bookings.status === 200, `status: ${bookings.status}`);
  check('data.data is array (not object)', Array.isArray(bookings.data?.data?.data), `type: ${typeof bookings.data?.data?.data}`);
  check('pagination exists', !!bookings.data?.data?.pagination);
  console.log(`  ℹ️  Bookings found: ${bookings.data?.data?.data?.length}`);

  // ── Unauthorized access ──
  console.log('\n── Authorization Tests ──');
  const unauth = await req('GET', '/api/admin/users');
  check('No token → 401', unauth.status === 401, `status: ${unauth.status}`);

  // Login as regular user
  const userLogin = await req('POST', '/api/auth/login', {
    email: 'user@realestate.sa',
    password: 'User@123456',
  });
  const userCookie = `auth_token=${userLogin.data?.data?.token}`;
  const forbidden = await req('GET', '/api/admin/users', null, userCookie);
  check('Regular user → 403', forbidden.status === 403, `status: ${forbidden.status}`);

  // ── Page accessibility ──
  console.log('\n── Page Accessibility ──');
  const pages = [
    { path: '/ar/admin/users', name: 'Users page (AR)' },
    { path: '/en/admin/users', name: 'Users page (EN)' },
    { path: '/ar/admin/contacts', name: 'Contacts page (AR)' },
    { path: '/en/admin/contacts', name: 'Contacts page (EN)' },
    { path: '/ar/admin/settings', name: 'Settings page (AR)' },
    { path: '/en/admin/settings', name: 'Settings page (EN)' },
    { path: '/ar/admin/bookings', name: 'Bookings page (AR)' },
  ];

  for (const page of pages) {
    const r = await req('GET', page.path);
    check(`${page.name}`, r.status === 200 || r.status === 307 || r.status === 308,
      `status: ${r.status}`);
  }

  // ── Summary ──
  console.log('\n' + '='.repeat(60));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed}`);
  console.log('='.repeat(60));
  if (failed === 0) console.log('\n🎉 All admin page tests passed!\n');
  else console.log(`\n⚠️  ${failed} test(s) failed\n`);
}

run().catch(console.error);
