CREATE TABLE movements (
    id UUID PRIMARY KEY,

    batch_id UUID NOT NULL,

    movement_type VARCHAR(30) NOT NULL,

    title VARCHAR(120) NOT NULL,

    description VARCHAR(500),

    location_name VARCHAR(160),

    latitude NUMERIC(9, 6),

    longitude NUMERIC(9, 6),

    responsible_name VARCHAR(120),

    quantity NUMERIC(15, 3),

    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_movements_batch
        FOREIGN KEY (batch_id)
        REFERENCES batches(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_movements_type
        CHECK (
            movement_type IN (
                'PRODUCTION',
                'STORAGE',
                'DISPATCH',
                'IN_TRANSIT',
                'RECEIPT',
                'QUALITY_CHECK',
                'BLOCK',
                'RELEASE',
                'ADJUSTMENT',
                'COMPLETION'
            )
        ),

    CONSTRAINT ck_movements_quantity
        CHECK (
            quantity IS NULL
            OR quantity > 0
        ),

    CONSTRAINT ck_movements_coordinates
        CHECK (
            (
                latitude IS NULL
                AND longitude IS NULL
            )
            OR
            (
                latitude BETWEEN -90 AND 90
                AND longitude BETWEEN -180 AND 180
            )
        )
);

CREATE INDEX idx_movements_batch_id
    ON movements(batch_id);

CREATE INDEX idx_movements_occurred_at
    ON movements(occurred_at DESC);

CREATE INDEX idx_movements_type
    ON movements(movement_type);

CREATE INDEX idx_movements_location
    ON movements(location_name);