/*
  Warnings:

  - The `export_mode` column on the `compliance_settings` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ComplianceExportMode" AS ENUM ('EXCLUDE_INTERACTION', 'REDACT_PARTICIPANT');

-- AlterTable
ALTER TABLE "compliance_settings" DROP COLUMN "export_mode",
ADD COLUMN     "export_mode" "ComplianceExportMode" NOT NULL DEFAULT 'EXCLUDE_INTERACTION';
