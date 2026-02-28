/**
 * Peserta Service - Business logic for participant management
 */

import { prisma } from '@/lib/prisma';
import { Peserta, Prisma, TipePeserta } from '@prisma/client';
import { generateToken } from '@/lib/utils';

// Type for Peserta with Event relation
export type PesertaWithEvent = Prisma.PesertaGetPayload<{
  include: {
    event: true;
  };
}>;

export interface CreatePesertaInput {
  event_id: string;
  nama: string;
  nomor_telepon: string;
  alamat: string;
  tipe?: TipePeserta;
}

export interface BulkCreatePesertaInput {
  event_id: string;
  participants: Array<{
    nama: string;
    nomor_telepon: string;
    alamat: string;
  }>;
  tipe?: TipePeserta;
}

/**
 * Generate unique code for participant (e.g., MU-001, MU-002)
 */
async function generateKodeUnik(eventId: string): Promise<string> {
  const count = await prisma.peserta.count({
    where: { event_id: eventId },
  });
  
  const nextNumber = count + 1;
  return `MU-${nextNumber.toString().padStart(3, '0')}`;
}

/**
 * Create a single participant with auto-generated token and unique code
 */
export async function createPeserta(data: CreatePesertaInput): Promise<Peserta> {
  const kode_unik = await generateKodeUnik(data.event_id);
  
  return prisma.peserta.create({
    data: {
      ...data,
      kode_unik,
      token: generateToken(),
    },
  });
}

/**
 * Bulk create participants from Excel upload
 * Each participant gets a unique UUID token and sequential code (MU-001, MU-002, etc.)
 */
export async function bulkCreatePeserta(data: BulkCreatePesertaInput): Promise<number> {
  // Get current count to generate sequential codes
  const currentCount = await prisma.peserta.count({
    where: { event_id: data.event_id },
  });
  
  // Create participants one by one to ensure unique sequential codes
  let createdCount = 0;
  for (let i = 0; i < data.participants.length; i++) {
    const participant = data.participants[i];
    const sequenceNumber = currentCount + i + 1;
    const kode_unik = `MU-${sequenceNumber.toString().padStart(3, '0')}`;
    
    await prisma.peserta.create({
      data: {
        event_id: data.event_id,
        nama: participant.nama,
        nomor_telepon: participant.nomor_telepon,
        alamat: participant.alamat,
        tipe: data.tipe || TipePeserta.PESERTA,
        kode_unik,
        token: generateToken(),
      },
    });
    
    createdCount++;
  }

  return createdCount;
}

/**
 * Get all participants for an event
 */
export async function getPesertaByEvent(eventId: string, tipe?: TipePeserta): Promise<Peserta[]> {
  return prisma.peserta.findMany({
    where: { 
      event_id: eventId,
      ...(tipe && { tipe }),
    },
    orderBy: { created_at: 'desc' },
  });
}

/**
 * Get participant by ID
 */
export async function getPesertaById(id: string): Promise<Peserta | null> {
  return prisma.peserta.findUnique({
    where: { id },
    include: {
      event: true,
      pemenang: {
        include: {
          hadiah: true,
        },
      },
    },
  });
}

/**
 * Get participant by token
 */
export async function getPesertaByToken(token: string): Promise<PesertaWithEvent | null> {
  return prisma.peserta.findUnique({
    where: { token },
    include: {
      event: true,
    },
  });
}

/**
 * Get participant by kode_unik
 */
export async function getPesertaByKode(kode_unik: string): Promise<PesertaWithEvent | null> {
  return prisma.peserta.findUnique({
    where: { kode_unik },
    include: {
      event: true,
    },
  });
}

/**
 * Mark participant as attended (when QR is scanned)
 */
export async function markAttendance(token: string): Promise<Peserta> {
  return prisma.peserta.update({
    where: { token },
    data: { status_hadir: true },
  });
}

/**
 * Get attended participants for an event (eligible for lottery)
 */
export async function getAttendedPeserta(eventId: string): Promise<Peserta[]> {
  return prisma.peserta.findMany({
    where: {
      event_id: eventId,
      status_hadir: true,
    },
  });
}

/**
 * Get eligible participants for lottery (attended and not won yet)
 */
export async function getEligiblePeserta(eventId: string, tipe?: TipePeserta): Promise<Peserta[]> {
  return prisma.peserta.findMany({
    where: {
      event_id: eventId,
      status_hadir: true,
      sudah_menang: false,
      ...(tipe && { tipe }),
    },
  });
}

/**
 * Update participant
 */
export async function updatePeserta(
  id: string,
  data: Partial<CreatePesertaInput>
): Promise<Peserta> {
  return prisma.peserta.update({
    where: { id },
    data,
  });
}

/**
 * Delete participant
 */
export async function deletePeserta(id: string): Promise<Peserta> {
  return prisma.peserta.delete({
    where: { id },
  });
}

/**
 * Get participant statistics for an event
 */
export async function getPesertaStats(eventId: string, tipe?: TipePeserta) {
  const total = await prisma.peserta.count({
    where: { 
      event_id: eventId,
      ...(tipe && { tipe }),
    },
  });

  const attended = await prisma.peserta.count({
    where: {
      event_id: eventId,
      status_hadir: true,
      ...(tipe && { tipe }),
    },
  });

  const winners = await prisma.peserta.count({
    where: {
      event_id: eventId,
      sudah_menang: true,
      ...(tipe && { tipe }),
    },
  });

  const eligible = await prisma.peserta.count({
    where: {
      event_id: eventId,
      status_hadir: true,
      sudah_menang: false,
      ...(tipe && { tipe }),
    },
  });

  return {
    total,
    attended,
    winners,
    eligible,
  };
}

/**
 * Delete all participants for an event
 */
export async function deleteAllPesertaByEvent(eventId: string): Promise<number> {
  const result = await prisma.peserta.deleteMany({
    where: { event_id: eventId },
  });

  return result.count;
}
