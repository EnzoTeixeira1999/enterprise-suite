package dev.enzoteixeira.tracepass.passport.dto;

import dev.enzoteixeira.tracepass.incident.IncidentSeverity;
import dev.enzoteixeira.tracepass.incident.IncidentStatus;
import dev.enzoteixeira.tracepass.incident.IncidentType;
import dev.enzoteixeira.tracepass.incident.TraceabilityIncident;

import java.time.OffsetDateTime;
import java.util.UUID;

public record PublicIncidentResponse(
        UUID id,
        IncidentType incidentType,
        IncidentSeverity severity,
        IncidentStatus status,
        String title,
        boolean automaticBlock,
        OffsetDateTime occurredAt,
        OffsetDateTime resolvedAt
) {

    public static PublicIncidentResponse from(
            TraceabilityIncident incident
    ) {
        return new PublicIncidentResponse(
                incident.getId(),
                incident.getIncidentType(),
                incident.getSeverity(),
                incident.getStatus(),
                incident.getTitle(),
                incident.isAutomaticBlock(),
                incident.getOccurredAt(),
                incident.getResolvedAt()
        );
    }
}