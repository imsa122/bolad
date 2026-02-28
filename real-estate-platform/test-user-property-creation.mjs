import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

// Test user credentials
const TEST_USER = {
  email: 'test-user@realestate.sa',
  password: 'Test@123456',
  name: 'Test User',
};

// Test property data
const TEST_PROPERTY = {
  title_ar: 'عقار اختبار',
  title_en: 'Test Property',
  description_ar: 'وصف عقار للاختبار',
  description_en: 'Test property description',
  price: 500000,
  city: 'الرياض',
  type: 'SALE',
  status: 'AVAILABLE',
  bedrooms: 3,
  bathrooms: 2,
  area: 200,
  images: [],
  amenities: ['مكيف', 'مسبح', 'AC', 'Pool'],
};

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 Starting comprehensive tests for user property creation...');
  console.log('-----------------------------------------------------------');

  try {
    // Setup: Create test user if doesn't exist
    await setupTestUser();

    // Test 1: Authentication
    const authTokens = await testAuthentication();
    
    // Test 2: Test property creation API
    await testPropertyCreationAPI(authTokens.token);
    
    // Test 3: Test property creation API without auth
    await testPropertyCreationWithoutAuth();
    
    // Test 4: Test property creation API with invalid data
    await testPropertyCreationWithInvalidData(authTokens.token);
    
    // Test 5: Test property listing API
    await testPropertyListingAPI();
    
    // Test 6: Test middleware protection
    await testMiddlewareProtection();
    
    // Cleanup
    await cleanup();
    
    console.log('-----------------------------------------------------------');
    console.log('✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Setup test user
 */
async function setupTestUser() {
  console.log('📋 Setting up test user...');
  
  const existingUser = await prisma.user.findUnique({
    where: { email: TEST_USER.email },
  });
  
  if (!existingUser) {
    const hashedPassword = await bcrypt.hash(TEST_USER.password, 12);
    await prisma.user.create({
      data: {
        email: TEST_USER.email,
        password: hashedPassword,
        name: TEST_USER.name,
        role: 'USER',
      },
    });
    console.log('✅ Test user created');
  } else {
    console.log('✅ Test user already exists');
  }
}

/**
 * Test authentication
 */
async function testAuthentication() {
  console.log('🔑 Testing authentication...');
  
  // Test login
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_USER.email,
      password: TEST_USER.password,
    }),
  });
  
  if (!loginResponse.ok) {
    const error = await loginResponse.json();
    throw new Error(`Login failed: ${error.error || 'Unknown error'}`);
  }
  
  const loginData = await loginResponse.json();
  console.log('✅ Login successful');
  
  // Extract cookies
  const cookies = loginResponse.headers.get('set-cookie');
  const authToken = cookies?.match(/auth_token=([^;]+)/)?.[1];
  
  if (!authToken) {
    throw new Error('Auth token cookie not found');
  }
  
  // Test /api/auth/me endpoint
  const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: {
      Cookie: `auth_token=${authToken}`,
    },
  });
  
  if (!meResponse.ok) {
    const error = await meResponse.json();
    throw new Error(`/me endpoint failed: ${error.error || 'Unknown error'}`);
  }
  
  const meData = await meResponse.json();
  console.log('✅ /me endpoint returned user data correctly');
  
  return { token: authToken, user: loginData.data.user };
}

/**
 * Test property creation API
 */
