// Set DATABASE_URL BEFORE any dotenv loading
process.env.DATABASE_URL = 'mysql://root:oOjJWkSfUilNqWyBdchIWcCxNWjFnSeD@turntable.proxy.rlwy.net:31805/railway';

const { spawnSync } = require('child_process');
const path = require('path');

console.log('🌱 Seeding Railway MySQL database...');

// Run ts-node with the seed file
const result = spawnSync(
  process.execPath,
  [
    '--loader', 'ts-node/esm',
    '--experimental-specifier-resolution=node',
    'prisma/seed.ts'
  ],
  {
    env: {
      ...process.env,
      TS_NODE_PROJECT: path.join(__dirname, 'tsconfig.json'),
    },
    stdio: 'inherit',
    cwd: __dirname,
  }
);

if (result.status !== 0) {
  console.log('\n⚠️  ts-node seed failed, trying alternative approach...');
  
  // Alternative: use node directly with a simple seed
  const { PrismaClient } = require('@prisma/client');
  const bcrypt = require('bcryptjs');
  
  async function seed() {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    try {
      // Create admin user
      const adminPassword = await bcrypt.hash('Admin@123456', 12);
      const admin = await prisma.user.upsert({
        where: { email: 'admin@realestate.sa' },
        update: {},
        create: {
          name: 'مدير النظام',
          email: 'admin@realestate.sa',
          password: adminPassword,
          role: 'ADMIN',
          phone: '+966500000000',
        },
      });
      console.log('✅ Admin created:', admin.email);

      // Create regular user
      const userPassword = await bcrypt.hash('User@123456', 12);
      const user = await prisma.user.upsert({
        where: { email: 'user@realestate.sa' },
        update: {},
        create: {
          name: 'أحمد محمد',
          email: 'user@realestate.sa',
          password: userPassword,
          role: 'USER',
          phone: '+966511111111',
        },
      });
      console.log('✅ User created:', user.email);

      // Create sample properties
      const properties = [
        {
          title_ar: 'فيلا فاخرة في حي النرجس',
          title_en: 'Luxury Villa in Al Narjis District',
          description_ar: 'فيلا فاخرة مع حديقة خاصة ومسبح، تقع في أرقى أحياء الرياض.',
          description_en: 'Luxury villa with private garden and pool in the most prestigious neighborhoods of Riyadh.',
          price: 3500000,
          city: 'الرياض',
          address_ar: 'حي النرجس، الرياض',
          address_en: 'Al Narjis District, Riyadh',
          type: 'SALE',
          status: 'AVAILABLE',
          bedrooms: 6,
          bathrooms: 7,
          area: 850,
          latitude: 24.7136,
          longitude: 46.6753,
          images: JSON.stringify([]),
          amenities: JSON.stringify(['مسبح', 'حديقة', 'مواقف سيارات']),
          featured: true,
        },
        {
          title_ar: 'شقة حديثة في جدة',
          title_en: 'Modern Apartment in Jeddah',
          description_ar: 'شقة حديثة بإطلالة على البحر في قلب جدة.',
          description_en: 'Modern apartment with sea view in the heart of Jeddah.',
          price: 8500,
          city: 'جدة',
          address_ar: 'حي الشاطئ، جدة',
          address_en: 'Al Shati District, Jeddah',
          type: 'RENT',
          status: 'AVAILABLE',
          bedrooms: 3,
          bathrooms: 2,
          area: 180,
          latitude: 21.5433,
          longitude: 39.1728,
          images: JSON.stringify([]),
          amenities: JSON.stringify(['إطلالة بحرية', 'موقف سيارة']),
          featured: true,
        },
        {
          title_ar: 'دوبلكس راقي في الدمام',
          title_en: 'Elegant Duplex in Dammam',
          description_ar: 'دوبلكس راقي في أفضل مواقع الدمام.',
          description_en: 'Elegant duplex in the best locations of Dammam.',
          price: 1800000,
          city: 'الدمام',
          address_ar: 'حي الفيصلية، الدمام',
          address_en: 'Al Faisaliyah District, Dammam',
          type: 'SALE',
          status: 'AVAILABLE',
          bedrooms: 4,
          bathrooms: 4,
          area: 380,
          latitude: 26.4207,
          longitude: 50.0888,
          images: JSON.stringify([]),
          amenities: JSON.stringify(['تراس', 'مطبخ مجهز']),
          featured: false,
        },
        {
          title_ar: 'فيلا مع مسبح في مكة',
          title_en: 'Villa with Pool in Makkah',
          description_ar: 'فيلا فاخرة مع مسبح خاص في حي راقي بمكة المكرمة.',
          description_en: 'Luxury villa with private pool in an upscale neighborhood in Makkah.',
          price: 4200000,
          city: 'مكة المكرمة',
          address_ar: 'حي العزيزية، مكة المكرمة',
          address_en: 'Al Aziziyah District, Makkah',
          type: 'SALE',
          status: 'AVAILABLE',
          bedrooms: 5,
          bathrooms: 5,
          area: 600,
          latitude: 21.3891,
          longitude: 39.8579,
          images: JSON.stringify([]),
          amenities: JSON.stringify(['مسبح', 'حديقة', 'نظام أمني']),
          featured: true,
        },
        {
          title_ar: 'شقة للإيجار في المدينة المنورة',
          title_en: 'Apartment for Rent in Madinah',
          description_ar: 'شقة مريحة قريبة من المسجد النبوي الشريف.',
          description_en: 'Comfortable apartment close to the Prophet\'s Mosque.',
          price: 4500,
          city: 'المدينة المنورة',
          address_ar: 'حي العوالي، المدينة المنورة',
          address_en: 'Al Awali District, Madinah',
          type: 'RENT',
          status: 'AVAILABLE',
          bedrooms: 2,
          bathrooms: 1,
          area: 120,
          latitude: 24.5247,
          longitude: 39.5692,
          images: JSON.stringify([]),
          amenities: JSON.stringify(['مكيف هواء', 'موقف سيارة']),
          featured: false,
        },
      ];

      for (const prop of properties) {
        await prisma.property.create({ data: prop });
      }
      console.log(`✅ ${properties.length} properties created`);

      await prisma.$disconnect();
      console.log('\n🎉 Database seeded successfully!');
      console.log('\n📋 Login Credentials:');
      console.log('   Admin: admin@realestate.sa / Admin@123456');
      console.log('   User:  user@realestate.sa  / User@123456');
    } catch (err) {
      console.error('❌ Seed error:', err.message);
      await prisma.$disconnect();
      process.exit(1);
    }
  }

  seed();
}
