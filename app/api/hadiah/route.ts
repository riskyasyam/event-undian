/**
 * Create Hadiah API Route
 * POST /api/hadiah - Create new prize
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createHadiah } from '@/services/hadiah.service';
import { errorResponse, successResponse } from '@/lib/utils';
import { TipePeserta, KecepatanUndian } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const {
      event_id,
      nama_hadiah,
      deskripsi,
      gambar_url,
      jumlah_pemenang,
      urutan,
      tipe_peserta,
      kecepatan_undian,
      mode_undian,
    } = body;

    if (!event_id || !nama_hadiah || !jumlah_pemenang) {
      return NextResponse.json(
        errorResponse('event_id, nama_hadiah, and jumlah_pemenang are required'),
        { status: 400 }
      );
    }

    if (jumlah_pemenang < 1) {
      return NextResponse.json(
        errorResponse('jumlah_pemenang must be at least 1'),
        { status: 400 }
      );
    }

    const normalizedModeUndian: 'SATU' | 'SEMUA' = mode_undian === 'SEMUA' ? 'SEMUA' : 'SATU';

    const createPayload = {
      event_id,
      nama_hadiah,
      deskripsi,
      gambar_url,
      jumlah_pemenang: parseInt(jumlah_pemenang),
      urutan: urutan ? parseInt(urutan) : undefined,
      tipe_peserta: tipe_peserta || TipePeserta.PESERTA,
      kecepatan_undian: (kecepatan_undian as KecepatanUndian) || KecepatanUndian.NORMAL,
      mode_undian: normalizedModeUndian,
    };

    let hadiah;
    try {
      hadiah = await createHadiah(createPayload);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (!message.includes('Unknown argument `mode_undian`')) {
        throw error;
      }

      // Backward-compatible path when Prisma client/database is not yet migrated.
      const { mode_undian: _unused, ...fallbackPayload } = createPayload;
      hadiah = await createHadiah(fallbackPayload);
    }

    return NextResponse.json(
      successResponse(hadiah, 'Prize created successfully'),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    console.error('Create prize error:', error);
    return NextResponse.json(
      errorResponse('Failed to create prize', error),
      { status: 500 }
    );
  }
}
