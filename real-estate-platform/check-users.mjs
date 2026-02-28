// Check what users exist and try both credentials
console.log('=== CHECKING USERS IN DB ===\n');

// Try admin login
const adminRes = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@realestate.sa', password: 'Admin@123456' }),
});
console.log('Admin login status:', adminRes.status);
const adminData = await adminRes.json();
console.log('Admin login result:', JSON.stringify(adminData, null, 2));

console.log('\n---\n');

// Try user login
const userRes = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@realestate.sa', password: 'User@123456' }),
});
console.log('User login status:', userRes.status);
const userData = await userRes.json();
console.log('User login result:', JSON.stringify(userData, null, 2));

console.log('\n=== REGISTERING TEST USER ===\n');

// Register the test user if not exists
const regRes = await fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'أحمد محمد',
    email: 'user@realestate.sa',
    password: 'User@123456',
    confirmPassword: 'User@123456',
    phone: '+966511111111',
  }),
});
console.log('Register status:', regRes.status);
const regData = await regRes.json();
console.log('Register result:', JSON.stringify(regData, null, 2));
