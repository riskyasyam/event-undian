/**
 * Peserta API Route
 * POST /api/peserta/upload - Upload participants from Excel
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { bulkCreatePeserta } from '@/services/peserta.service';
import { errorResponse, successResponse } from '@/lib/utils';
import { TipePeserta } from '@prisma/client';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const eventId = formData.get('event_id') as string;
    const tipe = (formData.get('tipe') as string) || 'PESERTA';

    if (!file) {
      return NextResponse.json(
        errorResponse('File is required'),
        { status: 400 }
      );
    }

    if (!eventId) {
      return NextResponse.json(
        errorResponse('event_id is required'),
        { status: 400 }
      );
    }

    // Read Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(sheet) as Array<{
      nama?: string;
      nomor_telepon?: string;
      alamat?: string;
    }>;

    if (data.length === 0) {
      return NextResponse.json(
        errorResponse('Excel file is empty'),
        { status: 400 }
      );
    }

    // Validate and sanitize data
    const participants = data
      .filter(row => 
        row.nama && row.nama.trim() !== '' &&
        row.nomor_telepon && row.nomor_telepon.trim() !== '' &&
        row.alamat && row.alamat.trim() !== ''
      )
      .map(row => ({
        nama: row.nama!.trim(),
        nomor_telepon: row.nomor_telepon!.trim(),
        alamat: row.alamat!.trim(),
      }));

    if (participants.length === 0) {
      return NextResponse.json(
        errorResponse('No valid participants found in Excel file'),
        { status: 400 }
      );
    }

    // Bulk create participants
    const count = await bulkCreatePeserta({
      event_id: eventId,
      participants,
      tipe: tipe as TipePeserta,
    });

    return NextResponse.json(
      successResponse(
        { count },
        `Successfully uploaded ${count} participants`
      ),
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    console.error('Upload participants error:', error);
    return NextResponse.json(
      errorResponse('Failed to upload participants', error),
      { status: 500 }
    );
  }
}
