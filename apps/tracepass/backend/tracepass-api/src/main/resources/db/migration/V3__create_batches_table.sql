CREATE TABLE batches (
    id UUID PRIMARY KEY,

    product_id UUID NOT NULL,

    batch_code VARCHAR(64) NOT NULL,

    manufacture_date DATE NOT NULL,

    expiration_date DATE,

    initial_quantity NUMERIC(15, 3) NOT NULL,

    current_quantity NUMERIC(15, 3) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'REGISTERED',

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_batches_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

    CONSTRAINT uk_batches_product_code
        UNIQUE (product_id, batch_code),

    CONSTRAINT ck_batches_status
        CHECK (
            status IN (
                'REGISTERED',
                'IN_STORAGE',
                'IN_TRANSIT',
                'BLOCKED',
                'COMPLETED',
                'EXPIRED'
            )
        ),

    CONSTRAINT ck_batches_initial_quantity
        CHECK (initial_quantity > 0),

    CONSTRAINT ck_batches_current_quantity
        CHECK (
            current_quantity >= 0
            AND current_quantity <= initial_quantity
        ),

    CONSTRAINT ck_batches_dates
        CHECK (
            expiration_date IS NULL
            OR expiration_date >= manufacture_date
        )
);

CREATE INDEX idx_batches_product_id
    ON batches(product_id);

CREATE INDEX idx_batches_code
    ON batches(batch_code);

CREATE INDEX idx_batches_status
    ON batches(status);

CREATE INDEX idx_batches_expiration_date
    ON batches(expiration_date);