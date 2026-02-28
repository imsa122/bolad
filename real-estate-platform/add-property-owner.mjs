// Migration script: Add userId and lastEditedAt columns to properties table
import { createConnection } from 'mysql2/promise';
import { readFileSync } from 'fs';

// Read .env file
let dbUrl = '';
try {
  const env = readFileSync('.env', 'utf8');
  const match = env.match(/DATABASE_URL="?([^"\n]+)"?/);
  if (match) dbUrl = match[1];
} catch {
  console.error('Could not read .env file');
  process.exit(1);
}

// Parse MySQL URL: mysql://user:pass@host:port/dbname
const urlMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (!urlMatch) {
  console.error('Invalid DATABASE_URL format');
  process.exit(1);
}

const [, user, password, host, port, database] = urlMatch;

async function migrate() {
  console.log('🔄 Running migration: Add userId and lastEditedAt to properties...\n');

  const conn = await createConnection({ host, port: parseInt(port), user, password, database });

  try {
    // Check if userId column already exists
    const [cols] = await conn.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'userId'`,
      [database]
    );

    if (cols.length > 0) {
      console.log('✅ userId column already exists — skipping');
    } else {
      await conn.execute(`ALTER TABLE properties ADD COLUMN userId INT NULL`);
      await conn.execute(`ALTER TABLE properties ADD INDEX idx_properties_userId (userId)`);
      await conn.execute(
        `ALTER TABLE properties ADD CONSTRAINT fk_properties_user 
         FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL`
      );
      console.log('✅ Added userId column with index and foreign key');
    }

    // Check if lastEditedAt column already exists
    const [cols2] = await conn.execute(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'lastEditedAt'`,
      [database]
    );

    if (cols2.length > 0) {
      console.log('✅ lastEditedAt column already exists — skipping');
    } else {
      await conn.execute(`ALTER TABLE properties ADD COLUMN lastEditedAt DATETIME NULL`);
      console.log('✅ Added lastEditedAt column');
    }

    // Regenerate Prisma client
    console.log('\n🔄 Regenerating Prisma client...');

    await conn.end();
    console.log('\n✅ Migration complete!');
    console.log('📌 Run: npm run db:generate  (to regenerate Prisma client)');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    await conn.end();
    process.exit(1);
  }
}

migrate();
