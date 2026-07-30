package dev.enzoteixeira.tracepass.batch.dto;

import dev.enzoteixeira.tracepass.batch.BatchStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateBatchRequest(

        @NotBlank(message = "O código do lote é obrigatório")
        @Size(
                max = 64,
                message = "O código do lote deve possuir no máximo 64 caracteres"
        )
        String batchCode,

        @NotNull(message = "A data de fabricação é obrigatória")
        @PastOrPresent(
                message = "A fabricação não pode estar no futuro"
        )
        LocalDate manufactureDate,

        LocalDate expirationDate,

        UUID supplierId,

        @NotNull(message = "A quantidade atual é obrigatória")
        @DecimalMin(
                value = "0.000",
                message = "A quantidade atual não pode ser negativa"
        )
        @Digits(
                integer = 12,
                fraction = 3,
                message = "A quantidade deve possuir no máximo 3 casas decimais"
        )
        BigDecimal currentQuantity,

        @NotNull(message = "O status do lote é obrigatório")
        BatchStatus status
) {
}