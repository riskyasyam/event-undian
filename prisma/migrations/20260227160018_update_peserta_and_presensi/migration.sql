-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "nama_event" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "lokasi" TEXT NOT NULL,
    "deskripsi" TEXT,
    "waktu_undian" TIMESTAMP(3),
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peserta" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "kode_unik" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "nomor_telepon" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "qr_code_url" TEXT,
    "status_hadir" BOOLEAN NOT NULL DEFAULT false,
    "sudah_menang" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "peserta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presensi" (
    "id" TEXT NOT NULL,
    "peserta_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "waktu_hadir" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metode" TEXT NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presensi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hadiah" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "nama_hadiah" TEXT NOT NULL,
    "deskripsi" TEXT,
    "gambar_url" TEXT,
    "jumlah_pemenang" INTEGER NOT NULL DEFAULT 1,
    "urutan" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hadiah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pemenang" (
    "id" TEXT NOT NULL,
    "peserta_id" TEXT NOT NULL,
    "hadiah_id" TEXT NOT NULL,
    "drawn_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pemenang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "peserta_kode_unik_key" ON "peserta"("kode_unik");

-- CreateIndex
CREATE UNIQUE INDEX "peserta_token_key" ON "peserta"("token");

-- CreateIndex
CREATE INDEX "peserta_event_id_idx" ON "peserta"("event_id");

-- CreateIndex
CREATE INDEX "peserta_kode_unik_idx" ON "peserta"("kode_unik");

-- CreateIndex
CREATE INDEX "peserta_token_idx" ON "peserta"("token");

-- CreateIndex
CREATE INDEX "peserta_status_hadir_sudah_menang_idx" ON "peserta"("status_hadir", "sudah_menang");

-- CreateIndex
CREATE INDEX "presensi_peserta_id_idx" ON "presensi"("peserta_id");

-- CreateIndex
CREATE INDEX "presensi_event_id_idx" ON "presensi"("event_id");

-- CreateIndex
CREATE INDEX "hadiah_event_id_idx" ON "hadiah"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "pemenang_peserta_id_key" ON "pemenang"("peserta_id");

-- CreateIndex
CREATE INDEX "pemenang_hadiah_id_idx" ON "pemenang"("hadiah_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- AddForeignKey
ALTER TABLE "peserta" ADD CONSTRAINT "peserta_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presensi" ADD CONSTRAINT "presensi_peserta_id_fkey" FOREIGN KEY ("peserta_id") REFERENCES "peserta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hadiah" ADD CONSTRAINT "hadiah_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemenang" ADD CONSTRAINT "pemenang_peserta_id_fkey" FOREIGN KEY ("peserta_id") REFERENCES "peserta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemenang" ADD CONSTRAINT "pemenang_hadiah_id_fkey" FOREIGN KEY ("hadiah_id") REFERENCES "hadiah"("id") ON DELETE CASCADE ON UPDATE CASCADE;
