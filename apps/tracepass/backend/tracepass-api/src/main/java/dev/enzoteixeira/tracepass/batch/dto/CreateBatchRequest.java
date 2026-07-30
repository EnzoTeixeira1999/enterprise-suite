package dev.enzoteixeira.tracepass.batch.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateBatchRequest(

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

        @NotNull(message = "A quantidade inicial é obrigatória")
        @DecimalMin(
                value = "0.001",
                message = "A quantidade inicial deve ser maior que zero"
        )
        @Digits(
                integer = 12,
                fraction = 3,
                message = "A quantidade deve possuir no máximo 3 casas decimais"
        )
        BigDecimal initialQuantity
) {
}