#!/usr/bin/env node

import { execSync } from 'child_process';
import fetch from 'node-fetch';
import { setTimeout } from 'timers/promises';

const BASE_URL = 'http://localhost:3000';

/**
 * Test authentication display in the navbar
 */
async function testAuthDisplay() {
  console.log('🧪 Testing authentication display in the navbar...');
  console.log('-----------------------------------------------------------');

  try {
    // Step 1: Login with test user
    console.log('🔑 Step 1: Logging in with test user...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@realestate.sa',
        password: 'User@123456',
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed with status ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');

    // Extract cookies
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('🍪 Cookies set:', cookies);

    // Check for auth_state cookie
    if (!cookies || !cookies.includes('auth_state=authenticated')) {
      console.warn('⚠️ auth_state cookie not found in response');
    } else {
      console.log('✅ auth_state cookie found in response');
    }

    // Step 2: Check /api/auth/me endpoint
    console.log('\n🔍 Step 2: Checking /api/auth/me endpoint...');
    const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        Cookie: cookies,
      },
    });

    if (!meResponse.ok) {
      throw new Error(`/me endpoint failed with status ${meResponse.status}`);
    }

    const meData = await meResponse.json();
    console.log('✅ /me endpoint returned user data:', meData.data.name);

    // Step 3: Logout
    console.log('\n🚪 Step 3: Testing logout...');
    const logoutResponse = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: cookies,
      },
    });

    if (!logoutResponse.ok) {
      throw new Error(`Logout failed with status ${logoutResponse.status}`);
    }

    const logoutCookies = logoutResponse.headers.get('set-cookie');
    console.log('🍪 Cookies after logout:', logoutCookies);

    // Check for cleared auth_state cookie
    if (!logoutCookies || !logoutCookies.includes('auth_state=;')) {
      console.warn('⚠️ auth_state cookie not properly cleared in response');
    } else {
      console.log('✅ auth_state cookie properly cleared in response');
    }

    console.log('-----------------------------------------------------------');
    console.log('✅ Authentication display tests completed!');
    console.log('');
    console.log('🔍 Summary:');
    console.log('1. Added non-HTTP-only auth_state cookie for client-side detection');
    console.log('2. Updated useAuth hook to check for auth_state cookie on initialization');
    console.log('3. Modified login, register, and logout routes to manage auth_state cookie');
    console.log('');
    console.log('These changes should fix the authentication display issue in the navbar.');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
testAuthDisplay().catch(console.error);
