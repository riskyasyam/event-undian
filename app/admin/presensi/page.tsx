'use client';

/**
 * Admin Presensi Page - Gold & Black Theme (Mobile Responsive)
 * /admin/presensi
 */

import { useEffect, useState } from 'react';
import QRScanner from '@/components/QRScanner';
import * as XLSX from 'xlsx';

interface Event {
  id: string;
  nama_event: string;
}

interface Peserta {
  id: string;
  kode_unik: string;
  nama: string;
  nomor_telepon: string;
  alamat: string;
}

interface PresensiItem {
  id: string;
  waktu_hadir: string;
  metode: string;
  peserta: Peserta;
}

interface Stats {
  total_peserta: number;
  total_hadir: number;
  total_belum_hadir: number;
  persentase_hadir: number;
}

export default function PresensiPage() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [presensiList, setPresensiList] = useState<PresensiItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [kodePeserta, setKodePeserta] = useState('');
  const [metode, setMetode] = useState<'manual' | 'qrcode'>('manual');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchMainEvent();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchPresensi();
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

  const fetchPresensi = async () => {
    if (!selectedEvent) return;

    try {
      const response = await fetch(`/api/presensi/event/${selectedEvent.id}`);
      const data = await response.json();

      if (data.success) {
        setPresensiList(data.data.presensi);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch presensi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPresensi = async (kode?: string) => {
    const kodePesertaToSubmit = kode || kodePeserta.trim();
    
    if (!kodePesertaToSubmit) {
      setErrorMessage('Kode peserta harus diisi');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/presensi/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kode_peserta: kodePesertaToSubmit,
          metode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(`✓ Presensi berhasil! ${data.data.peserta.nama} - ${data.data.peserta.kode_unik}`);
        setKodePeserta('');
        fetchPresensi(); // Refresh list
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setErrorMessage(data.error || 'Gagal mencatat presensi');
        
        // Clear error message after 3 seconds
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Submit presensi error:', error);
      setErrorMessage('Terjadi kesalahan saat mencatat presensi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQRScanSuccess = (decodedText: string) => {
    // Auto-submit when QR code is scanned
    setKodePeserta(decodedText);
    setMetode('qrcode');
    handleSubmitPresensi(decodedText);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmitPresensi();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportToExcel = async () => {
    if (!selectedEvent) return;

    try {
      // Fetch all peserta for this event
      const response = await fetch(`/api/peserta/event/${selectedEvent.id}`);
      const data = await response.json();

      if (!data.success) {
        alert('Gagal mengambil data peserta');
        return;
      }

      const allPeserta = data.data.participants;

      // Create Excel data with presensi status
      const excelData = allPeserta.map((peserta: any) => {
        // Find if this peserta has presensi
        const presensi = presensiList.find((p) => p.peserta.id === peserta.id);

        return {
          'Kode Peserta': peserta.kode_unik,
          'Nama': peserta.nama,
          'No. Telepon': peserta.nomor_telepon,
          'Alamat': peserta.alamat,
          'Status Presensi': presensi ? 'Sudah Presensi' : 'Belum Presensi',
          'Waktu Presensi': presensi ? formatDate(presensi.waktu_hadir) : '-',
          'Metode': presensi ? (presensi.metode === 'qrcode' ? 'QR Code' : 'Manual') : '-',
        };
      });

      // Create workbook
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      worksheet['!cols'] = [
        { wch: 12 }, // Kode Peserta
        { wch: 25 }, // Nama
        { wch: 15 }, // No. Telepon
        { wch: 50 }, // Alamat
        { wch: 18 }, // Status Presensi
        { wch: 20 }, // Waktu Presensi
        { wch: 12 }, // Metode
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Presensi');

      // Generate filename with event name and date
      const today = new Date().toISOString().split('T')[0];
      const filename = `Presensi_${selectedEvent.nama_event.replace(/\s+/g, '_')}_${today}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      alert(`✓ Excel berhasil didownload: ${filename}`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Gagal export Excel');
    }
  };

  if (loading || !selectedEvent) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-500"></div>
        <p className="mt-4 text-yellow-400 font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-yellow-500">
          Presensi Kehadiran
        </h1>
        <p className="text-gray-400 text-xs md:text-sm mt-1">Input kehadiran peserta acara {selectedEvent.nama_event}</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-[#1a1a1a] rounded-lg p-4 md:p-6 border border-yellow-500/20 shadow-lg">
            <div className="text-2xl md:text-4xl font-bold text-yellow-500">{stats.total_peserta}</div>
            <div className="text-xs md:text-sm text-gray-400 mt-1">Total Peserta</div>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-4 md:p-6 border border-yellow-500/20 shadow-lg">
            <div className="text-2xl md:text-4xl font-bold text-green-500">{stats.total_hadir}</div>
            <div className="text-xs md:text-sm text-gray-400 mt-1">Sudah Hadir</div>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-4 md:p-6 border border-yellow-500/20 shadow-lg">
            <div className="text-2xl md:text-4xl font-bold text-red-500">{stats.total_belum_hadir}</div>
            <div className="text-xs md:text-sm text-gray-400 mt-1">Belum Hadir</div>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-4 md:p-6 border border-yellow-500/20 shadow-lg">
            <div className="text-2xl md:text-4xl font-bold text-yellow-500">{stats.persentase_hadir}%</div>
            <div className="text-xs md:text-sm text-gray-400 mt-1">Persentase Hadir</div>
          </div>
        </div>
      )}

      {/* Export Excel Button */}
      <div className="flex justify-end">
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition shadow-lg shadow-green-600/50 text-sm md:text-base"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Excel
        </button>
      </div>

      {/* Input Presensi Form */}
      <div className="bg-[#1a1a1a] rounded-lg shadow-lg p-4 md:p-6 border border-yellow-500/20">
        <h2 className="text-lg md:text-xl font-bold text-yellow-500 mb-4">Input Presensi</h2>
        
        {/* Method Selection */}
        <div className="grid grid-cols-2 gap-2 md:gap-4 mb-6">
          <button
            onClick={() => setMetode('manual')}
            className={`py-2 md:py-3 px-3 md:px-6 rounded-lg font-semibold transition text-sm md:text-base ${
              metode === 'manual'
                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50'
                : 'bg-[#0a0a0a] text-gray-400 border border-yellow-500/20 hover:border-yellow-500/40'
            }`}
          >
            📝 Manual Input
          </button>
          <button
            onClick={() => setMetode('qrcode')}
            className={`py-2 md:py-3 px-3 md:px-6 rounded-lg font-semibold transition text-sm md:text-base ${
              metode === 'qrcode'
                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50'
                : 'bg-[#0a0a0a] text-gray-400 border border-yellow-500/20 hover:border-yellow-500/40'
            }`}
          >
            📷 Scan QR Code
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="p-3 md:p-4 bg-green-500/10 border border-green-500/20 rounded-lg mb-4 animate-pulse">
            <p className="text-green-500 font-semibold text-sm md:text-base">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3 md:p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
            <p className="text-red-500 font-semibold text-sm md:text-base">{errorMessage}</p>
          </div>
        )}

        {/* Manual Input Form */}
        {metode === 'manual' && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Masukkan Kode Peserta
              </label>
              <input
                type="text"
                value={kodePeserta}
                onChange={(e) => setKodePeserta(e.target.value.toUpperCase())}
                placeholder="Contoh: MU-001"
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-yellow-500/20 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-500 text-base md:text-lg font-mono"
                disabled={submitting}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                Format kode: MU-001, MU-002, dst.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || !kodePeserta.trim()}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition shadow-lg shadow-yellow-500/50 disabled:bg-gray-700 disabled:text-gray-500 disabled:shadow-none text-base md:text-lg"
            >
              {submitting ? 'Menyimpan...' : 'Simpan Presensi'}
            </button>
          </form>
        )}

        {/* QR Scanner */}
        {metode === 'qrcode' && (
          <div>
            <QRScanner
              onScanSuccess={handleQRScanSuccess}
              onScanError={(error) => setErrorMessage(error)}
            />
          </div>
        )}
      </div>

      {/* Recent Presensi List */}
      <div className="bg-[#1a1a1a] rounded-lg shadow-lg overflow-hidden border border-yellow-500/20">
        <div className="px-4 md:px-6 py-4 border-b border-yellow-500/20">
          <h2 className="text-lg md:text-xl font-bold text-yellow-500">Daftar Presensi Terbaru</h2>
          <p className="text-xs md:text-sm text-gray-400 mt-1">Total: {presensiList.length} presensi</p>
        </div>
        
        {/* Mobile View - Cards */}
        <div className="block md:hidden divide-y divide-yellow-500/20">
          {presensiList.map((item) => (
            <div key={item.id} className="p-4 hover:bg-[#0a0a0a] transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-sm font-bold text-yellow-500">{item.peserta.kode_unik}</div>
                  <div className="text-sm font-semibold text-white">{item.peserta.nama}</div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded border ${
                    item.metode === 'qrcode'
                      ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                  }`}
                >
                  {item.metode === 'qrcode' ? '📷 QR' : '📝 Manual'}
                </span>
              </div>
              <div className="text-xs text-gray-400">{item.peserta.nomor_telepon}</div>
              <div className="text-xs text-gray-500 mt-1">{formatDate(item.waktu_hadir)}</div>
            </div>
          ))}
        </div>

        {/* Desktop View - Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-yellow-500">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase">Waktu</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase">Kode</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase">Nama</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase">Telepon</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-black uppercase">Metode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-yellow-500/20">
              {presensiList.map((item) => (
                <tr key={item.id} className="hover:bg-[#0a0a0a] transition">
                  <td className="px-6 py-4 text-sm text-gray-300">{formatDate(item.waktu_hadir)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-yellow-500">{item.peserta.kode_unik}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-white">{item.peserta.nama}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{item.peserta.nomor_telepon}</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded border ${
                        item.metode === 'qrcode'
                          ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}
                    >
                      {item.metode === 'qrcode' ? 'QR Code' : 'Manual'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {presensiList.length === 0 && (
        <div className="text-center py-12 bg-[#1a1a1a] rounded-lg border border-yellow-500/20">
          <p className="text-gray-400 text-lg">Belum ada presensi yang tercatat</p>
        </div>
      )}
    </div>
  );
}
