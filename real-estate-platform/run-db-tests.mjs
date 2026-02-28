#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

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

console.log(`\n${colors.bright}${colors.magenta}🚀 MySQL Database Test Runner${colors.reset}`);
console.log(`${colors.cyan}==================================================${colors.reset}`);

try {
  console.log(`${colors.yellow}Running thorough database tests...${colors.reset}`);
  
  // Run the thorough database tests
  execSync('node thorough-db-test.mjs', {
    cwd: __dirname,
    stdio: 'inherit',
  });
  
  console.log(`\n${colors.green}✅ Database tests completed!${colors.reset}`);
} catch (error) {
  console.error(`\n${colors.red}❌ Error running database tests: ${error.message}${colors.reset}`);
  process.exit(1);
}
