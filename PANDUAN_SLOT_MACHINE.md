# Panduan Slot Machine 3D Vertical Picker

## 📋 Overview

Fitur undian telah diupgrade dari **Wheel Spin** menjadi **Slot Machine 3D Vertical Picker** dengan efek visual yang lebih menarik dan modern.

---

## 🎰 Fitur Utama

### 1. **Tampilan Visual**
- ✅ 1 kolom vertical
- ✅ Menampilkan 6 nama sekaligus
- ✅ Tinggi per item: 60px
- ✅ Item tengah (index 3) sebagai posisi pemenang
- ✅ Container dengan overflow-hidden

### 2. **Idle Animation**
- ✅ Animasi float naik-turun 15px
- ✅ Durasi 2 detik, infinite loop
- ✅ Menggunakan CSS keyframes
- ✅ Berhenti otomatis saat mulai spin

### 3. **Spin Animation**
- ✅ Durasi 4.5 detik
- ✅ Easing: ease-out cubic
- ✅ Random winner dari array peserta
- ✅ Loop data minimal 20x untuk efek panjang
- ✅ Berhenti tepat di posisi tengah
- ✅ Menggunakan requestAnimationFrame untuk smooth animation

### 4. **Efek 3D**
- ✅ Perspective 1000px di parent
- ✅ rotateX() untuk item atas & bawah
- ✅ Item tengah:
  - Scale 1.2
  - Opacity 1
  - Font bold (700)
  - Text-shadow glow kuning
- ✅ Item semakin jauh:
  - Opacity turun (min 0.2)
  - Scale turun (min 0.7)
  - rotateX meningkat

### 5. **UI Elements**
- ✅ Tombol "Mulai Undian"
- ✅ Tombol disabled saat spinning
- ✅ Winner announcement setelah selesai
- ✅ Gradient overlay atas & bawah
- ✅ Highlight border di tengah
- ✅ Animated pulse indicators di tengah

### 6. **Logic & State Management**
- ✅ useState untuk isSpinning, winner, offset
- ✅ useMemo untuk expanded list
- ✅ requestAnimationFrame untuk smooth animation
- ✅ Callback onWinner setelah selesai
- ✅ No external library (pure React & CSS)

---

## 📁 File Structure

```
components/
  └── SlotUndian.tsx          # Komponen utama slot machine
  └── SlotUndian.example.tsx  # Contoh penggunaan

app/admin/undi/
  └── page.tsx                # Halaman undi (sudah terintegrasi)
```

---

## 🚀 Cara Penggunaan

### Basic Usage

```tsx
import SlotUndian from '@/components/SlotUndian';

const peserta = [
  { id: '1', nama: 'Ahmad Abdullah' },
  { id: '2', nama: 'Fatimah Zahra' },
  { id: '3', nama: 'Muhammad Ali' },
  // ... more participants
];

<SlotUndian 
  peserta={peserta}
  onWinner={(winner) => {
    console.log('Pemenang:', winner);
    // Handle winner logic here
  }}
/>
```

### Props Interface

```tsx
interface SlotUndianProps {
  peserta: {
    id: string;
    nama: string;
    email?: string;
    nomor_telepon?: string;
  }[];
  onWinner?: (winner: Peserta) => void;
}
```

---

## 🎨 Customization

### Mengubah Tinggi Item

Edit konstanta di `SlotUndian.tsx`:

```tsx
const ITEM_HEIGHT = 60; // Ubah nilai ini
```

### Mengubah Jumlah Item Visible

```tsx
const VISIBLE_ITEMS = 6; // Ubah jumlah item yang terlihat
```

### Mengubah Durasi Spin

```tsx
const SPIN_DURATION = 4500; // Durasi dalam milliseconds
```

### Mengubah Jumlah Loop

```tsx
const MIN_LOOPS = 20; // Minimal pengulangan data
```

---

## 🎯 Algoritma Perhitungan Offset

```tsx
// Formula:
offset = (targetIndex × ITEM_HEIGHT) - (CENTER_INDEX × ITEM_HEIGHT)

// Contoh:
// - ITEM_HEIGHT = 60px
// - CENTER_INDEX = 3 (posisi tengah)
// - targetIndex = 45 (posisi winner di expanded list)
//
// offset = (45 × 60) - (3 × 60)
//        = 2700 - 180
//        = 2520px
```

