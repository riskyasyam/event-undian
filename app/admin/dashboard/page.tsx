'use client';

/**
 * Admin Dashboard Page - Gold & Black Theme
 * /admin/dashboard
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Event {
  id: string;
  nama_event: string;
  tanggal: Date;
  lokasi: string;
  waktu_undian?: Date;
  aktif: boolean;
  attendanceCount?: number;
  winnerCount?: number;
  _count?: {
    peserta: number;
    hadiah: number;
  };
}

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      const data = await response.json();

      if (data.success) {
        setEvents(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-3 border-yellow-500"></div>
        <p className="mt-4 text-gray-400 text-sm">Loading dashboard...</p>
      </div>
    );
  }

  // Auto-select first event
  const mainEvent = events[0];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-yellow-500">
          Dashboard - Milad MU Travel
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">Kelola sistem undian Milad MU Travel</p>
      </div>

      {/* Stats Overview - Quick Summary */}
      {mainEvent && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Total Peserta', value: mainEvent._count?.peserta || 0, icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) },
            { label: 'Total Hadiah', value: mainEvent._count?.hadiah || 0, icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            ) },
            { label: 'Status Event', value: mainEvent.aktif ? 'Aktif' : 'Tidak Aktif', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) },
          ].map((stat, idx) => (
            <div key={idx} className="bg-[#1a1a1a] rounded-lg p-4 border border-yellow-500/20 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-yellow-500/70">
                  {stat.icon}
                </div>
              </div>
              <div className="text-2xl font-bold text-yellow-500">{typeof stat.value === 'number' ? stat.value : stat.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Event Info Section */}
      {!mainEvent ? (
        <div className="text-center py-10 bg-[#1a1a1a] border border-yellow-500/20 rounded-lg">
          <svg className="w-12 h-12 mx-auto mb-3 text-yellow-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-400 text-sm">Event belum tersedia</p>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-yellow-500/20 rounded-lg p-5 shadow-lg">

          {/* Event Details */}
          <h3 className="text-xl font-bold text-yellow-500 mb-4">{mainEvent.nama_event}</h3>
          <div className="space-y-2 text-sm text-gray-400 mb-4">
            <p className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {mainEvent.lokasi}
            </p>
            <p className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(mainEvent.tanggal).toLocaleDateString('id-ID', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            {mainEvent.waktu_undian && (
              <p className="flex items-center gap-2 text-yellow-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Undian: {new Date(mainEvent.waktu_undian).toLocaleString('id-ID', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-yellow-500/20">
            <Link
              href={`/admin/peserta?event=${mainEvent.id}`}
              className="text-center px-3 py-2.5 bg-yellow-500/10 text-yellow-500 text-sm font-medium rounded-lg hover:bg-yellow-500/20 transition border border-yellow-500/20"
            >
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Peserta
            </Link>
            <Link
              href={`/admin/hadiah?event=${mainEvent.id}`}
              className="text-center px-3 py-2.5 bg-yellow-500/10 text-yellow-500 text-sm font-medium rounded-lg hover:bg-yellow-500/20 transition border border-yellow-500/20"
            >
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              Hadiah
            </Link>
            <Link
              href={`/admin/undi?event=${mainEvent.id}`}
              className="text-center px-3 py-2.5 bg-yellow-500 text-black text-sm font-semibold rounded-lg hover:bg-yellow-600 transition shadow-lg shadow-yellow-500/50"
            >
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Undian
            </Link>
          </div>
        </div>
      )}


    </div>
  );
}
