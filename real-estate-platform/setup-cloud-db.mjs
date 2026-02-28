/**
 * Cloud Database Setup Script
 * Run this after getting your Railway MySQL URL:
 * 
 * Usage: node setup-cloud-db.mjs "mysql://root:PASSWORD@HOST.railway.app:PORT/railway"
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';

const railwayUrl = process.argv[2];

if (!railwayUrl) {
  console.error('❌ Please provide your Railway MySQL URL as argument:');
  console.error('   node setup-cloud-db.mjs "mysql://root:PASSWORD@HOST.railway.app:PORT/railway"');
  process.exit(1);
}

if (!railwayUrl.startsWith('mysql://')) {
  console.error('❌ URL must start with mysql://');
  process.exit(1);
}

console.log('🚀 Setting up cloud database...');
console.log('📡 URL:', railwayUrl.replace(/:([^:@]+)@/, ':****@'));

// Temporarily set DATABASE_URL for migration
const originalEnv = process.env.DATABASE_URL;
process.env.DATABASE_URL = railwayUrl;

try {
  // Run Prisma migration
  console.log('\n📦 Running Prisma migrations...');
  execSync(`npx prisma migrate deploy`, {
    env: { ...process.env, DATABASE_URL: railwayUrl },
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  console.log('✅ Migrations applied successfully!');

  // Run seed
  console.log('\n🌱 Seeding database with sample data...');
  execSync(`npx ts-node --compiler-options {"module":"CommonJS"} prisma/seed.ts`, {
    env: { ...process.env, DATABASE_URL: railwayUrl },
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  console.log('✅ Database seeded!');

} catch (err) {
  console.error('❌ Error:', err.message);
  console.log('\n💡 Try running manually:');
  console.log(`   set DATABASE_URL=${railwayUrl}`);
  console.log('   npx prisma migrate deploy');
  process.exit(1);
}

console.log('\n✅ Cloud database setup complete!');
console.log('\n📋 Now add these to Vercel Environment Variables:');
console.log('   Settings → Environment Variables → Add:');
console.log(`\n   DATABASE_URL = ${railwayUrl}`);
console.log('   JWT_SECRET = your-random-32-char-secret-key-here');
console.log('   NEXT_PUBLIC_APP_URL = https://your-project.vercel.app');
console.log('   JWT_EXPIRES_IN = 7d');
console.log('\n🔄 Then redeploy on Vercel!');
