import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/ar',
  method: 'GET',
  headers: { 'Accept': 'text/html' }
};

const req = http.request(options, (res) => {
  console.log('HTTP Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    // Extract error message from Next.js error page
    const errorMatch = body.match(/Error: ([^\n<]+)/);
    const digestMatch = body.match(/digest['":\s]+([^\n<"']+)/);
    const moduleMatch = body.match(/Cannot find module[^\n<]*/);
    const syntaxMatch = body.match(/SyntaxError[^\n<]*/);
    
    console.log('\n--- ERROR DETAILS ---');
    if (errorMatch) console.log('Error:', errorMatch[1]);
    if (digestMatch) console.log('Digest:', digestMatch[1]);
    if (moduleMatch) console.log('Module Error:', moduleMatch[0]);
    if (syntaxMatch) console.log('Syntax Error:', syntaxMatch[0]);
    
    // Print first 3000 chars of body
    console.log('\n--- BODY PREVIEW (first 3000 chars) ---');
    console.log(body.substring(0, 3000));
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();
