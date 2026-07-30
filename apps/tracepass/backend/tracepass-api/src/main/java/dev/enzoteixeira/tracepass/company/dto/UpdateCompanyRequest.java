package dev.enzoteixeira.tracepass.company.dto;

import dev.enzoteixeira.tracepass.company.CompanyStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateCompanyRequest(

        @NotBlank(message = "A razão social é obrigatória")
        @Size(max = 160, message = "A razão social deve possuir no máximo 160 caracteres")
        String legalName,

        @NotBlank(message = "O nome fantasia é obrigatório")
        @Size(max = 120, message = "O nome fantasia deve possuir no máximo 120 caracteres")
        String tradeName,

        @NotBlank(message = "O documento da empresa é obrigatório")
        @Size(max = 32, message = "O documento deve possuir no máximo 32 caracteres")
        String taxId,

        @NotNull(message = "O status da empresa é obrigatório")
        CompanyStatus status
) {
}