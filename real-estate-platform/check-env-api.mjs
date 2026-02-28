// Check env vars (without exposing values)
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf8');
const lines = envContent.split('\n').filter(l => l && !l.startsWith('#'));
console.log('=== ENV KEYS PRESENT ===');
lines.forEach(line => {
  const [key] = line.split('=');
  if (key) console.log(' ✅', key.trim());
});

console.log('\n=== TESTING API ROUTES ===');

// Test simple route first
try {
  const r1 = await fetch('http://localhost:3000/api/test-db');
  console.log('GET /api/test-db status:', r1.status);
  const t1 = await r1.text();
  console.log('Response (first 200 chars):', t1.substring(0, 200));
} catch (e) {
  console.log('test-db error:', e.message);
}

console.log('');

// Test login route
try {
  const r2 = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@realestate.sa', password: 'User@123456' }),
  });
  console.log('POST /api/auth/login status:', r2.status);
  const t2 = await r2.text();
  console.log('Response (first 300 chars):', t2.substring(0, 300));
} catch (e) {
  console.log('login error:', e.message);
}
