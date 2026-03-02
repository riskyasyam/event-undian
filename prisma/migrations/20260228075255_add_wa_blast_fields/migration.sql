-- CreateEnum
CREATE TYPE "WaStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "peserta" ADD COLUMN     "wa_error" TEXT,
ADD COLUMN     "wa_sent_at" TIMESTAMP(3),
ADD COLUMN     "wa_status" "WaStatus" NOT NULL DEFAULT 'PENDING';
