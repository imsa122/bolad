import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const tsNodePath = resolve(__dirname, 'node_modules/.bin/ts-node.cmd');
const seedPath = resolve(__dirname, 'prisma/seed.ts');

try {
  console.log('Running database seed...');
  execSync(
    `node "${resolve(__dirname, 'node_modules/ts-node/dist/bin.js')}" --compiler-options "{\\"module\\":\\"CommonJS\\"}" "${seedPath}"`,
    {
      cwd: __dirname,
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: 'file:./prisma/dev.db' }
    }
  );
  console.log('Seed complete!');
} catch (e) {
  console.error('Seed failed:', e.message);
  process.exit(1);
}
