'use client';

/**
 * Admin WhatsApp Blast Page - Gold & Black Theme
 * /admin/blast-wa
 */

import { useEffect, useState } from 'react';

interface Event {
  id: string;
  nama_event: string;
}

interface BlastStats {
  total_sent: number;
  total_failed: number;
  total_pending: number;
}

interface BlastResult {
  processed: number;
  success: number;
  failed: number;
  remaining: number;
  stats: BlastStats;
}

interface BlastLog {
  timestamp: string;
  batch: number;
  processed: number;
  success: number;
  failed: number;
}

export default function BlastWAPage() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState<BlastStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [blasting, setBlasting] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [logs, setLogs] = useState<BlastLog[]>([]);
  const [batchCount, setBatchCount] = useState(0);

  useEffect(() => {
    fetchMainEvent();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchStats();
    }
  }, [selectedEvent]);

  const fetchMainEvent = async () => {
    try {
      const response = await fetch('/api/events');
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        setSelectedEvent(data.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch event:', error);
    }
  };

  const fetchStats = async () => {
    if (!selectedEvent) return;

    try {
      setLoading(true);

      // Count by status
      const response = await fetch(`/api/peserta/event/${selectedEvent.id}`);
      const data = await response.json();

      if (data.success) {
        // Calculate stats from participants
        const participants = data.data.participants;
        const statsCounted: BlastStats = {
          total_sent: participants.filter((p: any) => p.wa_status === 'SENT').length,
          total_failed: participants.filter((p: any) => p.wa_status === 'FAILED').length,
          total_pending: participants.filter((p: any) => 
            !p.wa_status || p.wa_status === 'PENDING' || p.wa_status === 'PROCESSING'
          ).length,
        };

        setStats(statsCounted);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlast = async () => {
    if (!selectedEvent) return;

    setBlasting(true);
    setProgress('Starting WhatsApp blast...');
    setLogs([]);
    setBatchCount(0);

    let batch = 1;
    let hasMore = true;

    try {
      while (hasMore) {
        setProgress(`Processing batch ${batch}...`);

        const response = await fetch('/api/blast-wa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_id: selectedEvent.id }),
        });

        const data: { success: boolean; data?: BlastResult } = await response.json();

        if (!data.success) {
          setProgress(`Error in batch ${batch}`);
          break;
        }

        const result = data.data!;

        // Add log
        const log: BlastLog = {
          timestamp: new Date().toLocaleTimeString('id-ID'),
          batch: batch,
          processed: result.processed,
          success: result.success,
          failed: result.failed,
        };
        setLogs((prev) => [...prev, log]);

        // Update stats
        setStats(result.stats);

        // Check if done
        if (result.remaining === 0 || result.processed === 0) {
          hasMore = false;
          setProgress(
            `✅ Blast completed! Sent: ${result.stats.total_sent}, Failed: ${result.stats.total_failed}`
          );
        } else {
          setProgress(
            `Batch ${batch} done. ${result.remaining} remaining...`
          );
          batch++;
          setBatchCount(batch);
        }
      }
    } catch (error) {
      console.error('Blast error:', error);
      setProgress('❌ Error occurred during blast');
    } finally {
      setBlasting(false);
      // Refresh final stats
      await fetchStats();
    }
  };

  const handleRetryFailed = async () => {
    if (!selectedEvent) return;

    try {
      // Reset FAILED back to PENDING
      const response = await fetch('/api/peserta/event/' + selectedEvent.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset_failed: true }),
      });

      if (response.ok) {
        alert('Failed messages reset to pending');
        await fetchStats();
      }
    } catch (error) {
      console.error('Failed to retry:', error);
      alert('Error resetting failed messages');
    }
  };

  const filteredLogs = logs.slice().reverse(); // Show newest first

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-yellow-400 mb-2">
          WhatsApp Blast
        </h1>
        <p className="text-gray-400">
          Kirim notifikasi WhatsApp ke semua peserta secara otomatis
        </p>
      </div>

      {/* Event Info */}
      {selectedEvent && (
        <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-yellow-600">
          <h2 className="text-xl font-semibold text-yellow-400">
            Event: {selectedEvent.nama_event}
          </h2>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-900 to-green-950 p-6 rounded-lg border border-green-600">
            <h3 className="text-sm text-green-300 mb-2">Terkirim</h3>
            <p className="text-4xl font-bold text-green-400">
              {stats.total_sent}
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-900 to-red-950 p-6 rounded-lg border border-red-600">
            <h3 className="text-sm text-red-300 mb-2">Gagal</h3>
            <p className="text-4xl font-bold text-red-400">
              {stats.total_failed}
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-900 to-yellow-950 p-6 rounded-lg border border-yellow-600">
            <h3 className="text-sm text-yellow-300 mb-2">Pending</h3>
            <p className="text-4xl font-bold text-yellow-400">
              {stats.total_pending}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-8 flex gap-4">
        <button
          onClick={handleBlast}
          disabled={blasting || !stats || stats.total_pending === 0}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            blasting || !stats || stats.total_pending === 0
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-yellow-600 hover:bg-yellow-700 text-black'
          }`}
        >
          {blasting ? '⏳ Processing...' : 'Mulai Blast WhatsApp'}
        </button>

        {stats && stats.total_failed > 0 && (
          <button
            onClick={handleRetryFailed}
            disabled={blasting}
            className="px-6 py-3 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white transition-all disabled:bg-gray-700 disabled:text-gray-400"
          >
            🔄 Retry Failed Messages
          </button>
        )}

        <button
          onClick={fetchStats}
          disabled={blasting}
          className="px-6 py-3 rounded-lg font-semibold bg-gray-700 hover:bg-gray-600 text-white transition-all disabled:opacity-50"
        >
          Refresh Stats
        </button>
      </div>

      {/* Progress Indicator */}
      {progress && (
        <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-yellow-600">
          <p className="text-yellow-400 font-semibold">{progress}</p>
          {blasting && (
            <div className="mt-3 w-full bg-gray-800 rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          )}
        </div>
      )}

      {/* Blast Logs */}
      {logs.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-yellow-400 mb-4">
            📋 Log Pengiriman
          </h2>
          <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800 border-b border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-yellow-400">Waktu</th>
                  <th className="px-4 py-3 text-left text-yellow-400">Batch</th>
                  <th className="px-4 py-3 text-left text-yellow-400">Diproses</th>
                  <th className="px-4 py-3 text-left text-yellow-400">Berhasil</th>
                  <th className="px-4 py-3 text-left text-yellow-400">Gagal</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-800 hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-300">{log.timestamp}</td>
                    <td className="px-4 py-3 text-gray-300">#{log.batch}</td>
                    <td className="px-4 py-3 text-gray-300">{log.processed}</td>
                    <td className="px-4 py-3 text-green-400">{log.success}</td>
                    <td className="px-4 py-3 text-red-400">{log.failed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Information Panel */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-yellow-400 mb-3">
          ℹ️ Informasi
        </h3>
        <ul className="space-y-2 text-gray-300 text-sm">
          <li>• Setiap batch memproses maksimal 50 peserta</li>
          <li>• Delay 2 detik antar pesan untuk menghindari rate limit</li>
          <li>• Proses berjalan otomatis sampai semua terkirim</li>
          <li>• Status FAILED dapat di-retry secara manual</li>
          <li>• QR code akan dikirim sebagai gambar di WhatsApp</li>
        </ul>
      </div>
    </div>
  );
}
