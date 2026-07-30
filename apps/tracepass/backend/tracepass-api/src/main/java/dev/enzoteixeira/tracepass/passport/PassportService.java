package dev.enzoteixeira.tracepass.passport;

import dev.enzoteixeira.tracepass.batch.BatchService;
import dev.enzoteixeira.tracepass.batch.dto.BatchResponse;
import dev.enzoteixeira.tracepass.movement.MovementService;
import dev.enzoteixeira.tracepass.movement.dto.MovementResponse;
import dev.enzoteixeira.tracepass.passport.dto.PassportResponse;
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

    public PassportService(
            BatchService batchService,
            MovementService movementService
    ) {
        this.batchService = batchService;
        this.movementService = movementService;
    }

    @Transactional(readOnly = true)
    public PassportResponse findByBatchId(UUID batchId) {
        BatchResponse batch =
                batchService.findPublicById(batchId);

        List<MovementResponse> movements =
                movementService.findAllPublic(batchId);

        return new PassportResponse(
                batch.id(),
                "VERIFIED",
                batch,
                movements,
                OffsetDateTime.now(ZoneOffset.UTC)
        );
    }
}