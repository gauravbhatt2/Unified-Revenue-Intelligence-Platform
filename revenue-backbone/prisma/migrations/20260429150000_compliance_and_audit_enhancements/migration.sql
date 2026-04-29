-- Contact compliance metadata
ALTER TABLE "contacts"
ADD COLUMN "opt_out_reason" TEXT,
ADD COLUMN "opted_out_at" TIMESTAMP(3);

-- Export log metadata
ALTER TABLE "export_logs"
ADD COLUMN "redacted_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "requested_by" TEXT,
ADD COLUMN "filters" JSONB;

-- Tenant-level compliance settings
CREATE TABLE "compliance_settings" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "export_mode" TEXT NOT NULL DEFAULT 'EXCLUDE_INTERACTION',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "compliance_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "compliance_settings_tenant_id_key" ON "compliance_settings"("tenant_id");
CREATE INDEX "compliance_settings_tenant_id_idx" ON "compliance_settings"("tenant_id");

ALTER TABLE "compliance_settings"
ADD CONSTRAINT "compliance_settings_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