async function testPropertyCreationAPI(authToken) {
  console.log('🏠 Testing property creation API...');
  
  const response = await fetch(`${BASE_URL}/api/properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `auth_token=${authToken}`,
    },
    body: JSON.stringify(TEST_PROPERTY),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Property creation failed: ${error.error || 'Unknown error'}`);
  }
  
  const data = await response.json();
  console.log('✅ Property created successfully:', data.data.id);
  
  // Store property ID for cleanup
  global.testPropertyId = data.data.id;
  
  // Test that regular users can't edit or delete properties (admin only)
  console.log('🔒 Testing property edit/delete restrictions...');
  
  const editResponse = await fetch(`${BASE_URL}/api/properties/${data.data.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `auth_token=${authToken}`,
    },
    body: JSON.stringify({ title_en: 'Updated Test Property' }),
  });
  
  if (editResponse.status !== 403) {
    throw new Error(`Expected 403 Forbidden for property edit, got ${editResponse.status}`);
  }
  console.log('✅ Correctly restricted property editing to admins');
  
  const deleteResponse = await fetch(`${BASE_URL}/api/properties/${data.data.id}`, {
    method: 'DELETE',
    headers: {
      Cookie: `auth_token=${authToken}`,
    },
  });
  
  if (deleteResponse.status !== 403) {
    throw new Error(`Expected 403 Forbidden for property delete, got ${deleteResponse.status}`);
  }
  console.log('✅ Correctly restricted property deletion to admins');
  
  return data.data;
}

/**
 * Test property creation without authentication
 */
async function testPropertyCreationWithoutAuth() {
  console.log('🔒 Testing property creation without authentication...');
  
  const response = await fetch(`${BASE_URL}/api/properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(TEST_PROPERTY),
  });
  
  if (response.status !== 401) {
    throw new Error(`Expected 401 Unauthorized, got ${response.status}`);
  }
  
  console.log('✅ Correctly rejected unauthenticated property creation');
}

/**
 * Test property creation with invalid data
 */
async function testPropertyCreationWithInvalidData(authToken) {
  console.log('❌ Testing property creation with invalid data...');
  
  const invalidProperty = {
    // Missing required fields
    title_en: 'Test Property',
    price: 'not-a-number', // Invalid type
  };
  
  const response = await fetch(`${BASE_URL}/api/properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `auth_token=${authToken}`,
    },
    body: JSON.stringify(invalidProperty),
  });
  
  if (response.status !== 422) {
    throw new Error(`Expected 422 Validation Error, got ${response.status}`);
  }
  
  console.log('✅ Correctly rejected invalid property data');
}

/**
 * Test property listing API
 */
async function testPropertyListingAPI() {
  console.log('📋 Testing property listing API...');
  
  const response = await fetch(`${BASE_URL}/api/properties`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Property listing failed: ${error.error || 'Unknown error'}`);
  }
  
  const data = await response.json();
  
  if (!Array.isArray(data.data.data)) {
    throw new Error('Property listing did not return an array');
  }
  
  console.log(`✅ Property listing returned ${data.data.data.length} properties`);
  
  // Check if our test property is in the list
  const testProperty = data.data.data.find(p => p.id === global.testPropertyId);
  
  if (testProperty) {
    console.log('✅ Test property found in listing');
  } else {
    console.warn('⚠️ Test property not found in listing');
  }
}

/**
 * Test middleware protection
 */
async function testMiddlewareProtection() {
  console.log('🔒 Testing middleware protection...');
  
  // Test accessing protected route without auth
  const response = await fetch(`${BASE_URL}/en/properties/new`, {
    redirect: 'manual', // Don't follow redirects
  });
  
  if (response.status !== 307) {
    throw new Error(`Expected 307 Redirect, got ${response.status}`);
  }
  
  const location = response.headers.get('location');
  
  if (!location || !location.includes('/auth/login')) {
    throw new Error(`Expected redirect to login, got ${location}`);
  }
  
  console.log('✅ Middleware correctly redirected to login page');
}

/**
 * Cleanup test data
 */
async function cleanup() {
  console.log('🧹 Cleaning up test data...');
  
  if (global.testPropertyId) {
    await prisma.property.delete({
      where: { id: global.testPropertyId },
    }).catch(e => console.warn('Could not delete test property:', e.message));
    console.log('✅ Test property deleted');
  }
  
  // We keep the test user for future tests
}

// Run the tests
runTests().catch(console.error);
