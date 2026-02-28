/**
 * QR Code Image API Route
 * GET /api/qrcode/[kodeUnik] - Serve QR code image as PNG
 */

import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

interface RouteParams {
  params: Promise<{
    kodeUnik: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { kodeUnik } = await params;

    if (!kodeUnik) {
      return NextResponse.json(
        { error: 'kodeUnik is required' },
        { status: 400 }
      );
    }

    // Generate QR code as PNG buffer
    const qrCodeBuffer = await QRCode.toBuffer(kodeUnik, {
      width: 400,
      margin: 2,
      type: 'png',
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Return PNG image
    return new NextResponse(new Uint8Array(qrCodeBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error('QR code generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}
