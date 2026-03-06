/**
 * Database Seeder
 * Creates initial admin user for first-time setup
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      nama: 'System Administrator',
    },
  });

  console.log('✅ Created admin user:', {
    username: admin.username,
    password: 'admin123 (change this after first login!)',
  });

  // Create default event (Milad MU Travel)
  const event = await prisma.event.upsert({
    where: { id: 'default-event-id' },
    update: {},
    create: {
      id: 'default-event-id',
      nama_event: 'Milad MU Travel 2026',
      tanggal: new Date('2026-03-15T10:00:00Z'),
      lokasi: 'Hotel Cempaka Jember',
      deskripsi: 'Perayaan Milad MU Travel dengan undian doorprize menarik',
      waktu_undian: new Date('2026-04-25T20:00:00Z'),
      aktif: true,
    },
  });

  console.log('✅ Created default event:', {
    nama_event: event.nama_event,
    tanggal: event.tanggal.toLocaleDateString('id-ID'),
  });

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
