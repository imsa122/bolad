import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Set environment variables
process.env.DATABASE_URL = 'file:./prisma/dev.db';

const prismaPath = resolve(__dirname, 'node_modules/prisma/build/index.js');
const schemaPath = resolve(__dirname, 'prisma/schema.prisma');

try {
  console.log('Running prisma migrate dev...');
  execSync(
    `node "${prismaPath}" migrate dev --name init --schema="${schemaPath}"`,
    {
      cwd: __dirname,
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: 'file:./prisma/dev.db' }
    }
  );
  console.log('Migration complete!');
} catch (e) {
  console.error('Migration failed:', e.message);
  process.exit(1);
}
