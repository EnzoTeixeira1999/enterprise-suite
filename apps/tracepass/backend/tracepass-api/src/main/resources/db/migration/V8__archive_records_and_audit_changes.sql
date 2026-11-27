ALTER TABLE companies ADD COLUMN archived_at timestamptz;
ALTER TABLE products ADD COLUMN archived_at timestamptz;
ALTER TABLE suppliers ADD COLUMN archived_at timestamptz;
ALTER TABLE batches ADD COLUMN archived_at timestamptz;
ALTER TABLE movements ADD COLUMN archived_at timestamptz;

CREATE TABLE tracepass_audit (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    entity varchar(24) NOT NULL,
    record_id uuid NOT NULL,
    action varchar(12) NOT NULL CHECK (action IN ('EDITED', 'ARCHIVED')),
    reason varchar(500),
    before_data jsonb NOT NULL,
    after_data jsonb NOT NULL,
    recorded_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE FUNCTION tracepass_audit_update() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    before_row jsonb := to_jsonb(OLD) - 'updated_at';
    after_row jsonb := to_jsonb(NEW) - 'updated_at';
    archiving boolean := OLD.archived_at IS NULL AND NEW.archived_at IS NOT NULL;
BEGIN
    IF OLD.archived_at IS NOT NULL AND before_row IS DISTINCT FROM after_row THEN
        RAISE EXCEPTION 'Registro arquivado' USING ERRCODE = '23514';
    END IF;

    -- Status changes caused by movements do not duplicate those events in the audit.
    IF TG_TABLE_NAME = 'batches' AND NOT archiving
        AND before_row - 'status' = after_row - 'status' THEN
        RETURN NEW;
    END IF;

    IF before_row IS DISTINCT FROM after_row THEN
        INSERT INTO tracepass_audit (entity, record_id, action, reason, before_data, after_data)
        VALUES (TG_TABLE_NAME, OLD.id, CASE WHEN archiving THEN 'ARCHIVED' ELSE 'EDITED' END,
                CASE WHEN archiving THEN nullif(current_setting('tracepass.archive_reason', true), '') END,
                to_jsonb(OLD), to_jsonb(NEW));
    END IF;
    RETURN NEW;
END;
$$;

DO $$
DECLARE relation text;
BEGIN
    FOREACH relation IN ARRAY ARRAY['companies', 'products', 'suppliers', 'batches', 'movements'] LOOP
        EXECUTE format('CREATE TRIGGER tracepass_record_audit AFTER UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION tracepass_audit_update()', relation);
    END LOOP;
END;
$$;

CREATE FUNCTION tracepass_require_active_parent() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF TG_TABLE_NAME IN ('products', 'suppliers') THEN
        PERFORM id FROM companies WHERE id = NEW.company_id AND archived_at IS NULL FOR SHARE;
    ELSIF TG_TABLE_NAME = 'batches' THEN
        IF NEW.supplier_id IS NOT NULL THEN
            PERFORM id FROM suppliers WHERE id = NEW.supplier_id AND archived_at IS NULL FOR SHARE;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Fornecedor arquivado' USING ERRCODE = '23514';
            END IF;
        END IF;
        PERFORM id FROM products WHERE id = NEW.product_id AND archived_at IS NULL FOR SHARE;
    ELSE
        PERFORM id FROM batches WHERE id = NEW.batch_id AND archived_at IS NULL FOR SHARE;
    END IF;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Registro vinculado arquivado' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER active_company_for_product BEFORE INSERT OR UPDATE OF company_id ON products FOR EACH ROW EXECUTE FUNCTION tracepass_require_active_parent();
CREATE TRIGGER active_company_for_supplier BEFORE INSERT OR UPDATE OF company_id ON suppliers FOR EACH ROW EXECUTE FUNCTION tracepass_require_active_parent();
CREATE TRIGGER active_records_for_batch BEFORE INSERT OR UPDATE OF product_id, supplier_id ON batches FOR EACH ROW EXECUTE FUNCTION tracepass_require_active_parent();
CREATE TRIGGER active_batch_for_movement BEFORE INSERT ON movements FOR EACH ROW EXECUTE FUNCTION tracepass_require_active_parent();
CREATE TRIGGER active_batch_for_incident BEFORE INSERT OR UPDATE ON traceability_incidents FOR EACH ROW EXECUTE FUNCTION tracepass_require_active_parent();
