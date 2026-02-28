#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import path from 'path';

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

console.log(`\n${colors.bright}${colors.magenta}🔄 Resetting Prisma Migrations${colors.reset}`);
console.log(`${colors.cyan}==================================================${colors.reset}`);

// Path to the migrations directory
const migrationsDir = path.join(__dirname, 'prisma', 'migrations');

try {
  // Check if migrations directory exists
  if (fs.existsSync(migrationsDir)) {
    console.log(`${colors.yellow}Removing existing migrations directory...${colors.reset}`);
    
    // Remove the migrations directory
    fs.rmSync(migrationsDir, { recursive: true, force: true });
    
    console.log(`${colors.green}✅ Migrations directory removed successfully!${colors.reset}`);
  } else {
    console.log(`${colors.blue}No existing migrations directory found.${colors.reset}`);
  }
  
  // Check for migration_lock.toml
  const migrationLockPath = path.join(__dirname, 'prisma', 'migration_lock.toml');
  if (fs.existsSync(migrationLockPath)) {
    console.log(`${colors.yellow}Removing migration_lock.toml...${colors.reset}`);
    
    // Remove the migration_lock.toml file
    fs.unlinkSync(migrationLockPath);
    
    console.log(`${colors.green}✅ migration_lock.toml removed successfully!${colors.reset}`);
  } else {
    console.log(`${colors.blue}No migration_lock.toml found.${colors.reset}`);
  }
  
  // Check for dev.db (SQLite database)
  const sqliteDbPath = path.join(__dirname, 'prisma', 'dev.db');
  if (fs.existsSync(sqliteDbPath)) {
    console.log(`${colors.yellow}Removing SQLite database file...${colors.reset}`);
    
    // Remove the SQLite database file
    fs.unlinkSync(sqliteDbPath);
    
    console.log(`${colors.green}✅ SQLite database file removed successfully!${colors.reset}`);
  } else {
    console.log(`${colors.blue}No SQLite database file found.${colors.reset}`);
  }
  
  // Generate Prisma client
  console.log(`\n${colors.yellow}Generating Prisma client...${colors.reset}`);
  execSync('npx prisma generate', {
    cwd: __dirname,
    stdio: 'inherit',
  });
  
  console.log(`\n${colors.bright}${colors.green}✅ Migration reset complete!${colors.reset}`);
  console.log(`\n${colors.bright}${colors.cyan}Next steps:${colors.reset}`);
  console.log(`${colors.cyan}1. Run: ${colors.bright}npx prisma migrate dev --name init${colors.reset}`);
  console.log(`${colors.cyan}2. Run: ${colors.bright}npx prisma db seed${colors.reset}`);
  console.log(`${colors.cyan}3. Start your application: ${colors.bright}npm run dev${colors.reset}`);
} catch (error) {
  console.error(`\n${colors.red}❌ Error resetting migrations: ${error.message}${colors.reset}`);
  process.exit(1);
}
