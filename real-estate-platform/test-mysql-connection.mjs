import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Get the directory of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env file
const envPath = resolve(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = envContent.split('\n').reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    acc[key] = value;
  }
  return acc;
}, {});

// Set environment variables
Object.entries(envVars).forEach(([key, value]) => {
  process.env[key] = value;
});

async function testConnection() {
  console.log('🔍 Testing MySQL connection...');
  console.log(`🔌 Database URL: ${process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@')}`);
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    // Test connection by running a simple query
    console.log('🔄 Connecting to MySQL database...');
    const result = await prisma.$queryRaw`SELECT 1+1 AS result`;
    console.log('✅ Connection successful!');
    console.log('📊 Test query result:', result);

    // Get database version
    const versionResult = await prisma.$queryRaw`SELECT VERSION() AS version`;
    console.log('🔢 MySQL version:', versionResult[0].version);

    // Check if tables exist
    console.log('📋 Checking database tables...');
    const tables = await prisma.$queryRaw`SHOW TABLES`;
    
    if (tables.length === 0) {
      console.log('⚠️ No tables found. You need to run migrations:');
      console.log('   npx prisma migrate dev --name init');
    } else {
      console.log('📑 Tables found:', tables.length);
      tables.forEach((table) => {
        const tableName = Object.values(table)[0];
        console.log(`   - ${tableName}`);
      });
    }

    console.log('\n🎉 MySQL connection test completed successfully!');
    console.log('👉 Next steps:');
    console.log('   1. Run migrations: npx prisma migrate dev --name init');
    console.log('   2. Generate Prisma client: npx prisma generate');
    console.log('   3. Seed the database: npx prisma db seed');
    console.log('   4. Start your Next.js app: npm run dev');
  } catch (error) {
    console.error('❌ Connection failed:', error);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Check if MySQL server is running on port 3307');
    console.error('   2. Verify username and password in .env file');
    console.error('   3. Make sure the database "real_estate_db" exists');
    console.error('   4. Check network connectivity to the database server');
    
    // Provide command to create database if it doesn't exist
    console.error('\n💡 To create the database, run:');
    console.error('   mysql -h localhost -P 3307 -u root -p113245Aa! -e "CREATE DATABASE IF NOT EXISTS real_estate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"');
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
