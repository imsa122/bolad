import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================
  // SEED ADMIN USER
  // ============================================
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
  console.log('✅ Admin user created:', admin.email);

  // ============================================
  // SEED REGULAR USER
  // ============================================
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
  console.log('✅ Regular user created:', user.email);

  // ============================================
  // SEED PROPERTIES
  // ============================================
  const properties = [
    {
      title_ar: 'فيلا فاخرة في حي النرجس',
      title_en: 'Luxury Villa in Al Narjis District',
      description_ar: 'فيلا فاخرة مع حديقة خاصة ومسبح، تقع في أرقى أحياء الرياض. تتميز بتصميم عصري وإطلالات رائعة.',
      description_en: 'Luxury villa with private garden and pool, located in the most prestigious neighborhoods of Riyadh. Features modern design and stunning views.',
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
      images: JSON.stringify(['/images/property-placeholder.jpg']),
      amenities: JSON.stringify(['مسبح', 'حديقة', 'مواقف سيارات', 'غرفة خادمة', 'مطبخ مجهز']),
      featured: true,
    },
    {
      title_ar: 'شقة حديثة في جدة',
      title_en: 'Modern Apartment in Jeddah',
      description_ar: 'شقة حديثة بإطلالة على البحر في قلب جدة، مجهزة بالكامل بأحدث التقنيات الذكية.',
      description_en: 'Modern apartment with sea view in the heart of Jeddah, fully equipped with the latest smart technologies.',
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
      images: JSON.stringify(['/images/property-placeholder.jpg']),
      amenities: JSON.stringify(['إطلالة بحرية', 'موقف سيارة', 'أمن 24 ساعة', 'مصعد']),
      featured: true,
    },
    {
      title_ar: 'دوبلكس راقي في الدمام',
      title_en: 'Elegant Duplex in Dammam',
      description_ar: 'دوبلكس راقي في أفضل مواقع الدمام، يتميز بمساحات واسعة وتشطيبات عالية الجودة.',
      description_en: 'Elegant duplex in the best locations of Dammam, featuring spacious areas and high-quality finishes.',
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
      images: JSON.stringify(['/images/property-placeholder.jpg']),
      amenities: JSON.stringify(['تراس', 'مطبخ مجهز', 'غرفة غسيل', 'مواقف سيارات']),
      featured: false,
    },
    {
      title_ar: 'مكتب تجاري في الرياض',
      title_en: 'Commercial Office in Riyadh',
      description_ar: 'مكتب تجاري في برج حديث بقلب الرياض، مناسب للشركات والمؤسسات التجارية.',
      description_en: 'Commercial office in a modern tower in the heart of Riyadh, suitable for companies and commercial institutions.',
      price: 15000,
      city: 'الرياض',
      address_ar: 'طريق الملك فهد، الرياض',
      address_en: 'King Fahd Road, Riyadh',
      type: 'RENT',
      status: 'AVAILABLE',
      bedrooms: 0,
      bathrooms: 2,
      area: 250,
      latitude: 24.6877,
      longitude: 46.7219,
      images: JSON.stringify(['/images/property-placeholder.jpg']),
      amenities: JSON.stringify(['إنترنت فائق السرعة', 'قاعة اجتماعات', 'استقبال', 'أمن 24 ساعة']),
      featured: false,
    },
    {
      title_ar: 'فيلا مع مسبح في مكة',
      title_en: 'Villa with Pool in Makkah',
      description_ar: 'فيلا فاخرة مع مسبح خاص في حي راقي بمكة المكرمة، قريبة من الخدمات والمرافق.',
      description_en: 'Luxury villa with private pool in an upscale neighborhood in Makkah, close to services and facilities.',
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
      images: JSON.stringify(['/images/property-placeholder.jpg']),
      amenities: JSON.stringify(['مسبح', 'حديقة', 'غرفة خادمة', 'مواقف سيارات', 'نظام أمني']),
      featured: true,
    },
    {
      title_ar: 'شقة للإيجار في المدينة المنورة',
      title_en: 'Apartment for Rent in Madinah',
      description_ar: 'شقة مريحة قريبة من المسجد النبوي الشريف، مناسبة للعائلات والأفراد.',
      description_en: "Comfortable apartment close to the Prophet's Mosque, suitable for families and individuals.",
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
      images: JSON.stringify(['/images/property-placeholder.jpg']),
      amenities: JSON.stringify(['مكيف هواء', 'موقف سيارة', 'قريب من الخدمات']),
      featured: false,
    },
  ];

  for (const property of properties) {
    await prisma.property.create({ data: property });
  }
  console.log(`✅ ${properties.length} properties created`);

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📋 Login Credentials:');
  console.log('   Admin: admin@realestate.sa / Admin@123456');
  console.log('   User:  user@realestate.sa  / User@123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
