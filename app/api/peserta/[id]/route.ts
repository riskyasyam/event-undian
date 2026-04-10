/**
 * Update or get peserta by ID
 * PUT /api/peserta/[id] - Update peserta
 * GET /api/peserta/[id] - Get peserta details
 */

import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { nama, nomor_telepon, alamat, wa_status } = body;

    // Build update data
    const updateData: any = {};
    
    if (nama !== undefined) updateData.nama = nama;
    if (nomor_telepon !== undefined) updateData.nomor_telepon = nomor_telepon;
    if (alamat !== undefined) updateData.alamat = alamat;
    
    // If phone number changed, reset wa_status to PENDING
    if (nomor_telepon !== undefined) {
      // Verify current phone is different
      const currentPeserta = await prisma.peserta.findUnique({
        where: { id },
      });
      
      if (currentPeserta && currentPeserta.nomor_telepon !== nomor_telepon) {
        updateData.wa_status = 'PENDING';
      }
    }
    
    // Allow manual wa_status reset
    if (wa_status !== undefined && wa_status === 'PENDING') {
      updateData.wa_status = 'PENDING';
      updateData.wa_error = null;
      updateData.wa_sent_at = null;
    }

    // Allow manual mark as SENT for participants blasted outside the app
    if (wa_status !== undefined && wa_status === 'SENT') {
      updateData.wa_status = 'SENT';
      updateData.wa_error = null;
      updateData.wa_sent_at = new Date();
    }

    const peserta = await prisma.peserta.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Peserta berhasil diupdate',
        data: peserta,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Peserta update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengupdate peserta',
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const peserta = await prisma.peserta.findUnique({
      where: { id },
    });

    if (!peserta) {
      return NextResponse.json(
        {
          success: false,
          error: 'Peserta tidak ditemukan',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: peserta,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Peserta get error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil data peserta',
      },
      { status: 500 }
    );
  }
}
