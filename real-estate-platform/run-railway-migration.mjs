/**
 * Railway Migration Script
 * Bypasses .env file and runs Prisma migration directly against Railway MySQL
 */
import { execSync } from 'child_process';

const RAILWAY_URL = 'mysql://root:oOjJWkSfUilNqWyBdchIWcCxNWjFnSeD@turntable.proxy.rlwy.net:31805/railway';

console.log('🚀 Running Prisma schema push against Railway MySQL...');
console.log('📡 Target:', RAILWAY_URL.replace(/:([^:@]+)@/, ':****@'));

try {
  // Use prisma db push which creates tables directly from schema
  // On Windows use .cmd version, on Unix use regular
  const prismaCmd = process.platform === 'win32' 
    ? 'node_modules\\.bin\\prisma.cmd' 
    : 'node node_modules/.bin/prisma';
  execSync(`${prismaCmd} db push --force-reset --accept-data-loss`, {
    env: {
      ...process.env,
      DATABASE_URL: RAILWAY_URL,
    },
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  console.log('\n✅ Schema pushed successfully! Tables created in Railway MySQL.');
} catch (err) {
  console.error('\n❌ db push failed, trying migrate deploy...');
  try {
    execSync(`${prismaCmd} migrate deploy`, {
      env: {
        ...process.env,
        DATABASE_URL: RAILWAY_URL,
      },
      stdio: 'inherit',
      cwd: process.cwd(),
    });
    console.log('\n✅ Migrations deployed successfully!');
  } catch (err2) {
    console.error('❌ Both methods failed:', err2.message);
    process.exit(1);
  }
}

console.log('\n🌱 Now seeding the database...');
try {
  // Create a temporary seed script that uses the Railway URL
  const seedScript = `
    process.env.DATABASE_URL = '${RAILWAY_URL}';
    const { PrismaClient } = await import('@prisma/client');
    const bcrypt = await import('bcryptjs');
    const prisma = new PrismaClient();
    
    const adminPassword = await bcrypt.default.hash('Admin@123456', 12);
    await prisma.user.upsert({
      where: { email: 'admin@realestate.sa' },
      update: {},
      create: {
        name: 'مدير النظام',
        email: 'admin@realestate.sa',
        password: adminPassword,
        role: 'ADMIN',
        phone: '+966500000000',
      },
    });
    console.log('✅ Admin user created: admin@realestate.sa / Admin@123456');
    
    const userPassword = await bcrypt.default.hash('User@123456', 12);
    await prisma.user.upsert({
      where: { email: 'user@realestate.sa' },
      update: {},
      create: {
        name: 'أحمد محمد',
        email: 'user@realestate.sa',
        password: userPassword,
        role: 'USER',
        phone: '+966511111111',
      },
    });
    console.log('✅ Regular user created: user@realestate.sa / User@123456');
    
    await prisma.$disconnect();
    console.log('\\n🎉 Seed complete!');
  `;

  execSync(`node --input-type=module`, {
    input: seedScript,
    env: {
      ...process.env,
      DATABASE_URL: RAILWAY_URL,
    },
    stdio: ['pipe', 'inherit', 'inherit'],
    cwd: process.cwd(),
  });
} catch (seedErr) {
  console.log('⚠️  Seed skipped (can be done manually). Error:', seedErr.message);
}

console.log('\n✅ Railway database setup complete!');
console.log('\n📋 Vercel Environment Variables needed:');
console.log('   DATABASE_URL =', RAILWAY_URL);
console.log('   JWT_SECRET = saudi-real-estate-jwt-secret-2024-production-key');
console.log('   JWT_EXPIRES_IN = 7d');
console.log('   NEXT_PUBLIC_APP_URL = https://bolad-rk2cxhaxh-imsa122s-projects.vercel.app');
console.log('\n🔄 After setting env vars → Redeploy on Vercel!');
