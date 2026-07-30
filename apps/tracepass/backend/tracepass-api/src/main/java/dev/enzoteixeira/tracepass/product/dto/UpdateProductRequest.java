package dev.enzoteixeira.tracepass.product.dto;

import dev.enzoteixeira.tracepass.product.ProductStatus;
import dev.enzoteixeira.tracepass.product.ProductUnit;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateProductRequest(

        @NotBlank(message = "O SKU é obrigatório")
        @Size(max = 64, message = "O SKU deve possuir no máximo 64 caracteres")
        String sku,

        @NotBlank(message = "O nome do produto é obrigatório")
        @Size(max = 160, message = "O nome deve possuir no máximo 160 caracteres")
        String name,

        @Size(max = 500, message = "A descrição deve possuir no máximo 500 caracteres")
        String description,

        @Size(max = 100, message = "A categoria deve possuir no máximo 100 caracteres")
        String category,

        @NotNull(message = "A unidade do produto é obrigatória")
        ProductUnit unit,

        @NotNull(message = "O status do produto é obrigatório")
        ProductStatus status
) {
}