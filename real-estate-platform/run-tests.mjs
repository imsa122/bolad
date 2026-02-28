import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

try {
  const result = execSync(`node "${resolve(__dirname, 'test-api.mjs')}"`, {
    cwd: __dirname,
    encoding: 'utf8',
    env: { ...process.env, DATABASE_URL: 'file:./prisma/dev.db' },
    timeout: 60000,
  });
  console.log(result);
  writeFileSync(resolve(__dirname, 'test-results.txt'), result, 'utf8');
  console.log('\nResults saved to test-results.txt');
} catch (e) {
  const output = (e.stdout || '') + (e.stderr || '');
  console.log(output);
  writeFileSync(resolve(__dirname, 'test-results.txt'), output, 'utf8');
}
