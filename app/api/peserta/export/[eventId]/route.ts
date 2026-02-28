/**
 * Export Peserta Data API Route
 * GET /api/peserta/export/[eventId] - Export all participant data with QR codes as Excel
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { errorResponse } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { TipePeserta } from '@prisma/client';
import * as XLSX from 'xlsx';

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
    const tipe = searchParams.get('tipe') as TipePeserta | null;
    
    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        errorResponse('Event not found'),
        { status: 404 }
      );
    }

    // Get all participants for this event
    const participants = await prisma.peserta.findMany({
      where: { 
        event_id: eventId,
        ...(tipe && { tipe }),
      },
      orderBy: { kode_unik: 'asc' },
    });

    if (participants.length === 0) {
      return NextResponse.json(
        errorResponse(`Tidak ada ${tipe === 'JAMAAH' ? 'jamaah' : 'peserta'} untuk di-export`),
        { status: 404 }
      );
    }

    // Get base URL from request
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    // Prepare data for Excel
    const exportData = participants.map((p, index) => ({
      No: index + 1,
      'Kode Peserta': p.kode_unik,
      'Nama': p.nama,
      'Nomor Telepon': p.nomor_telepon,
      'Alamat': p.alamat,
      'Tipe': p.tipe,
      'URL Download QR Code': `${baseUrl}/api/qrcode/${p.kode_unik}`,
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, tipe === 'JAMAAH' ? 'Data Jamaah' : 'Data Peserta');

    // Set column widths for better readability
    worksheet['!cols'] = [
      { wch: 5 },  // No
      { wch: 15 }, // Kode Peserta
      { wch: 30 }, // Nama
      { wch: 15 }, // Nomor Telepon
      { wch: 40 }, // Alamat
      { wch: 10 }, // Tipe
      { wch: 50 }, // URL Download QR Code
    ];

    // Generate Excel buffer
    const buffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx' 
    });

    // Create filename with event name and date
    const dateStr = new Date().toISOString().split('T')[0];
    const label = tipe === 'JAMAAH' ? 'Jamaah' : 'Peserta';
    const filename = `${label}_${event.nama_event.replace(/\s+/g, '_')}_${dateStr}.xlsx`;

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    console.error('Export peserta error:', error);
    return NextResponse.json(
      errorResponse('Failed to export participants', error),
      { status: 500 }
    );
  }
}
