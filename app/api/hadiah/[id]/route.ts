/**
 * Delete Hadiah API Route
 * PUT /api/hadiah/[id] - Update prize
 * DELETE /api/hadiah/[id] - Delete prize
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { deleteHadiah, updateHadiah } from '@/services/hadiah.service';
import { errorResponse, successResponse } from '@/lib/utils';
import { KecepatanUndian, TipePeserta } from '@prisma/client';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();

    const { id } = await params;
    const body = await request.json();
    const {
      nama_hadiah,
      deskripsi,
      gambar_url,
      jumlah_pemenang,
      urutan,
      tipe_peserta,
      kecepatan_undian,
      mode_undian,
    } = body;

    const updatePayload = {
      nama_hadiah,
      deskripsi,
      gambar_url,
      jumlah_pemenang: jumlah_pemenang ? parseInt(jumlah_pemenang) : undefined,
      urutan: urutan ? parseInt(urutan) : undefined,
      tipe_peserta: tipe_peserta ? (tipe_peserta as TipePeserta) : undefined,
      kecepatan_undian: kecepatan_undian ? (kecepatan_undian as KecepatanUndian) : undefined,
      mode_undian: mode_undian === 'SEMUA' ? 'SEMUA' : 'SATU' as 'SATU' | 'SEMUA',
    };

    let hadiah;
    try {
      hadiah = await updateHadiah(id, updatePayload);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (!message.includes('Unknown argument `mode_undian`')) {
        throw error;
      }

      // Backward-compatible path when Prisma client/database is not yet migrated.
      const { mode_undian: _unused, ...fallbackPayload } = updatePayload;
      hadiah = await updateHadiah(id, fallbackPayload);
    }

    return NextResponse.json(
      successResponse(hadiah, 'Prize updated successfully')
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    console.error('Update prize error:', error);
    return NextResponse.json(
      errorResponse('Failed to update prize', error),
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();

    const { id } = await params;
    await deleteHadiah(id);

    return NextResponse.json(
      successResponse(null, 'Prize deleted successfully')
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    console.error('Delete prize error:', error);
    return NextResponse.json(
      errorResponse('Failed to delete prize', error),
      { status: 500 }
    );
  }
}
