'use client';

/**
 * Admin Peserta Management Page - Gold & Black Theme
 * /admin/peserta
 */

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

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
  token: string;
  qr_code_url?: string;
  status_hadir: boolean;
  sudah_menang: boolean;
  wa_status?: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';
  wa_sent_at?: string;
  wa_error?: string;
}

interface EditFormData {
  nama: string;
  nomor_telepon: string;
  alamat: string;
}

interface Stats {
  total: number;
  attended: number;
  winners: number;
  eligible: number;
}

export default function PesertaPage() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<Peserta[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'attended' | 'eligible'>('all');
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPeserta, setEditingPeserta] = useState<Peserta | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    nama: '',
    nomor_telepon: '',
    alamat: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchMainEvent();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchParticipants();
    }
  }, [selectedEvent]);

  const fetchMainEvent = async () => {
    try {
      const response = await fetch('/api/events');
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        // Auto-select first event (Milad MU Travel)
        setSelectedEvent(data.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch event:', error);
    }
  };

  const fetchParticipants = async () => {
    if (!selectedEvent) return;

    try {
      const response = await fetch(`/api/peserta/event/${selectedEvent.id}?tipe=PESERTA`);
      const data = await response.json();

      if (data.success) {
        setParticipants(data.data.participants);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (peserta: Peserta) => {
    setEditingPeserta(peserta);
    setEditFormData({
      nama: peserta.nama,
      nomor_telepon: peserta.nomor_telepon,
      alamat: peserta.alamat,
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingPeserta(null);
    setEditFormData({
      nama: '',
      nomor_telepon: '',
      alamat: '',
    });
  };

  const handleEditFormChange = (field: keyof EditFormData, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdatePeserta = async () => {
    if (!editingPeserta) return;

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/peserta/${editingPeserta.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setParticipants(prev =>
          prev.map(p =>
            p.id === editingPeserta.id
              ? {
                  ...p,
                  ...editFormData,
                  wa_status: editFormData.nomor_telepon !== editingPeserta.nomor_telepon 
                    ? 'PENDING' 
                    : p.wa_status,
                  wa_error: editFormData.nomor_telepon !== editingPeserta.nomor_telepon 
                    ? undefined 
                    : p.wa_error,
                  wa_sent_at: editFormData.nomor_telepon !== editingPeserta.nomor_telepon 
                    ? undefined 
                    : p.wa_sent_at,
                }
              : p
          )
        );
        alert('Peserta berhasil diupdate');
        closeEditModal();
      } else {
        alert(`Update gagal: ${data.error}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Update gagal');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetWAStatus = async (peserta: Peserta) => {
    if (!confirm(`Reset wa_status ${peserta.nama} ke PENDING?`)) return;

    try {
      const response = await fetch(`/api/peserta/${peserta.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wa_status: 'PENDING' }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setParticipants(prev =>
          prev.map(p =>
            p.id === peserta.id
              ? {
                  ...p,
                  wa_status: 'PENDING',
                  wa_error: undefined,
                  wa_sent_at: undefined,
                }
              : p
          )
        );
        alert('Status WA berhasil direset ke PENDING');
      } else {
        alert(`Reset gagal: ${data.error}`);
      }
    } catch (error) {
      console.error('Reset error:', error);
      alert('Reset gagal');
    }
  };

  const handleMarkWASent = async (peserta: Peserta) => {
    if (!confirm(`Tandai WA ${peserta.nama} sebagai SENT?`)) return;

    try {
      const response = await fetch(`/api/peserta/${peserta.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wa_status: 'SENT' }),
      });

      const data = await response.json();

      if (data.success) {
        setParticipants(prev =>
          prev.map(p =>
            p.id === peserta.id
              ? {
                  ...p,
                  wa_status: 'SENT',
                  wa_error: undefined,
                  wa_sent_at: new Date().toISOString(),
                }
              : p
          )
        );
        alert('Status WA berhasil ditandai sebagai SENT');
      } else {
        alert(`Update gagal: ${data.error}`);
      }
    } catch (error) {
      console.error('Mark sent error:', error);
      alert('Update gagal');
    }
  };

  const handleDeletePeserta = async (peserta: Peserta) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus peserta "${peserta.nama}"? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
      const response = await fetch(`/api/peserta/${peserta.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success) {
        setParticipants(prev =>
          prev.filter(p => p.id !== peserta.id)
        );
        // Update stats
        if (stats) {
          setStats({
            ...stats,
            total: stats.total - 1,
            attended: peserta.status_hadir ? stats.attended - 1 : stats.attended,
            eligible: peserta.status_hadir && !peserta.sudah_menang ? stats.eligible - 1 : stats.eligible,
          });
        }
        alert('Peserta berhasil dihapus');
      } else {
        alert(`Penghapusan gagal: ${data.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Penghapusan gagal');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedEvent) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('event_id', selectedEvent.id);
      formData.append('tipe', 'PESERTA');

      const response = await fetch('/api/peserta/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        alert(`Berhasil mengupload ${data.data.count} peserta`);
        setSelectedFile(null);
        fetchParticipants();
      } else {
        alert(`Upload gagal: ${data.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload gagal');
    } finally {
      setUploading(false);
    }
  };

  const downloadQRCode = async (peserta: Peserta) => {
    try {
      // Generate QR code if not exists
      if (!peserta.qr_code_url) {
        const response = await fetch('/api/qrcode/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ peserta_id: peserta.id }),
        });

        const data = await response.json();
        if (!data.success) {
          alert('Gagal generate QR code');
          return;
        }

        peserta.qr_code_url = data.data.qr_code_url;
      }

      // Download QR code
      if (peserta.qr_code_url) {
        const link = document.createElement('a');
        link.href = peserta.qr_code_url;
        link.download = `QR-${peserta.kode_unik}-${peserta.nama}.png`;
        link.click();
      }
    } catch (error) {
      console.error('QR generation error:', error);
      alert('Gagal generate QR code');
    }
  };

  const downloadAllQRCodes = async () => {
    for (const peserta of filteredParticipants) {
      await downloadQRCode(peserta);
      // Small delay to prevent overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const exportParticipantData = async () => {
    if (!selectedEvent) return;

    try {
      const response = await fetch(`/api/peserta/export/${selectedEvent.id}?tipe=PESERTA`);
      
      if (!response.ok) {
        alert('Gagal export data peserta');
        return;
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `Peserta_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      link.download = filename;
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Gagal export data peserta');
    }
  };

  const filteredParticipants = participants
    .filter(p => {
      if (filter === 'attended') return p.status_hadir;
      if (filter === 'eligible') return p.status_hadir && !p.sudah_menang;
      return true;
    })
    .filter(p => 
      p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.kode_unik.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.nomor_telepon?.includes(searchTerm) ||
      p.alamat?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading || !selectedEvent) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-500"></div>
        <p className="mt-4 text-yellow-400 font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-yellow-500">
          Kelola Peserta
        </h1>
        <p className="text-gray-400 text-sm mt-1">Manage event participants and QR codes</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-yellow-500/20 shadow-lg inline-block">
          <div className="text-5xl font-bold text-yellow-500 mb-2">{stats.total}</div>
          <div className="text-sm text-gray-400">Total Peserta Terdaftar</div>
        </div>
      )}

      {/* Upload Section */}
      <div className="bg-[#1a1a1a] rounded-lg shadow-lg p-6 border border-yellow-500/20">
        <h2 className="text-xl font-bold text-yellow-500 mb-4">Upload Peserta (Excel)</h2>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Pilih File Excel (.xlsx)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="w-full px-4 py-2 bg-[#0a0a0a] border border-yellow-500/20 text-white rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-yellow-500 file:text-black file:font-semibold hover:file:bg-yellow-600"
            />
            <p className="text-xs text-gray-500 mt-2">
              Kolom wajib: nama, nomor_telepon, alamat
            </p>
            <p className="text-xs text-gray-500">
              Format: Excel (.xlsx) dengan 3 kolom tersebut
            </p>
          </div>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition shadow-lg shadow-yellow-500/50 disabled:bg-gray-700 disabled:text-gray-500 disabled:shadow-none"
          >
            {uploading ? 'Mengupload...' : 'Upload'}
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-[#1a1a1a] rounded-lg shadow-lg p-6 border border-yellow-500/20">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cari berdasarkan kode, nama, telepon, atau alamat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-yellow-500/20 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === 'all' 
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50' 
                  : 'bg-[#0a0a0a] text-gray-400 border border-yellow-500/20 hover:border-yellow-500/40'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilter('attended')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === 'attended' 
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50' 
                  : 'bg-[#0a0a0a] text-gray-400 border border-yellow-500/20 hover:border-yellow-500/40'
              }`}
            >
              Hadir
            </button>
            <button
              onClick={() => setFilter('eligible')}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filter === 'eligible' 
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50' 
                  : 'bg-[#0a0a0a] text-gray-400 border border-yellow-500/20 hover:border-yellow-500/40'
              }`}
            >
              Layak
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {filteredParticipants.length > 0 && (
        <div className="flex justify-end gap-3">
          <button
            onClick={exportParticipantData}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition shadow-lg shadow-green-600/50"
          >
            Export Data Excel ({participants.length})
          </button>
          <button
            onClick={downloadAllQRCodes}
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition shadow-lg shadow-yellow-500/50"
          >
            Download Semua QR ({filteredParticipants.length})
          </button>
        </div>
      )}

      {/* Participants Table */}
      <div className="bg-[#1a1a1a] rounded-lg shadow-lg overflow-hidden border border-yellow-500/20">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-yellow-500">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase">Kode</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase">Nama</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase">Telepon</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase">Alamat</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-black uppercase">Status WA</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-black uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-yellow-500/20">
              {filteredParticipants.map((peserta) => (
                <tr key={peserta.id} className="hover:bg-[#0a0a0a] transition">
                  <td className="px-6 py-4 text-sm font-bold text-yellow-500">{peserta.kode_unik}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-white">{peserta.nama}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{peserta.nomor_telepon}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{peserta.alamat}</td>
                  <td className="px-6 py-4 text-center">
                    {!peserta.wa_status || peserta.wa_status === 'PENDING' ? (
                      <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">
                        PENDING
                      </span>
                    ) : peserta.wa_status === 'PROCESSING' ? (
                      <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40">
                        PROCESSING
                      </span>
                    ) : peserta.wa_status === 'SENT' ? (
                      <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400 border border-green-500/40" title={peserta.wa_sent_at ? `Sent at: ${new Date(peserta.wa_sent_at).toLocaleString('id-ID')}` : ''}>
                        SENT ✓
                      </span>
                    ) : peserta.wa_status === 'FAILED' ? (
                      <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/40" title={peserta.wa_error || 'Unknown error'}>
                        FAILED ✗
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-gray-500/20 text-gray-400 border border-gray-500/40">
                        N/A
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex gap-2 justify-center flex-wrap">
                      <button
                        onClick={() => downloadQRCode(peserta)}
                        className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-semibold rounded-lg hover:bg-yellow-500/20 transition border border-yellow-500/20"
                      >
                        {peserta.qr_code_url ? 'Download QR' : 'Generate QR'}
                      </button>
                      <button
                        onClick={() => openEditModal(peserta)}
                        className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-lg hover:bg-blue-500/20 transition border border-blue-500/20"
                      >
                        Edit
                      </button>
                      {(peserta.wa_status === 'PENDING' || peserta.wa_status === 'FAILED') && (
                        <button
                          onClick={() => handleMarkWASent(peserta)}
                          className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-semibold rounded-lg hover:bg-green-500/20 transition border border-green-500/20"
                        >
                          Mark SENT
                        </button>
                      )}
                      {peserta.wa_status === 'SENT' && (
                        <button
                          onClick={() => handleResetWAStatus(peserta)}
                          className="px-3 py-1 bg-orange-500/10 text-orange-400 text-xs font-semibold rounded-lg hover:bg-orange-500/20 transition border border-orange-500/20"
                        >
                          Reset WA
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePeserta(peserta)}
                        className="px-3 py-1 bg-red-500/10 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-500/20 transition border border-red-500/20"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredParticipants.length === 0 && (
        <div className="text-center py-12 bg-[#1a1a1a] rounded-lg border border-yellow-500/20">
          <p className="text-gray-400 text-lg">Tidak ada peserta ditemukan</p>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingPeserta && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-lg border border-yellow-500/20 shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-yellow-500 mb-4">Edit Peserta</h2>
            
            {/* Kode (Read-only) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Kode Peserta (Tidak bisa diubah)
              </label>
              <div className="px-4 py-2 bg-[#0a0a0a]/50 border border-yellow-500/20 text-yellow-500 font-semibold rounded-lg">
                {editingPeserta.kode_unik}
              </div>
            </div>

            {/* Nama */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Nama Peserta
              </label>
              <input
                type="text"
                value={editFormData.nama}
                onChange={(e) => handleEditFormChange('nama', e.target.value)}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-yellow-500/20 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            {/* Nomor Telepon */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Nomor Telepon
              </label>
              <input
                type="text"
                value={editFormData.nomor_telepon}
                onChange={(e) => handleEditFormChange('nomor_telepon', e.target.value)}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-yellow-500/20 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
              <p className="text-xs text-orange-400 mt-2">
                ℹ️ Jika nomor telepon diubah, status WA akan direset ke PENDING
              </p>
            </div>

            {/* Alamat */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Alamat
              </label>
              <textarea
                value={editFormData.alamat}
                onChange={(e) => handleEditFormChange('alamat', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-[#0a0a0a] border border-yellow-500/20 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={closeEditModal}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={handleUpdatePeserta}
                disabled={isUpdating}
                className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition disabled:bg-gray-700 disabled:text-gray-500 shadow-lg shadow-yellow-500/50"
              >
                {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
