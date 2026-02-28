/**
 * Create Hadiah API Route
 * POST /api/hadiah - Create new prize
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createHadiah } from '@/services/hadiah.service';
import { errorResponse, successResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { event_id, nama_hadiah, deskripsi, gambar_url, jumlah_pemenang, urutan } = body;

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

    const hadiah = await createHadiah({
      event_id,
      nama_hadiah,
      deskripsi,
      gambar_url,
      jumlah_pemenang: parseInt(jumlah_pemenang),
      urutan: urutan ? parseInt(urutan) : undefined,
    });

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
