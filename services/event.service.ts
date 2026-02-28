/**
 * Event Service - Business logic for event management
 */

import { prisma } from '@/lib/prisma';
import { Event } from '@prisma/client';

export interface CreateEventInput {
  nama_event: string;
  tanggal: Date;
  lokasi: string;
  deskripsi?: string;
}

export interface UpdateEventInput {
  nama_event?: string;
  tanggal?: Date;
  lokasi?: string;
  deskripsi?: string;
  aktif?: boolean;
}

/**
 * Create a new event
 */
export async function createEvent(data: CreateEventInput): Promise<Event> {
  return prisma.event.create({
    data,
  });
}

/**
 * Get all events
 */
export async function getAllEvents(): Promise<Event[]> {
  return prisma.event.findMany({
    orderBy: { tanggal: 'desc' },
  });
}

/**
 * Get active events only
 */
export async function getActiveEvents(): Promise<Event[]> {
  return prisma.event.findMany({
    where: { aktif: true },
    orderBy: { tanggal: 'desc' },
  });
}

/**
 * Get event by ID with related data
 */
export async function getEventById(id: string): Promise<Event | null> {
  return prisma.event.findUnique({
    where: { id },
  });
}

/**
 * Get event with full details including counts
 */
export async function getEventWithStats(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          peserta: true,
          hadiah: true,
        },
      },
    },
  });

  if (!event) {
    return null;
  }

  // Get attendance and winner counts
  const attendanceCount = await prisma.peserta.count({
    where: {
      event_id: id,
      status_hadir: true,
    },
  });

  const winnerCount = await prisma.pemenang.count({
    where: {
      peserta: {
        event_id: id,
      },
    },
  });

  return {
    ...event,
    attendanceCount,
    winnerCount,
  };
}

/**
 * Update event
 */
export async function updateEvent(id: string, data: UpdateEventInput): Promise<Event> {
  return prisma.event.update({
    where: { id },
    data,
  });
}

/**
 * Delete event (will cascade delete all related data)
 */
export async function deleteEvent(id: string): Promise<Event> {
  return prisma.event.delete({
    where: { id },
  });
}

/**
 * Set event as active/inactive
 */
export async function setEventActive(id: string, aktif: boolean): Promise<Event> {
  return prisma.event.update({
    where: { id },
    data: { aktif },
  });
}
