-- CreateEnum
CREATE TYPE "TipePeserta" AS ENUM ('PESERTA', 'JAMAAH');

-- AlterTable
ALTER TABLE "hadiah" ADD COLUMN     "tipe_peserta" "TipePeserta" NOT NULL DEFAULT 'PESERTA';

-- AlterTable
ALTER TABLE "peserta" ADD COLUMN     "tipe" "TipePeserta" NOT NULL DEFAULT 'PESERTA';
