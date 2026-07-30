CREATE TABLE suppliers (
    id UUID PRIMARY KEY,

    company_id UUID NOT NULL,

    legal_name VARCHAR(160) NOT NULL,

    trade_name VARCHAR(120) NOT NULL,

    tax_id VARCHAR(32),

    email VARCHAR(160),

    phone VARCHAR(32),

    city VARCHAR(120),

    state VARCHAR(80),

    country VARCHAR(80) NOT NULL DEFAULT 'Brasil',

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP WITH TIME ZONE
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP WITH TIME ZONE
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_suppliers_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE RESTRICT,

    CONSTRAINT uk_suppliers_company_tax_id
        UNIQUE (company_id, tax_id),

    CONSTRAINT ck_suppliers_status
        CHECK (
            status IN (
                'ACTIVE',
                'INACTIVE',
                'SUSPENDED'
            )
        )
);

CREATE INDEX idx_suppliers_company_id
    ON suppliers(company_id);

CREATE INDEX idx_suppliers_trade_name
    ON suppliers(trade_name);

CREATE INDEX idx_suppliers_status
    ON suppliers(status);

ALTER TABLE batches
    ADD COLUMN supplier_id UUID;

ALTER TABLE batches
    ADD CONSTRAINT fk_batches_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES suppliers(id)
        ON DELETE RESTRICT;

CREATE INDEX idx_batches_supplier_id
    ON batches(supplier_id);