'use client';

/**
 * Admin Lottery Draw Page - Gold & Black Theme with Countdown & Wheel
 * /admin/undi
 */

import { useEffect, useState } from 'react';
import type confettiType from 'canvas-confetti';

interface Event {
  id: string;
  nama_event: string;
  waktu_undian?: string;
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

interface Participant {
  id: string;
  nama: string;
  email?: string;
  nomor_telepon?: string;
}

interface Winner {
  id: string;
  drawn_at: Date;
  peserta: {
    id: string;
    nama: string;
    email?: string;
    nomor_telepon?: string;
  };
  hadiah: {
    nama_hadiah: string;
  };
}

export default function UndiPage() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [prizes, setPrizes] = useState<Hadiah[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [newWinners, setNewWinners] = useState<Winner[]>([]);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [lotteryOpen, setLotteryOpen] = useState(false);
  
  // Wheel states
  const [showWheel, setShowWheel] = useState(false);
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedPrizeForDraw, setSelectedPrizeForDraw] = useState<Hadiah | null>(null);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [totalEligible, setTotalEligible] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [selectedWinnerIndex, setSelectedWinnerIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchMainEvent();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchPrizes();
      fetchWinners();
      checkLotteryTime();
    }
  }, [selectedEvent]);

  // Countdown timer
  useEffect(() => {
    if (!selectedEvent?.waktu_undian) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const lotteryTime = new Date(selectedEvent.waktu_undian!).getTime();
      const distance = lotteryTime - now;

      if (distance < 0) {
        setLotteryOpen(true);
        setTimeLeft(null);
        clearInterval(timer);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedEvent]);

  const checkLotteryTime = () => {
    if (!selectedEvent?.waktu_undian) {
      setLotteryOpen(true);
      return;
    }
    const now = new Date().getTime();
    const lotteryTime = new Date(selectedEvent.waktu_undian).getTime();
    setLotteryOpen(now >= lotteryTime);
  };

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

    try {
      const response = await fetch(`/api/hadiah/event/${selectedEvent.id}`);
      const data = await response.json();

      if (data.success) {
        setPrizes(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch prizes:', error);
    }
  };

  const fetchWinners = async () => {
    if (!selectedEvent) return;

    try {
      const response = await fetch(`/api/lottery/winners/${selectedEvent.id}`);
      const data = await response.json();

      if (data.success) {
        setWinners(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch winners:', error);
    }
  };

  const fetchEligibleParticipants = async () => {
    if (!selectedEvent) return;

    setLoadingParticipants(true);
    try {
      const response = await fetch(`/api/peserta/event/${selectedEvent.id}`);
      const data = await response.json();

      if (data.success) {
        // Filter only eligible participants (attended and not yet won)
        const eligible = data.data.participants.filter(
          (p: Participant & { status_hadir: boolean; sudah_menang: boolean }) => 
            p.status_hadir && !p.sudah_menang
        );
        
        setTotalEligible(eligible.length);
        
        // Limit to 50 participants for smooth wheel animation
        // If more than 50, randomly sample 50
        let finalParticipants = eligible;
        if (eligible.length > 50) {
          finalParticipants = [...eligible].sort(() => Math.random() - 0.5).slice(0, 50);
        }
        
        setParticipants(finalParticipants);
      }
    } catch (error) {
      console.error('Failed to fetch participants:', error);
      setParticipants([]);
      setTotalEligible(0);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const triggerConfetti = async () => {
    // Dynamically import confetti to avoid SSR issues
    const confetti = (await import('canvas-confetti')).default;
    
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleOpenWheel = async (prize: Hadiah) => {
    setSelectedPrizeForDraw(prize);
    setParticipants([]); // Reset participants first
    setRotation(0); // Reset rotation
    setMustSpin(false); // Reset spin state
    setSelectedWinnerIndex(null); // Reset winner index
    await fetchEligibleParticipants();
    // Only show wheel after participants are fully loaded
    setTimeout(() => {
      setShowWheel(true);
    }, 100);
  };

  const handleSpinWheel = () => {
    if (participants.length === 0) {
      alert('Tidak ada peserta yang eligible untuk diundi!');
      return;
    }

    const newPrizeNumber = Math.floor(Math.random() * participants.length);
    setSelectedWinnerIndex(newPrizeNumber); // Save winner index
    setPrizeNumber(newPrizeNumber);
    setMustSpin(true);

    // Calculate rotation
    // Pointer is at top. Segments start from -90° (top) going clockwise.
    // To rotate segment i to align its middle with pointer:
    const segmentAngle = 360 / participants.length;
    const rotationToAlignWinner = -(newPrizeNumber + 0.5) * segmentAngle;
    
    // Add 5 full rotations (1800°) for dramatic spinning
    const finalRotation = 1800 + rotationToAlignWinner;
    
    console.log('🎯 Winner Index:', newPrizeNumber, 'Name:', participants[newPrizeNumber]?.nama);
    console.log('📐 Segment Angle:', segmentAngle.toFixed(2), '° - Final Rotation:', finalRotation.toFixed(2), '°');
    
    setRotation(finalRotation);

    // Auto stop after animation completes
    setTimeout(() => {
      setMustSpin(false);
      // Wait a moment then process the winner
      setTimeout(() => {
        handleStopSpinning();
      }, 500);
    }, 5000);
  };

  const handleStopSpinning = async () => {
    setDrawing(true);

    // Use selectedWinnerIndex to get the correct winner
    if (selectedWinnerIndex === null || selectedWinnerIndex < 0 || selectedWinnerIndex >= participants.length) {
      alert('Error: Index pemenang tidak valid!');
      setDrawing(false);
      setMustSpin(false);
      return;
    }
    
    const selectedWinner = participants[selectedWinnerIndex];
    
    console.log('🏆 Processing winner from index:', selectedWinnerIndex, '-', selectedWinner?.nama);

    if (!selectedWinner) {
      alert('Error: Pemenang tidak ditemukan!');
      setDrawing(false);
      setMustSpin(false);
      return;
    }

    try {
      // If total eligible > 50, use server-side random for fairness
      // Otherwise, use the selected participant from wheel
      const requestBody = totalEligible > 50 
        ? { hadiah_id: selectedPrizeForDraw?.id }
        : { hadiah_id: selectedPrizeForDraw?.id, peserta_id: selectedWinner.id };

      const response = await fetch('/api/lottery/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        // Trigger confetti
        triggerConfetti();

        // Transform winners data to match expected format
        const transformedWinners = data.data.winners.map((w: any) => ({
          id: w.pemenang?.id || w.id,
          drawn_at: w.pemenang?.drawn_at || new Date(),
          peserta: {
            id: w.id,
            nama: w.nama,
            email: w.email,
            nomor_telepon: w.nomor_telepon
          },
          hadiah: {
            nama_hadiah: selectedPrizeForDraw?.nama_hadiah || ''
          }
        }));

        console.log('✅ Winners saved:', transformedWinners.map((w: any) => w.peserta.nama).join(', '));

        // Show winner announcement
        setTimeout(() => {
          setNewWinners(transformedWinners);
          setShowWheel(false);
          setDrawing(false);
          fetchPrizes();
          fetchWinners();
          
          setTimeout(() => {
            setNewWinners([]);
          }, 5000);
        }, 1000);
      } else {
        alert(`Gagal mengundi: ${data.error}`);
        setDrawing(false);
        setMustSpin(false);
      }
    } catch (error) {
      console.error('Draw error:', error);
      alert('Gagal mengundi');
      setDrawing(false);
      setMustSpin(false);
    }
  };

  return (
    <div className="space-y-5">
      {selectedEvent && (
        <>
          {/* Event Banner Section */}
          <div className="relative bg-[#1a1a1a] rounded-xl shadow-lg overflow-hidden border border-yellow-500/20">
            {/* Banner Image */}
            <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
              <img 
                src="/images/contoh_banner.jpg" 
                alt="Event Banner" 
                className="w-full h-full object-cover"
              />
              {/* Overlay gradient for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            </div>
          </div>

          {/* Drawing Animation */}
          {animating && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="text-center">
                <div className="text-9xl mb-6 animate-spin">🎰</div>
                <div className="text-5xl font-bold text-yellow-500 mb-3">
                  Mengundi Pemenang...
                </div>
                <div className="text-xl text-gray-400">Mohon tunggu</div>
              </div>
            </div>
          )}

          {/* Wheel Modal */}
          {showWheel && selectedPrizeForDraw && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="max-w-2xl w-full bg-[#1a1a1a] rounded-2xl shadow-2xl border border-yellow-500/20 p-6 my-8 max-h-[90vh] overflow-y-auto">
                {/* Prize Info */}
                <div className="text-center mb-6">
                  {selectedPrizeForDraw.gambar_url && (
                    <img 
                      src={selectedPrizeForDraw.gambar_url} 
                      alt={selectedPrizeForDraw.nama_hadiah}
                      className="w-24 h-24 object-cover rounded-lg mx-auto mb-3 border-2 border-yellow-500"
                    />
                  )}
                  <h2 className="text-2xl font-bold text-yellow-500 mb-2">
                    {selectedPrizeForDraw.nama_hadiah}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {loadingParticipants ? 'Memuat peserta...' : (
                      <>
                        {totalEligible} peserta eligible
                        {totalEligible > 50 && (
                          <span className="block mt-1 text-amber-400 text-xs">
                            Roda menampilkan sample 50 peserta. Sistem akan random dari semua {totalEligible} peserta eligible secara adil.
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>

                {/* Loading State */}
                {loadingParticipants && (
                  <div className="flex justify-center items-center py-20">
                    <div className="text-center">
                      <div className="text-6xl mb-4 animate-spin">⏳</div>
                      <p className="text-gray-400">Memuat peserta eligible...</p>
                    </div>
                  </div>
                )}

                {/* No Participants */}
                {!loadingParticipants && participants.length === 0 && (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">😔</div>
                    <p className="text-gray-400 mb-6">Tidak ada peserta yang eligible untuk hadiah ini</p>
                    <button
                      onClick={() => setShowWheel(false)}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
                    >
                      Tutup
                    </button>
                  </div>
                )}

                {/* Wheel - Only show if participants are loaded and available */}
                {!loadingParticipants && participants.length > 0 && (
                  <>
                    {/* Circular Spinning Wheel */}
                    <div className="flex justify-center mb-6">
                      <div className="relative w-full max-w-[350px] aspect-square mx-auto">
                        {/* Pointer at top */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
                          <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-red-600 drop-shadow-2xl"></div>
                        </div>

                        {/* Wheel SVG */}
                        <svg 
                          viewBox="0 0 500 500" 
                          className="w-full h-full drop-shadow-2xl"
                          style={{
                            transform: `rotate(${rotation}deg)`,
                            transition: mustSpin ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
                          }}
                        >
                          {/* Outer circle border */}
                          <circle cx="250" cy="250" r="248" fill="none" stroke="#fbbf24" strokeWidth="4" />
                          
                          {participants.map((participant, index) => {
                            const segmentAngle = 360 / participants.length;
                            const startAngle = (index * segmentAngle - 90) * (Math.PI / 180);
                            const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180);
                            
                            const x1 = 250 + 245 * Math.cos(startAngle);
                            const y1 = 250 + 245 * Math.sin(startAngle);
                            const x2 = 250 + 245 * Math.cos(endAngle);
                            const y2 = 250 + 245 * Math.sin(endAngle);

                            const colors = ['#fbbf24', '#f59e0b', '#d97706'];
                            const isWinner = index === selectedWinnerIndex && !mustSpin;
                            const color = isWinner ? '#10b981' : colors[index % colors.length]; // Green if winner

                            const largeArcFlag = segmentAngle > 180 ? 1 : 0;
                            const pathData = `M 250 250 L ${x1} ${y1} A 245 245 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                            // Text position (middle of segment)
                            const textAngle = ((index + 0.5) * segmentAngle - 90) * (Math.PI / 180);
                            const textRadius = 170;
                            const textX = 250 + textRadius * Math.cos(textAngle);
                            const textY = 250 + textRadius * Math.sin(textAngle);
                            const textRotation = (index + 0.5) * segmentAngle;

                            return (
                              <g key={participant.id}>
                                {/* Segment */}
                                <path d={pathData} fill={color} stroke="#000" strokeWidth={isWinner ? "3" : "1"} />
                                
                                {/* Text */}
                                <text
                                  x={textX}
                                  y={textY}
                                  fill="#000"
                                  fontSize={isWinner ? "14" : "12"}
                                  fontWeight="bold"
                                  textAnchor="middle"
                                  dominantBaseline="middle"
                                  transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                                >
                                  {participant.nama.length > 15 ? participant.nama.substring(0, 15) + '...' : participant.nama}
                                </text>
                              </g>
                            );
                          })}

                          {/* Center circle */}
                          <circle cx="250" cy="250" r="40" fill="#000" stroke="#fbbf24" strokeWidth="4" />
                        </svg>

                        {/* Center emoji (non-rotating) */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl pointer-events-none z-10">
                          🎰
                        </div>
                      </div>
                    </div>

                    {/* Winner Name Display (shown when not spinning) */}
                    {!mustSpin && !drawing && selectedWinnerIndex !== null && participants[selectedWinnerIndex] && (
                      <div className="bg-yellow-500/10 border-2 border-yellow-500 rounded-lg p-4 mb-6 text-center">
                        <p className="text-sm text-gray-400 mb-1">Pemenang Terpilih:</p>
                        <p className="text-2xl font-bold text-yellow-500">{participants[selectedWinnerIndex].nama}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 justify-center flex-wrap">
                      <button
                        onClick={() => {
                          setShowWheel(false);
                          setRotation(0);
                          setPrizeNumber(0);
                        }}
                        disabled={mustSpin || drawing}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Tutup
                      </button>
                      
                      {/* Show spin button only when wheel is idle */}
                      {!mustSpin && !drawing && (
                        <button
                          onClick={handleSpinWheel}
                          disabled={participants.length === 0}
                          className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition shadow-lg shadow-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                        >
                          🎲 PUTAR RODA!
                        </button>
                      )}
                      
                      {/* Show confirming state when spinning or saving */}
                      {(mustSpin || drawing) && (
                        <button
                          disabled
                          className="px-8 py-3 bg-yellow-500/50 text-black font-bold rounded-lg text-lg cursor-not-allowed"
                        >
                          {drawing ? '💾 Menyimpan...' : '🔄 Berputar...'}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* New Winners Announcement */}
          {newWinners.length > 0 && !animating && (
            <div className="bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-500 rounded-xl shadow-lg shadow-yellow-500/50 p-8 text-center">
              <div className="text-7xl mb-4">🎉</div>
              <h2 className="text-4xl font-bold text-black mb-6">Selamat Kepada Pemenang!</h2>
              <div className="space-y-3">
                {newWinners.map((winner, index) => (
                  <div key={index} className="text-3xl font-bold text-black bg-black/10 rounded-lg py-3">
                    {winner.peserta.nama}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prizes Section */}
          {prizes.length > 0 && (
            <div>
              {/* Warning if lottery is not yet open */}
              {!lotteryOpen && timeLeft && (
                <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">⏰</div>
                    <div>
                      <p className="text-amber-500 font-semibold mb-1">Undian Belum Dibuka</p>
                      <p className="text-sm text-gray-400">
                        Waktu tersisa: {timeLeft.days}h {timeLeft.hours}j {timeLeft.minutes}m {timeLeft.seconds}d
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <h2 className="text-2xl font-bold text-yellow-500 mb-4">Daftar Hadiah</h2>
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
                      <div className="flex justify-between items-start mb-4">
                        <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-medium rounded-full border border-yellow-500/20">
                          Hadiah #{prize.urutan}
                        </span>
                        {prize.isComplete ? (
                          <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded-full border border-green-500/20">
                            Selesai ✓
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-amber-500/10 text-amber-500 text-xs font-medium rounded-full border border-amber-500/20">
                            {prize.remainingSlots} tersisa
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-yellow-500 mb-2">{prize.nama_hadiah}</h3>
                      {prize.deskripsi && (
                        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{prize.deskripsi}</p>
                      )}

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Pemenang Terundi</span>
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

                      <button
                        onClick={() => handleOpenWheel(prize)}
                        disabled={prize.isComplete || drawing}
                        className="w-full px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-black text-sm font-semibold rounded-lg transition disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/50 disabled:shadow-none"
                      >
                        {prize.isComplete ? 'Semua Pemenang Terundi' : `Undi Pemenang`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Winners List */}
          {winners.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-yellow-500 mb-4">Daftar Semua Pemenang</h2>
              <div className="bg-[#1a1a1a] rounded-lg shadow-lg overflow-hidden border border-yellow-500/20">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-yellow-500/10">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-yellow-500 uppercase tracking-wider">Nama Pemenang</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-yellow-500 uppercase tracking-wider">Hadiah</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-yellow-500 uppercase tracking-wider">Kontak</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-yellow-500 uppercase tracking-wider">Waktu Undi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-yellow-500/20">
                      {winners.map((winner) => (
                        <tr key={winner.id} className="hover:bg-yellow-500/5 transition">
                          <td className="px-6 py-4 text-sm font-medium text-yellow-500">
                            {winner.peserta.nama}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {winner.hadiah.nama_hadiah}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {winner.peserta.email || winner.peserta.nomor_telepon || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {new Date(winner.drawn_at).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {prizes.length === 0 && (
            <div className="bg-[#1a1a1a] rounded-lg shadow-lg p-12 text-center border border-yellow-500/20">
              <div className="text-7xl mb-4">🎁</div>
              <h3 className="text-2xl font-bold text-yellow-500 mb-2">Belum Ada Hadiah</h3>
              <p className="text-gray-400 mb-6">Tambahkan hadiah terlebih dahulu sebelum mengundi</p>
              <a
                href={`/admin/hadiah?event=${selectedEvent.id}`}
                className="inline-block px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition shadow-lg shadow-yellow-500/50"
              >
                Kelola Hadiah
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
