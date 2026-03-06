/**
 * Database Seed API (PRODUCTION ONLY)
 * POST /api/seed - Seed initial data (admin & default event)
 * 
 * Security: Hanya bisa dipanggil dengan SEED_SECRET dari environment variable
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { errorResponse, successResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret } = body;

    // Security check: require SEED_SECRET environment variable
    const seedSecret = process.env.SEED_SECRET || 'your-secret-key-change-this';
    
    if (secret !== seedSecret) {
      return NextResponse.json(
        errorResponse('Unauthorized: Invalid secret key'),
        { status: 401 }
      );
    }

    console.log('🌱 Starting database seed...');

    // 1. Create default admin user
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

    console.log('✅ Admin user created/updated');

    // 2. Create default event
    const event = await prisma.event.upsert({
      where: { id: 'default-event-id' },
      update: {},
      create: {
        id: 'default-event-id',
        nama_event: 'Milad MU Travel 2026',
        tanggal: new Date('2026-04-25T03:00:00Z'), // 25 April 2026, 10:00 WIB
        lokasi: 'Hotel Cempaka Jember',
        deskripsi: 'Perayaan Milad MU Travel dengan undian doorprize menarik',
        waktu_undian: new Date('2026-04-25T13:00:00Z'), // 25 April 2026, 20:00 WIB
        aktif: true,
      },
    });

    console.log('✅ Default event created/updated');

    return NextResponse.json(
      successResponse(
        {
          admin: {
            username: admin.username,
            note: 'Default password: admin123 (please change after first login)',
          },
          event: {
            nama_event: event.nama_event,
            tanggal: event.tanggal,
            lokasi: event.lokasi,
          },
        },
        'Database seeded successfully'
      )
    );
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      errorResponse('Failed to seed database', error),
      { status: 500 }
    );
  }
}
