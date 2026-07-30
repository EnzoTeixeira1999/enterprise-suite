package dev.enzoteixeira.tracepass.supplier.dto;

import dev.enzoteixeira.tracepass.supplier.SupplierStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateSupplierRequest(

        @NotBlank(message = "A razão social é obrigatória")
        @Size(max = 160)
        String legalName,

        @NotBlank(message = "O nome fantasia é obrigatório")
        @Size(max = 120)
        String tradeName,

        @Size(max = 32)
        String taxId,

        @Email(message = "Informe um e-mail válido")
        @Size(max = 160)
        String email,

        @Size(max = 32)
        String phone,

        @Size(max = 120)
        String city,

        @Size(max = 80)
        String state,

        @Size(max = 80)
        String country,

        @NotNull(message = "O status é obrigatório")
        SupplierStatus status
) {
}