import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Get the directory of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper function to execute commands and log output
function runCommand(command, message) {
  console.log(`\n${colors.bright}${colors.blue}⚙️ ${message}${colors.reset}`);
  console.log(`${colors.dim}$ ${command}${colors.reset}`);
  
  try {
    const output = execSync(command, { 
      cwd: __dirname,
      stdio: ['inherit', 'pipe', 'pipe'],
      encoding: 'utf-8'
    });
    
    if (output.trim()) {
      console.log(`${colors.green}${output}${colors.reset}`);
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    if (error.stdout) console.log(`${colors.dim}${error.stdout}${colors.reset}`);
    if (error.stderr) console.error(`${colors.red}${error.stderr}${colors.reset}`);
    return false;
  }
}

// Helper function to reset migrations when switching providers
function resetMigrations() {
  console.log(`\n${colors.bright}${colors.yellow}Step 0: Resetting migrations for provider switch${colors.reset}`);
  
  // Path to the migrations directory
  const migrationsDir = resolve(__dirname, 'prisma', 'migrations');
  const migrationLockPath = resolve(__dirname, 'prisma', 'migration_lock.toml');
  const sqliteDbPath = resolve(__dirname, 'prisma', 'dev.db');
  
  try {
    // Check if migrations directory exists
    if (fs.existsSync(migrationsDir)) {
      console.log(`${colors.yellow}Removing existing migrations directory...${colors.reset}`);
      fs.rmSync(migrationsDir, { recursive: true, force: true });
      console.log(`${colors.green}✅ Migrations directory removed successfully!${colors.reset}`);
    }
    
    // Check for migration_lock.toml
    if (fs.existsSync(migrationLockPath)) {
      console.log(`${colors.yellow}Removing migration_lock.toml...${colors.reset}`);
      fs.unlinkSync(migrationLockPath);
      console.log(`${colors.green}✅ migration_lock.toml removed successfully!${colors.reset}`);
    }
    
    // Check for dev.db (SQLite database)
    if (fs.existsSync(sqliteDbPath)) {
      console.log(`${colors.yellow}Removing SQLite database file...${colors.reset}`);
      fs.unlinkSync(sqliteDbPath);
      console.log(`${colors.green}✅ SQLite database file removed successfully!${colors.reset}`);
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Error resetting migrations: ${error.message}${colors.reset}`);
    return false;
  }
}

// Main function to set up the database
async function setupDatabase() {
  console.log(`\n${colors.bright}${colors.magenta}🚀 Setting up MySQL Database for Real Estate Platform${colors.reset}`);
  console.log(`${colors.cyan}==================================================${colors.reset}`);
  
  // Step 0: Reset migrations if switching providers
  resetMigrations();
  
  // Step 1: Check if MySQL is accessible
  console.log(`\n${colors.bright}${colors.yellow}Step 1: Checking MySQL connection${colors.reset}`);
  
  try {
    // Run the test connection script
    const testResult = runCommand('node test-mysql-connection.mjs', 'Testing MySQL connection');
    
    if (!testResult) {
      console.log(`\n${colors.yellow}⚠️ MySQL connection test failed. Attempting to create database...${colors.reset}`);
      
      // Try to create the database
      const createDbCommand = 'mysql -h localhost -P 3307 -u root -p113245Aa! -e "CREATE DATABASE IF NOT EXISTS real_estate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"';
      const dbCreated = runCommand(createDbCommand, 'Creating MySQL database');
      
      if (!dbCreated) {
        console.error(`\n${colors.red}❌ Failed to create database. Please check your MySQL installation and credentials.${colors.reset}`);
        process.exit(1);
      }
    }
  } catch (error) {
    console.error(`\n${colors.red}❌ Error checking MySQL connection: ${error.message}${colors.reset}`);
    process.exit(1);
  }
  
  // Step 2: Generate Prisma client
  console.log(`\n${colors.bright}${colors.yellow}Step 2: Generating Prisma client${colors.reset}`);
  const clientGenerated = runCommand('npx prisma generate', 'Generating Prisma client');
  
  if (!clientGenerated) {
    console.error(`\n${colors.red}❌ Failed to generate Prisma client. Aborting setup.${colors.reset}`);
    process.exit(1);
  }
  
  // Step 3: Run database migrations
  console.log(`\n${colors.bright}${colors.yellow}Step 3: Running database migrations${colors.reset}`);
  const migrationsRun = runCommand('npx prisma migrate dev --name init', 'Running database migrations');
  
  if (!migrationsRun) {
    console.error(`\n${colors.red}❌ Failed to run migrations. Aborting setup.${colors.reset}`);
    process.exit(1);
  }
  
  // Step 4: Seed the database
  console.log(`\n${colors.bright}${colors.yellow}Step 4: Seeding the database${colors.reset}`);
  const dbSeeded = runCommand('npx prisma db seed', 'Seeding the database with initial data');
  
  if (!dbSeeded) {
    console.warn(`\n${colors.yellow}⚠️ Database seeding failed. You can try running it manually later.${colors.reset}`);
  }
  
  // Step 5: Verify setup
  console.log(`\n${colors.bright}${colors.yellow}Step 5: Verifying database setup${colors.reset}`);
  const setupVerified = runCommand('node test-mysql-connection.mjs', 'Verifying database setup');
  
  if (setupVerified) {
    console.log(`\n${colors.bright}${colors.green}✅ MySQL database setup completed successfully!${colors.reset}`);
    console.log(`\n${colors.bright}${colors.cyan}Next steps:${colors.reset}`);
    console.log(`${colors.cyan}1. Start your Next.js app: ${colors.bright}npm run dev${colors.reset}`);
    console.log(`${colors.cyan}2. Access your app at: ${colors.bright}http://localhost:3000${colors.reset}`);
    console.log(`${colors.cyan}3. Login with admin credentials:${colors.reset}`);
    console.log(`   ${colors.dim}Email: ${colors.bright}admin@realestate.sa${colors.reset}`);
    console.log(`   ${colors.dim}Password: ${colors.bright}Admin@123456${colors.reset}`);
  } else {
    console.error(`\n${colors.red}❌ Database setup verification failed. Please check the errors above.${colors.reset}`);
  }
}

// Run the setup
setupDatabase().catch(error => {
  console.error(`${colors.red}❌ Unhandled error: ${error.message}${colors.reset}`);
  process.exit(1);
});
