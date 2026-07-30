package dev.enzoteixeira.tracepass.supplier;

import dev.enzoteixeira.tracepass.company.Company;
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

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "suppliers")
public class Supplier {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "legal_name", nullable = false, length = 160)
    private String legalName;

    @Column(name = "trade_name", nullable = false, length = 120)
    private String tradeName;

    @Column(name = "tax_id", length = 32)
    private String taxId;

    @Column(length = 160)
    private String email;

    @Column(length = 32)
    private String phone;

    @Column(length = 120)
    private String city;

    @Column(length = 80)
    private String state;

    @Column(nullable = false, length = 80)
    private String country;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SupplierStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected Supplier() {
        // Construtor exigido pelo JPA
    }

    public Supplier(
            Company company,
            String legalName,
            String tradeName,
            String taxId,
            String email,
            String phone,
            String city,
            String state,
            String country
    ) {
        this.id = UUID.randomUUID();
        this.company = company;
        this.legalName = legalName;
        this.tradeName = tradeName;
        this.taxId = taxId;
        this.email = email;
        this.phone = phone;
        this.city = city;
        this.state = state;
        this.country = country;
        this.status = SupplierStatus.ACTIVE;
    }

    public void update(
            String legalName,
            String tradeName,
            String taxId,
            String email,
            String phone,
            String city,
            String state,
            String country,
            SupplierStatus status
    ) {
        this.legalName = legalName;
        this.tradeName = tradeName;
        this.taxId = taxId;
        this.email = email;
        this.phone = phone;
        this.city = city;
        this.state = state;
        this.country = country;
        this.status = status;
    }

    @PrePersist
    private void beforeInsert() {
        OffsetDateTime now =
                OffsetDateTime.now(ZoneOffset.UTC);

        if (id == null) {
            id = UUID.randomUUID();
        }

        if (status == null) {
            status = SupplierStatus.ACTIVE;
        }

        if (country == null || country.isBlank()) {
            country = "Brasil";
        }

        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    private void beforeUpdate() {
        updatedAt =
                OffsetDateTime.now(ZoneOffset.UTC);
    }

    public UUID getId() {
        return id;
    }

    public Company getCompany() {
        return company;
    }

    public String getLegalName() {
        return legalName;
    }

    public String getTradeName() {
        return tradeName;
    }

    public String getTaxId() {
        return taxId;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getCity() {
        return city;
    }

    public String getState() {
        return state;
    }

    public String getCountry() {
        return country;
    }

    public SupplierStatus getStatus() {
        return status;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}