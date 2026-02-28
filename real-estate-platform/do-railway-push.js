// Set DATABASE_URL BEFORE any dotenv loading
process.env.DATABASE_URL = 'mysql://root:oOjJWkSfUilNqWyBdchIWcCxNWjFnSeD@turntable.proxy.rlwy.net:31805/railway';

const { spawnSync } = require('child_process');
const path = require('path');

console.log('🚀 Pushing schema to Railway MySQL...');
console.log('📡 URL: mysql://root:****@turntable.proxy.rlwy.net:31805/railway');

const prismaPath = path.join(__dirname, 'node_modules', 'prisma', 'build', 'index.js');

const result = spawnSync(
  process.execPath,
  [prismaPath, 'db', 'push', '--force-reset', '--accept-data-loss'],
  {
    env: process.env,
    stdio: 'inherit',
    cwd: __dirname,
  }
);

if (result.status === 0) {
  console.log('\n✅ Schema pushed! Tables created in Railway MySQL.');
  console.log('\n📋 Next: Add these to Vercel Environment Variables:');
  console.log('   DATABASE_URL = mysql://root:oOjJWkSfUilNqWyBdchIWcCxNWjFnSeD@turntable.proxy.rlwy.net:31805/railway');
  console.log('   JWT_SECRET = saudi-real-estate-jwt-secret-2024-production-key');
  console.log('   JWT_EXPIRES_IN = 7d');
  console.log('   NEXT_PUBLIC_APP_URL = https://bolad-rk2cxhaxh-imsa122s-projects.vercel.app');
  console.log('\n🔄 Then Redeploy on Vercel!');
} else {
  console.error('\n❌ Push failed with exit code:', result.status);
  process.exit(result.status || 1);
}
