import http from 'http';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
let authToken = '';
let testPropertyId = 1;
const allLines = [];

function req(method, rawPath, body, headers) {
  headers = headers || {};
  return new Promise(function(resolve) {
    var safePath = rawPath.replace(/[^\x00-\x7F]/g, function(c) { return encodeURIComponent(c); });
    var data = body ? JSON.stringify(body) : null;
    var opts = {
      hostname: 'localhost',
      port: 3001,
      path: safePath,
      method: method,
      headers: Object.assign({ 'Content-Type': 'application/json' },
        data ? { 'Content-Length': Buffer.byteLength(data) } : {},
        headers)
    };
    var r = http.request(opts, function(res) {
      var b = '';
      res.on('data', function(c) { b += c; });
      res.on('end', function() {
        try { resolve({ status: res.statusCode, body: JSON.parse(b) }); }
        catch(e) { resolve({ status: res.statusCode, body: b.slice(0,100) }); }
      });
    });
    r.on('error', function(e) { resolve({ status: 0, body: e.message }); });
    if (data) r.write(data);
    r.end();
  });
}

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

function out(msg) {
  allLines.push(msg);
  process.stdout.write(msg + '\n');
}

function log(label, status, expected, body) {
  var pass = Array.isArray(expected) ? expected.indexOf(status) !== -1 : status === expected;
  var icon = pass ? 'PASS' : 'FAIL';
  out('[' + icon + '][' + status + '] ' + label);
  if (!pass) {
    out('       Expected:' + JSON.stringify(expected) + ' Body:' + JSON.stringify(body).slice(0,150));
  }
  return pass;
}

