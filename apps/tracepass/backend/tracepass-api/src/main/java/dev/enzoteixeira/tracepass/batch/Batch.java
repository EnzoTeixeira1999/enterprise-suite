package dev.enzoteixeira.tracepass.batch;

import dev.enzoteixeira.tracepass.product.Product;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "batches")
public class Batch {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "batch_code", nullable = false, length = 64)
    private String batchCode;

    @Column(name = "manufacture_date", nullable = false)
    private LocalDate manufactureDate;

    @Column(name = "expiration_date")
    private LocalDate expirationDate;

    @Column(
            name = "initial_quantity",
            nullable = false,
            precision = 15,
            scale = 3
    )
    private BigDecimal initialQuantity;

    @Column(
            name = "current_quantity",
            nullable = false,
            precision = 15,
            scale = 3
    )
    private BigDecimal currentQuantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BatchStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected Batch() {
        // Construtor exigido pelo JPA
    }

    public Batch(
            Product product,
            String batchCode,
            LocalDate manufactureDate,
            LocalDate expirationDate,
            BigDecimal initialQuantity
    ) {
        this.id = UUID.randomUUID();
        this.product = product;
        this.batchCode = batchCode;
        this.manufactureDate = manufactureDate;
        this.expirationDate = expirationDate;
        this.initialQuantity = initialQuantity;
        this.currentQuantity = initialQuantity;
        this.status = BatchStatus.REGISTERED;
    }

    public void update(
            String batchCode,
            LocalDate manufactureDate,
            LocalDate expirationDate,
            BigDecimal currentQuantity,
            BatchStatus status
    ) {
        this.batchCode = batchCode;
        this.manufactureDate = manufactureDate;
        this.expirationDate = expirationDate;
        this.currentQuantity = currentQuantity;
        this.status = status;
    }

    public void changeStatus(BatchStatus status) {
    this.status = status;
    }

    @PrePersist
    private void beforeInsert() {
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

        if (id == null) {
            id = UUID.randomUUID();
        }

        if (status == null) {
            status = BatchStatus.REGISTERED;
        }

        if (currentQuantity == null) {
            currentQuantity = initialQuantity;
        }

        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    private void beforeUpdate() {
        updatedAt = OffsetDateTime.now(ZoneOffset.UTC);
    }

    public UUID getId() {
        return id;
    }

    public Product getProduct() {
        return product;
    }

    public String getBatchCode() {
        return batchCode;
    }

    public LocalDate getManufactureDate() {
        return manufactureDate;
    }

    public LocalDate getExpirationDate() {
        return expirationDate;
    }

    public BigDecimal getInitialQuantity() {
        return initialQuantity;
    }

    public BigDecimal getCurrentQuantity() {
        return currentQuantity;
    }

    public BatchStatus getStatus() {
        return status;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}