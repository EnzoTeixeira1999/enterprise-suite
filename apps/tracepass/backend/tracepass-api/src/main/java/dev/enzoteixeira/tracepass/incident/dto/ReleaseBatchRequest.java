package dev.enzoteixeira.tracepass.incident.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ReleaseBatchRequest(

        @NotBlank(
                message = "O responsável pela liberação é obrigatório"
        )
        @Size(
                max = 120,
                message = "O responsável deve possuir no máximo 120 caracteres"
        )
        String releasedBy,

        @NotBlank(
                message = "A justificativa da liberação é obrigatória"
        )
        @Size(
                max = 500,
                message = "A justificativa deve possuir no máximo 500 caracteres"
        )
        String releaseNotes,

        @Size(
                max = 160,
                message = "O local deve possuir no máximo 160 caracteres"
        )
        String locationName,

        @DecimalMin(
                value = "-90.000000",
                message = "Latitude inválida"
        )
        @DecimalMax(
                value = "90.000000",
                message = "Latitude inválida"
        )
        @Digits(
                integer = 3,
                fraction = 6,
                message = "Latitude inválida"
        )
        BigDecimal latitude,

        @DecimalMin(
                value = "-180.000000",
                message = "Longitude inválida"
        )
        @DecimalMax(
                value = "180.000000",
                message = "Longitude inválida"
        )
        @Digits(
                integer = 3,
                fraction = 6,
                message = "Longitude inválida"
        )
        BigDecimal longitude
) {
}