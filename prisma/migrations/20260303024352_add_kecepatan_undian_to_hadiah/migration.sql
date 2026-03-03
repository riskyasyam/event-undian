-- CreateEnum
CREATE TYPE "KecepatanUndian" AS ENUM ('NORMAL', 'DRAMATIS');

-- AlterTable
ALTER TABLE "hadiah" ADD COLUMN     "kecepatan_undian" "KecepatanUndian" NOT NULL DEFAULT 'NORMAL';
