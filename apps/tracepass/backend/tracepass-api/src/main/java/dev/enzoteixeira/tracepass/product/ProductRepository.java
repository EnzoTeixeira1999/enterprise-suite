package dev.enzoteixeira.tracepass.product;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    List<Product> findAllByCompany_IdOrderByCreatedAtDesc(
            UUID companyId
    );

    Optional<Product> findByIdAndCompany_Id(
            UUID id,
            UUID companyId
    );

    boolean existsByCompany_IdAndSkuIgnoreCase(
            UUID companyId,
            String sku
    );

    boolean existsByCompany_IdAndSkuIgnoreCaseAndIdNot(
            UUID companyId,
            String sku,
            UUID id
    );
}