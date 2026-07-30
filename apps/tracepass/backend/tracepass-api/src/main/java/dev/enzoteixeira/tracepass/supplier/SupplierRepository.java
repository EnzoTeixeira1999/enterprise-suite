package dev.enzoteixeira.tracepass.supplier;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SupplierRepository
        extends JpaRepository<Supplier, UUID> {

    List<Supplier> findAllByCompany_IdOrderByTradeNameAsc(
            UUID companyId
    );

    Optional<Supplier> findByIdAndCompany_Id(
            UUID supplierId,
            UUID companyId
    );

    boolean existsByCompany_IdAndTaxIdIgnoreCase(
            UUID companyId,
            String taxId
    );

    boolean existsByCompany_IdAndTaxIdIgnoreCaseAndIdNot(
            UUID companyId,
            String taxId,
            UUID supplierId
    );
}