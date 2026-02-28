# Panduan Upload Peserta - Sistem Undian MU Travel

## Format File Excel

Untuk mengupload data peserta, gunakan file Excel (.xlsx) dengan **3 kolom wajib**:

### Struktur Kolom

| nama | nomor_telepon | alamat |
|------|---------------|--------|
| Ahmad Fauzi | 081234567890 | Jl. Merdeka No. 123, Jakarta |
| Siti Nurhaliza | 082345678901 | Jl. Raya Bogor Km 5, Bogor |
| Budi Santoso | 083456789012 | Jl. Sudirman No. 45, Bandung |

### Ketentuan:
- **nama**: Nama lengkap peserta (wajib diisi)
- **nomor_telepon**: Nomor telepon aktif (wajib diisi)
- **alamat**: Alamat lengkap peserta (wajib diisi)

### Catatan Penting:
1. **Semua kolom wajib diisi** - Baris yang ada kolom kosong akan diabaikan
2. **Nama kolom harus exact match**: `nama`, `nomor_telepon`, `alamat` (case-sensitive)
3. **Hindari karakter special** yang tidak perlu
4. **Format file**: .xlsx (Excel 2007 atau lebih baru)

## Kode Peserta Unik

Setelah upload, setiap peserta akan mendapatkan **kode unik otomatis**:
- Format: `MU-001`, `MU-002`, `MU-003`, dst.
- Prefix `MU-` adalah default untuk MU Travel
- Nomor urut berdasarkan urutan upload

## QR Code

### Generate QR Code:
1. Setelah upload berhasil, buka halaman **Peserta**
2. Setiap peserta memiliki tombol **"Generate QR"**
3. Klik tombol untuk generate dan download QR code
4. QR code berisi kode unik peserta (`MU-001`, dll)

### Download QR Code:
- Individual: Klik tombol "Generate QR" pada setiap peserta
- Batch: Klik tombol "Download Semua QR" untuk download semua sekaligus

## Presensi Kehadiran

Ada 2 cara untuk mencatat presensi:

### 1. Input Manual (Kode Peserta)
- Buka halaman **Presensi**
- Pilih tab **"Manual Input Kode"**
- Ketik kode peserta (contoh: `MU-001`)
- Klik **"Simpan Presensi"**

### 2. Scan QR Code
- Buka halaman **Presensi**
- Pilih tab **"Scan QR Code"**
- Scan QR code dari peserta (gunakan scanner atau kamera)
- Hasil scan akan otomatis terisi di field input
- Klik **"Simpan Presensi"**

## Alur Lengkap

```
1. UPLOAD PESERTA (Excel)
   ↓
2. SISTEM GENERATE KODE UNIK (MU-001, MU-002, ...)
   ↓
3. GENERATE QR CODE untuk setiap peserta
   ↓
4. PRESENSI (Manual atau QR Scan)
   ↓
5. PESERTA ELIGIBLE untuk UNDIAN
```

## Tips & Troubleshooting

### Upload Gagal?
- ✅ Pastikan format Excel .xlsx
- ✅ Pastikan nama kolom sesuai: `nama`, `nomor_telepon`, `alamat`
- ✅ Pastikan tidak ada baris kosong
- ✅ Pastikan semua 3 kolom terisi

### QR Code Tidak Muncul?
- Klik tombol "Generate QR" terlebih dahulu
- Refresh halaman setelah generate
- Cek koneksi internet

### Presensi Gagal?
- Pastikan kode peserta benar (contoh: `MU-001`)
- Pastikan peserta belum presensi sebelumnya
- Cek case-sensitive: gunakan huruf besar

## Contoh Template Excel

Anda bisa download template Excel di: [Template Excel - Peserta MU Travel](./template_peserta.xlsx)

Atau buat sendiri dengan struktur di atas.

---

**Support**: Hubungi admin jika ada pertanyaan atau masalah.
