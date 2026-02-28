/**
 * Single Event API Route
 * GET /api/events/[id] - Get event by ID
 * PUT /api/events/[id] - Update event
 * DELETE /api/events/[id] - Delete event
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getEventWithStats, updateEvent, deleteEvent } from '@/services/event.service';
import { errorResponse, successResponse } from '@/lib/utils';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();

    const { id } = await params;
    const event = await getEventWithStats(id);

    if (!event) {
      return NextResponse.json(
        errorResponse('Event not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(event));
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    console.error('Get event error:', error);
    return NextResponse.json(
      errorResponse('Failed to fetch event', error),
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();

    const { id } = await params;
    const body = await request.json();
    const { nama_event, tanggal, lokasi, deskripsi, aktif } = body;

    const updateData: Record<string, unknown> = {};
    if (nama_event !== undefined) updateData.nama_event = nama_event;
    if (tanggal !== undefined) updateData.tanggal = new Date(tanggal);
    if (lokasi !== undefined) updateData.lokasi = lokasi;
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi;
    if (aktif !== undefined) updateData.aktif = aktif;

    const event = await updateEvent(id, updateData);

    return NextResponse.json(
      successResponse(event, 'Event updated successfully')
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    console.error('Update event error:', error);
    return NextResponse.json(
      errorResponse('Failed to update event', error),
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();

    const { id } = await params;
    await deleteEvent(id);

    return NextResponse.json(
      successResponse(null, 'Event deleted successfully')
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    console.error('Delete event error:', error);
    return NextResponse.json(
      errorResponse('Failed to delete event', error),
      { status: 500 }
    );
  }
}
