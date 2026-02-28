# Troubleshooting - Halaman Loading Terus

## ✅ SOLVED: Database Tidak Punya Event

**Masalah**: Saat migration database di-reset dan tidak ada data event. Semua halaman (Peserta, Presensi, Hadiah) membutuhkan event untuk bisa load.

**Solusi**: Database sudah di-seed dengan event default: "Milad MU Travel 2026"

---

## Jika Masih Loading Setelah Seed:

### 1. **Logout & Login Ulang**
   - Klik tombol Logout di sidebar
   - Login kembali dengan:
     - Username: `admin`
     - Password: `admin123`

### 2. **Clear Browser Cache**
   - Tekan `Ctrl + Shift + Delete`
   - Clear "Cookies" dan "Cached Images"
   - Refresh halaman (`F5` atau `Ctrl + R`)

### 3. **Hard Reload Browser**
   - Tekan `Ctrl + Shift + R` (hard reload)
   - Atau buka Incognito/Private window

### 4. **Cek Console Browser**
   - Tekan `F12` (Developer Tools)
   - Tab **Console** - lihat error messages
   - Tab **Network** - cek API calls yang gagal
   - Screenshot error jika ada

### 5. **Restart Dev Server**
   ```bash
   # Stop server (Ctrl + C)
   # Lalu jalankan ulang:
   npm run dev
   ```

---

## Data Default Setelah Seed:

### Admin User:
- Username: `admin`
- Password: `admin123`

### Event Default:
- Nama Event: **Milad MU Travel 2026**
- Tanggal: 15 Maret 2026
- Lokasi: Grand Hall MU Travel Jakarta
- Status: Aktif ✓

---

## Cek Browser Network Tab:

Buka F12 → Network, lalu refresh halaman. Cek API calls berikut:

1. **GET /api/events** - Status harus **200 OK**
2. **GET /api/peserta/event/[id]** - Status harus **200 OK** 
3. **GET /api/hadiah/event/[id]** - Status harus **200 OK**
4. **GET /api/presensi/event/[id]** - Status harus **200 OK**

Jika ada yang **401 Unauthorized**: Logout → Login ulang
Jika ada yang **500 Internal Server Error**: Ada bug di API (kirim error message)

---

## Perintah Berguna:

```bash
# Re-seed database (jika perlu reset)
npm run seed

# Cek database dengan Prisma Studio
npm run prisma:studio

# Generate Prisma Client (jika ada perubahan schema)
npx prisma generate

# Restart dev server
npm run dev
```

---

**Update**: Database sudah di-seed, silakan coba refresh browser atau logout/login ulang!
