# Seed Production Database - Vercel

Write-Host "🌱 Seed Database Production Vercel" -ForegroundColor Cyan
Write-Host ""

# Minta URL production
$productionUrl = Read-Host "Masukkan URL production Vercel (contoh: https://mu-travel-undian.vercel.app)"

# Minta secret key
Write-Host ""
Write-Host "Secret key ada di Vercel Dashboard > Settings > Environment Variables > SEED_SECRET" -ForegroundColor Yellow
$secretKey = Read-Host "Masukkan SEED_SECRET"

Write-Host ""
Write-Host "🔄 Mengirim request seed..." -ForegroundColor Cyan

# Call seed API
$response = Invoke-RestMethod -Uri "$productionUrl/api/seed" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{
        secret = $secretKey
    } | ConvertTo-Json)

Write-Host ""
if ($response.success) {
    Write-Host "✅ Database berhasil di-seed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Admin credentials:" -ForegroundColor Yellow
    Write-Host "  Username: admin" -ForegroundColor White
    Write-Host "  Password: admin123" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  Jangan lupa ganti password setelah login pertama kali!" -ForegroundColor Red
} else {
    Write-Host "❌ Seed gagal: $($response.message)" -ForegroundColor Red
}

Write-Host ""
