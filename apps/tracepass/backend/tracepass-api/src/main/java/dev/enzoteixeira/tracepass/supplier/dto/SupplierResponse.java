package dev.enzoteixeira.tracepass.supplier.dto;

import dev.enzoteixeira.tracepass.supplier.Supplier;
import dev.enzoteixeira.tracepass.supplier.SupplierStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record SupplierResponse(
        UUID id,
        UUID companyId,
        String companyName,
        String legalName,
        String tradeName,
        String taxId,
        String email,
        String phone,
        String city,
        String state,
        String country,
        SupplierStatus status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {

    public static SupplierResponse from(
            Supplier supplier
    ) {
        return new SupplierResponse(
                supplier.getId(),
                supplier.getCompany().getId(),
                supplier.getCompany().getTradeName(),
                supplier.getLegalName(),
                supplier.getTradeName(),
                supplier.getTaxId(),
                supplier.getEmail(),
                supplier.getPhone(),
                supplier.getCity(),
                supplier.getState(),
                supplier.getCountry(),
                supplier.getStatus(),
                supplier.getCreatedAt(),
                supplier.getUpdatedAt()
        );
    }
}