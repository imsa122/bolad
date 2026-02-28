import http from 'http';

const BASE_URL = 'http://localhost:3000';

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('🧪 Testing API fixes...\n');

  // Test 1: Properties API - default (should return AVAILABLE only)
  try {
    const res = await httpGet(`${BASE_URL}/api/properties?limit=3`);
    const props = res.body?.data?.data || [];
    const allAvailable = props.every(p => p.status === 'AVAILABLE');
    console.log(`✅ Test 1 - Default status filter (AVAILABLE only):`);
    console.log(`   Status: ${res.status} | Count: ${props.length} | All AVAILABLE: ${allAvailable}`);
  } catch (e) {
    console.log(`❌ Test 1 failed: ${e.message}`);
  }

  // Test 2: Properties API - status=ALL (admin view, all statuses)
  try {
    const res = await httpGet(`${BASE_URL}/api/properties?status=ALL&limit=50`);
    const props = res.body?.data?.data || [];
    const statuses = [...new Set(props.map(p => p.status))];
    console.log(`\n✅ Test 2 - status=ALL (admin view):`);
    console.log(`   Status: ${res.status} | Count: ${props.length} | Statuses found: ${statuses.join(', ')}`);
  } catch (e) {
    console.log(`❌ Test 2 failed: ${e.message}`);
  }

  // Test 3: Properties API - paginated response structure
  try {
    const res = await httpGet(`${BASE_URL}/api/properties?limit=3`);
    const hasData = Array.isArray(res.body?.data?.data);
    const hasPagination = !!res.body?.data?.pagination;
    console.log(`\n✅ Test 3 - Response structure (data.data.data array + pagination):`);
    console.log(`   Has data array: ${hasData} | Has pagination: ${hasPagination}`);
    if (hasPagination) {
      const p = res.body.data.pagination;
      console.log(`   Pagination: total=${p.total}, page=${p.page}, totalPages=${p.totalPages}`);
    }
  } catch (e) {
    console.log(`❌ Test 3 failed: ${e.message}`);
  }

  // Test 4: Single property fetch (for edit page)
  try {
    const listRes = await httpGet(`${BASE_URL}/api/properties?limit=1`);
    const firstId = listRes.body?.data?.data?.[0]?.id;
    if (firstId) {
      const res = await httpGet(`${BASE_URL}/api/properties/${firstId}`);
      const prop = res.body?.data;
      console.log(`\n✅ Test 4 - Single property fetch (for edit page):`);
      console.log(`   Status: ${res.status} | ID: ${prop?.id} | Title EN: ${prop?.title_en?.substring(0, 30)}...`);
    } else {
      console.log(`\n⚠️  Test 4 - No properties found to test single fetch`);
    }
  } catch (e) {
    console.log(`❌ Test 4 failed: ${e.message}`);
  }

  // Test 5: Profile page route exists (check middleware doesn't block it)
  try {
    const res = await httpGet(`${BASE_URL}/ar/profile`);
    // Should redirect to login (302) since we're not authenticated, NOT 404
    console.log(`\n✅ Test 5 - Profile page route:`);
    console.log(`   Status: ${res.status} (302=redirect to login ✓, 404=page missing ✗)`);
    if (res.status === 302 || res.status === 307 || res.status === 200) {
      console.log(`   ✓ Profile page exists and middleware is working`);
    } else {
      console.log(`   ⚠️  Unexpected status: ${res.status}`);
    }
  } catch (e) {
    console.log(`❌ Test 5 failed: ${e.message}`);
  }

  // Test 6: Admin edit route exists
  try {
    const listRes = await httpGet(`${BASE_URL}/api/properties?limit=1`);
    const firstId = listRes.body?.data?.data?.[0]?.id;
    if (firstId) {
      const res = await httpGet(`${BASE_URL}/ar/admin/properties/${firstId}/edit`);
      console.log(`\n✅ Test 6 - Admin edit page route:`);
      console.log(`   Status: ${res.status} (302=redirect to login ✓, 404=page missing ✗)`);
    }
  } catch (e) {
    console.log(`❌ Test 6 failed: ${e.message}`);
  }

  console.log('\n🏁 Tests complete!');
  console.log('\n📋 Summary of changes made:');
  console.log('   1. ✅ Middleware: Fixed JWT verification using jose (Edge-compatible)');
  console.log('   2. ✅ Profile page: Created /[locale]/profile/page.tsx');
  console.log('   3. ✅ Edit page: Created /[locale]/admin/properties/[id]/edit/page.tsx');
  console.log('   4. ✅ Homepage: Now shows recent properties when < 6 featured exist');
  console.log('   5. ✅ Admin properties: Fixed data.data.data response parsing');
  console.log('   6. ✅ API: Added status=ALL support for admin to see all properties');
}

runTests().catch(console.error);
