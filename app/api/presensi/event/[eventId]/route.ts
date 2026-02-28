/**
 * Presensi by Event API Route
 * GET /api/presensi/event/[eventId] - Get attendance list for an event
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{
    eventId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();

    const { eventId } = await params;

    // Get all presensi for the event
    const presensiList = await prisma.presensi.findMany({
      where: { event_id: eventId },
      include: {
        peserta: {
          select: {
            id: true,
            kode_unik: true,
            nama: true,
            nomor_telepon: true,
            alamat: true,
          },
        },
      },
      orderBy: { waktu_hadir: 'desc' },
    });

    // Get statistics
    const totalPeserta = await prisma.peserta.count({
      where: { event_id: eventId },
    });

    const totalHadir = await prisma.peserta.count({
      where: {
        event_id: eventId,
        status_hadir: true,
      },
    });

    const stats = {
      total_peserta: totalPeserta,
      total_hadir: totalHadir,
      total_belum_hadir: totalPeserta - totalHadir,
      persentase_hadir: totalPeserta > 0 ? Math.round((totalHadir / totalPeserta) * 100) : 0,
    };

    return NextResponse.json(
      successResponse({
        presensi: presensiList,
        stats,
      })
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    console.error('Get presensi error:', error);
    return NextResponse.json(
      errorResponse('Failed to get presensi', error),
      { status: 500 }
    );
  }
}
