CREATE TABLE products (
    id UUID PRIMARY KEY,

    company_id UUID NOT NULL,

    sku VARCHAR(64) NOT NULL,

    name VARCHAR(160) NOT NULL,

    description VARCHAR(500),

    category VARCHAR(100),

    unit VARCHAR(20) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_products_company
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE RESTRICT,

    CONSTRAINT uk_products_company_sku
        UNIQUE (company_id, sku),

    CONSTRAINT ck_products_status
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'DISCONTINUED')),

    CONSTRAINT ck_products_unit
        CHECK (unit IN ('UNIT', 'KG', 'LITER', 'BOX', 'METER'))
);

CREATE INDEX idx_products_company_id
    ON products(company_id);

CREATE INDEX idx_products_name
    ON products(name);