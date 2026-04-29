CREATE OR REPLACE FUNCTION prevent_export_log_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'export_logs is immutable';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS export_logs_no_update ON "export_logs";
DROP TRIGGER IF EXISTS export_logs_no_delete ON "export_logs";

CREATE TRIGGER export_logs_no_update
BEFORE UPDATE ON "export_logs"
FOR EACH ROW
EXECUTE FUNCTION prevent_export_log_mutation();

CREATE TRIGGER export_logs_no_delete
BEFORE DELETE ON "export_logs"
FOR EACH ROW
EXECUTE FUNCTION prevent_export_log_mutation();
