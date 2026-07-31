package dev.enzoteixeira.tracepass.incident.dto;

import dev.enzoteixeira.tracepass.batch.BatchStatus;
import dev.enzoteixeira.tracepass.incident.IncidentSeverity;
import dev.enzoteixeira.tracepass.incident.IncidentStatus;
import dev.enzoteixeira.tracepass.incident.IncidentType;
import dev.enzoteixeira.tracepass.incident.TraceabilityIncident;

import java.time.OffsetDateTime;
import java.util.UUID;

public record IncidentResponse(
        UUID id,

        UUID companyId,
        String companyName,

        UUID productId,
        String productName,
        String productSku,

        UUID batchId,
        String batchCode,
        BatchStatus batchStatus,

        IncidentType incidentType,
        IncidentSeverity severity,
        IncidentStatus status,

        String title,
        String description,
        String locationName,
        String reportedBy,

        boolean automaticBlock,

        OffsetDateTime occurredAt,
        OffsetDateTime resolvedAt,
        String resolutionNotes,

        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {

    public static IncidentResponse from(
            TraceabilityIncident incident
    ) {
        var batch = incident.getBatch();
        var product = batch.getProduct();
        var company = product.getCompany();

        return new IncidentResponse(
                incident.getId(),

                company.getId(),
                company.getTradeName(),

                product.getId(),
                product.getName(),
                product.getSku(),

                batch.getId(),
                batch.getBatchCode(),
                batch.getStatus(),

                incident.getIncidentType(),
                incident.getSeverity(),
                incident.getStatus(),

                incident.getTitle(),
                incident.getDescription(),
                incident.getLocationName(),
                incident.getReportedBy(),

                incident.isAutomaticBlock(),

                incident.getOccurredAt(),
                incident.getResolvedAt(),
                incident.getResolutionNotes(),

                incident.getCreatedAt(),
                incident.getUpdatedAt()
        );
    }
}