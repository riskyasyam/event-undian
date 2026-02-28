/**
 * Scan Service - Business logic for QR code scanning and attendance tracking
 */

import { prisma } from '@/lib/prisma';
import { getPesertaByToken } from './peserta.service';
import { presensiByToken } from './presensi.service';

export interface ScanResult {
  success: boolean;
  message: string;
  peserta?: {
    id: string;
    nama: string;
    kode_unik: string;
    event: {
      nama_event: string;
      tanggal: Date;
      lokasi: string;
    };
    already_attended: boolean;
  };
}

/**
 * Process QR code scan and mark attendance
 */
export async function processScan(token: string): Promise<ScanResult> {
  try {
    // 1. Find participant by token
    const peserta = await getPesertaByToken(token);

    if (!peserta) {
      return {
        success: false,
        message: 'Invalid QR code. Participant not found.',
      };
    }

    // 2. Check if event is active
    if (!peserta.event.aktif) {
      return {
        success: false,
        message: 'This event is no longer active.',
      };
    }

    // 3. Check if already attended
    if (peserta.status_hadir) {
      return {
        success: true,
        message: 'You have already checked in for this event.',
        peserta: {
          id: peserta.id,
          nama: peserta.nama,
          kode_unik: peserta.kode_unik,
          event: {
            nama_event: peserta.event.nama_event,
            tanggal: peserta.event.tanggal,
            lokasi: peserta.event.lokasi,
          },
          already_attended: true,
        },
      };
    }

    // 4. Mark attendance via presensi
    try {
      await presensiByToken(token, peserta.event_id);
    } catch (error) {
      // If error is "already attended", it's ok
      if (error instanceof Error && !error.message.includes('sudah melakukan presensi')) {
        throw error;
      }
    }

    return {
      success: true,
      message: 'Check-in successful! You are now eligible for the lottery.',
      peserta: {
        id: peserta.id,
        nama: peserta.nama,
        kode_unik: peserta.kode_unik,
        event: {
          nama_event: peserta.event.nama_event,
          tanggal: peserta.event.tanggal,
          lokasi: peserta.event.lokasi,
        },
        already_attended: false,
      },
    };
  } catch (error) {
    console.error('Scan processing error:', error);
    return {
      success: false,
      message: 'An error occurred while processing your check-in. Please try again.',
    };
  }
}

/**
 * Validate token without marking attendance
 */
export async function validateToken(token: string): Promise<boolean> {
  const peserta = await getPesertaByToken(token);
  return peserta !== null && peserta.event.aktif;
}

/**
 * Get participant info from token
 */
export async function getParticipantInfo(token: string) {
  const peserta = await getPesertaByToken(token);

  if (!peserta) {
    return null;
  }

  return {
    kode_unik: peserta.kode_unik,
    nama: peserta.nama,
    nomor_telepon: peserta.nomor_telepon,
    alamat: peserta.alamat,
    status_hadir: peserta.status_hadir,
    sudah_menang: peserta.sudah_menang,
    event: {
      nama_event: peserta.event.nama_event,
      tanggal: peserta.event.tanggal,
      lokasi: peserta.event.lokasi,
    },
  };
}
