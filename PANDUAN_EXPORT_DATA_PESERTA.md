# Panduan Export Data Peserta - Sistem Undian MU Travel

## Fitur Export Data Peserta

Fitur ini memungkinkan Anda untuk mengekspor seluruh data peserta beserta kode peserta dan URL QR code dalam format Excel (.xlsx).

## Cara Menggunakan

### 1. Akses Halaman Peserta
- Login ke admin dashboard
- Buka menu **Peserta** di sidebar

### 2. Export Data
- Klik tombol **"Export Data Excel"** (tombol hijau) di bagian atas tabel peserta
- File Excel akan otomatis terdownload

### 3. Nama File
File hasil export akan otomatis diberi nama dengan format:
```
Peserta_[Nama_Event]_[Tanggal].xlsx
```

Contoh: `Peserta_Milad_MU_Travel_2026-02-28.xlsx`

## Isi File Excel

File Excel yang diexport berisi kolom-kolom berikut:

| Kolom | Deskripsi | Contoh |
|-------|-----------|--------|
| No | Nomor urut | 1, 2, 3, ... |
| Kode Peserta | Kode unik peserta | MU-001, MU-002 |
| Nama | Nama lengkap peserta | Ahmad Fauzi |
| Nomor Telepon | Nomor telepon peserta | 081234567890 |
| Alamat | Alamat lengkap | Jl. Merdeka No. 123, Jakarta |
| URL Download QR Code | Link untuk download QR code | https://yourdomain.com/api/qrcode/MU-001 |

### Catatan URL QR Code
- URL QR code adalah link publik yang bisa dibuka di browser
- Copy paste URL ke browser akan langsung menampilkan gambar QR code
- Bisa diakses dari komputer manapun yang terkoneksi internet
- Format: `https://[domain]/api/qrcode/[kode-peserta]`

## Kegunaan

### 1. Backup Data
- Simpan data peserta sebagai backup
- Data lengkap terstruktur dalam Excel

### 2. Pendataan Offline
- Cetak atau share file Excel untuk pendataan
- Semua informasi peserta dalam satu file
- Kode peserta jelas untuk referensi

### 3. QR Code Distribution
- URL QR code bisa langsung dibuka di browser
- Copy paste URL untuk akses gambar QR code
- Bisa dibagikan ke komputer atau device lain
- Download gambar dengan klik kanan > Save Image

### 4. Integrasi dengan Sistem Lain
- Data terstruktur dalam Excel
- Mudah diimport ke sistem lain jika diperlukan
- URL QR code bisa diintegrasikan ke platform lain

## Tips

### Cara Menggunakan URL QR Code
1. **Copy URL** dari kolom "URL Download QR Code"
2. **Paste di browser** (Chrome, Firefox, Edge, dll)
3. **Gambar QR code akan muncul** di browser
4. **Klik kanan > Save Image** untuk menyimpan gambar
5. Atau **Print langsung** dari browser

### Share ke Tim/Panitia
- Share file Excel ke tim panitia
- Mereka bisa akses URL QR code tanpa perlu login
- URL bisa dibuka dari desktop, laptop, atau mobile

## Troubleshooting

### File Tidak Terdownload
- Pastikan browser tidak memblokir download
- Cek popup blocker di browser
- Coba dengan browser berbeda

### File Excel Kosong
- Pastikan ada peserta yang sudah diupload
- Refresh halaman dan coba lagi

### Error "Tidak ada peserta untuk di-export"
- Upload peserta terlebih dahulu melalui tombol "Upload"
- Lihat panduan [PANDUAN_UPLOAD_PESERTA.md](./PANDUAN_UPLOAD_PESERTA.md)

### URL QR Code Tidak Bisa Dibuka
- Pastikan aplikasi sudah di-deploy dan online
- Cek koneksi internet
- Pastikan URL aplikasi sudah benar

## Alur Lengkap: Upload → Export

1. **Upload Peserta**
   - Upload file Excel dengan data peserta (nama, nomor_telepon, alamat)
   - Sistem otomatis generate kode peserta (MU-001, MU-002, dst)

2. **Export Data**
   - Klik "Export Data Excel" untuk download data lengkap
   - File Excel berisi semua data + URL download QR code
   - **Tidak perlu generate QR code terlebih dahulu** - URL sudah bisa diakses langsung

3. **Gunakan untuk Pendataan**
   - Share file Excel ke tim/panitia
   - Copy paste URL QR code ke browser untuk lihat/download gambar
   - Cetak atau gunakan digital sesuai kebutuhan

## Keamanan

- Export hanya bisa dilakukan oleh admin yang sudah login
- Data peserta hanya untuk event yang dipilih
- URL QR code bersifat publik dan bisa diakses siapa saja (tidak berisi data sensitif)
- QR code hanya berisi kode peserta (MU-001, dll) untuk keperluan check-in

---

**Dibuat**: 28 Februari 2026  
**Versi**: 1.0
