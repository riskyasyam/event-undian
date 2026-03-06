/**
 * Presensi API Route
 * POST /api/presensi/submit - Submit attendance (manual code or QR scan)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { kode_peserta, metode = 'manual' } = body; // metode: 'manual' or 'qrcode'

    if (!kode_peserta) {
      return NextResponse.json(
        errorResponse('Kode peserta is required'),
        { status: 400 }
      );
    }

    // Find participant by kode_unik
    const peserta = await prisma.peserta.findUnique({
      where: { kode_unik: kode_peserta },
      include: {
        event: true,
      },
    });

    if (!peserta) {
      return NextResponse.json(
        errorResponse('Peserta tidak ditemukan'),
        { status: 404 }
      );
    }

    // Check if already attended
    if (peserta.status_hadir) {
      return NextResponse.json(
        errorResponse('Peserta sudah melakukan presensi sebelumnya'),
        { status: 400 }
      );
    }

    try {
      // Use transaction to ensure atomicity and prevent race conditions
      const result = await prisma.$transaction(async (tx) => {
        // Mark as attended
        await tx.peserta.update({
          where: { id: peserta.id },
          data: { status_hadir: true },
        });

        // Create presensi record
        const presensi = await tx.presensi.create({
          data: {
            peserta_id: peserta.id,
            event_id: peserta.event_id,
            metode,
          },
        });

        return presensi;
      });

      return NextResponse.json(
        successResponse(
          {
            presensi_id: result.id,
            peserta: {
              id: peserta.id,
              kode_unik: peserta.kode_unik,
              nama: peserta.nama,
              nomor_telepon: peserta.nomor_telepon,
            },
            waktu_hadir: result.waktu_hadir,
          },
          'Presensi berhasil dicatat'
        )
      );
    } catch (txError: any) {
      // Handle unique constraint violation (duplicate presensi)
      if (txError.code === 'P2002' && txError.meta?.target?.includes('peserta_id')) {
        return NextResponse.json(
          errorResponse('Peserta sudah melakukan presensi sebelumnya'),
          { status: 400 }
        );
      }
      throw txError;
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    console.error('Submit presensi error:', error);
    return NextResponse.json(
      errorResponse('Failed to submit presensi', error),
      { status: 500 }
    );
  }
}
