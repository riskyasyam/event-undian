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
        errorResponse('QR tidak terdeteksi'),
        { status: 400 }
      );
    }

    const rawInput = String(kode_peserta).trim();

    const tokenCandidates = new Set<string>();
    const kodeCandidates = new Set<string>();

    // 1) Raw text candidates
    if (rawInput) {
      tokenCandidates.add(rawInput);
      kodeCandidates.add(rawInput.toUpperCase());
    }

    // 2) URL candidates (supports old QR formats like /scan?token=...)
    if (/^https?:\/\//i.test(rawInput)) {
      try {
        const parsed = new URL(rawInput);
        const tokenParam = parsed.searchParams.get('token');
        const kodeParam = parsed.searchParams.get('kode') || parsed.searchParams.get('kode_unik');

        if (tokenParam) {
          tokenCandidates.add(tokenParam.trim());
        }

        if (kodeParam) {
          kodeCandidates.add(kodeParam.trim().toUpperCase());
        }

        const pathTail = parsed.pathname.split('/').filter(Boolean).pop();
        if (pathTail) {
          const normalizedTail = pathTail.replace(/\.png$/i, '');
          if (normalizedTail) {
            tokenCandidates.add(normalizedTail);
            kodeCandidates.add(normalizedTail.toUpperCase());
          }
        }
      } catch {
        // If URL parsing fails, continue with raw input only
      }
    }

    // Find participant by either kode_unik or token to support legacy QR variants.
    const peserta = await prisma.peserta.findFirst({
      where: {
        OR: [
          ...Array.from(kodeCandidates).map((kode) => ({ kode_unik: kode })),
          ...Array.from(tokenCandidates).map((token) => ({ token })),
        ],
      },
      include: {
        event: true,
      },
    });

    if (!peserta) {
      return NextResponse.json(
        errorResponse('QR tidak terdeteksi'),
        { status: 404 }
      );
    }

    // Check if already attended
    if (peserta.status_hadir) {
      return NextResponse.json(
        errorResponse(`${peserta.nama} sudah presensi`),
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
          errorResponse(`${peserta.nama} sudah presensi`),
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
