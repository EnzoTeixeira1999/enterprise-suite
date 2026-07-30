package dev.enzoteixeira.tracepass.movement.dto;

import dev.enzoteixeira.tracepass.movement.MovementType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record CreateMovementRequest(

        @NotNull(message = "O tipo da movimentação é obrigatório")
        MovementType movementType,

        @NotBlank(message = "O título é obrigatório")
        @Size(max = 120, message = "O título deve possuir no máximo 120 caracteres")
        String title,

        @Size(max = 500, message = "A descrição deve possuir no máximo 500 caracteres")
        String description,

        @Size(max = 160, message = "O local deve possuir no máximo 160 caracteres")
        String locationName,

        @DecimalMin(value = "-90.000000", message = "Latitude inválida")
        @DecimalMax(value = "90.000000", message = "Latitude inválida")
        @Digits(integer = 3, fraction = 6, message = "Latitude inválida")
        BigDecimal latitude,

        @DecimalMin(value = "-180.000000", message = "Longitude inválida")
        @DecimalMax(value = "180.000000", message = "Longitude inválida")
        @Digits(integer = 3, fraction = 6, message = "Longitude inválida")
        BigDecimal longitude,

        @Size(max = 120, message = "O responsável deve possuir no máximo 120 caracteres")
        String responsibleName,

        @DecimalMin(
                value = "0.001",
                message = "A quantidade deve ser maior que zero"
        )
        @Digits(
                integer = 12,
                fraction = 3,
                message = "A quantidade deve possuir no máximo 3 casas decimais"
        )
        BigDecimal quantity,

        @NotNull(message = "A data e o horário são obrigatórios")
        @PastOrPresent(message = "A movimentação não pode estar no futuro")
        OffsetDateTime occurredAt
) {
}