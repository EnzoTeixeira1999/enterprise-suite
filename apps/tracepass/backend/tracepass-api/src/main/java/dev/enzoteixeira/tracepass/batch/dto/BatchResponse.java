package dev.enzoteixeira.tracepass.batch.dto;

import dev.enzoteixeira.tracepass.batch.Batch;
import dev.enzoteixeira.tracepass.batch.BatchStatus;
import dev.enzoteixeira.tracepass.product.ProductUnit;
import dev.enzoteixeira.tracepass.supplier.Supplier;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record BatchResponse(
        UUID id,
        UUID companyId,
        String companyName,
        UUID productId,
        String productName,
        String productSku,
        ProductUnit productUnit,
        UUID supplierId,
        String supplierName,
        String supplierTaxId,
        String supplierCity,
        String supplierState,
        String supplierCountry,
        String batchCode,
        LocalDate manufactureDate,
        LocalDate expirationDate,
        BigDecimal initialQuantity,
        BigDecimal currentQuantity,
        BatchStatus status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {

    public static BatchResponse from(Batch batch) {
        Supplier supplier = batch.getSupplier();

        return new BatchResponse(
                batch.getId(),
                batch.getProduct().getCompany().getId(),
                batch.getProduct().getCompany().getTradeName(),
                batch.getProduct().getId(),
                batch.getProduct().getName(),
                batch.getProduct().getSku(),
                batch.getProduct().getUnit(),

                supplier != null
                        ? supplier.getId()
                        : null,

                supplier != null
                        ? supplier.getTradeName()
                        : null,

                supplier != null
                        ? supplier.getTaxId()
                        : null,

                supplier != null
                        ? supplier.getCity()
                        : null,

                supplier != null
                        ? supplier.getState()
                        : null,

                supplier != null
                        ? supplier.getCountry()
                        : null,

                batch.getBatchCode(),
                batch.getManufactureDate(),
                batch.getExpirationDate(),
                batch.getInitialQuantity(),
                batch.getCurrentQuantity(),
                batch.getStatus(),
                batch.getCreatedAt(),
                batch.getUpdatedAt()
        );
    }
}