-- Drop duplicate presensi records, keeping only the first one for each peserta
DELETE FROM presensi
WHERE id NOT IN (
  SELECT MIN(id)
  FROM presensi
  GROUP BY peserta_id
);

-- Add unique constraint on peserta_id to prevent duplicate presensi
ALTER TABLE presensi ADD CONSTRAINT presensi_peserta_id_key UNIQUE (peserta_id);
