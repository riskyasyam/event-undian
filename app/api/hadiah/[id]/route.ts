/**
 * Delete Hadiah API Route
 * DELETE /api/hadiah/[id] - Delete prize
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { deleteHadiah } from '@/services/hadiah.service';
import { errorResponse, successResponse } from '@/lib/utils';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
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
