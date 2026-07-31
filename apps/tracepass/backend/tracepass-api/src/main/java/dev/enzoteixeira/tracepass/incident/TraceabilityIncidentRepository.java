package dev.enzoteixeira.tracepass.incident;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TraceabilityIncidentRepository
        extends JpaRepository<TraceabilityIncident, UUID> {

    List<TraceabilityIncident>
    findAllByBatchIdOrderByOccurredAtDesc(
            UUID batchId
    );

    List<TraceabilityIncident>
    findAllByBatchProductCompanyIdOrderByOccurredAtDesc(
            UUID companyId
    );

    long countByBatchIdAndStatusNot(
            UUID batchId,
            IncidentStatus status
    );
}