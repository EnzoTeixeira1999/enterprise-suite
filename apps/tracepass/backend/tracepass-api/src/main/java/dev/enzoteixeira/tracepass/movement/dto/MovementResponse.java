package dev.enzoteixeira.tracepass.movement.dto;

import dev.enzoteixeira.tracepass.movement.Movement;
import dev.enzoteixeira.tracepass.movement.MovementType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record MovementResponse(
        UUID id,
        UUID companyId,
        String companyName,
        UUID productId,
        String productName,
        UUID batchId,
        String batchCode,
        MovementType movementType,
        String title,
        String description,
        String locationName,
        BigDecimal latitude,
        BigDecimal longitude,
        String responsibleName,
        BigDecimal quantity,
        OffsetDateTime occurredAt,
        OffsetDateTime createdAt
) {

    public static MovementResponse from(Movement movement) {
        return new MovementResponse(
                movement.getId(),
                movement.getBatch()
                        .getProduct()
                        .getCompany()
                        .getId(),
                movement.getBatch()
                        .getProduct()
                        .getCompany()
                        .getTradeName(),
                movement.getBatch()
                        .getProduct()
                        .getId(),
                movement.getBatch()
                        .getProduct()
                        .getName(),
                movement.getBatch().getId(),
                movement.getBatch().getBatchCode(),
                movement.getMovementType(),
                movement.getTitle(),
                movement.getDescription(),
                movement.getLocationName(),
                movement.getLatitude(),
                movement.getLongitude(),
                movement.getResponsibleName(),
                movement.getQuantity(),
                movement.getOccurredAt(),
                movement.getCreatedAt()
        );
    }
}