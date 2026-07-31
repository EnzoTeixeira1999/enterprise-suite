package dev.enzoteixeira.tracepass.passport.dto;

import dev.enzoteixeira.tracepass.batch.BatchStatus;
import dev.enzoteixeira.tracepass.incident.IncidentSeverity;
import dev.enzoteixeira.tracepass.incident.IncidentStatus;

import java.util.List;

public record PassportSafetyResponse(
        String status,
        int totalIncidents,
        int activeIncidents,
        int resolvedIncidents,
        int criticalActiveIncidents,
        boolean hasAutomaticBlocks,
        List<PublicIncidentResponse> incidents
) {

    public static PassportSafetyResponse from(
            BatchStatus batchStatus,
            List<PublicIncidentResponse> incidents
    ) {
        int activeIncidents = (int) incidents
                .stream()
                .filter(incident ->
                        incident.status()
                                != IncidentStatus.RESOLVED
                )
                .count();

        int resolvedIncidents =
                incidents.size() - activeIncidents;

        int criticalActiveIncidents = (int) incidents
                .stream()
                .filter(incident ->
                        incident.status()
                                != IncidentStatus.RESOLVED
                                && (
                                incident.severity()
                                        == IncidentSeverity.HIGH
                                        || incident.severity()
                                        == IncidentSeverity.CRITICAL
                        )
                )
                .count();

        boolean hasAutomaticBlocks =
                incidents
                        .stream()
                        .anyMatch(
                                PublicIncidentResponse::automaticBlock
                        );

        String safetyStatus;

        if (batchStatus == BatchStatus.BLOCKED) {
            safetyStatus = "BLOCKED";
        } else if (activeIncidents > 0) {
            safetyStatus = "ATTENTION";
        } else {
            safetyStatus = "CLEAR";
        }

        return new PassportSafetyResponse(
                safetyStatus,
                incidents.size(),
                activeIncidents,
                resolvedIncidents,
                criticalActiveIncidents,
                hasAutomaticBlocks,
                incidents
        );
    }
}