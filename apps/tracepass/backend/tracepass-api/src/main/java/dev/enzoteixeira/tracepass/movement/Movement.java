package dev.enzoteixeira.tracepass.movement;

import dev.enzoteixeira.tracepass.batch.Batch;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "movements")
public class Movement {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "batch_id", nullable = false)
    private Batch batch;

    @Enumerated(EnumType.STRING)
    @Column(name = "movement_type", nullable = false, length = 30)
    private MovementType movementType;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(length = 500)
    private String description;

    @Column(name = "location_name", length = 160)
    private String locationName;

    @Column(precision = 9, scale = 6)
    private BigDecimal latitude;

    @Column(precision = 9, scale = 6)
    private BigDecimal longitude;

    @Column(name = "responsible_name", length = 120)
    private String responsibleName;

    @Column(precision = 15, scale = 3)
    private BigDecimal quantity;

    @Column(name = "occurred_at", nullable = false)
    private OffsetDateTime occurredAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    protected Movement() {
        // Construtor exigido pelo JPA
    }

    public Movement(
            Batch batch,
            MovementType movementType,
            String title,
            String description,
            String locationName,
            BigDecimal latitude,
            BigDecimal longitude,
            String responsibleName,
            BigDecimal quantity,
            OffsetDateTime occurredAt
    ) {
        this.id = UUID.randomUUID();
        this.batch = batch;
        this.movementType = movementType;
        this.title = title;
        this.description = description;
        this.locationName = locationName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.responsibleName = responsibleName;
        this.quantity = quantity;
        this.occurredAt = occurredAt;
    }

    @PrePersist
    private void beforeInsert() {
        if (id == null) {
            id = UUID.randomUUID();
        }

        if (occurredAt == null) {
            occurredAt = OffsetDateTime.now(ZoneOffset.UTC);
        }

        createdAt = OffsetDateTime.now(ZoneOffset.UTC);
    }

    public UUID getId() {
        return id;
    }

    public Batch getBatch() {
        return batch;
    }

    public MovementType getMovementType() {
        return movementType;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getLocationName() {
        return locationName;
    }

    public BigDecimal getLatitude() {
        return latitude;
    }

    public BigDecimal getLongitude() {
        return longitude;
    }

    public String getResponsibleName() {
        return responsibleName;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public OffsetDateTime getOccurredAt() {
        return occurredAt;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}