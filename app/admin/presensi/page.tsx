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
  status_hadir?: boolean;
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
  const ITEMS_PER_PAGE = 10;
  const PESERTA_MODAL_PAGE_SIZE = 12;
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [presensiList, setPresensiList] = useState<PresensiItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [totalPresensi, setTotalPresensi] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [presensiSearchInput, setPresensiSearchInput] = useState('');
  const [presensiSearchQuery, setPresensiSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resettingPresensi, setResettingPresensi] = useState(false);
  const [markingAllPresensi, setMarkingAllPresensi] = useState(false);
  const [showPesertaModal, setShowPesertaModal] = useState(false);
  const [pesertaModalPage, setPesertaModalPage] = useState(1);
  const [pesertaModalSearchInput, setPesertaModalSearchInput] = useState('');
  const [pesertaModalSearchQuery, setPesertaModalSearchQuery] = useState('');
  const [pesertaModalLoading, setPesertaModalLoading] = useState(false);
  const [pesertaModalList, setPesertaModalList] = useState<Peserta[]>([]);
  const [pesertaModalTotal, setPesertaModalTotal] = useState(0);
  const [pesertaModalTotalPages, setPesertaModalTotalPages] = useState(1);
  const [selectedPesertaList, setSelectedPesertaList] = useState<Peserta[]>([]);
  const [bulkPresensiSubmitting, setBulkPresensiSubmitting] = useState(false);
  
  // Form states
  const [kodePeserta, setKodePeserta] = useState('');
  const [metode, setMetode] = useState<'manual' | 'qrcode'>('manual');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [scanModal, setScanModal] = useState<{
    open: boolean;
    mode: 'loading' | 'success' | 'error';
    message: string;
  }>({
    open: false,
    mode: 'loading',
    message: '',
  });

  useEffect(() => {
    fetchMainEvent();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      setCurrentPage(1);
      setPresensiSearchInput('');
      setPresensiSearchQuery('');
    }
  }, [selectedEvent?.id]);

  useEffect(() => {
    if (selectedEvent) {
      fetchPresensi();
    }
  }, [selectedEvent, currentPage, presensiSearchQuery]);

  useEffect(() => {
    if (!showPesertaModal || !selectedEvent) return;

    const fetchPesertaModal = async () => {
      setPesertaModalLoading(true);

      try {
        const query = new URLSearchParams({
          page: String(pesertaModalPage),
          pageSize: String(PESERTA_MODAL_PAGE_SIZE),
          filter: 'all',
          tipe: 'PESERTA',
        });

        const trimmedSearch = pesertaModalSearchQuery.trim();
        if (trimmedSearch) {
          query.set('search', trimmedSearch);
        }

        const response = await fetch(`/api/peserta/event/${selectedEvent.id}?${query.toString()}`);
        const data = await response.json();

        if (data.success) {
          setPesertaModalList(data.data.participants || []);
          setPesertaModalTotal(data.data.pagination?.total || 0);
          setPesertaModalTotalPages(data.data.pagination?.totalPages || 1);
        } else {
          setPesertaModalList([]);
          setPesertaModalTotal(0);
          setPesertaModalTotalPages(1);
          setErrorMessage(data.error || 'Gagal mengambil daftar peserta');
        }
      } catch (error) {
        console.error('Failed to fetch peserta modal:', error);
        setPesertaModalList([]);
        setPesertaModalTotal(0);
        setPesertaModalTotalPages(1);
        setErrorMessage('Gagal mengambil daftar peserta');
      } finally {
        setPesertaModalLoading(false);
      }
    };

    fetchPesertaModal();
  }, [showPesertaModal, selectedEvent, pesertaModalPage, pesertaModalSearchQuery]);

  useEffect(() => {
    setSelectedPesertaList([]);
    setPesertaModalPage(1);
    setPesertaModalSearchInput('');
    setPesertaModalSearchQuery('');
    setShowPesertaModal(false);
  }, [selectedEvent?.id]);

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
      const query = new URLSearchParams({
        page: String(currentPage),
        pageSize: String(ITEMS_PER_PAGE),
      });

      const trimmedSearch = presensiSearchQuery.trim();
      if (trimmedSearch) {
        query.set('search', trimmedSearch);
      }

      const response = await fetch(`/api/presensi/event/${selectedEvent.id}?${query.toString()}`);
      const data = await response.json();

      if (data.success) {
        setPresensiList(data.data.presensi);
        setStats(data.data.stats);
        setTotalPresensi(data.data.total_presensi || 0);
        setTotalPages(data.data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch presensi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchPresensi = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setPresensiSearchQuery(presensiSearchInput.trim());
  };

  const handleResetSearchPresensi = () => {
    setPresensiSearchInput('');
    setPresensiSearchQuery('');
    setCurrentPage(1);
  };

  const handleSubmitPresensi = async (
    kode?: string,
    options?: {
      showPopupOnSuccess?: boolean;
      showScanModal?: boolean;
    }
  ) => {
    const kodePesertaToSubmit = kode || kodePeserta.trim();
    
    if (!kodePesertaToSubmit) {
      setErrorMessage('Kode peserta harus diisi');
      return;
    }

    // Prevent double detection - set processing flag
    setIsProcessing(true);

    // Show loading modal immediately if scanning
    if (options?.showScanModal) {
      setScanModal({
        open: true,
        mode: 'loading',
        message: 'Mendeteksi QR peserta...',
      });
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const startTime = Date.now();
    const minDelay = 1000; // Minimum 1 second to show loading modal

    try {
      const data = await submitPresensiRequest(kodePesertaToSubmit, metode);
      
      // Ensure minimum delay so loading modal is visible
      const elapsed = Date.now() - startTime;
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }

      const presensiData = data.data;

      if (data.success && presensiData) {
        const pesertaNama = presensiData.peserta.nama;
        setSuccessMessage(`✓ Presensi berhasil! ${pesertaNama} - ${presensiData.peserta.kode_unik}`);
        setKodePeserta('');
        fetchPresensi(); // Refresh list

        if (options?.showScanModal) {
          setScanModal({
            open: true,
            mode: 'success',
            message: `Berhasil presensi: ${pesertaNama}`,
          });
          
          // Auto-dismiss after 3 seconds, then allow new scan
          setTimeout(() => {
            setScanModal({ open: false, mode: 'loading', message: '' });
            setIsProcessing(false);
          }, 3000);
        }

        if (options?.showPopupOnSuccess) {
          alert(`Berhasil presensi: ${pesertaNama}`);
        }
        
        // Clear success message after 5 seconds (for manual input)
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        const errorMsg = data.error || 'QR tidak terdeteksi';
        setErrorMessage(`❌ ${errorMsg}`);

        if (options?.showScanModal) {
          setScanModal({
            open: true,
            mode: 'error',
            message: errorMsg,
          });
          
          // Auto-dismiss after 3 seconds, then allow new scan
          setTimeout(() => {
            setScanModal({ open: false, mode: 'loading', message: '' });
            setIsProcessing(false);
          }, 3000);
        }
        
        // Clear error message after 3 seconds (for manual input)
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Submit presensi error:', error);
      const errorMsg = 'Terjadi kesalahan saat mencatat presensi';
      setErrorMessage(`❌ ${errorMsg}`);

      if (options?.showScanModal) {
        setScanModal({
          open: true,
          mode: 'error',
          message: 'QR tidak terdeteksi',
        });
        
        // Auto-dismiss after 3 seconds, then allow new scan
        setTimeout(() => {
          setScanModal({ open: false, mode: 'loading', message: '' });
          setIsProcessing(false);
        }, 3000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const submitPresensiRequest = async (
    kodePesertaToSubmit: string,
    metodeSubmit: 'manual' | 'qrcode'
  ): Promise<{
    success: boolean;
    data?: {
      presensi_id: string;
      peserta: {
        id: string;
        kode_unik: string;
        nama: string;
        nomor_telepon?: string;
      };
      waktu_hadir: string;
    };
    error?: string;
  }> => {
    const response = await fetch('/api/presensi/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kode_peserta: kodePesertaToSubmit,
        metode: metodeSubmit,
      }),
    });

    return response.json();
  };

  const openPesertaModal = () => {
    setPesertaModalPage(1);
    setPesertaModalSearchInput('');
    setPesertaModalSearchQuery('');
    setShowPesertaModal(true);
  };

  const isPesertaSelected = (pesertaId: string) => {
    return selectedPesertaList.some((item) => item.id === pesertaId);
  };

  const togglePesertaSelection = (peserta: Peserta) => {
    if (peserta.status_hadir) return;

    setSelectedPesertaList((prev) => {
      const isSelected = prev.some((item) => item.id === peserta.id);
      if (isSelected) {
        return prev.filter((item) => item.id !== peserta.id);
      }

      return [...prev, peserta];
    });
  };

  const handleSelectVisiblePeserta = () => {
    const selectableParticipants = pesertaModalList.filter((item) => !item.status_hadir);

    setSelectedPesertaList((prev) => {
      const nextMap = new Map(prev.map((item) => [item.id, item]));

      selectableParticipants.forEach((participant) => {
        nextMap.set(participant.id, participant);
      });

      return Array.from(nextMap.values());
    });
  };

  const handleClearSelectedPeserta = () => {
    setSelectedPesertaList([]);
  };

  const handleSearchPeserta = (e: React.FormEvent) => {
    e.preventDefault();
    setPesertaModalPage(1);
    setPesertaModalSearchQuery(pesertaModalSearchInput.trim());
  };

  const handleBulkPresensi = async () => {
    if (!selectedEvent || bulkPresensiSubmitting || selectedPesertaList.length === 0) return;

    setBulkPresensiSubmitting(true);
    setIsProcessing(true);
    setErrorMessage('');
    setSuccessMessage('');

    const berhasil: string[] = [];
    const gagal: string[] = [];

    try {
      for (const peserta of selectedPesertaList) {
        try {
          const hasil = await submitPresensiRequest(peserta.kode_unik, 'manual');
          if (hasil.success && hasil.data) {
            berhasil.push(hasil.data.peserta.nama);
          } else {
            throw new Error(hasil.error || 'Gagal mencatat presensi');
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Gagal mencatat presensi';
          gagal.push(`${peserta.nama}: ${message}`);
        }
      }

      await fetchPresensi();

      if (gagal.length === 0) {
        setSuccessMessage(`✓ ${berhasil.length} peserta berhasil dipresensi manual.`);
        setSelectedPesertaList([]);
        setShowPesertaModal(false);
      } else if (berhasil.length > 0) {
        setSuccessMessage(`✓ ${berhasil.length} peserta berhasil dipresensi. ${gagal.length} peserta gagal.`);
      }

      if (gagal.length > 0) {
        setErrorMessage(`⚠ ${gagal.length} peserta belum berhasil dipresensi.`);
      }
    } catch (error) {
      console.error('Bulk presensi error:', error);
      setErrorMessage('Terjadi kesalahan saat memproses presensi terpilih');
    } finally {
      setBulkPresensiSubmitting(false);
      setIsProcessing(false);
    }
  };

  const handleQRScanSuccess = (decodedText: string) => {
    // Prevent double detection - only process if not already processing
    if (isProcessing) return;

    // Auto-submit when QR code is scanned
    setKodePeserta(decodedText);
    setMetode('qrcode');
    handleSubmitPresensi(decodedText, { showScanModal: true });
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

  const getVisiblePages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }

    if (currentPage >= totalPages - 2) {
      return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  };

  const exportToExcel = async () => {
    if (!selectedEvent) return;

    try {
      // Fetch all presensi records for this event (PESERTA only)
      const response = await fetch(`/api/presensi/event/${selectedEvent.id}?all=true`);
      const data = await response.json();

      if (!data.success) {
        alert('Gagal mengambil data presensi');
        return;
      }

      const allPresensi = [...data.data.presensi].sort((a: PresensiItem, b: PresensiItem) => {
        const getCodeNumber = (kode: string) => {
          const match = kode.match(/(\d+)/);
          return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
        };

        const aNumber = getCodeNumber(a.peserta.kode_unik || '');
        const bNumber = getCodeNumber(b.peserta.kode_unik || '');

        if (aNumber !== bNumber) {
          return aNumber - bNumber;
        }

        return (a.peserta.kode_unik || '').localeCompare(b.peserta.kode_unik || '');
      });

      // Create Excel data directly from all presensi records
      const excelData = allPresensi.map((presensi: PresensiItem) => {
        return {
          'Kode Peserta': presensi.peserta.kode_unik,
          'Nama': presensi.peserta.nama,
          'No. Telepon': presensi.peserta.nomor_telepon,
          'Alamat': presensi.peserta.alamat,
          'Status Presensi': 'Sudah Presensi',
          'Waktu Presensi': formatDate(presensi.waktu_hadir),
          'Metode': presensi.metode === 'qrcode' ? 'QR Code' : 'Manual',
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

  const handleResetPresensi = async () => {
    if (!selectedEvent || resettingPresensi) return;

    const confirmed = window.confirm(
      'Reset presensi akan menghapus data presensi dan mengembalikan semua peserta ke status belum hadir. Lanjutkan?'
    );
    if (!confirmed) return;

    const pin = window.prompt('Masukkan PIN reset presensi:');
    if (!pin) return;

    setResettingPresensi(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/presensi/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: selectedEvent.id,
          pin,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(`Gagal reset presensi: ${data.error || 'Unknown error'}`);
        return;
      }

      await fetchPresensi();
      setKodePeserta('');
      setErrorMessage('');
      setSuccessMessage('✓ Presensi berhasil direset. Semua peserta kembali belum hadir.');
      setTimeout(() => setSuccessMessage(''), 5000);
      setCurrentPage(1);
      alert('Presensi berhasil direset.');
    } catch (error) {
      console.error('Reset presensi error:', error);
      alert('Terjadi kesalahan saat reset presensi');
    } finally {
      setResettingPresensi(false);
    }
  };

  const handleMarkAllPresensi = async () => {
    if (!selectedEvent || markingAllPresensi) return;

    const confirmed = window.confirm(
      'Semua peserta akan dipresensikan manual untuk keperluan testing. Lanjutkan?'
    );
    if (!confirmed) return;

    const pin = window.prompt('Masukkan PIN presensi semua peserta:');
    if (!pin) return;

    setMarkingAllPresensi(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/presensi/mark-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: selectedEvent.id,
          pin,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(`Gagal presensi semua peserta: ${data.error || 'Unknown error'}`);
        return;
      }

      await fetchPresensi();
      setKodePeserta('');
      setErrorMessage('');
      setSuccessMessage('✓ Semua peserta berhasil dipresensikan manual untuk testing.');
      setTimeout(() => setSuccessMessage(''), 5000);
      setCurrentPage(1);
      alert('Semua peserta berhasil dipresensikan manual.');
    } catch (error) {
      console.error('Mark all presensi error:', error);
      alert('Terjadi kesalahan saat memproses presensi semua peserta');
    } finally {
      setMarkingAllPresensi(false);
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

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 flex-wrap">
        <button
          onClick={handleMarkAllPresensi}
          disabled={markingAllPresensi || resettingPresensi || submitting || isProcessing}
          className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
        >
          {markingAllPresensi ? 'Memproses...' : 'Presensi Semua (Testing)'}
        </button>
        <button
          onClick={handleResetPresensi}
          disabled={resettingPresensi || markingAllPresensi || submitting || isProcessing}
          className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
        >
          {resettingPresensi ? 'Mereset...' : 'Reset Presensi'}
        </button>
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

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={openPesertaModal}
                className="w-full sm:flex-1 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 font-semibold text-yellow-300 transition hover:bg-yellow-500/15"
              >
                Pilih dari Daftar Peserta
              </button>

              <button
                type="submit"
                disabled={submitting || !kodePeserta.trim()}
                className="w-full sm:flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition shadow-lg shadow-yellow-500/50 disabled:bg-gray-700 disabled:text-gray-500 disabled:shadow-none text-base md:text-lg"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Presensi Manual'}
              </button>
            </div>

            {selectedPesertaList.length > 0 && (
              <div className="rounded-2xl border border-yellow-500/20 bg-[#0f0f0f] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-yellow-400">{selectedPesertaList.length} peserta dipilih</div>
                    <div className="mt-1 text-xs text-gray-500">Klik presensi terpilih dari modal untuk memproses semua sekaligus.</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelectedPeserta}
                    className="text-xs font-semibold text-gray-300 transition hover:text-white"
                  >
                    Bersihkan
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedPesertaList.slice(0, 4).map((peserta) => (
                    <span
                      key={peserta.id}
                      className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-200"
                    >
                      <span className="font-semibold">{peserta.kode_unik}</span>
                      <span>{peserta.nama}</span>
                    </span>
                  ))}
                  {selectedPesertaList.length > 4 && (
                    <span className="inline-flex items-center rounded-full border border-yellow-500/20 bg-white/5 px-3 py-1 text-xs text-gray-300">
                      +{selectedPesertaList.length - 4} lainnya
                    </span>
                  )}
                </div>
              </div>
            )}
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
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-yellow-500">Daftar Presensi</h2>
              <p className="text-xs md:text-sm text-gray-400 mt-1">
                Menampilkan {presensiList.length} dari {totalPresensi} presensi{presensiSearchQuery ? ' (hasil pencarian)' : ''}
              </p>
            </div>
            <form onSubmit={handleSearchPresensi} className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={presensiSearchInput}
                onChange={(e) => setPresensiSearchInput(e.target.value)}
                placeholder="Cari nama, kode, atau telepon"
                className="w-full md:w-72 px-4 py-2.5 bg-[#0a0a0a] border border-yellow-500/20 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-500 text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition text-sm"
              >
                Cari
              </button>
              {presensiSearchQuery && (
                <button
                  type="button"
                  onClick={handleResetSearchPresensi}
                  className="px-4 py-2.5 bg-[#0a0a0a] border border-yellow-500/20 text-gray-300 hover:text-white hover:border-yellow-500/40 font-semibold rounded-lg transition text-sm"
                >
                  Reset
                </button>
              )}
            </form>
          </div>
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

        {totalPresensi > 0 && (
          <div className="px-4 md:px-6 py-4 border-t border-yellow-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs md:text-sm text-gray-400">
              Halaman {currentPage} dari {totalPages}
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-center">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-[#0a0a0a] text-gray-300 border border-yellow-500/20 rounded-lg hover:border-yellow-500/40 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Sebelumnya
              </button>

              {getVisiblePages().map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg text-sm font-semibold transition ${
                    currentPage === page
                      ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/40'
                      : 'bg-[#0a0a0a] text-gray-300 border border-yellow-500/20 hover:border-yellow-500/40'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-[#0a0a0a] text-gray-300 border border-yellow-500/20 rounded-lg hover:border-yellow-500/40 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {presensiList.length === 0 && (
        <div className="text-center py-12 bg-[#1a1a1a] rounded-lg border border-yellow-500/20">
          <p className="text-gray-400 text-lg">Belum ada presensi yang tercatat</p>
        </div>
      )}

      {scanModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div
            className={`w-full max-w-md rounded-xl border-2 p-8 text-center transition-all duration-300 ${
              scanModal.mode === 'loading'
                ? 'border-yellow-500/50 bg-[#1a1a1a] shadow-2xl shadow-yellow-500/20'
                : scanModal.mode === 'success'
                  ? 'border-green-500/50 bg-green-500/5 shadow-2xl shadow-green-500/30'
                  : 'border-red-500/50 bg-red-500/5 shadow-2xl shadow-red-500/30'
            }`}
          >
            {scanModal.mode === 'loading' && (
              <>
                <div className="mb-4 flex justify-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent"></div>
                </div>
                <h3 className="mb-2 text-xl font-bold text-yellow-400">Memproses</h3>
                <p className="text-sm text-gray-300">{scanModal.message}</p>
              </>
            )}

            {scanModal.mode === 'success' && (
              <>
                <div className="mb-4 text-6xl animate-bounce">✅</div>
                <h3 className="mb-2 text-2xl font-bold text-green-500">Presensi Berhasil</h3>
                <p className="text-base font-medium text-gray-200">{scanModal.message}</p>
                <button
                  onClick={() => {
                    setScanModal({ open: false, mode: 'loading', message: '' });
                    setIsProcessing(false);
                  }}
                  className="mt-6 w-full rounded-lg bg-green-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-green-700"
                >
                  OK
                </button>
              </>
            )}

            {scanModal.mode === 'error' && (
              <>
                <div className="mb-4 text-6xl">❌</div>
                <h3 className="mb-2 text-2xl font-bold text-red-500">Presensi Gagal</h3>
                <p className="text-base font-medium text-gray-200">{scanModal.message}</p>
                <button
                  onClick={() => {
                    setScanModal({ open: false, mode: 'loading', message: '' });
                    setIsProcessing(false);
                  }}
                  className="mt-6 w-full rounded-lg bg-red-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-red-700"
                >
                  OK
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showPesertaModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 px-4 py-6 backdrop-blur-sm">
          <div className="flex w-full max-w-3xl max-h-[calc(100vh-3rem)] flex-col overflow-hidden rounded-3xl border border-yellow-500/20 bg-linear-to-b from-[#1a1a1a] to-[#0b0b0b] shadow-2xl shadow-black/60">
            <div className="flex items-start justify-between gap-4 border-b border-yellow-500/15 px-5 py-4 md:px-6">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-yellow-500/70">Presensi Manual</div>
                <h3 className="mt-1 text-lg font-bold text-yellow-400 md:text-xl">Pilih Peserta</h3>
                <p className="mt-1 text-sm text-gray-400">Klik lebih dari satu peserta, lalu presensi sekaligus dari modal ini.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPesertaModal(false)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 transition hover:bg-white/10 hover:text-white"
              >
                Tutup
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 md:px-6">
              <div className="sticky top-0 z-10 -mx-5 mb-4 border-b border-yellow-500/10 bg-[#111111]/95 px-5 pb-4 pt-1 backdrop-blur-sm md:-mx-6 md:px-6">
                <form onSubmit={handleSearchPeserta} className="flex flex-col gap-3 md:flex-row">
                  <input
                    type="text"
                    value={pesertaModalSearchInput}
                    onChange={(e) => setPesertaModalSearchInput(e.target.value)}
                    placeholder="Cari nama, kode, nomor telepon, atau alamat"
                    className="w-full flex-1 rounded-xl border border-yellow-500/20 bg-[#0a0a0a] px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-yellow-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-600"
                  >
                    Cari
                  </button>
                </form>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
                  <div>{pesertaModalLoading ? 'Memuat data...' : `${pesertaModalTotal} peserta ditemukan`}</div>
                  <button
                    type="button"
                    onClick={handleSelectVisiblePeserta}
                    className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-xs font-semibold text-yellow-300 transition hover:bg-yellow-500/15"
                  >
                    Pilih Semua Halaman Ini
                  </button>
                </div>

                {pesertaModalLoading ? (
                  <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-yellow-500/20 bg-[#0a0a0a] text-gray-400">
                    Memuat daftar peserta...
                  </div>
                ) : pesertaModalList.filter((item) => !item.status_hadir).length === 0 ? (
                  <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-yellow-500/20 bg-[#0a0a0a] text-center text-gray-400">
                    Tidak ada peserta yang belum hadir
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pesertaModalList
                      .filter((item) => !item.status_hadir)
                      .map((peserta) => {
                        const selected = isPesertaSelected(peserta.id);

                        return (
                          <button
                            key={peserta.id}
                            type="button"
                            onClick={() => togglePesertaSelection(peserta)}
                            className={`w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
                              selected
                                ? 'border-yellow-500/60 bg-yellow-500/10 shadow-lg shadow-yellow-500/10'
                                : 'border-white/5 bg-[#0a0a0a] hover:border-yellow-500/30 hover:bg-yellow-500/5'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                                selected
                                  ? 'border-yellow-400 bg-yellow-400 text-black'
                                  : 'border-white/15 bg-white/5 text-gray-500'
                              }`}>
                                {selected ? '✓' : ''}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold text-white">{peserta.nama}</div>
                                    <div className="mt-1 text-sm text-gray-300">{peserta.nomor_telepon || '-'}</div>
                                  </div>
                                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                    selected
                                      ? 'border-yellow-500/30 bg-yellow-500/20 text-yellow-200'
                                      : 'border-gray-500/20 bg-gray-500/10 text-gray-400'
                                  }`}>
                                    {selected ? 'Dipilih' : 'Pilih'}
                                  </span>
                                </div>
                                <div className="mt-2 text-sm text-gray-400">
                                  {peserta.alamat || '-'}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                )}

                {pesertaModalTotalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setPesertaModalPage((prev) => Math.max(1, prev - 1))}
                      disabled={pesertaModalPage === 1 || pesertaModalLoading}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Sebelumnya
                    </button>

                    {Array.from({ length: pesertaModalTotalPages }, (_, index) => index + 1)
                      .slice(Math.max(0, pesertaModalPage - 3), Math.min(pesertaModalTotalPages, pesertaModalPage + 2))
                      .map((page) => (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setPesertaModalPage(page)}
                          className={`h-10 min-w-10 rounded-lg px-3 text-sm font-semibold transition ${
                            pesertaModalPage === page
                              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
                              : 'border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                    <button
                      type="button"
                      onClick={() => setPesertaModalPage((prev) => Math.min(pesertaModalTotalPages, prev + 1))}
                      disabled={pesertaModalPage === pesertaModalTotalPages || pesertaModalLoading}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Berikutnya
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-yellow-500/15 bg-[#101010]/95 px-5 py-4 md:px-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-yellow-400">{selectedPesertaList.length} peserta terpilih</div>
                    <div className="text-xs text-gray-500">Presensi manual hanya untuk peserta yang belum hadir.</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelectedPeserta}
                    className="text-xs font-semibold text-gray-400 transition hover:text-white"
                  >
                    Reset
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedPesertaList.slice(0, 4).map((peserta) => (
                    <span
                      key={peserta.id}
                      className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-200"
                    >
                      <span className="max-w-45 truncate font-semibold">{peserta.nama}</span>
                    </span>
                  ))}
                  {selectedPesertaList.length > 4 && (
                    <span className="inline-flex items-center rounded-full border border-yellow-500/20 bg-white/5 px-3 py-1 text-xs text-gray-300">
                      +{selectedPesertaList.length - 4} lainnya
                    </span>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={handleBulkPresensi}
                    disabled={bulkPresensiSubmitting || selectedPesertaList.length === 0}
                    className="w-full rounded-xl bg-yellow-500 px-4 py-3 text-sm font-bold text-black transition hover:bg-yellow-600 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
                  >
                    {bulkPresensiSubmitting ? 'Memproses...' : 'Presensi Terpilih'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPesertaModal(false)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white"
                  >
                    Tutup Modal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
