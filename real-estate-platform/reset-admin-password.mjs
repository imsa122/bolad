// Reset admin password using Prisma directly
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔑 Resetting admin password...');
  
  const newPassword = await bcrypt.hash('Admin@123456', 12);
  
  // Update or create admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@realestate.sa' },
    update: { password: newPassword, role: 'ADMIN' },
    create: {
      name: 'مدير النظام',
      email: 'admin@realestate.sa',
      password: newPassword,
      role: 'ADMIN',
      phone: '+966500000000',
    },
  });
  
  console.log('✅ Admin password reset for:', admin.email, '(id:', admin.id, ')');
  
  // List all users
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, name: true }
  });
  console.log('\n📋 All users in DB:');
  users.forEach(u => console.log(`  [${u.id}] ${u.email} (${u.role}) - ${u.name}`));
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
