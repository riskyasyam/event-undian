# 📱 Panduan Menggunakan QR Scanner dengan HP

## ✅ Langkah-Langkah Scan QR Code

### 1. **Akses Website Melalui HP**
- Buka browser di HP (Chrome, Safari, Firefox, dll)
- Akses URL admin dashboard: `http://localhost:3000/admin/dashboard`
- Login dengan username & password admin

### 2. **Buka Halaman Presensi**
- Dari sidebar, klik menu **"Presensi"**
- Atau akses langsung: `http://localhost:3000/admin/presensi`

### 3. **Pilih Mode Scan QR Code**
- Klik tab **"📷 Scan QR Code"** (bukan Manual Input)
- Kamera akan meminta izin akses

### 4. **Izinkan Akses Kamera**
- Browser akan muncul popup: **"Allow camera access?"**
- Klik **"Allow"** atau **"Izinkan"**
- ⚠️ **Penting**: Jika tidak izinkan, QR scanner tidak akan berfungsi

### 5. **Mulai Scan**
- Klik tombol **"Start Camera"** (warna kuning)
- Kamera HP akan aktif
- Layar akan menampilkan preview kamera

### 6. **Arahkan Kamera ke QR Code**
- Pegang HP dengan stabil
- Arahkan kamera ke QR Code peserta
- Pastikan QR Code terlihat jelas dalam kotak kuning
- Jarak ideal: **15-30 cm** dari QR Code

### 7. **Otomatis Tersimpan!**
- Scanner akan **otomatis** membaca QR Code
- Tidak perlu tekan tombol apapun
- Notifikasi hijau akan muncul: **"✓ Presensi berhasil!"**
- Kamera akan berhenti otomatis

### 8. **Scan Peserta Berikutnya**
- Klik **"Start Camera"** lagi untuk scan peserta berikutnya
- Ulangi langkah 6-7

---

## 🎯 Tips Agar Scan Lancar

### ✅ DO's (Lakukan):
1. **Pencahayaan Cukup**: Scan di tempat terang
2. **HP Stabil**: Pegang HP dengan stabil, jangan goyang
3. **QR Code Jelas**: Pastikan tidak blur atau kusut
4. **Jarak Pas**: 15-30 cm dari QR Code
5. **Fokus**: Tunggu kamera fokus sebelum scan
6. **Koneksi Internet**: Pastikan HP terhubung ke internet/WiFi yang sama dengan server

### ❌ DON'T's (Hindari):
1. ❌ Scan di tempat gelap
2. ❌ QR Code terlalu dekat (< 10cm)
3. ❌ QR Code terlalu jauh (> 50cm)
4. ❌ Menggoyang HP saat scan
5. ❌ QR Code rusak/sobek
6. ❌ Menutup akses kamera

---

## 📋 Contoh Alur Lengkap

```
PERSIAPAN:
1. Print QR Code semua peserta → Bawa ke lokasi event
2. HP admin sudah login & buka halaman Presensi
3. Pastikan WiFi/internet HP stabil

SAAT EVENT:
1. Peserta datang → tunjukkan QR Code
2. Admin scan dengan HP:
   - Buka tab "Scan QR Code"
   - Klik "Start Camera"
   - Arahkan ke QR Code peserta
   - Tunggu notifikasi hijau "Presensi berhasil!"
3. Peserta berikutnya → ulangi

SELESAI:
- Semua presensi tercatat otomatis
- Bisa lihat daftar di bawah halaman
- Data tersimpan di database
```

---

## 🔧 Troubleshooting

### ❗ "Kamera tidak muncul"
**Solusi:**
1. Pastikan sudah klik "Allow" pada popup izin kamera
2. Check browser settings → pastikan camera permission ON
3. Coba browser lain (Chrome recommended)
4. Restart browser

### ❗ "QR Code tidak terbaca"
**Solusi:**
1. Pastikan QR Code tidak blur
2. Perbaiki pencahayaan
3. Dekatkan/jauhkan HP dari QR Code
4. Pastikan QR Code adalah hasil generate dari sistem (bukan QR Code lain)

### ❗ "Error: Peserta sudah melakukan presensi"
**Solusi:**
- Peserta sudah scan sebelumnya
- Cek di daftar presensi apakah nama sudah ada
- Ini normal, setiap peserta hanya bisa presensi 1x

### ❗ "Camera blocked by system"
**Solusi Android:**
1. Settings → Apps → Browser (Chrome/etc)
2. Permissions → Camera → Allow
3. Restart browser

**Solusi iOS:**
1. Settings → Safari/Chrome
2. Camera → Allow
3. Restart browser

### ❗ "Network Error / Failed to submit"
**Solusi:**
1. Check koneksi internet HP
2. Pastikan HP & server dalam network yang sama
3. Refresh halaman (F5)
4. Login ulang

---

## 📊 Monitoring Real-time

Di halaman Presensi, Anda bisa lihat:
- **Total Peserta**: Jumlah peserta terdaftar
- **Sudah Hadir**: Yang sudah presensi (hijau)
- **Belum Hadir**: Yang belum presensi (merah)
- **Persentase Hadir**: % kehadiran

Dan daftar presensi terbaru akan muncul otomatis di bawah:
- Waktu presensi
- Kode peserta (MU-001, dll)
- Nama peserta
- Metode (QR Code / Manual)

---

## 🎉 File Excel Template Peserta

File Excel dengan **100 contoh peserta** sudah dibuat di:
📁 **`public/template_peserta_100.xlsx`**

**Isi File:**
- 100 nama orang Indonesia
- Nomor telepon lengkap
- Alamat lengkap dengan RT/RW

**Cara Pakai:**
1. Download file dari folder `public/`
2. Buka halaman **Peserta**
3. Klik "Upload" dan pilih file tersebut
4. Sistem akan auto-generate kode: MU-001 s/d MU-100
5. Generate QR Code untuk semua peserta
6. Print QR Code → bawa ke event
7. Scan saat peserta datang!

---

## 🔐 Akses Admin

**Default Login:**
- URL: `/admin/login`
- Username: `admin`
- Password: `admin123`

⚠️ **Ganti password setelah first login!**

---

## 💡 Best Practices

### Untuk Event Besar (100+ peserta):
1. Siapkan **2-3 HP admin** untuk scan bersamaan
2. Gunakan **HP dengan kamera bagus** (mid-range ke atas)
3. **Print QR Code ukuran besar** (10x10 cm) agar mudah scan
4. Siapkan **cadangan manual input** jika kamera bermasalah
5. **Test QR scanner** sebelum event dimulai

### Untuk Testing:
1. Upload sample 10-20 peserta dulu
2. Generate QR Code
3. Test scan dengan HP
4. Pastikan presensi tersimpan
5. Baru upload semua peserta

---

**Support**: Jika ada kendala, screenshot error dan hubungi developer!
