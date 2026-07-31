package dev.enzoteixeira.tracepass.incident;

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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

@Entity
@Table(name = "traceability_incidents")
public class TraceabilityIncident {

    @Id
    @Column(nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "batch_id", nullable = false)
    private Batch batch;

    @Enumerated(EnumType.STRING)
    @Column(name = "incident_type", nullable = false, length = 30)
    private IncidentType incidentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IncidentSeverity severity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private IncidentStatus status;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(name = "location_name", length = 160)
    private String locationName;

    @Column(name = "reported_by", length = 120)
    private String reportedBy;

    @Column(name = "automatic_block", nullable = false)
    private boolean automaticBlock;

    @Column(name = "occurred_at", nullable = false)
    private OffsetDateTime occurredAt;

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;

    @Column(name = "resolution_notes", length = 1000)
    private String resolutionNotes;

    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected TraceabilityIncident() {
        // Construtor exigido pelo JPA
    }

    public TraceabilityIncident(
            Batch batch,
            IncidentType incidentType,
            IncidentSeverity severity,
            String title,
            String description,
            String locationName,
            String reportedBy,
            OffsetDateTime occurredAt
    ) {
        this.id = UUID.randomUUID();
        this.batch = batch;
        this.incidentType = incidentType;
        this.severity = severity;
        this.status = IncidentStatus.OPEN;
        this.title = title;
        this.description = description;
        this.locationName = locationName;
        this.reportedBy = reportedBy;
        this.occurredAt = occurredAt;
        this.automaticBlock =
                severity.requiresAutomaticBlock();
    }

    public void startInvestigation() {
        if (status == IncidentStatus.RESOLVED) {
            throw new IllegalStateException(
                    "Uma ocorrência resolvida não pode voltar para investigação"
            );
        }

        status = IncidentStatus.INVESTIGATING;
    }

    public void resolve(String resolutionNotes) {
        if (status == IncidentStatus.RESOLVED) {
            throw new IllegalStateException(
                    "A ocorrência já foi resolvida"
            );
        }

        status = IncidentStatus.RESOLVED;
        this.resolutionNotes = resolutionNotes;
        resolvedAt = OffsetDateTime.now(ZoneOffset.UTC);
    }

    @PrePersist
    private void beforeInsert() {
        OffsetDateTime now =
                OffsetDateTime.now(ZoneOffset.UTC);

        if (id == null) {
            id = UUID.randomUUID();
        }

        if (status == null) {
            status = IncidentStatus.OPEN;
        }

        if (severity != null) {
            automaticBlock =
                    severity.requiresAutomaticBlock();
        }

        if (occurredAt == null) {
            occurredAt = now;
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

    public Batch getBatch() {
        return batch;
    }

    public IncidentType getIncidentType() {
        return incidentType;
    }

    public IncidentSeverity getSeverity() {
        return severity;
    }

    public IncidentStatus getStatus() {
        return status;
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

    public String getReportedBy() {
        return reportedBy;
    }

    public boolean isAutomaticBlock() {
        return automaticBlock;
    }

    public OffsetDateTime getOccurredAt() {
        return occurredAt;
    }

    public OffsetDateTime getResolvedAt() {
        return resolvedAt;
    }

    public String getResolutionNotes() {
        return resolutionNotes;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}