import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read DATABASE_URL from .env
let dbUrl = '';
try {
  const env = readFileSync(resolve(__dirname, '.env'), 'utf8');
  const match = env.match(/DATABASE_URL\s*=\s*"?([^"\n]+)"?/);
  if (match) dbUrl = match[1].trim();
} catch {
  console.error('❌ Could not read .env file. Make sure it exists.');
  process.exit(1);
}

if (!dbUrl) {
  console.error('❌ DATABASE_URL not found in .env');
  process.exit(1);
}

console.log('🔄 Pushing schema changes to database...');
console.log('   (Adding userId and lastEditedAt columns to properties table)\n');

const prismaPath = resolve(__dirname, 'node_modules/prisma/build/index.js');
const schemaPath = resolve(__dirname, 'prisma/schema.prisma');

try {
  execSync(
    `node "${prismaPath}" db push --schema="${schemaPath}" --accept-data-loss`,
    {
      cwd: __dirname,
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: dbUrl },
    }
  );
  console.log('\n✅ Schema pushed successfully!');
  console.log('🔄 Regenerating Prisma client...');

  execSync(
    `node "${prismaPath}" generate --schema="${schemaPath}"`,
    {
      cwd: __dirname,
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: dbUrl },
    }
  );
  console.log('✅ Prisma client regenerated!');
} catch (e) {
  console.error('❌ Schema push failed:', e.message);
  process.exit(1);
}
