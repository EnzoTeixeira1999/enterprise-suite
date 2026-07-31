package dev.enzoteixeira.tracepass.incident;

import dev.enzoteixeira.tracepass.batch.Batch;
import dev.enzoteixeira.tracepass.batch.BatchRepository;
import dev.enzoteixeira.tracepass.batch.BatchStatus;
import dev.enzoteixeira.tracepass.incident.dto.CreateIncidentRequest;
import dev.enzoteixeira.tracepass.incident.dto.IncidentResponse;
import dev.enzoteixeira.tracepass.incident.dto.ReleaseBatchRequest;
import dev.enzoteixeira.tracepass.incident.dto.ResolveIncidentRequest;
import dev.enzoteixeira.tracepass.movement.MovementService;
import dev.enzoteixeira.tracepass.movement.MovementType;
import dev.enzoteixeira.tracepass.movement.dto.CreateMovementRequest;
import dev.enzoteixeira.tracepass.movement.dto.MovementResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import dev.enzoteixeira.tracepass.passport.dto.PublicIncidentResponse;


import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class IncidentService {

    private final TraceabilityIncidentRepository
            incidentRepository;

    private final BatchRepository batchRepository;

    private final MovementService movementService;

    public IncidentService(
            TraceabilityIncidentRepository incidentRepository,
            BatchRepository batchRepository,
            MovementService movementService
    ) {
        this.incidentRepository =
                incidentRepository;

        this.batchRepository =
                batchRepository;

        this.movementService =
                movementService;
    }

    @Transactional
    public IncidentResponse create(
            UUID companyId,
            UUID productId,
            UUID batchId,
            CreateIncidentRequest request
    ) {
        Batch batch = findBatch(
                companyId,
                productId,
                batchId
        );

        TraceabilityIncident incident =
                new TraceabilityIncident(
                        batch,
                        request.incidentType(),
                        request.severity(),
                        request.title().trim(),
                        normalizeOptional(
                                request.description()
                        ),
                        normalizeOptional(
                                request.locationName()
                        ),
                        normalizeOptional(
                                request.reportedBy()
                        ),
                        request.occurredAt()
                );

        if (
                request.severity()
                        .requiresAutomaticBlock()
        ) {
            batch.changeStatus(
                    BatchStatus.BLOCKED
            );

            batchRepository.save(batch);
        }

        TraceabilityIncident savedIncident =
                incidentRepository.save(incident);

        return IncidentResponse.from(
                savedIncident
        );
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> findAllByBatch(
            UUID companyId,
            UUID productId,
            UUID batchId
    ) {
        findBatch(
                companyId,
                productId,
                batchId
        );

        return incidentRepository
                .findAllByBatchIdOrderByOccurredAtDesc(
                        batchId
                )
                .stream()
                .map(IncidentResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> findAllByCompany(
            UUID companyId
    ) {
        return incidentRepository
                .findAllByBatchProductCompanyIdOrderByOccurredAtDesc(
                        companyId
                )
                .stream()
                .map(IncidentResponse::from)
                .toList();
    }

        @Transactional(readOnly = true)
    public List<PublicIncidentResponse> findAllPublic(
            UUID batchId
    ) {
        if (!batchRepository.existsById(batchId)) {
            throw new NoSuchElementException(
                    "Passaporte do lote não encontrado"
            );
        }

        return incidentRepository
                .findAllByBatchIdOrderByOccurredAtDesc(
                        batchId
                )
                .stream()
                .map(PublicIncidentResponse::from)
                .toList();
    }

    @Transactional
    public IncidentResponse startInvestigation(
            UUID companyId,
            UUID productId,
            UUID batchId,
            UUID incidentId
    ) {
        TraceabilityIncident incident =
                findIncident(
                        companyId,
                        productId,
                        batchId,
                        incidentId
                );

        incident.startInvestigation();

        TraceabilityIncident updatedIncident =
                incidentRepository.saveAndFlush(
                        incident
                );

        return IncidentResponse.from(
                updatedIncident
        );
    }

    @Transactional
    public IncidentResponse resolve(
            UUID companyId,
            UUID productId,
            UUID batchId,
            UUID incidentId,
            ResolveIncidentRequest request
    ) {
        TraceabilityIncident incident =
                findIncident(
                        companyId,
                        productId,
                        batchId,
                        incidentId
                );

        incident.resolve(
                request.resolutionNotes().trim()
        );

        TraceabilityIncident updatedIncident =
                incidentRepository.saveAndFlush(
                        incident
                );

        return IncidentResponse.from(
                updatedIncident
        );
    }

    @Transactional
    public MovementResponse releaseBatch(
            UUID companyId,
            UUID productId,
            UUID batchId,
            ReleaseBatchRequest request
    ) {
        Batch batch = findBatch(
                companyId,
                productId,
                batchId
        );

        if (
                batch.getStatus()
                        != BatchStatus.BLOCKED
        ) {
            throw new IllegalStateException(
                    "Somente lotes bloqueados podem ser liberados"
            );
        }

        long unresolvedIncidents =
                incidentRepository
                        .countByBatchIdAndStatusNot(
                                batchId,
                                IncidentStatus.RESOLVED
                        );

        if (unresolvedIncidents > 0) {
            throw new IllegalStateException(
                    "Todas as ocorrências precisam estar resolvidas antes da liberação"
            );
        }

        CreateMovementRequest movementRequest =
                new CreateMovementRequest(
                        MovementType.RELEASE,
                        "Lote liberado após inspeção",
                        request.releaseNotes().trim(),
                        normalizeOptional(
                                request.locationName()
                        ),
                        request.latitude(),
                        request.longitude(),
                        request.releasedBy().trim(),
                        batch.getCurrentQuantity(),
                        OffsetDateTime.now(
                                ZoneOffset.UTC
                        )
                );

        return movementService.create(
                companyId,
                productId,
                batchId,
                movementRequest
        );
    }

    @Transactional(readOnly = true)
    public long countOpenByBatch(
            UUID companyId,
            UUID productId,
            UUID batchId
    ) {
        findBatch(
                companyId,
                productId,
                batchId
        );

        return incidentRepository
                .countByBatchIdAndStatusNot(
                        batchId,
                        IncidentStatus.RESOLVED
                );
    }

    private Batch findBatch(
            UUID companyId,
            UUID productId,
            UUID batchId
    ) {
        Batch batch = batchRepository
                .findByIdAndProduct_Id(
                        batchId,
                        productId
                )
                .orElseThrow(() ->
                        new NoSuchElementException(
                                "Lote não encontrado para este produto"
                        )
                );

        UUID batchCompanyId =
                batch
                        .getProduct()
                        .getCompany()
                        .getId();

        if (!batchCompanyId.equals(companyId)) {
            throw new NoSuchElementException(
                    "Lote não encontrado para esta empresa"
            );
        }

        return batch;
    }

    private TraceabilityIncident findIncident(
            UUID companyId,
            UUID productId,
            UUID batchId,
            UUID incidentId
    ) {
        TraceabilityIncident incident =
                incidentRepository
                        .findById(incidentId)
                        .orElseThrow(() ->
                                new NoSuchElementException(
                                        "Ocorrência não encontrada"
                                )
                        );

        Batch batch = incident.getBatch();

        boolean belongsToRoute =
                batch.getId().equals(batchId)
                        && batch
                        .getProduct()
                        .getId()
                        .equals(productId)
                        && batch
                        .getProduct()
                        .getCompany()
                        .getId()
                        .equals(companyId);

        if (!belongsToRoute) {
            throw new NoSuchElementException(
                    "Ocorrência não encontrada para este lote"
            );
        }

        return incident;
    }

    private String normalizeOptional(
            String value
    ) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();

        return normalized.isEmpty()
                ? null
                : normalized;
    }
}