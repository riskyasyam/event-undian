/**
 * CONTOH PENGGUNAAN KOMPONEN SLOTUNDIAN
 * 
 * Contoh sederhana cara menggunakan SlotUndian di halaman Next.js
 */

'use client';

import { useState, useEffect } from 'react';
import SlotUndian from '@/components/SlotUndian';

interface Peserta {
  id: string;
  nama: string;
}

export default function ExampleSlotPage() {
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [currentWinner, setCurrentWinner] = useState<Peserta | null>(null);

  // Fetch peserta dari database
  useEffect(() => {
    fetchPeserta();
  }, []);

  const fetchPeserta = async () => {
    try {
      // Contoh fetch dari API
      const response = await fetch('/api/peserta/event/EVENT_ID');
      const data = await response.json();
      
      if (data.success) {
        // Filter peserta yang eligible (hadir dan belum menang)
        const eligible = data.data.participants.filter(
          (p: any) => p.status_hadir && !p.sudah_menang
        );
        setPeserta(eligible);
      }
    } catch (error) {
      console.error('Error fetching peserta:', error);
    }
  };

  const handleWinner = (winner: Peserta) => {
    console.log('Pemenang:', winner);
    setCurrentWinner(winner);
    
    // Lakukan action lain, misalnya:
    // - Simpan ke database
    // - Trigger confetti
    // - Show announcement
    // - dll
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-500 text-center mb-8">
          Undian Hadiah
        </h1>

        {/* Slot Machine */}
        <SlotUndian 
          peserta={peserta}
          onWinner={handleWinner}
        />

        {/* Display Current Winner */}
        {currentWinner && (
          <div className="mt-8 bg-yellow-500/10 border-2 border-yellow-500 rounded-xl p-6 text-center">
            <h2 className="text-xl text-yellow-500 mb-2">Pemenang Terakhir</h2>
            <p className="text-3xl font-bold text-white">{currentWinner.nama}</p>
          </div>
        )}

        {/* Debug Info */}
        <div className="mt-8 bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400">
            Total peserta eligible: <span className="text-white font-semibold">{peserta.length}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ================================
// CARA PENGGUNAAN SINGKAT
// ================================
// 
// 1. Import komponen:
//    import SlotUndian from '@/components/SlotUndian';
//
// 2. Siapkan data peserta:
//    const peserta = [
//      { id: '1', nama: 'Ahmad' },
//      { id: '2', nama: 'Budi' },
//      { id: '3', nama: 'Citra' },
//      // ... dst
//    ];
//
// 3. Gunakan komponen:
//    <SlotUndian 
//      peserta={peserta}
//      onWinner={(winner) => {
//        console.log('Pemenang:', winner);
//        // Handle winner logic
//      }}
//    />
//
// ================================
// FITUR KOMPONEN
// ================================
//
// ✓ Idle animation saat tidak spinning
// ✓ Smooth spin animation 4.5 detik
// ✓ Efek 3D dengan perspective & rotateX
// ✓ Highlight dinamis item tengah
// ✓ Scale & opacity berdasarkan jarak dari center
// ✓ Glow shadow pada item center
// ✓ Gradient overlay top & bottom
// ✓ Border highlight di tengah
// ✓ Winner announcement setelah spin
// ✓ Tombol disabled saat spinning
// ✓ Callback onWinner setelah selesai
//
// ================================
// PROPS
// ================================
//
// peserta: Array<{ id: string; nama: string }>
//   - Array peserta yang akan diundi
//   - Minimal 1 peserta
//
// onWinner?: (winner: Peserta) => void
//   - Callback dipanggil setelah spin selesai
//   - Menerima objek pemenang
//
