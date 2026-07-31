package dev.enzoteixeira.tracepass.passport;

import dev.enzoteixeira.tracepass.batch.BatchService;
import dev.enzoteixeira.tracepass.batch.dto.BatchResponse;
import dev.enzoteixeira.tracepass.incident.IncidentService;
import dev.enzoteixeira.tracepass.movement.MovementService;
import dev.enzoteixeira.tracepass.movement.dto.MovementResponse;
import dev.enzoteixeira.tracepass.passport.dto.PassportResponse;
import dev.enzoteixeira.tracepass.passport.dto.PassportSafetyResponse;
import dev.enzoteixeira.tracepass.passport.dto.PublicIncidentResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
public class PassportService {

    private final BatchService batchService;

    private final MovementService movementService;

    private final IncidentService incidentService;

    public PassportService(
            BatchService batchService,
            MovementService movementService,
            IncidentService incidentService
    ) {
        this.batchService = batchService;

        this.movementService =
                movementService;

        this.incidentService =
                incidentService;
    }

    @Transactional(readOnly = true)
    public PassportResponse findByBatchId(
            UUID batchId
    ) {
        BatchResponse batch =
                batchService.findPublicById(
                        batchId
                );

        List<MovementResponse> movements =
                movementService.findAllPublic(
                        batchId
                );

        List<PublicIncidentResponse> incidents =
                incidentService.findAllPublic(
                        batchId
                );

        PassportSafetyResponse safety =
                PassportSafetyResponse.from(
                        batch.status(),
                        incidents
                );

        return new PassportResponse(
                batch.id(),
                "VERIFIED",
                batch,
                movements,
                safety,
                OffsetDateTime.now(
                        ZoneOffset.UTC
                )
        );
    }
}