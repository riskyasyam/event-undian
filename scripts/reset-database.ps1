#!/usr/bin/env pwsh
# Reset Database Script - Sama seperti "php artisan migrate:fresh --seed" di Laravel
# Script ini akan:
# 1. Drop semua tabel
# 2. Jalankan ulang migrations
# 3. Seed data awal

Write-Host "⚠️  WARNING: Semua data akan dihapus!" -ForegroundColor Red
Write-Host ""
$confirmation = Read-Host "Ketik 'YES' untuk melanjutkan reset database"

if ($confirmation -ne "YES") {
    Write-Host "❌ Reset database dibatalkan." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔄 Mereset database..." -ForegroundColor Cyan
Write-Host ""

# Reset database (drop, migrate, seed)
npx prisma migrate reset --force

Write-Host ""
Write-Host "✅ Database berhasil direset dan di-seed!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Untuk membuka Prisma Studio: npm run prisma:studio" -ForegroundColor Blue
