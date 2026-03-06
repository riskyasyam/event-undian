-- ⚠️ HATI-HATI: Script ini akan MENGHAPUS SEMUA DATA!
-- Gunakan hanya jika ingin reset total database production

-- Drop all data (cascade delete)
TRUNCATE TABLE "pemenang" CASCADE;
TRUNCATE TABLE "presensi" CASCADE;
TRUNCATE TABLE "hadiah" CASCADE;
TRUNCATE TABLE "peserta" CASCADE;
TRUNCATE TABLE "events" CASCADE;
TRUNCATE TABLE "admins" CASCADE;

-- Reset sequences jika ada
-- ALTER SEQUENCE jika diperlukan

SELECT 'Database production berhasil direset!' as status;
