package dev.enzoteixeira.tracepass.incident.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResolveIncidentRequest(

        @NotBlank(
                message = "A descrição da resolução é obrigatória"
        )
        @Size(
                max = 1000,
                message = "A resolução deve possuir no máximo 1000 caracteres"
        )
        String resolutionNotes
) {
}