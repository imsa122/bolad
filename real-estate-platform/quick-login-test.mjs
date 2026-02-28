const res = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@realestate.sa', password: 'User@123456' }),
});
const data = await res.json();
console.log('Status:', res.status);
console.log('Response:', JSON.stringify(data, null, 2));
console.log('\nToken path check:');
console.log('  data.data?.token:', data.data?.token ? 'EXISTS ✅' : 'MISSING ❌');
console.log('  data.token:', data.token ? 'EXISTS ✅' : 'MISSING ❌');
