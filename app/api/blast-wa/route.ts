/**
 * WhatsApp Blast API Route
 * POST /api/blast-wa - Process batch WhatsApp blast to participants
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { sendWablasMessage, buildParticipantMessage, sleep } from '@/lib/wablas';

const BATCH_SIZE = 50; // Max 50 peserta per batch
const DELAY_PER_MESSAGE = 2000; // 2 seconds delay per message

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

    // Get batch of pending participants (max 50)
    const pendingPeserta = await prisma.peserta.findMany({
      where: {
        event_id: event_id,
        wa_status: 'PENDING',
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

    for (const peserta of pendingPeserta) {
      try {
        // 1. Update status to PROCESSING
        await prisma.peserta.update({
          where: { id: peserta.id },
          data: { wa_status: 'PROCESSING' },
        });

        // 2. Generate QR code URL if not exists
        let qrCodeUrl = peserta.qr_code_url;
        if (!qrCodeUrl) {
          // Generate QR code first
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                          `${request.nextUrl.protocol}//${request.nextUrl.host}`;
          qrCodeUrl = `${baseUrl}/api/qrcode/${peserta.kode_unik}`;
        }

        // 3. Build message
        const message = buildParticipantMessage(
          {
            nama: peserta.nama,
            kode_unik: peserta.kode_unik,
            qr_code_url: qrCodeUrl,
          },
          event.nama_event
        );

        // 4. Send via Wablas (text only, no media)
        const waResult = await sendWablasMessage({
          phone: peserta.nomor_telepon,
          message: message,
          // image: qrCodeUrl, // Disabled - subscription doesn't support media
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
          successCount++;
        } else {
          // Failed: update to FAILED with error message
          await prisma.peserta.update({
            where: { id: peserta.id },
            data: {
              wa_status: 'FAILED',
              wa_error: waResult.error || 'Unknown error',
            },
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
      },
    });

    // Get overall stats
    const stats = {
      total_sent: await prisma.peserta.count({
        where: { event_id: event_id, wa_status: 'SENT' },
      }),
      total_failed: await prisma.peserta.count({
        where: { event_id: event_id, wa_status: 'FAILED' },
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
