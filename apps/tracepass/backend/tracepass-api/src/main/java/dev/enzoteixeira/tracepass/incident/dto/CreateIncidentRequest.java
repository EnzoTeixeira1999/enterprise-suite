package dev.enzoteixeira.tracepass.incident.dto;

import dev.enzoteixeira.tracepass.incident.IncidentSeverity;
import dev.enzoteixeira.tracepass.incident.IncidentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

public record CreateIncidentRequest(

        @NotNull(message = "O tipo da ocorrência é obrigatório")
        IncidentType incidentType,

        @NotNull(message = "A gravidade é obrigatória")
        IncidentSeverity severity,

        @NotBlank(message = "O título é obrigatório")
        @Size(
                max = 160,
                message = "O título deve possuir no máximo 160 caracteres"
        )
        String title,

        @Size(
                max = 1000,
                message = "A descrição deve possuir no máximo 1000 caracteres"
        )
        String description,

        @Size(
                max = 160,
                message = "O local deve possuir no máximo 160 caracteres"
        )
        String locationName,

        @Size(
                max = 120,
                message = "O responsável deve possuir no máximo 120 caracteres"
        )
        String reportedBy,

        @NotNull(message = "A data da ocorrência é obrigatória")
        @PastOrPresent(
                message = "A ocorrência não pode estar no futuro"
        )
        OffsetDateTime occurredAt
) {
}