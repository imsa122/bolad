/**
 * Script to update property images in the database with real Unsplash photos
 * Run: node update-images.mjs
 */
import { createRequire } from 'module';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Set DATABASE_URL before importing Prisma
process.env.DATABASE_URL = 'file:./prisma/dev.db';

const { PrismaClient } = require('./node_modules/@prisma/client/index.js');
const prisma = new PrismaClient();

// Real estate images from Unsplash (free to use)
const propertyImages = [
  // Property 1: Luxury Villa in Riyadh
  {
    id: 1,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    ]),
  },
  // Property 2: Modern Apartment in Jeddah
  {
    id: 2,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    ]),
  },
  // Property 3: Elegant Duplex in Dammam
  {
    id: 3,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&q=80',
    ]),
  },
  // Property 4: Commercial Office in Riyadh
  {
    id: 4,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80',
    ]),
  },
  // Property 5: Villa with Pool in Makkah
  {
    id: 5,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
    ]),
  },
  // Property 6: Apartment in Madinah
  {
    id: 6,
    images: JSON.stringify([
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80',
    ]),
  },
];

async function updateImages() {
  console.log('🖼️  Updating property images...\n');

  for (const { id, images } of propertyImages) {
    try {
      const updated = await prisma.property.update({
        where: { id },
        data: { images },
        select: { id: true, title_en: true },
      });
      console.log(`✅ Property ${updated.id}: ${updated.title_en}`);
    } catch (e) {
      console.log(`⚠️  Property ${id} not found (skipping): ${e.message}`);
    }
  }

  // Verify
  const props = await prisma.property.findMany({
    select: { id: true, title_en: true, images: true },
    orderBy: { id: 'asc' },
  });

  console.log('\n📋 Current properties:');
  for (const p of props) {
    const imgs = JSON.parse(p.images || '[]');
    console.log(`  [${p.id}] ${p.title_en} — ${imgs.length} image(s)`);
  }

  console.log('\n✅ Done! Images updated successfully.');
  await prisma.$disconnect();
}

updateImages().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
