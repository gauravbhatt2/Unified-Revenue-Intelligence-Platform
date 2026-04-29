-- Tenant-aware RLS helper
CREATE OR REPLACE FUNCTION app_current_tenant() RETURNS text AS $$
  SELECT nullif(current_setting('app.current_tenant', true), '');
$$ LANGUAGE SQL STABLE;

-- Enable RLS on tenant-scoped tables
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "interactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "interaction_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deal_contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "raw_interactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "export_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "compliance_settings" ENABLE ROW LEVEL SECURITY;

-- Force RLS so even table owner must satisfy policy
ALTER TABLE "accounts" FORCE ROW LEVEL SECURITY;
ALTER TABLE "contacts" FORCE ROW LEVEL SECURITY;
ALTER TABLE "deals" FORCE ROW LEVEL SECURITY;
ALTER TABLE "interactions" FORCE ROW LEVEL SECURITY;
ALTER TABLE "interaction_participants" FORCE ROW LEVEL SECURITY;
ALTER TABLE "deal_contacts" FORCE ROW LEVEL SECURITY;
ALTER TABLE "raw_interactions" FORCE ROW LEVEL SECURITY;
ALTER TABLE "export_logs" FORCE ROW LEVEL SECURITY;
ALTER TABLE "compliance_settings" FORCE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY tenant_isolation_accounts ON "accounts"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());

CREATE POLICY tenant_isolation_contacts ON "contacts"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());

CREATE POLICY tenant_isolation_deals ON "deals"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());

CREATE POLICY tenant_isolation_interactions ON "interactions"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());

CREATE POLICY tenant_isolation_interaction_participants ON "interaction_participants"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());

CREATE POLICY tenant_isolation_deal_contacts ON "deal_contacts"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());

CREATE POLICY tenant_isolation_raw_interactions ON "raw_interactions"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());

CREATE POLICY tenant_isolation_export_logs ON "export_logs"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());

CREATE POLICY tenant_isolation_compliance_settings ON "compliance_settings"
  USING ("tenant_id" = app_current_tenant())
  WITH CHECK ("tenant_id" = app_current_tenant());
