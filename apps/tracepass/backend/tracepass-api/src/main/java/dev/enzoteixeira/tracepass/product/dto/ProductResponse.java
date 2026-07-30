package dev.enzoteixeira.tracepass.product.dto;

import dev.enzoteixeira.tracepass.product.Product;
import dev.enzoteixeira.tracepass.product.ProductStatus;
import dev.enzoteixeira.tracepass.product.ProductUnit;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ProductResponse(
        UUID id,
        UUID companyId,
        String companyName,
        String sku,
        String name,
        String description,
        String category,
        ProductUnit unit,
        ProductStatus status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {

    public static ProductResponse from(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getCompany().getId(),
                product.getCompany().getTradeName(),
                product.getSku(),
                product.getName(),
                product.getDescription(),
                product.getCategory(),
                product.getUnit(),
                product.getStatus(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}