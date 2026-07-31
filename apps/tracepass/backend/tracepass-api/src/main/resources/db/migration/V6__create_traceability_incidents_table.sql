CREATE TABLE traceability_incidents (
    id UUID PRIMARY KEY,

    batch_id UUID NOT NULL,

    incident_type VARCHAR(30) NOT NULL,

    severity VARCHAR(20) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',

    title VARCHAR(160) NOT NULL,

    description VARCHAR(1000),

    location_name VARCHAR(160),

    reported_by VARCHAR(120),

    automatic_block BOOLEAN NOT NULL DEFAULT FALSE,

    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,

    resolved_at TIMESTAMP WITH TIME ZONE,

    resolution_notes VARCHAR(1000),

    created_at TIMESTAMP WITH TIME ZONE
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP WITH TIME ZONE
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_traceability_incidents_batch
        FOREIGN KEY (batch_id)
        REFERENCES batches(id)
        ON DELETE RESTRICT,

    CONSTRAINT ck_traceability_incidents_type
        CHECK (
            incident_type IN (
                'QUALITY_DEVIATION',
                'TEMPERATURE_ALERT',
                'DAMAGE',
                'DOCUMENTATION',
                'DELIVERY_DELAY',
                'OTHER'
            )
        ),

    CONSTRAINT ck_traceability_incidents_severity
        CHECK (
            severity IN (
                'LOW',
                'MEDIUM',
                'HIGH',
                'CRITICAL'
            )
        ),

    CONSTRAINT ck_traceability_incidents_status
        CHECK (
            status IN (
                'OPEN',
                'INVESTIGATING',
                'RESOLVED'
            )
        ),

    CONSTRAINT ck_traceability_incidents_resolution
        CHECK (
            resolved_at IS NULL
            OR resolved_at >= occurred_at
        )
);

CREATE INDEX idx_traceability_incidents_batch_id
    ON traceability_incidents(batch_id);

CREATE INDEX idx_traceability_incidents_status
    ON traceability_incidents(status);

CREATE INDEX idx_traceability_incidents_severity
    ON traceability_incidents(severity);

CREATE INDEX idx_traceability_incidents_occurred_at
    ON traceability_incidents(occurred_at);