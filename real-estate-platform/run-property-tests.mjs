#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🧪 Running user property creation tests...');
console.log('Make sure your Next.js development server is running on http://localhost:3000');
console.log('-----------------------------------------------------------');

// Run the test script
const testProcess = spawn('node', [join(__dirname, 'test-user-property-creation.mjs')], {
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
    console.log('✅ All tests passed successfully!');
    console.log('');
    console.log('Summary of changes:');
    console.log('1. Modified the properties API to allow regular users to create properties');
    console.log('2. Added "Add Property" link in the navbar for logged-in users');
    console.log('3. Created a new page at /properties/new for users to add properties');
    console.log('4. Updated the middleware to protect the property creation page');
  } else {
    console.log('-----------------------------------------------------------');
    console.error(`❌ Tests failed with code ${code}`);
  }
});