---

## 🔧 Technical Details

### Expanded List Logic

Komponen membuat list panjang dengan mengulang data peserta minimal 20x:

```tsx
const loops = Math.max(MIN_LOOPS, Math.ceil(100 / peserta.length));
for (let i = 0; i < loops; i++) {
  expanded.push(...peserta);
}
```

### 3D Transform Calculation

Setiap item mendapat style dinamis berdasarkan jarak dari center:

```tsx
const distanceFromCenter = itemPosition - centerPosition;
const normalizedDistance = Math.abs(distanceFromCenter) / ITEM_HEIGHT;

// Scale: 1.2 → 0.7
const scale = Math.max(0.7, 1.2 - normalizedDistance * 0.15);

// Opacity: 1 → 0.2
const opacity = Math.max(0.2, 1 - normalizedDistance * 0.25);

// RotateX untuk efek 3D
const rotateX = distanceFromCenter * 0.8;
```

### Easing Function

Menggunakan cubic ease-out untuk smooth deceleration:

```tsx
const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};
```

---

## 🎬 Animation Flow

1. **Idle State**: 
   - List float naik-turun dengan CSS animation
   - Semua item visible dengan efek 3D

2. **Spin Start**:
   - Idle animation berhenti
   - Random winner dipilih
   - Calculate target offset
   - requestAnimationFrame mulai

3. **Spinning**:
   - Offset berubah dari 0 → targetOffset
   - Progress 0 → 1 dalam 4.5 detik
   - Easing cubic ease-out
   - Visual smooth 60fps

4. **Spin End**:
   - Berhenti tepat di center
   - Winner state di-set
   - Callback onWinner dipanggil
   - Winner announcement muncul

---

## 🎨 Styling Highlights

### Color Scheme (Gold & Black)
- Background: `#1a1a1a` → `#2d2d2d` gradient
- Accent: Yellow 500/600 (`#eab308`, `#ca8a04`)
- Border: Yellow 500/30 opacity
- Shadow: Yellow 500/50 glow

### Center Highlight
- Border 2px yellow dengan glow shadow
- 2 pulse indicators di samping
- Text-shadow glow pada item tengah

### Gradient Overlays
- Top: `rgba(26,26,26,1)` → transparent
- Bottom: transparent → `rgba(26,26,26,1)`
- Smooth fade effect

---

## 🐛 Troubleshooting

### Slot tidak bergerak
- Pastikan peserta.length > 0
- Check console untuk errors

### Animation patah-patah
- Check browser performance
- Reduce MIN_LOOPS jika data besar

### Winner tidak tepat
- Verify targetIndex calculation
- Check offset formula

### Idle animation tidak muncul
- Pastikan CSS keyframes ter-load
- Check class `slot-idle`

---

## 📱 Responsive Design

Komponen sudah responsive dengan:
- max-w-lg (512px) di desktop
- Width 100% di mobile
- Padding auto-adjust

---

## ⚡ Performance Tips

1. **Batasi peserta display**: 
   - Jika peserta > 50, ambil sample random
   - Sudah diimplementasi di page undi

2. **Optimize re-renders**:
   - useMemo untuk expanded list
   - useEffect untuk reset offset

3. **Animation performance**:
   - Gunakan transform (GPU accelerated)
   - Avoid margin/padding animation

---

## 🔄 Migration dari Wheel Spin

### Yang Berubah:
- ❌ Wheel SVG circular
- ❌ Rotation-based animation
- ❌ mustSpin, prizeNumber states
- ❌ selectedWinnerIndex

### Yang Baru:
- ✅ Slot Machine vertical
- ✅ TranslateY-based animation
- ✅ isSpinning, offset states
- ✅ selectedWinner object

### Compatibility:
- ✅ API endpoint tetap sama
- ✅ Data structure tetap sama
- ✅ Winner handling tetap sama
- ✅ Confetti tetap berfungsi

---

## 📄 License & Credits

Created for MU Travel Milad Event
Design: Gold & Black Theme
Animation: Pure CSS + React
No external animation libraries

---

## 📞 Support

Jika ada pertanyaan atau issue:
1. Check console logs
2. Verify peserta data structure
3. Review TROUBLESHOOTING.md

**Happy Drawing! 🎰✨**
