'use client';

/**
 * Admin Hadiah (Prizes) Management Page - Gold & Black Theme
 * /admin/hadiah
 */

import { useEffect, useState } from 'react';

interface Event {
  id: string;
  nama_event: string;
}

interface Hadiah {
  id: string;
  nama_hadiah: string;
  deskripsi?: string;
  gambar_url?: string;
  jumlah_pemenang: number;
  urutan: number;
  winnersDrawn: number;
  remainingSlots: number;
  isComplete: boolean;
}

export default function HadiahPage() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [prizes, setPrizes] = useState<Hadiah[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageBase64, setImageBase64] = useState<string>('');

  useEffect(() => {
    fetchMainEvent();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchPrizes();
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

  const fetchPrizes = async () => {
    if (!selectedEvent) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/hadiah/event/${selectedEvent.id}`);
      const data = await response.json();

      if (data.success) {
        setPrizes(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch prizes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file maksimal 2MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('File harus berupa gambar');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageBase64(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePrize = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/hadiah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: selectedEvent?.id,
          nama_hadiah: formData.get('nama_hadiah'),
          deskripsi: formData.get('deskripsi'),
          gambar_url: imageBase64 || null, // Use base64 image if uploaded
          jumlah_pemenang: parseInt(formData.get('jumlah_pemenang') as string),
          urutan: parseInt(formData.get('urutan') as string),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        setImagePreview('');
        setImageBase64('');
        fetchPrizes();
      } else {
        alert(`Gagal: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to create prize:', error);
      alert('Gagal membuat hadiah');
    }
  };

  const handleDeletePrize = async (id: string) => {
    if (!confirm('Yakin ingin menghapus hadiah ini?')) return;

    try {
      const response = await fetch(`/api/hadiah/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchPrizes();
      }
    } catch (error) {
      console.error('Failed to delete prize:', error);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-yellow-500">
            Kelola Hadiah
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage prizes for lottery</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={!selectedEvent}
          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black text-sm font-semibold rounded-lg transition shadow-lg shadow-yellow-500/50 disabled:bg-gray-700 disabled:text-gray-500 disabled:shadow-none"
        >
          + Tambah Hadiah
        </button>
      </div>

      {/* Prizes List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-3 border-yellow-500"></div>
          <p className="mt-4 text-gray-400 text-sm">Loading...</p>
        </div>
      ) : prizes.length === 0 ? (
        <div className="bg-[#1a1a1a] rounded-lg shadow-lg p-12 text-center border border-yellow-500/20">
          <div className="text-7xl mb-4">🎁</div>
          <h3 className="text-2xl font-bold text-yellow-500 mb-2">Belum Ada Hadiah</h3>
          <p className="text-gray-400 mb-6">Tambahkan hadiah untuk peserta yang beruntung</p>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!selectedEvent}
            className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition shadow-lg shadow-yellow-500/50 disabled:bg-gray-700 disabled:text-gray-500 disabled:shadow-none"
          >
            Tambah Hadiah Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prizes.map((prize) => (
            <div key={prize.id} className="bg-[#1a1a1a] rounded-lg shadow-lg overflow-hidden border border-yellow-500/20">
              {/* Prize Image */}
              {prize.gambar_url && (
                <div className="relative h-48 w-full overflow-hidden bg-[#0a0a0a]">
                  <img 
                    src={prize.gambar_url} 
                    alt={prize.nama_hadiah}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent"></div>
                </div>
              )}
              
              <div className="p-5">
                {/* Prize Order Badge */}
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-medium rounded-full border border-yellow-500/20">
                    Hadiah #{prize.urutan}
                  </span>
                  {prize.isComplete && (
                    <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded-full border border-green-500/20">
                      Selesai ✓
                    </span>
                  )}
                </div>

                {/* Prize Details */}
                <h3 className="text-lg font-bold text-yellow-500 mb-2">{prize.nama_hadiah}</h3>
                {prize.deskripsi && (
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{prize.deskripsi}</p>
                )}

                {/* Winners Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Pemenang</span>
                    <span className="font-bold text-yellow-500">
                      {prize.winnersDrawn} / {prize.jumlah_pemenang}
                    </span>
                  </div>
                  <div className="w-full bg-yellow-500/10 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-yellow-500 to-yellow-600 h-2.5 rounded-full transition-all shadow-sm shadow-yellow-500/50"
                      style={{
                        width: `${(prize.winnersDrawn / prize.jumlah_pemenang) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeletePrize(prize.id)}
                    className="flex-1 px-3 py-2 border border-red-500/20 bg-red-500/10 text-red-500 text-sm font-medium rounded-lg hover:bg-red-500/20 transition"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Prize Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] rounded-lg shadow-xl max-w-md w-full p-6 border border-yellow-500/20">
            <h2 className="text-xl font-bold text-yellow-500 mb-5">
              Tambah Hadiah Baru
            </h2>
            <form onSubmit={handleCreatePrize} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Nama Hadiah *
                </label>
                <input
                  type="text"
                  name="nama_hadiah"
                  required
                  className="w-full px-3 py-2 text-sm bg-[#0a0a0a] border border-yellow-500/20 text-yellow-500 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-500"
                  placeholder="e.g., Grand Prize - Paket Umroh"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  name="deskripsi"
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-[#0a0a0a] border border-yellow-500/20 text-yellow-500 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent placeholder-gray-500"
                  placeholder="Deskripsi hadiah..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Gambar Hadiah (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 text-sm bg-[#0a0a0a] border border-yellow-500/20 text-gray-400 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-600 file:cursor-pointer"
                />
                <p className="text-xs text-gray-500 mt-1">Upload gambar (Max 2MB, format: JPG, PNG, GIF)</p>
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="mt-3 relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg border border-yellow-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview('');
                        setImageBase64('');
                      }}
                      className="absolute top-2 right-2 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded transition"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Jumlah Pemenang *
                  </label>
                  <input
                    type="number"
                    name="jumlah_pemenang"
                    required
                    min="1"
                    defaultValue="1"
                    className="w-full px-3 py-2 text-sm bg-[#0a0a0a] border border-yellow-500/20 text-yellow-500 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Urutan Tampil *
                  </label>
                  <input
                    type="number"
                    name="urutan"
                    required
                    min="1"
                    defaultValue={prizes.length + 1}
                    className="w-full px-3 py-2 text-sm bg-[#0a0a0a] border border-yellow-500/20 text-yellow-500 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setImagePreview('');
                    setImageBase64('');
                  }}
                  className="flex-1 px-4 py-2 text-sm border border-yellow-500/20 text-gray-400 font-medium rounded-lg hover:bg-yellow-500/10 hover:text-yellow-500 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition shadow-lg shadow-yellow-500/50"
                >
                  Tambah Hadiah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
