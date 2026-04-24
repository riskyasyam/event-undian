'use client';

/**
 * Admin Lottery Draw Page - Gold & Black Theme with Countdown & Slot Machine
 * /admin/undi
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import SlotUndian from '@/components/SlotUndian';
import * as XLSX from 'xlsx';

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
  tipe_peserta?: string;
  kecepatan_undian?: string;
  mode_undian?: 'SATU' | 'SEMUA';
  winnersDrawn: number;
  remainingSlots: number;
  isComplete: boolean;
}

interface Participant {
  id: string;
  nama: string;
  email?: string;
  nomor_telepon?: string;
  alamat?: string;
}

interface Winner {
  id: string;
  drawn_at: Date;
  peserta: {
    id: string;
    kode_unik?: string;
    nama: string;
    tipe?: string;
    email?: string;
    nomor_telepon?: string;
    alamat?: string;
  };
  hadiah: {
    nama_hadiah: string;
    tipe_peserta?: string;
  };
}

export default function UndiPage() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [prizes, setPrizes] = useState<Hadiah[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [newWinners, setNewWinners] = useState<Winner[]>([]);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [lotteryOpen, setLotteryOpen] = useState(false);
  
  // Slot Machine states
  const [showSlot, setShowSlot] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedPrizeForDraw, setSelectedPrizeForDraw] = useState<Hadiah | null>(null);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<Participant | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastWinner, setLastWinner] = useState<Participant | null>(null);
  const [batchWinners, setBatchWinners] = useState<Participant[]>([]);
  const [autoSpinSignal, setAutoSpinSignal] = useState(0);
  const [autoDrawingAll, setAutoDrawingAll] = useState(false);
  const [continuousSpinning, setContinuousSpinning] = useState(false);
  const [stopAtWinner, setStopAtWinner] = useState<Participant | null>(null);
  const [prizeRemainingSlots, setPrizeRemainingSlots] = useState<number>(0);
  const [resettingLottery, setResettingLottery] = useState(false);
  const [resettingPrizeId, setResettingPrizeId] = useState<string | null>(null);
  const [openingPrizeId, setOpeningPrizeId] = useState<string | null>(null);
  const liveWinnersScrollRef = useRef<HTMLDivElement | null>(null);
  const finalWinnersScrollRef = useRef<HTMLDivElement | null>(null);

  const groupedPrizes = useMemo(() => {
    const grouped = new Map<number, Hadiah[]>();

    for (const prize of prizes) {
      const key = Number(prize.urutan) || 0;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(prize);
    }

    return [...grouped.entries()].sort((a, b) => a[0] - b[0]);
  }, [prizes]);

  useEffect(() => {
    fetchMainEvent();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      const loadInitialUndianData = async () => {
        setInitialLoading(true);
        try {
          await Promise.all([fetchPrizes(), fetchWinners()]);
          checkLotteryTime();
        } finally {
          setInitialLoading(false);
        }
      };

      loadInitialUndianData();
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

  useEffect(() => {
    if (batchWinners.length === 0) return;

    if (!showSuccess && liveWinnersScrollRef.current) {
      liveWinnersScrollRef.current.scrollTop = liveWinnersScrollRef.current.scrollHeight;
    }

    if (showSuccess && finalWinnersScrollRef.current) {
      finalWinnersScrollRef.current.scrollTop = finalWinnersScrollRef.current.scrollHeight;
    }
  }, [batchWinners, showSuccess]);

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
      } else {
        setInitialLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch event:', error);
      setInitialLoading(false);
    }
  };

  const fetchPrizes = async () => {
    if (!selectedEvent) return;

    try {
      const response = await fetch(`/api/hadiah/event/${selectedEvent.id}?images=proxy`);
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
      const response = await fetch(`/api/lottery/winners/${selectedEvent.id}?limit=300`);
      const data = await response.json();

      if (data.success) {
        setWinners(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch winners:', error);
    }
  };

  const fetchEligibleParticipants = async (prize?: Hadiah) => {
    if (!selectedEvent) return;

    setLoadingParticipants(true);
    try {
      const tipe = prize?.tipe_peserta || 'PESERTA';
      const params = new URLSearchParams({
        tipe,
        forLottery: '1',
        pageSize: '5000',
      });

      const response = await fetch(`/api/peserta/event/${selectedEvent.id}?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setParticipants(data.data.participants || []);
      }
    } catch (error) {
      console.error('Failed to fetch participants:', error);
      setParticipants([]);
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

  const handleOpenSlot = async (prize: Hadiah) => {
    setOpeningPrizeId(prize.id);
    setSelectedPrizeForDraw(prize);
    setParticipants([]); // Reset participants first
    setSelectedWinner(null); // Reset winner
    setShowSuccess(false); // Reset success state
    setLastWinner(null); // Reset last winner
    setBatchWinners([]);
    setAutoSpinSignal(0);
    setAutoDrawingAll(false);
    setContinuousSpinning(false);
    setStopAtWinner(null);
    setPrizeRemainingSlots(prize.remainingSlots); // Set initial remaining slots
    await fetchEligibleParticipants(prize); // Pass prize to filter by type
    // Only show slot after participants are fully loaded
    setTimeout(() => {
      setShowSlot(true);
      setOpeningPrizeId(null);
    }, 100);
  };

  const drawSpecificWinner = async (winner: Participant) => {
    setSelectedWinner(winner);
    
    console.log('� Slot machine selected winner:', winner.nama, '| ID:', winner.id);

    // ALWAYS send peserta_id from slot machine winner
    // Slot machine sudah pilih winner secara fair dari displayed participants
    const requestBody = {
      hadiah_id: selectedPrizeForDraw?.id,
      peserta_id: winner.id,
    };

    console.log('📤 Sending to API:', requestBody);

    const response = await fetch('/api/lottery/draw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Gagal mengundi');
    }

    console.log('📥 API Response:', data.data.winners.map((w: any) => w.nama).join(', '));

    // Transform winners data to match expected format
    const transformedWinners = data.data.winners.map((w: any) => ({
      id: w.pemenang?.id || w.id,
      drawn_at: w.pemenang?.drawn_at || new Date(),
      peserta: {
        id: w.id,
        nama: w.nama,
        email: w.email,
        nomor_telepon: w.nomor_telepon,
        alamat: w.alamat,
      },
      hadiah: {
        nama_hadiah: selectedPrizeForDraw?.nama_hadiah || '',
      },
    }));

    console.log('✅ Winners saved:', transformedWinners.map((w: any) => w.peserta.nama).join(', '));

    return transformedWinners;
  };

  const handleSlotWinner = async (winner: Participant) => {
    setDrawing(true);

    try {
      const transformedWinners = await drawSpecificWinner(winner);

      // IMMEDIATELY remove pemenang dari local participants untuk mencegah race condition
      const winnerIds = new Set(transformedWinners.map((w: any) => w.peserta.id));
      setParticipants((prev) => prev.filter((p) => !winnerIds.has(p.id)));

      const newRemainingSlots = Math.max(0, prizeRemainingSlots - transformedWinners.length);
      setPrizeRemainingSlots(newRemainingSlots);

      // Use actual winner from API response
      const winnerPeserta = transformedWinners[0]?.peserta || null;
      setLastWinner(winnerPeserta);
      if (winnerPeserta) {
        setBatchWinners((prev) => [...prev, winnerPeserta]);
      }

      await Promise.all([fetchPrizes(), fetchWinners()]);

      // SATU mode atau pemenang terakhir: Trigger confetti dan tunjukkan success
      setAutoDrawingAll(false);
      setDrawing(false);
      triggerConfetti();
      setShowSuccess(true);
    } catch (error) {
      console.error('Draw error:', error);
      alert(error instanceof Error ? error.message : 'Gagal mengundi');
      setDrawing(false);
      setShowSuccess(false);
      setAutoDrawingAll(false);
    }
  };

  const handleUndiLagi = () => {
    setShowSuccess(false);
    setLastWinner(null);
    setSelectedWinner(null);
    // Participants & prizeRemainingSlots sudah di-update otomatis setelah undi
  };

  const handleStartAutoDraw = async () => {
    if (!selectedPrizeForDraw || drawing || autoDrawingAll || prizeRemainingSlots <= 0) return;

    setBatchWinners([]);
    setShowSuccess(false);
    setLastWinner(null);
    setStopAtWinner(null);
    setAutoDrawingAll(true);
    setContinuousSpinning(true);
    setDrawing(true);

    let workingParticipants = [...participants];
    let remainingSlots = prizeRemainingSlots;
    let finalWinner: Participant | null = null;

    try {
      while (remainingSlots > 0 && workingParticipants.length > 0) {
        const randomIndex = Math.floor(Math.random() * workingParticipants.length);
        const picked = workingParticipants[randomIndex];

        const transformedWinners = await drawSpecificWinner(picked);
        const winnerPeserta = transformedWinners[0]?.peserta || null;

        if (!winnerPeserta) {
          throw new Error('Data pemenang tidak valid');
        }

        finalWinner = winnerPeserta;
        setLastWinner(winnerPeserta);
        setBatchWinners((prev) => [...prev, winnerPeserta]);

        const nextRemainingSlots = Math.max(0, remainingSlots - transformedWinners.length);
        setPrizeRemainingSlots(nextRemainingSlots);

        const filteredParticipants = workingParticipants.filter((p) => p.id !== winnerPeserta.id);

        // Keep last winner in slot list so animation can stop exactly on that name.
        if (nextRemainingSlots > 0) {
          workingParticipants = filteredParticipants;
          setParticipants(filteredParticipants);
        }

        remainingSlots = nextRemainingSlots;
      }

      await Promise.all([fetchPrizes(), fetchWinners()]);

      if (finalWinner) {
        setStopAtWinner(finalWinner);
      }

      setContinuousSpinning(false);
      setAutoDrawingAll(false);
      setDrawing(false);

      if (finalWinner) {
        setTimeout(() => {
          triggerConfetti();
          setShowSuccess(true);
        }, 1200);
      }
    } catch (error) {
      console.error('Auto draw all error:', error);
      alert(error instanceof Error ? error.message : 'Gagal mengundi otomatis');
      setContinuousSpinning(false);
      setAutoDrawingAll(false);
      setDrawing(false);
      setShowSuccess(false);
    }
  };

  const handleSelesaiUndi = () => {
    setShowSlot(false);
    setShowSuccess(false);
    setLastWinner(null);
    setSelectedWinner(null);
    setBatchWinners([]);
    setAutoSpinSignal(0);
    setAutoDrawingAll(false);
    setContinuousSpinning(false);
    setStopAtWinner(null);
    setParticipants([]);
    setSelectedPrizeForDraw(null);
    setPrizeRemainingSlots(0);
  };

  const exportWinnersToExcel = () => {
    if (!selectedEvent) return;

    if (winners.length === 0) {
      alert('Belum ada data pemenang untuk diexport');
      return;
    }

    try {
      const excelData = winners.map((winner, index) => {
        const tipePesertaRaw = winner.peserta.tipe || winner.hadiah.tipe_peserta || '';
        const tipePeserta =
          tipePesertaRaw === 'JAMAAH'
            ? 'Jamaah'
            : tipePesertaRaw === 'PESERTA'
            ? 'Peserta'
            : '-';

        return {
          No: index + 1,
          'Kode Peserta': winner.peserta.kode_unik || '-',
          'Nama Pemenang': winner.peserta.nama,
          'Tipe Peserta': tipePeserta,
          'Nomor Telepon': winner.peserta.nomor_telepon || '-',
          Alamat: winner.peserta.alamat || '-',
          'Hadiah Dimenangkan': winner.hadiah.nama_hadiah,
          'Waktu Undi': new Date(winner.drawn_at).toLocaleString('id-ID'),
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      worksheet['!cols'] = [
        { wch: 6 },
        { wch: 14 },
        { wch: 28 },
        { wch: 14 },
        { wch: 18 },
        { wch: 36 },
        { wch: 28 },
        { wch: 24 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Pemenang Undian');

      const today = new Date().toISOString().split('T')[0];
      const filename = `Pemenang_${selectedEvent.nama_event.replace(/\s+/g, '_')}_${today}.xlsx`;
      XLSX.writeFile(workbook, filename);

      alert(`Export Excel berhasil: ${filename}`);
    } catch (error) {
      console.error('Export winners error:', error);
      alert('Gagal export data pemenang');
    }
  };

  const handleResetLottery = async () => {
    if (!selectedEvent || resettingLottery) return;

    const confirmed = window.confirm(
      'Reset undian akan menghapus semua pemenang dan mengembalikan semua kuota hadiah. Lanjutkan?'
    );

    if (!confirmed) return;

    const pin = window.prompt('Masukkan PIN reset undian:');
    if (!pin) return;

    setResettingLottery(true);
    try {
      const response = await fetch('/api/lottery/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: selectedEvent.id,
          pin,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(`Gagal reset undian: ${data.error || 'Unknown error'}`);
        return;
      }

      handleSelesaiUndi();
      setNewWinners([]);
      await Promise.all([fetchPrizes(), fetchWinners()]);
      alert('Undian berhasil direset. Semua peserta bisa diundi lagi.');
    } catch (error) {
      console.error('Reset lottery error:', error);
      alert('Terjadi kesalahan saat reset undian');
    } finally {
      setResettingLottery(false);
    }
  };

  const handleResetPrizeLottery = async (prize: Hadiah) => {
    if (!selectedEvent || resettingPrizeId) return;

    const confirmed = window.confirm(
      `Reset undian untuk hadiah \"${prize.nama_hadiah}\"? Pemenang hadiah ini akan dihapus dan bisa diundi ulang.`
    );
    if (!confirmed) return;

    const pin = window.prompt('Masukkan PIN reset hadiah:');
    if (!pin) return;

    setResettingPrizeId(prize.id);
    try {
      const response = await fetch('/api/lottery/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: selectedEvent.id,
          hadiah_id: prize.id,
          pin,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(`Gagal reset hadiah: ${data.error || 'Unknown error'}`);
        return;
      }

      if (selectedPrizeForDraw?.id === prize.id) {
        handleSelesaiUndi();
      }

      setNewWinners([]);
      await Promise.all([fetchPrizes(), fetchWinners()]);
      alert(`Undian hadiah \"${prize.nama_hadiah}\" berhasil direset.`);
    } catch (error) {
      console.error('Reset prize lottery error:', error);
      alert('Terjadi kesalahan saat reset hadiah');
    } finally {
      setResettingPrizeId(null);
    }
  };

  if (initialLoading || !selectedEvent) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-yellow-500"></div>
        <p className="mt-4 text-yellow-400 font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <>
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

          {/* Slot Machine Modal */}
          {showSlot && selectedPrizeForDraw && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="max-w-2xl w-full bg-[#1a1a1a] rounded-2xl shadow-2xl border border-yellow-500/20 p-6 my-8 max-h-[90vh] overflow-y-auto">
                {/* Prize Info */}
                <div className="text-center mb-6">
                  {selectedPrizeForDraw.gambar_url && (
                    <img 
                      src={selectedPrizeForDraw.gambar_url} 
                      alt={selectedPrizeForDraw.nama_hadiah}
                        loading="lazy"
                      className="w-24 h-24 object-cover rounded-lg mx-auto mb-3 border-2 border-yellow-500"
                    />
                  )}
                  <h2 className="text-2xl font-bold text-yellow-500 mb-2">
                    {selectedPrizeForDraw.nama_hadiah}
                  </h2>
                  <div className="flex justify-center mb-3">
                    <div className="flex gap-2 flex-wrap justify-center">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
                        selectedPrizeForDraw.tipe_peserta === 'JAMAAH' 
                          ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' 
                          : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                        Undian untuk: {selectedPrizeForDraw.tipe_peserta === 'JAMAAH' ? 'Jamaah' : 'Peserta Milad'}
                      </span>
                      <span className="px-3 py-1 text-xs font-medium rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                        Mode klik: {selectedPrizeForDraw.mode_undian === 'SEMUA' ? 'Semua langsung' : '1 pemenang'}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">
                    {loadingParticipants ? 'Memuat peserta...' : 'Siap untuk diundi'}
                  </p>
                </div>

                {/* Loading State */}
                {loadingParticipants && !autoDrawingAll && (
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
                    <p className="text-gray-400 mb-2">
                      Tidak ada {selectedPrizeForDraw?.tipe_peserta === 'JAMAAH' ? 'jamaah' : 'peserta'} yang eligible untuk hadiah ini
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                      {selectedPrizeForDraw?.tipe_peserta === 'JAMAAH' 
                        ? 'Pastikan data jamaah sudah di-upload dan belum pernah menang'
                        : 'Pastikan peserta sudah melakukan presensi dan belum pernah menang'
                      }
                    </p>
                    <button
                      onClick={() => setShowSlot(false)}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
                    >
                      Tutup
                    </button>
                  </div>
                )}

                {/* Slot Machine - Show ketika participants siap dan tidak loading (atau loading tapi dalam SEMUA mode) */}
                {(!loadingParticipants || autoDrawingAll) && participants.length > 0 && (
                  <>
                    {/* Success Message after winning */}
                    {showSuccess && lastWinner && (
                      <div className="mb-6 animate-fadeIn">
                        <div className="bg-linear-to-br from-yellow-500/20 to-yellow-600/10 border-2 border-yellow-500 rounded-2xl p-10 text-center shadow-2xl">
                          <div className="text-7xl mb-4">🎉</div>
                          <div className="text-2xl text-yellow-500 mb-3 font-semibold">
                            SELAMAT!
                          </div>
                          
                          {/* Conditional: SEMUA mode completed vs SATU mode */}
                          {selectedPrizeForDraw?.mode_undian === 'SEMUA' && prizeRemainingSlots === 0 ? (
                            <>
                              <div className="text-4xl font-bold text-white mb-4">
                                Kepada {batchWinners.length} Pemenang
                              </div>
                              <div className="text-xl text-gray-300 mb-6">
                                Menjadi pemenang {selectedPrizeForDraw?.nama_hadiah}!
                              </div>
                              
                              {/* Daftar semua pemenang */}
                              <div
                                ref={finalWinnersScrollRef}
                                className="bg-black/30 rounded-lg p-4 mb-6 text-left max-h-56 overflow-y-auto"
                              >
                                <div className="text-sm font-semibold text-yellow-500 mb-3 text-center">Daftar Pemenang</div>
                                <div className="space-y-2">
                                  {batchWinners.map((winner, idx) => (
                                    <div key={`${winner.id}-${idx}`} className="text-sm">
                                      <div className="font-medium text-white">{idx + 1}. {winner.nama}</div>
                                      <div className="text-xs text-yellow-300">{winner.nomor_telepon || '-'}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="text-5xl font-bold text-white mb-2">
                                {lastWinner.nama}
                              </div>
                              <div className="text-lg font-medium text-yellow-300 mb-2">
                                {lastWinner.nomor_telepon || '-'}
                              </div>
                              <div className="text-base text-gray-200 mb-2 px-4 wrap-break-word">
                                {lastWinner.alamat || '-'}
                              </div>
                              <div className="text-xl text-gray-300 mt-4 mb-6">
                                Menjadi pemenang {selectedPrizeForDraw?.nama_hadiah}!
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Slot Machine Component - Hide saat show success */}
                    {!showSuccess && (
                      <div className="mb-6">
                        {selectedPrizeForDraw.mode_undian === 'SEMUA' ? (
                          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
                            <div>
                              <SlotUndian 
                                peserta={participants}
                                onWinner={handleSlotWinner}
                                speed={selectedPrizeForDraw?.kecepatan_undian as 'NORMAL' | 'DRAMATIS' || 'NORMAL'}
                                autoStartSignal={autoSpinSignal}
                                continuousSpin={continuousSpinning}
                                stopAtWinner={stopAtWinner}
                                showControls={false}
                                showWinnerCard={false}
                                spinButtonLabel="Mulai Undian"
                              />
                            </div>

                            <div className="bg-black/20 border border-yellow-500/20 rounded-xl p-4 h-full">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-yellow-500">Pemenang Terkumpul</h4>
                                <span className="text-xs text-gray-400">{batchWinners.length} orang</span>
                              </div>
                              <div
                                ref={liveWinnersScrollRef}
                                className="max-h-90 overflow-y-auto space-y-2 pr-1"
                              >
                                {batchWinners.length === 0 ? (
                                  <div className="rounded-lg border border-yellow-500/10 bg-black/30 px-3 py-5 text-sm text-center text-gray-400">
                                    Menunggu pemenang pertama...
                                  </div>
                                ) : (
                                  batchWinners.map((winner, idx) => (
                                    <div key={`${winner.id}-${idx}`} className="rounded-lg border border-yellow-500/10 bg-black/30 px-3 py-2 text-sm">
                                      <div className="font-semibold text-white">{idx + 1}. {winner.nama}</div>
                                      <div className="text-yellow-300 text-xs mt-0.5">{winner.nomor_telepon || '-'}</div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <SlotUndian 
                            peserta={participants}
                            onWinner={handleSlotWinner}
                            speed={selectedPrizeForDraw?.kecepatan_undian as 'NORMAL' | 'DRAMATIS' || 'NORMAL'}
                            autoStartSignal={autoSpinSignal}
                            continuousSpin={false}
                            stopAtWinner={null}
                            showControls={true}
                            showWinnerCard={true}
                            spinButtonLabel="Mulai Undian"
                          />
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 justify-center flex-wrap">
                      {showSuccess ? (
                        <>
                          {selectedPrizeForDraw.mode_undian !== 'SEMUA' ? (
                            prizeRemainingSlots > 0 && participants.length > 0 ? (
                              <button
                                onClick={handleUndiLagi}
                                disabled={drawing}
                                className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition shadow-lg shadow-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                🎰 Undi Lagi ({prizeRemainingSlots} slot tersisa)
                              </button>
                            ) : (
                              <div className="px-8 py-3 bg-green-500/10 border-2 border-green-500 text-green-500 font-bold rounded-lg">
                                ✓ Semua Pemenang Sudah Terundi
                              </div>
                            )
                          ) : (
                            <div className="px-8 py-3 bg-green-500/10 border-2 border-green-500 text-green-500 font-bold rounded-lg">
                              ✓ Undian semua langsung selesai
                            </div>
                          )}
                          
                          {/* Tombol Selesai */}
                          <button
                            onClick={handleSelesaiUndi}
                            disabled={drawing}
                            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Selesai
                          </button>
                          <button
                            onClick={() => selectedPrizeForDraw && handleResetPrizeLottery(selectedPrizeForDraw)}
                            disabled={drawing || !selectedPrizeForDraw || resettingPrizeId === selectedPrizeForDraw?.id}
                            className="px-8 py-3 text-white font-semibold rounded-lg border border-red-500/40 bg-red-500/30 hover:bg-red-500/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {resettingPrizeId === selectedPrizeForDraw?.id ? 'Mereset...' : 'Reset Hadiah'}
                          </button>
                        </>
                      ) : (
                        <>
                          {selectedPrizeForDraw.mode_undian === 'SEMUA' && (
                            <button
                              onClick={handleStartAutoDraw}
                              disabled={drawing || autoDrawingAll || prizeRemainingSlots <= 0}
                              className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition shadow-lg shadow-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {autoDrawingAll ? 'Mengundi Otomatis...' : `Mulai Undi Semua (${prizeRemainingSlots} slot)`}
                            </button>
                          )}
                          {/* Tombol Tutup - hanya saat belum undi */}
                          <button
                            onClick={handleSelesaiUndi}
                            disabled={drawing}
                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Tutup
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* New Winners Announcement */}
          {newWinners.length > 0 && !animating && (
            <div className="bg-linear-to-r from-yellow-500 via-yellow-600 to-yellow-500 rounded-xl shadow-lg shadow-yellow-500/50 p-8 text-center">
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
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-2xl font-bold text-yellow-500">Daftar Hadiah</h2>
                <button
                  onClick={handleResetLottery}
                  disabled={resettingLottery || drawing}
                  className="px-4 py-2 text-sm font-semibold rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resettingLottery ? 'Mereset...' : 'Reset Undian'}
                </button>
              </div>
              <div className="space-y-6">
                {groupedPrizes.map(([displayOrder, orderPrizes]) => (
                  <div key={`undian-${displayOrder}`} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-semibold rounded-full border border-yellow-500/20">
                        Undian #{displayOrder}
                      </span>
                      <span className="text-xs text-gray-400">
                        {orderPrizes.length} hadiah
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {orderPrizes.map((prize) => (
                        <div key={prize.id} className="bg-[#1a1a1a] rounded-lg shadow-lg overflow-hidden border border-yellow-500/20">
                    {/* Prize Image */}
                    {prize.gambar_url && (
                      <div className="relative h-48 w-full overflow-hidden bg-[#0a0a0a]">
                        <img 
                          src={prize.gambar_url} 
                          alt={prize.nama_hadiah}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-[#1a1a1a] via-transparent to-transparent"></div>
                      </div>
                    )}
                    
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-xs font-medium rounded-full border border-yellow-500/20">
                            Hadiah #{prize.urutan}
                          </span>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
                            prize.tipe_peserta === 'JAMAAH' 
                              ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' 
                              : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          }`}>
                            {prize.tipe_peserta === 'JAMAAH' ? 'Jamaah' : 'Peserta'}
                          </span>
                        </div>
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
                            className="bg-linear-to-r from-yellow-500 to-yellow-600 h-2.5 rounded-full transition-all shadow-sm shadow-yellow-500/50"
                            style={{
                              width: `${(prize.winnersDrawn / prize.jumlah_pemenang) * 100}%`,
                            }}
                          />
                        </div>
                      </div>

                          {prize.isComplete ? (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                disabled
                                className="w-full px-4 py-2.5 bg-gray-700 text-gray-300 text-sm font-semibold rounded-lg cursor-not-allowed"
                              >
                                Semua Pemenang Terundi
                              </button>
                              <button
                                onClick={() => handleResetPrizeLottery(prize)}
                                disabled={drawing || resettingPrizeId === prize.id}
                                className="w-full px-4 py-2.5 border border-red-500/40 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {resettingPrizeId === prize.id ? 'Mereset...' : 'Reset'}
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenSlot(prize)}
                              disabled={drawing || openingPrizeId === prize.id}
                              className="w-full px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-black text-sm font-semibold rounded-lg transition disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed shadow-lg shadow-yellow-500/50 disabled:shadow-none"
                            >
                              {openingPrizeId === prize.id ? 'Membuka Undian...' : 'Undi Pemenang'}
                            </button>
                          )}
                        </div>
                      </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Winners List */}
          {winners.length > 0 && (
            <div>
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <h2 className="text-2xl font-bold text-yellow-500">Daftar Semua Pemenang</h2>
                <button
                  onClick={exportWinnersToExcel}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition shadow-lg shadow-green-600/40"
                >
                  Export Excel Pemenang
                </button>
              </div>
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
    </div>
  );
}
