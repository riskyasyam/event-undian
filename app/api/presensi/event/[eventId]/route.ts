/**
 * Presensi by Event API Route
 * GET /api/presensi/event/[eventId] - Get attendance list for an event
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';
import { getPresensiByEvent, getPresensiStats } from '@/services/presensi.service';
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
    const { searchParams } = new URL(request.url);
    const tipe = 'PESERTA' as const;
    const all = searchParams.get('all') === 'true';
    const page = Number(searchParams.get('page') || '1');
    const pageSize = Number(searchParams.get('pageSize') || '10');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Number(limitParam) : undefined;
    const search = (searchParams.get('search') || '').trim();

    const totalPresensi = await prisma.presensi.count({
      where: {
        event_id: eventId,
        peserta: {
          tipe,
          ...(search && {
            OR: [
              {
                nama: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                kode_unik: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                nomor_telepon: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }),
        },
      },
    });

    const [presensiList, stats] = await Promise.all([
      getPresensiByEvent(eventId, {
        all,
        limit: all ? undefined : (Number.isFinite(limit) && limit ? limit : undefined),
        page: all ? undefined : page,
        pageSize: all ? undefined : pageSize,
        tipe,
        search,
      }),
      getPresensiStats(eventId),
    ]);

    const resolvedPageSize = all ? totalPresensi || 1 : (Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10);
    const totalPages = all ? 1 : Math.max(1, Math.ceil(totalPresensi / resolvedPageSize));

    return NextResponse.json(
      successResponse({
        presensi: presensiList,
        stats,
        total_presensi: totalPresensi,
        pagination: {
          page: all ? 1 : (Number.isFinite(page) && page > 0 ? page : 1),
          pageSize: resolvedPageSize,
          total: totalPresensi,
          totalPages,
          all,
        },
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
