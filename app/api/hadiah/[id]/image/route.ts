/**
 * Hadiah Image Proxy API Route
 * GET /api/hadiah/[id]/image - Serve prize image from database efficiently
 */

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getHadiahById } from '@/services/hadiah.service';
import { errorResponse } from '@/lib/utils';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    await requireAuth();

    const { id } = await params;
    const hadiah = await getHadiahById(id);

    if (!hadiah || !hadiah.gambar_url) {
      return NextResponse.json(errorResponse('Image not found'), { status: 404 });
    }

    const imageSource = hadiah.gambar_url;

    if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
      return NextResponse.redirect(imageSource);
    }

    if (imageSource.startsWith('data:')) {
      const match = imageSource.match(/^data:(.+?);base64,(.+)$/);
      if (!match) {
        return NextResponse.json(errorResponse('Invalid image format'), { status: 400 });
      }

      const mimeType = match[1] || 'image/jpeg';
      const base64 = match[2];
      const buffer = Buffer.from(base64, 'base64');

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    // Fallback: assume plain base64-encoded image data.
    const buffer = Buffer.from(imageSource, 'base64');
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });
    }

    console.error('Get hadiah image error:', error);
    return NextResponse.json(errorResponse('Failed to load image', error), { status: 500 });
  }
}
