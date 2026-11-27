package dev.enzoteixeira.tracepass.company;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CompanyRepository extends JpaRepository<Company, UUID> {

    java.util.List<Company> findAllByArchivedAtIsNull();

    Optional<Company> findByTaxId(String taxId);

    boolean existsByTaxId(String taxId);

    boolean existsByTaxIdAndIdNot(String taxId, UUID id);
}