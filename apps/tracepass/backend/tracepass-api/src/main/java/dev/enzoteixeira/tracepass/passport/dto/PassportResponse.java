package dev.enzoteixeira.tracepass.passport.dto;

import dev.enzoteixeira.tracepass.batch.dto.BatchResponse;
import dev.enzoteixeira.tracepass.movement.dto.MovementResponse;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record PassportResponse(
        UUID passportId,
        String verificationStatus,
        BatchResponse batch,
        List<MovementResponse> movements,
        OffsetDateTime generatedAt
) {
}