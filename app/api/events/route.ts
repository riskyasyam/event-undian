/**
 * Events API Route
 * GET /api/events - Get all events
 * POST /api/events - Create new event
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getAllEvents, createEvent } from '@/services/event.service';
import { errorResponse, successResponse } from '@/lib/utils';

export async function GET() {
  try {
    await requireAuth();

    const events = await getAllEvents();

    return NextResponse.json(successResponse(events));
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    console.error('Get events error:', error);
    return NextResponse.json(
      errorResponse('Failed to fetch events', error),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { nama_event, tanggal, lokasi, deskripsi } = body;

    if (!nama_event || !tanggal || !lokasi) {
      return NextResponse.json(
        errorResponse('nama_event, tanggal, and lokasi are required'),
        { status: 400 }
      );
    }

    const event = await createEvent({
      nama_event,
      tanggal: new Date(tanggal),
      lokasi,
      deskripsi,
    });

    return NextResponse.json(
      successResponse(event, 'Event created successfully'),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    console.error('Create event error:', error);
    return NextResponse.json(
      errorResponse('Failed to create event', error),
      { status: 500 }
    );
  }
}
