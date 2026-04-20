-- Performance indexes for admin listing and stats endpoints
CREATE INDEX "peserta_event_id_tipe_created_at_idx" ON "peserta"("event_id", "tipe", "created_at");

CREATE INDEX "peserta_event_id_tipe_status_hadir_sudah_menang_idx"
ON "peserta"("event_id", "tipe", "status_hadir", "sudah_menang");

CREATE INDEX "hadiah_event_id_urutan_idx" ON "hadiah"("event_id", "urutan");

CREATE INDEX "pemenang_hadiah_id_drawn_at_idx" ON "pemenang"("hadiah_id", "drawn_at");
