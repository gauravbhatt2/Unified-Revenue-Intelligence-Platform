-- AlterTable
ALTER TABLE "export_logs" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "error_msg" TEXT,
ADD COLUMN     "status" TEXT;