async function run() {
  out('\n===== FULL API TEST SUITE =====\n');
  var r, newPropId, bookingId;

  // ── FRONTEND PAGES ──────────────────────────────────────────
  out('--- FRONTEND PAGES ---');
  r = await req('GET', '/ar'); log('GET /ar (Arabic home)', r.status, 200, r.body);
  r = await req('GET', '/en'); log('GET /en (English home)', r.status, 200, r.body);
  r = await req('GET', '/ar/properties'); log('GET /ar/properties', r.status, 200, r.body);
  r = await req('GET', '/ar/properties/1'); log('GET /ar/properties/1', r.status, 200, r.body);
  r = await req('GET', '/ar/auth/login'); log('GET /ar/auth/login', r.status, 200, r.body);
  r = await req('GET', '/ar/auth/register'); log('GET /ar/auth/register', r.status, 200, r.body);
  r = await req('GET', '/ar/contact'); log('GET /ar/contact', r.status, 200, r.body);

  // ── PROPERTIES API ──────────────────────────────────────────
  out('\n--- PROPERTIES API ---');
  r = await req('GET', '/api/properties');
  log('GET /api/properties (list)', r.status, 200, r.body);
  if (r.body && r.body.data && r.body.data.data && r.body.data.data.length > 0) {
    testPropertyId = r.body.data.data[0].id;
    out('   Found ' + r.body.data.data.length + ' properties, ID=' + testPropertyId);
  }

  r = await req('GET', '/api/properties?type=SALE');
  log('GET /api/properties?type=SALE', r.status, 200, r.body);
  if (r.body && r.body.data && r.body.data.data) out('   SALE: ' + r.body.data.data.length);

  r = await req('GET', '/api/properties?type=RENT');
  log('GET /api/properties?type=RENT', r.status, 200, r.body);
  if (r.body && r.body.data && r.body.data.data) out('   RENT: ' + r.body.data.data.length);

  // Arabic city - pre-encoded (%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6 = الرياض)
  r = await req('GET', '/api/properties?city=%D8%A7%D9%84%D8%B1%D9%8A%D8%A7%D8%B6');
  log('GET /api/properties?city=Riyadh (Arabic encoded)', r.status, 200, r.body);
  if (r.body && r.body.data && r.body.data.data) out('   Riyadh: ' + r.body.data.data.length);

  r = await req('GET', '/api/properties?minPrice=1000000&maxPrice=5000000');
  log('GET /api/properties?minPrice&maxPrice', r.status, 200, r.body);

  r = await req('GET', '/api/properties?bedrooms=3');
  log('GET /api/properties?bedrooms=3', r.status, 200, r.body);

  r = await req('GET', '/api/properties?featured=true');
  log('GET /api/properties?featured=true', r.status, 200, r.body);
  if (r.body && r.body.data && r.body.data.data) out('   Featured: ' + r.body.data.data.length);

  r = await req('GET', '/api/properties/' + testPropertyId);
  log('GET /api/properties/' + testPropertyId + ' (single)', r.status, 200, r.body);

  r = await req('GET', '/api/properties/99999');
  log('GET /api/properties/99999 (not found)', r.status, 404, r.body);

  // ── AUTH API ────────────────────────────────────────────────
  out('\n--- AUTH API ---');

  // Validation errors - 422 is correct (Unprocessable Entity)
  r = await req('POST', '/api/auth/register', {});
  log('POST /api/auth/register (empty body -> 422)', r.status, 422, r.body);

  r = await req('POST', '/api/auth/register', { name:'a', email:'bad', password:'123', confirmPassword:'456' });
  log('POST /api/auth/register (invalid data -> 422)', r.status, 422, r.body);

  // Valid registration
  var uniqueEmail = 'testapi_' + Date.now() + '@test.com';
  r = await req('POST', '/api/auth/register', {
    name: 'Test API User', email: uniqueEmail,
    password: 'Test@123456', confirmPassword: 'Test@123456'
  });
  log('POST /api/auth/register (valid -> 201)', r.status, 201, r.body);

  // Duplicate email
  r = await req('POST', '/api/auth/register', {
    name: 'Admin Dup', email: 'admin@realestate.sa',
    password: 'Admin@123456', confirmPassword: 'Admin@123456'
  });
  log('POST /api/auth/register (duplicate -> 409)', r.status, 409, r.body);

  // Wait to avoid rate limit
  out('   Waiting 3s before login tests...');
  await sleep(3000);

  // Wrong credentials
  r = await req('POST', '/api/auth/login', { email: 'wrong@test.com', password: 'wrongpass' });
  log('POST /api/auth/login (wrong creds -> 401)', r.status, 401, r.body);

  await sleep(1000);

  // Valid admin login
  r = await req('POST', '/api/auth/login', { email: 'admin@realestate.sa', password: 'Admin@123456' });
  if (r.status === 429) {
    out('   Rate limited, waiting 5s...');
    await sleep(5000);
    r = await req('POST', '/api/auth/login', { email: 'admin@realestate.sa', password: 'Admin@123456' });
  }
  log('POST /api/auth/login (admin -> 200)', r.status, 200, r.body);
  if (r.body && r.body.data && r.body.data.token) {
    authToken = r.body.data.token;
    out('   Token obtained: ' + authToken.slice(0,30) + '...');
  }

  // GET /me authenticated
  r = await req('GET', '/api/auth/me', null, { Authorization: 'Bearer ' + authToken });
  log('GET /api/auth/me (authenticated -> 200)', r.status, 200, r.body);
  if (r.body && r.body.data) out('   User: ' + r.body.data.email + ' (' + r.body.data.role + ')');

  // GET /me no token
  r = await req('GET', '/api/auth/me');
  log('GET /api/auth/me (no token -> 401)', r.status, 401, r.body);

  // ── ADMIN PROPERTY CRUD ─────────────────────────────────────
  out('\n--- ADMIN PROPERTY CRUD ---');

  // Create without auth
  r = await req('POST', '/api/properties', { title_en: 'Unauth' });
  log('POST /api/properties (no auth -> 401)', r.status, 401, r.body);

  // Create with admin auth
  r = await req('POST', '/api/properties', {
    title_ar: 'عقار تجريبي',
    title_en: 'Test Property API',
    description_ar: 'وصف تجريبي',
    description_en: 'Test description',
    price: 500000, city: 'Riyadh',
    type: 'SALE', status: 'AVAILABLE',
    bedrooms: 3, bathrooms: 2, area: 200
  }, { Authorization: 'Bearer ' + authToken });
  log('POST /api/properties (admin create -> 201)', r.status, 201, r.body);
  newPropId = r.body && r.body.data ? r.body.data.id : null;
  if (newPropId) out('   Created ID: ' + newPropId);

  // Update
  if (newPropId) {
    r = await req('PUT', '/api/properties/' + newPropId, { price: 600000 },
      { Authorization: 'Bearer ' + authToken });
    log('PUT /api/properties/' + newPropId + ' (update -> 200)', r.status, 200, r.body);

    // Delete
    r = await req('DELETE', '/api/properties/' + newPropId, null,
      { Authorization: 'Bearer ' + authToken });
    log('DELETE /api/properties/' + newPropId + ' (delete -> 200)', r.status, 200, r.body);
  }

  // ── CONTACT API ─────────────────────────────────────────────
  out('\n--- CONTACT API ---');

  r = await req('POST', '/api/contact', {});
  log('POST /api/contact (empty -> 422)', r.status, 422, r.body);

  r = await req('POST', '/api/contact', {
    name: 'Ahmed Ali', email: 'ahmed@test.com',
    subject: 'Property Inquiry', message: 'I want to inquire about available properties in Riyadh'
  });
  log('POST /api/contact (valid -> 201)', r.status, 201, r.body);

  // ── ADMIN STATS ─────────────────────────────────────────────
  out('\n--- ADMIN STATS ---');

  r = await req('GET', '/api/admin/stats');
  log('GET /api/admin/stats (no auth -> 401)', r.status, 401, r.body);

  r = await req('GET', '/api/admin/stats', null, { Authorization: 'Bearer ' + authToken });
  log('GET /api/admin/stats (admin -> 200)', r.status, 200, r.body);
  if (r.body && r.body.data && r.body.data.stats) {
    var s = r.body.data.stats;
    out('   users=' + s.totalUsers + ' props=' + s.totalProperties + ' bookings=' + s.totalBookings);
  }

  // ── BOOKINGS API ────────────────────────────────────────────
  out('\n--- BOOKINGS API ---');

  r = await req('POST', '/api/bookings', { propertyId: testPropertyId, bookingType: 'VISIT' });
  log('POST /api/bookings (no auth -> 401)', r.status, 401, r.body);

  r = await req('POST', '/api/bookings', {
    propertyId: testPropertyId, bookingType: 'VISIT',
    message: 'I want to visit this property'
  }, { Authorization: 'Bearer ' + authToken });
  // 201 = new booking | 409 = duplicate (already has pending booking - both are correct)
  log('POST /api/bookings (create -> 201 or 409)', r.status, [201, 409], r.body);
  bookingId = r.body && r.body.data ? r.body.data.id : null;

  r = await req('GET', '/api/bookings', null, { Authorization: 'Bearer ' + authToken });
  log('GET /api/bookings (admin list -> 200)', r.status, 200, r.body);
  if (r.body && r.body.data && r.body.data.data) out('   Bookings: ' + r.body.data.data.length);

  // ── LOGOUT ──────────────────────────────────────────────────
  out('\n--- LOGOUT ---');

  r = await req('POST', '/api/auth/logout', null, { Authorization: 'Bearer ' + authToken });
  log('POST /api/auth/logout (-> 200)', r.status, 200, r.body);

  // ── SUMMARY ─────────────────────────────────────────────────
  var passed = allLines.filter(function(l) { return l.indexOf('[PASS]') !== -1; }).length;
  var failed = allLines.filter(function(l) { return l.indexOf('[FAIL]') !== -1; }).length;
  var total = passed + failed;

  out('\n' + '='.repeat(50));
  out('RESULTS: ' + passed + ' passed, ' + failed + ' failed / ' + total + ' total');
  if (failed === 0) {
    out('ALL TESTS PASSED!');
  } else {
    out('\nFailed tests:');
    allLines.filter(function(l) { return l.indexOf('[FAIL]') !== -1; })
      .forEach(function(l) { out('  ' + l); });
  }
  out('='.repeat(50));

  // Write results to file
  writeFileSync(resolve(__dirname, 'test-results.txt'), allLines.join('\n'), 'utf8');
  out('\nResults saved to test-results.txt');
}

run().catch(function(e) {
  process.stdout.write('FATAL ERROR: ' + e.message + '\n' + e.stack + '\n');
});
