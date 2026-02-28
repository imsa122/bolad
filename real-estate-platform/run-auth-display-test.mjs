#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🧪 Running authentication display tests...');
console.log('Make sure your Next.js development server is running on http://localhost:3000');
console.log('-----------------------------------------------------------');

// Run the test script
const testProcess = spawn('node', [join(__dirname, 'test-auth-display.mjs')], {
  stdio: 'inherit',
  shell: true,
});

testProcess.on('error', (error) => {
  console.error('Failed to start test process:', error);
  process.exit(1);
});

testProcess.on('close', (code) => {
  if (code === 0) {
    console.log('-----------------------------------------------------------');
    console.log('✅ Authentication display tests passed successfully!');
    console.log('');
    console.log('Summary of changes:');
    console.log('1. Added non-HTTP-only auth_state cookie for client-side detection');
    console.log('2. Updated useAuth hook to check for auth_state cookie on initialization');
    console.log('3. Modified login, register, and logout routes to manage auth_state cookie');
    console.log('');
    console.log('These changes should fix the authentication display issue in the navbar.');
  } else {
    console.log('-----------------------------------------------------------');
    console.error(`❌ Tests failed with code ${code}`);
  }
});
