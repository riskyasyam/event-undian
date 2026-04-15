'use client';

/**
 * SlotUndian - Vertical 3D Slot Machine Picker
 * 
 * Komponen slot machine vertical untuk undian dengan efek 3D
 * Menampilkan 6 nama sekaligus dengan item tengah sebagai posisi pemenang
 */

import { useEffect, useState } from 'react';

interface Peserta {
  id: string;
  nama: string;
  email?: string;
  nomor_telepon?: string;
}

interface SlotUndianProps {
  peserta: Peserta[];
  onWinner?: (winner: Peserta) => void;
  speed?: 'NORMAL' | 'DRAMATIS';  // Control spin speed & drama
}

export default function SlotUndian({ peserta, onWinner, speed = 'NORMAL' }: SlotUndianProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Peserta | null>(null);
  const [offset, setOffset] = useState(0);
  const [displayOffset, setDisplayOffset] = useState(0);

  // Konstanta
  const ITEM_HEIGHT = 60;
  const VISIBLE_ITEMS = 6;
  const CENTER_INDEX = 3;
  const BUFFER_ITEMS = 4;
  const VIRTUAL_ROWS = Math.max(
    peserta.length * 12,
    Math.floor(displayOffset / ITEM_HEIGHT) + VISIBLE_ITEMS + BUFFER_ITEMS + 20,
    120
  );
  
  // Durasi spin berdasarkan speed setting
  const SPIN_DURATION = speed === 'DRAMATIS' ? 12000 : 4500; // 12s untuk dramatis (4s cepat + 8s pelan), 4.5s untuk normal

  const getParticipantAt = (index: number) => {
    const normalizedIndex = ((index % peserta.length) + peserta.length) % peserta.length;
    return peserta[normalizedIndex];
  };

  // Handle tombol Mulai Undian
  const handleSpin = () => {
    if (isSpinning || peserta.length === 0) return;

    // Reset winner
    setWinner(null);
    setIsSpinning(true);

    // Tentukan pemenang random
    const randomIndex = Math.floor(Math.random() * peserta.length);
    const selectedWinner = peserta[randomIndex];

    // Cari posisi winner di virtual sequence yang sangat panjang
    const currentIndex = Math.floor(offset / ITEM_HEIGHT);
    const targetIndex = currentIndex + (peserta.length * 8) + randomIndex;

    // Hitung offset agar winner tepat di tengah (index 3)
    const targetOffset = (targetIndex * ITEM_HEIGHT) - (CENTER_INDEX * ITEM_HEIGHT);

    // Mulai animasi dengan requestAnimationFrame
    const startTime = Date.now();
    const startOffset = offset;

    const animate = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / SPIN_DURATION, 1);

      // Easing function berdasarkan speed mode
      let easedProgress: number;
      
      if (speed === 'DRAMATIS') {
        // Mode Dramatis: 4 detik cepat, 8 detik sangat pelan per tik
        // Total durasi: 12 detik
        // 4 detik pertama = 33% dari total 12 detik = mencapai 85% perjalanan
        // 8 detik terakhir = 67% dari total 12 detik = sisa 15% dengan efek per tik yang sangat pelan
        if (progress < 0.33) {
          // 33% pertama (4 detik): Cepat - mencapai 85% perjalanan
          const t = progress / 0.33;
          // Accelerate fast dengan ease-out quadratic
          easedProgress = (1 - Math.pow(1 - t, 1.5)) * 0.85;
        } else {
          // 67% terakhir (8 detik): Sangat pelan - sisa 15% dengan efek per tik
          const t = (progress - 0.33) / 0.67;
          // Extreme slow curve - seperti turun per tik satu per satu
          // Menggunakan exponential curve power 7 untuk efek sangat pelan dan menegangkan
          easedProgress = 0.85 + (0.15 * (1 - Math.pow(1 - t, 7)));
        }
      } else {
        // Mode Normal: ease-out cubic (standard)
        easedProgress = 1 - Math.pow(1 - progress, 3);
      }

      const currentOffset = startOffset + (targetOffset - startOffset) * easedProgress;

      setDisplayOffset(currentOffset);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animasi selesai
        setOffset(targetOffset);
        setDisplayOffset(targetOffset);
        setIsSpinning(false);
        setWinner(selectedWinner);
        
        // Callback
        if (onWinner) {
          onWinner(selectedWinner);
        }
      }
    };

    requestAnimationFrame(animate);
  };

  // Reset offset saat peserta berubah
  useEffect(() => {
    setOffset(0);
    setDisplayOffset(0);
    setWinner(null);
  }, [peserta]);

  // Hitung style untuk setiap item berdasarkan posisi relatif ke tengah
  const getItemStyle = (index: number) => {
    const itemPosition = (index * ITEM_HEIGHT) - displayOffset;
    const centerPosition = CENTER_INDEX * ITEM_HEIGHT;
    const distanceFromCenter = itemPosition - centerPosition;
    const normalizedDistance = Math.abs(distanceFromCenter) / ITEM_HEIGHT;

    // Skip calculation untuk items yang terlalu jauh (performance optimization)
    if (normalizedDistance > 4) {
      return {
        transform: 'translateY(0px) rotateX(0deg) scale(0.7)',
        opacity: 0.1,
        filter: 'brightness(1)',
        fontWeight: 400,
        textShadow: 'none',
      };
    }

    // Scale: 1.2 di tengah, mengecil semakin jauh
    const scale = Math.max(0.7, 1.2 - normalizedDistance * 0.15);

    // Opacity: 1 di tengah, mengecil semakin jauh
    const opacity = Math.max(0.2, 1 - normalizedDistance * 0.25);

    // RotateX: 0 di tengah, meningkat semakin jauh
    const rotateX = distanceFromCenter * 0.8;

    // Brightness untuk highlight winner
    const isCenterItem = Math.abs(normalizedDistance) < 0.1;

    return {
      transform: `translateY(0px) rotateX(${rotateX}deg) scale(${scale})`,
      opacity,
      filter: isCenterItem ? 'brightness(1.3)' : 'brightness(1)',
      fontWeight: isCenterItem ? 700 : 400,
      textShadow: isCenterItem ? '0 0 20px rgba(234, 179, 8, 0.8), 0 0 30px rgba(234, 179, 8, 0.4)' : 'none',
    };
  };

  if (peserta.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        Tidak ada peserta yang eligible untuk diundi
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Slot Machine Container */}
      <div className="relative mb-8">
        {/* Perspective Container */}
        <div 
          className="relative rounded-2xl overflow-hidden border-2 border-yellow-500/30 shadow-2xl"
          style={{
            height: `${VISIBLE_ITEMS * ITEM_HEIGHT}px`,
            perspective: '1000px',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          }}
        >
          {/* Gradient Overlay Top */}
          <div 
            className="absolute top-0 left-0 right-0 h-24 pointer-events-none z-20"
            style={{
              background: 'linear-gradient(to bottom, rgba(26, 26, 26, 1) 0%, rgba(26, 26, 26, 0) 100%)',
            }}
          />

          {/* Gradient Overlay Bottom */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-20"
            style={{
              background: 'linear-gradient(to top, rgba(26, 26, 26, 1) 0%, rgba(26, 26, 26, 0) 100%)',
            }}
          />

          {/* Center Highlight Border */}
          <div 
            className="absolute left-0 right-0 border-2 border-yellow-500 pointer-events-none z-20 shadow-lg"
            style={{
              top: `${CENTER_INDEX * ITEM_HEIGHT}px`,
              height: `${ITEM_HEIGHT}px`,
              boxShadow: '0 0 30px rgba(234, 179, 8, 0.5), inset 0 0 30px rgba(234, 179, 8, 0.1)',
            }}
          />

          {/* Slot Items */}
          <div
            className="relative"
            style={{
              height: `${VIRTUAL_ROWS * ITEM_HEIGHT}px`,
              transformStyle: 'preserve-3d',
              transform: `translateY(-${displayOffset}px)`,
              willChange: isSpinning ? 'transform' : 'auto',
            }}
          >
            {(() => {
              const startIndex = Math.max(0, Math.floor(displayOffset / ITEM_HEIGHT) - BUFFER_ITEMS);
              const endIndex = Math.ceil((displayOffset + (VISIBLE_ITEMS * ITEM_HEIGHT)) / ITEM_HEIGHT) + BUFFER_ITEMS;
              const visibleIndices = [];

              for (let index = startIndex; index <= endIndex; index++) {
                visibleIndices.push(index);
              }

              return visibleIndices.map((index) => {
                const participant = getParticipantAt(index);

                return (
              <div
                key={`${participant.id}-${index}`}
                className="absolute left-0 right-0 flex items-center justify-center px-6 transition-all duration-200"
                style={{
                  top: `${index * ITEM_HEIGHT}px`,
                  height: `${ITEM_HEIGHT}px`,
                  ...getItemStyle(index),
                }}
              >
                <div className="text-center">
                  <div className="text-lg text-white truncate max-w-full">
                    {participant.nama}
                  </div>
                </div>
              </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Control Button */}
      <div className="text-center mb-6">
        <button
          onClick={handleSpin}
          disabled={isSpinning || peserta.length === 0}
          className={`
            px-12 py-4 rounded-xl font-bold text-lg
            transition-all duration-300 transform
            ${isSpinning 
              ? 'bg-gray-600 cursor-not-allowed opacity-50' 
              : 'bg-linear-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/50'
            }
            text-black shadow-xl
          `}
        >
          {isSpinning ? 'Mengundi...' : 'Mulai Undian'}
        </button>
      </div>

      {/* Winner Announcement */}
      {winner && !isSpinning && (
        <div className="animate-fadeIn">
          <div className="bg-linear-to-br from-yellow-500/20 to-yellow-600/10 border-2 border-yellow-500 rounded-2xl p-8 text-center shadow-2xl">
            <div className="text-2xl text-yellow-500 mb-3 font-semibold">
              🎉 SELAMAT 🎉
            </div>
            <div className="text-5xl font-bold text-white mb-2 animate-pulse">
              {winner.nama}
            </div>
            <div className="text-xl text-gray-300 mt-4">
              Anda adalah pemenang!
            </div>
          </div>
        </div>
      )}

      {/* Inline Styles for Animations */}
      <style jsx>{`
        @keyframes idleFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .slot-idle {
          animation: idleFloat 2s ease-in-out infinite;
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
