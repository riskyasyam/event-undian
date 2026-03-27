/**
 * WhatsApp Blast API Route
 * POST /api/blast-wa - Process batch WhatsApp blast to participants
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { sendWablasMessage, buildParticipantMessage, sleep } from '@/lib/wablas';
import QRCode from 'qrcode';

// Increase serverless execution budget (supported in Next.js route handlers)
export const maxDuration = 60;

const BATCH_SIZE = Number(process.env.WABLAS_BATCH_SIZE || '5');
const DELAY_PER_MESSAGE = Number(process.env.WABLAS_DELAY_MS || '500');

type BlastDetailLog = {
  peserta_id: string;
  kode_unik: string;
  nama: string;
  phone: string;
  status: 'SENT' | 'FAILED';
  error?: string;
  processed_at: string;
};

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { event_id } = body;

    if (!event_id) {
      return NextResponse.json(
        errorResponse('event_id is required'),
        { status: 400 }
      );
    }

    // Get event details
    const event = await prisma.event.findUnique({
      where: { id: event_id },
    });

    if (!event) {
      return NextResponse.json(
        errorResponse('Event not found'),
        { status: 404 }
      );
    }

    // Get batch of pending participants (max 50) - only PESERTA type
    const pendingPeserta = await prisma.peserta.findMany({
      where: {
        event_id: event_id,
        wa_status: 'PENDING',
        tipe: 'PESERTA', // Only send to PESERTA (milad participants), not JAMAAH
      },
      take: BATCH_SIZE,
      orderBy: {
        created_at: 'asc', // FIFO: send to oldest registrations first
      },
    });

    if (pendingPeserta.length === 0) {
      // Count remaining to verify
      const remaining = await prisma.peserta.count({
        where: {
          event_id: event_id,
          wa_status: 'PENDING',
          tipe: 'PESERTA',
        },
      });

      return NextResponse.json(
        successResponse(
          {
            processed: 0,
            remaining: remaining,
            message: 'No pending participants to process',
          },
          'All messages have been sent'
        )
      );
    }

    // Process each participant sequentially (NOT parallel)
    let successCount = 0;
    let failCount = 0;
    const detailLogs: BlastDetailLog[] = [];

    for (const peserta of pendingPeserta) {
      try {
        // 1. Update status to PROCESSING
        await prisma.peserta.update({
          where: { id: peserta.id },
          data: { wa_status: 'PROCESSING' },
        });

        // 2. Generate QR code if not exists (same format as manual "Generate QR")
        let qrCodeUrl = peserta.qr_code_url;
        if (!qrCodeUrl) {
          qrCodeUrl = await QRCode.toDataURL(peserta.kode_unik, {
            width: 400,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });

          // Persist so future blasts reuse the exact same QR image bytes.
          await prisma.peserta.update({
            where: { id: peserta.id },
            data: { qr_code_url: qrCodeUrl },
          });
        }

        // 3. Build message
        const message = buildParticipantMessage(
          {
            nama: peserta.nama,
            kode_unik: peserta.kode_unik,
            qr_code_url: qrCodeUrl,
          },
          event.nama_event,
          event.tanggal,
          event.lokasi
        );

        // 4. Send via Wablas with QR image media
        const waResult = await sendWablasMessage({
          phone: peserta.nomor_telepon,
          message: message,
          image: qrCodeUrl || undefined,
        });

        if (waResult.success) {
          // Success: update to SENT
          await prisma.peserta.update({
            where: { id: peserta.id },
            data: {
              wa_status: 'SENT',
              wa_sent_at: new Date(),
              wa_error: null, // Clear previous error if any
            },
          });

          detailLogs.push({
            peserta_id: peserta.id,
            kode_unik: peserta.kode_unik,
            nama: peserta.nama,
            phone: peserta.nomor_telepon,
            status: 'SENT',
            processed_at: new Date().toISOString(),
          });

          successCount++;
        } else {
          console.error('Wablas failed for participant:', {
            pesertaId: peserta.id,
            kode_unik: peserta.kode_unik,
            phone: peserta.nomor_telepon,
            error: waResult.error,
          });

          // Failed: update to FAILED with error message
          await prisma.peserta.update({
            where: { id: peserta.id },
            data: {
              wa_status: 'FAILED',
              wa_error: waResult.error || 'Unknown error',
            },
          });

          detailLogs.push({
            peserta_id: peserta.id,
            kode_unik: peserta.kode_unik,
            nama: peserta.nama,
            phone: peserta.nomor_telepon,
            status: 'FAILED',
            error: waResult.error || 'Unknown error',
            processed_at: new Date().toISOString(),
          });

          failCount++;
        }

        // 5. Delay before next message (safety)
        await sleep(DELAY_PER_MESSAGE);

      } catch (error) {
        // Handle individual participant error
        console.error(`Error processing peserta ${peserta.kode_unik}:`, error);
        
        await prisma.peserta.update({
          where: { id: peserta.id },
          data: {
            wa_status: 'FAILED',
            wa_error: error instanceof Error ? error.message : 'Processing error',
          },
        });

        detailLogs.push({
          peserta_id: peserta.id,
          kode_unik: peserta.kode_unik,
          nama: peserta.nama,
          phone: peserta.nomor_telepon,
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Processing error',
          processed_at: new Date().toISOString(),
        });

        failCount++;

        // Continue to next participant even if this one failed
        await sleep(DELAY_PER_MESSAGE);
      }
    }

    // Count remaining pending
    const remainingCount = await prisma.peserta.count({
      where: {
        event_id: event_id,
        wa_status: 'PENDING',
        tipe: 'PESERTA',
      },
    });

    // Get overall stats (only for PESERTA type)
    const stats = {
      total_sent: await prisma.peserta.count({
        where: { event_id: event_id, wa_status: 'SENT', tipe: 'PESERTA' },
      }),
      total_failed: await prisma.peserta.count({
        where: { event_id: event_id, wa_status: 'FAILED', tipe: 'PESERTA' },
      }),
      total_pending: remainingCount,
    };

    return NextResponse.json(
      successResponse(
        {
          processed: successCount + failCount,
          success: successCount,
          failed: failCount,
          remaining: remainingCount,
          stats: stats,
          details: detailLogs,
          meta: {
            batch_size: BATCH_SIZE,
            delay_ms: DELAY_PER_MESSAGE,
            processed_at: new Date().toISOString(),
          },
        },
        `Processed ${successCount + failCount} messages. ${successCount} sent, ${failCount} failed.`
      )
    );

  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    console.error('WhatsApp blast error:', error);
    return NextResponse.json(
      errorResponse('Failed to process WhatsApp blast', error),
      { status: 500 }
    );
  }
}
