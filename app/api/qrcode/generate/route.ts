/**
 * QR Code Generation API Route
 * POST /api/qrcode/generate - Generate QR code for a participant
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { peserta_id } = body;

    if (!peserta_id) {
      return NextResponse.json(
        errorResponse('peserta_id is required'),
        { status: 400 }
      );
    }

    // Get participant
    const peserta = await prisma.peserta.findUnique({
      where: { id: peserta_id },
    });

    if (!peserta) {
      return NextResponse.json(
        errorResponse('Participant not found'),
        { status: 404 }
      );
    }

    // Generate QR code as data URL (base64)
    // QR code contains the unique code (kode_unik) for easy manual entry
    const qrCodeDataUrl = await QRCode.toDataURL(peserta.kode_unik, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Update peserta with QR code URL
    const updatedPeserta = await prisma.peserta.update({
      where: { id: peserta_id },
      data: { qr_code_url: qrCodeDataUrl },
    });

    return NextResponse.json(
      successResponse(
        {
          qr_code_url: updatedPeserta.qr_code_url,
          kode_unik: updatedPeserta.kode_unik,
        },
        'QR code generated successfully'
      )
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    console.error('Generate QR code error:', error);
    return NextResponse.json(
      errorResponse('Failed to generate QR code', error),
      { status: 500 }
    );
  }
}
