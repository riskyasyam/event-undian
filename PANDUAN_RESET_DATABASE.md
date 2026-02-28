# Panduan Reset Database (Fresh Migration + Seed)

Seperti `php artisan migrate:fresh --seed` di Laravel, berikut cara reset database di Next.js dengan Prisma:

---

## 🚀 Cara Tercepat (Recommended)

### Windows PowerShell:
```powershell
npm run db:fresh
```

### Atau jalankan script:
```powershell
.\scripts\reset-database.ps1
```

**Penjelasan:**
- Drop semua tabel
- Jalankan ulang semua migrations  
- Jalankan seed untuk isi data awal
- ⚠️ **HATI-HATI:** Semua data akan hilang!

---

## 📋 Metode Lainnya

### Metode 1: Reset Database Otomatis (Prisma Built-in)

```powershell
npm run prisma:reset
```

atau

```powershell
npx prisma migrate reset --force
```

### Metode 2: Manual Step-by-Step

```powershell
# 1. Drop database (atau delete file jika SQLite)
# Jika PostgreSQL/MySQL:
# DROP DATABASE mu_travel_undian;
# CREATE DATABASE mu_travel_undian;

# 2. Generate Prisma Client
npx prisma generate

# 3. Jalankan migrations
npx prisma migrate deploy

# 4. Jalankan seed
npm run seed
```

---

## 📦 Seed Data Yang Akan Dibuat

File seed berada di `prisma/seed.ts`, yang akan membuat:
- ✅ Admin user default (username: admin, password: admin123)
- ✅ Event "Milad MU Travel"
- ✅ Data contoh hadiah dan peserta (jika ada)

---

## 🛠️ Command Tambahan

### Cek Status Migration
```powershell
npx prisma migrate status
```

### Hanya Jalankan Seed (Tanpa Reset)
```powershell
npm run seed
```

### Buka Prisma Studio (GUI Database)
```powershell
npm run prisma:studio
```

### Generate Prisma Client
```powershell
npm run prisma:generate
```

---

## ⚠️ WARNING - PENTING!

**SEMUA DATA AKAN HILANG** saat menjalankan reset database!

❌ Jangan jalankan di production tanpa backup
✅ Pastikan backup data penting terlebih dahulu
✅ Gunakan hanya untuk development/testing

---

## 📊 Perbedaan dengan Laravel

| Laravel | Next.js (Prisma) |
|---------|------------------|
| `php artisan migrate:fresh --seed` | `npm run db:fresh` |
| `php artisan migrate:reset` | `npm run prisma:reset` |
| `php artisan migrate` | `npm run prisma:migrate` |
| `php artisan db:seed` | `npm run seed` |
| `php artisan migrate:status` | `npx prisma migrate status` |
| `php artisan db` | `npm run prisma:studio` |

---

## 🔧 Troubleshooting

### Error: "Database not found"
```powershell
# Buat database manual terlebih dahulu, lalu:
npx prisma migrate deploy
npm run seed
```

### Error: "Prisma Client not generated"
```powershell
npx prisma generate
```

### Error saat seed
```powershell
# Cek file seed.ts untuk error detail
npm run seed
```

---

## 💡 Tips

1. **Development**: Gunakan `npm run db:fresh` setiap kali struktur database berubah drastis
2. **Testing**: Reset database sebelum test untuk konsistensi
3. **Production**: JANGAN PERNAH reset database, gunakan migrations only

