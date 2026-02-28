import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const nextBin = resolve(__dirname, 'node_modules/next/dist/bin/next');

console.log('🚀 Starting Next.js dev server on port 3001...');

const child = spawn('node', [nextBin, 'dev', '--port', '3001'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    DATABASE_URL: 'file:./prisma/dev.db',
  }
});

child.on('error', (err) => {
  console.error('Failed to start server:', err);
});

child.on('exit', (code) => {
  console.log('Server exited with code:', code);
});
