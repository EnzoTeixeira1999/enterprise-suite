package dev.enzoteixeira.tracepass.company.dto;

import dev.enzoteixeira.tracepass.company.Company;
import dev.enzoteixeira.tracepass.company.CompanyStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CompanyResponse(
        UUID id,
        String legalName,
        String tradeName,
        String taxId,
        CompanyStatus status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {

    public static CompanyResponse from(Company company) {
        return new CompanyResponse(
                company.getId(),
                company.getLegalName(),
                company.getTradeName(),
                company.getTaxId(),
                company.getStatus(),
                company.getCreatedAt(),
                company.getUpdatedAt()
        );
    }
}