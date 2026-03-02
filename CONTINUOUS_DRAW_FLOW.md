# Update: Continuous Draw Flow

## 📋 Perubahan

### ✅ Flow Baru Setelah Undi

**SEBELUM:**
1. User klik "Undi Pemenang"
2. Modal slot machine terbuka
3. User klik "Mulai Undian"
4. Slot spin → pemenang terpilih
5. **Modal langsung tutup**
6. Tampil ucapan selamat di halaman utama
7. Harus klik "Undi Pemenang" lagi untuk undi berikutnya

**SEKARANG:**
1. User klik "Undi Pemenang"
2. Modal slot machine terbuka
3. User klik "Mulai Undian"
4. Slot spin → pemenang terpilih
5. **Modal TETAP TERBUKA**
6. **Ucapan selamat muncul DI DALAM MODAL**
7. Tampil 2 tombol:
   - **🎰 Undi Lagi** - Langsung undi winner berikutnya
   - **Selesai** - Tutup modal dan kembali ke daftar hadiah

---

## 🎯 Keuntungan Flow Baru

### 1. **Efisiensi Waktu**
- Tidak perlu buka-tutup modal berulang kali
- Bisa undi multiple winners dalam 1 session
- Cocok untuk hadiah dengan banyak pemenang

### 2. **User Experience Lebih Baik**
- Flow lebih smooth dan natural
- Tidak kehilangan context
- Peserta auto-refresh setelah undi

### 3. **Auto-Refresh**
- Setelah winner tersimpan
- Eligible participants di-refresh otomatis
- Peserta yang sudah menang otomatis excluded
- Tombol "Undi Lagi" otomatis hilang jika tidak ada eligible lagi

---

## 🔄 State Management Baru

### State Tambahan

```tsx
const [showSuccess, setShowSuccess] = useState(false);
const [lastWinner, setLastWinner] = useState<Participant | null>(null);
```

### State Flow

```
Initial:
  showSuccess: false
  lastWinner: null

After Spin Complete:
  showSuccess: true
  lastWinner: { id, nama }
  
After Click "Undi Lagi":
  showSuccess: false
  lastWinner: null
  (participants already refreshed)

After Click "Selesai":
  showSlot: false
  (back to main page)
```

---

## 🎨 UI Changes

### Success Message Display

```tsx
{showSuccess && lastWinner && (
  <div className="animate-fadeIn">
    <div className="bg-gradient-to-br from-yellow-500/20 ...">
      <div className="text-7xl mb-4">🎉</div>
      <div className="text-2xl text-yellow-500 mb-3">SELAMAT!</div>
      <div className="text-5xl font-bold text-white">
        {lastWinner.nama}
      </div>
      <div className="text-xl text-gray-300 mt-4">
        Menjadi pemenang {selectedPrizeForDraw?.nama_hadiah}!
      </div>
    </div>
  </div>
)}
```

### Conditional Buttons

```tsx
{showSuccess ? (
  // Tombol setelah undi
  <>
    <button onClick={handleUndiLagi}>🎰 Undi Lagi</button>
    <button onClick={handleSelesaiUndi}>Selesai</button>
  </>
) : (
  // Tombol sebelum undi
  <button onClick={handleSelesaiUndi}>Tutup</button>
)}
```

---

## 🔧 Functions Baru

### `handleUndiLagi()`
```tsx
const handleUndiLagi = () => {
  setShowSuccess(false);
  setLastWinner(null);
  setSelectedWinner(null);
  // Participants sudah di-refresh otomatis
};
```

### `handleSelesaiUndi()`
```tsx
const handleSelesaiUndi = () => {
  setShowSlot(false);
  setShowSuccess(false);
  setLastWinner(null);
  setSelectedWinner(null);
  setParticipants([]);
  setSelectedPrizeForDraw(null);
};
```

---

## 📱 Skenario Penggunaan

### Skenario 1: Hadiah dengan 3 Pemenang

1. Klik "Undi Pemenang" pada hadiah
2. Klik "Mulai Undian" → **Winner 1** terpilih
3. Ucapan selamat muncul
4. Klik "🎰 Undi Lagi"
5. Klik "Mulai Undian" → **Winner 2** terpilih
6. Ucapan selamat muncul
7. Klik "🎰 Undi Lagi"
8. Klik "Mulai Undian" → **Winner 3** terpilih
9. Ucapan selamat muncul
10. Info: "Sisa 0 peserta eligible"
11. Tombol "Undi Lagi" **hilang otomatis**
12. Klik "Selesai" → Kembali ke daftar hadiah

### Skenario 2: Exit Sebelum Selesai

1. Klik "Undi Pemenang"
2. Klik "Mulai Undian" → Winner terpilih
3. Ucapan selamat muncul
4. Klik "Selesai" → Langsung tutup modal
5. Bisa lanjut undi hadiah lain

---

## 🎯 Auto-Refresh Logic

Setelah winner tersimpan:

```tsx
// Update data
fetchPrizes();        // Update prize progress
fetchWinners();       // Update winners list

// Refresh participants (exclude yang sudah menang)
if (selectedPrizeForDraw) {
  fetchEligibleParticipants(selectedPrizeForDraw);
}
```

Filter eligible participants:
```tsx
const eligible = data.data.participants.filter(
  (p) => p.status_hadir && !p.sudah_menang
);
```

---

## 🎨 Visual Feedback

### Congrats Display
- Animasi fadeIn smooth
- Gold gradient background
- 🎉 Emoji celebration
- Nama pemenang size 5xl bold
- Info sisa eligible participants
- Clear call-to-action buttons

### Button States
- "Undi Lagi": Bright yellow, prominent
- "Selesai": Subtle gray
- Auto-hide "Undi Lagi" jika tidak ada eligible

---

## ⚡ Performa

- Tidak ada memory leak
- State di-reset dengan proper
- Participants di-refresh efficient
- Modal reusable tanpa re-mount

---

## 🐛 Edge Cases Handled

1. **No eligible left**: Tombol "Undi Lagi" hilang otomatis
2. **API error**: Modal tetap terbuka, show error alert
3. **Click spam**: Tombol disabled saat drawing
4. **Close during draw**: Disabled "Tutup" saat spinning/saving

---

## 🎬 Demo Flow

```
[Modal Terbuka]
├── Slot Machine Idle Animation
├── Klik "Mulai Undian"
│   ├── Slot Spin 4.5s
│   ├── Winner terpilih
│   ├── Simpan ke database
│   └── Confetti! 🎉
│
├── [Success Screen]
│   ├── 🎉 SELAMAT!
│   ├── [Nama Pemenang]
│   ├── Sisa X peserta eligible
│   └── [🎰 Undi Lagi] [Selesai]
│
├── Klik "Undi Lagi"
│   └── Back to Slot Machine
│
└── Klik "Selesai"
    └── Modal Tutup
```

---

**Update Complete! Flow sekarang lebih efficient untuk multiple winners.** ✨
