# WhatsApp Blast Configuration Guide

## Setup Environment Variables

Tambahkan variable berikut ke file `.env` Anda:

```env
# WhatsApp Blast - Wablas API
WABLAS_TOKEN=your_wablas_token_here
WABLAS_API_URL=https://solo.wablas.com
```

## Cara Mendapatkan Wablas Token

1. Daftar/Login ke akun Wablas di [wablas.com](https://wablas.com)
2. Buka dashboard dan copy API token Anda
3. Paste token tersebut ke `.env` file

## Testing Configuration

Untuk test apakah configuration sudah benar, Anda bisa:

1. Jalankan aplikasi: `npm run dev`
2. Buka halaman Admin → WhatsApp Blast
3. Statistik akan menampilkan jumlah pending messages
4. Klik tombol "Mulai Blast WhatsApp"

## Batch Configuration

Pengaturan batch sudah di-hardcode di `/app/api/blast-wa/route.ts`:

- **BATCH_SIZE**: 50 peserta per batch
- **DELAY_PER_MESSAGE**: 2000ms (2 detik) delay antar pesan

Untuk mengubah nilai ini, edit file API route tersebut.

## Troubleshooting

### Error "Wablas token not configured"
- Pastikan `WABLAS_TOKEN` sudah ada di `.env` file
- Restart development server setelah mengubah `.env`

### Error "Failed to send message"
- Cek apakah token Wablas masih valid
- Pastikan nomor telepon dalam format yang benar (akan otomatis ditambah kode +62)
- Cek quota/saldo Wablas Anda

### Rate Limit Error
- Increase `DELAY_PER_MESSAGE` di route.ts
- Reduce `BATCH_SIZE` untuk batch lebih kecil

## Message Format

Template pesan otomatis:

```
🎉 *Undangan Event*

Halo *[Nama Peserta]*!

Anda telah terdaftar untuk event *[Nama Event]*.

🔑 Kode Unik Anda: *[Kode Unik]*

Silakan scan QR Code untuk presensi (gambar terlampir).

Terima kasih! 🙏
```

Message template dapat dimodifikasi di `lib/wablas.ts` function `buildParticipantMessage()`.

## Features

### Status Tracking
- **PENDING**: Belum dikirim (default saat peserta baru upload)
- **PROCESSING**: Sedang dalam proses pengiriman
- **SENT**: Berhasil dikirim (dengan timestamp)
- **FAILED**: Gagal kirim (dengan error message)

### Retry Failed
Tombol "Retry Failed Messages" akan reset semua status FAILED kembali ke PENDING, sehingga bisa di-blast ulang.

### Auto-Batch Processing
Sistem akan otomatis memproses batch demi batch sampai semua pending messages terkirim.

## Database Schema

Field yang ditambahkan ke tabel `Peserta`:

```prisma
wa_status    WaStatus @default(PENDING)
wa_sent_at   DateTime?
wa_error     String?
```

Enum `WaStatus`:
```prisma
enum WaStatus {
  PENDING
  PROCESSING
  SENT
  FAILED
}
```

## API Endpoints

### POST /api/blast-wa

**Request Body:**
```json
{
  "event_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "processed": 50,
    "success": 48,
    "failed": 2,
    "remaining": 700,
    "stats": {
      "total_sent": 48,
      "total_failed": 2,
      "total_pending": 700
    }
  },
  "message": "Processed 50 messages. 48 sent, 2 failed."
}
```

## Best Practices

1. **Test dengan sedikit peserta dulu** - Upload 5-10 peserta dan test blast sebelum upload 750+ peserta
2. **Monitor logs** - Perhatikan batch logs untuk detect masalah early
3. **Backup database** - Sebelum blast ke 750+ peserta, backup database terlebih dahulu
4. **Check Wablas quota** - Pastikan quota Wablas mencukupi untuk 750+ pesan
5. **Timing** - Blast di waktu yang tepat (bukan tengah malam) untuk response rate lebih baik

## Performance

Dengan settings default:
- Batch size: 50 peserta
- Delay: 2 detik per pesan
- **Total durasi untuk 750 peserta**: ~25-30 menit

Perhitungan:
- 750 peserta ÷ 50 per batch = 15 batch
- 50 pesan × 2 detik = 100 detik per batch
- 15 batch × 100 detik = 1500 detik (~25 menit)

---

**Created**: February 28, 2026
**Version**: 1.0.0
