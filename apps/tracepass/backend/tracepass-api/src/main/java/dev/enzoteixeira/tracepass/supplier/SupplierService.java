package dev.enzoteixeira.tracepass.supplier;

import dev.enzoteixeira.tracepass.company.Company;
import dev.enzoteixeira.tracepass.company.CompanyRepository;
import dev.enzoteixeira.tracepass.supplier.dto.CreateSupplierRequest;
import dev.enzoteixeira.tracepass.supplier.dto.SupplierResponse;
import dev.enzoteixeira.tracepass.supplier.dto.UpdateSupplierRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final CompanyRepository companyRepository;

    public SupplierService(
            SupplierRepository supplierRepository,
            CompanyRepository companyRepository
    ) {
        this.supplierRepository = supplierRepository;
        this.companyRepository = companyRepository;
    }

    @Transactional
    public SupplierResponse create(
            UUID companyId,
            CreateSupplierRequest request
    ) {
        Company company = findCompany(companyId);

        String taxId =
                normalizeOptional(request.taxId());

        validateDuplicateTaxId(
                companyId,
                taxId,
                null
        );

        Supplier supplier = new Supplier(
                company,
                normalizeRequired(request.legalName()),
                normalizeRequired(request.tradeName()),
                taxId,
                normalizeOptional(request.email()),
                normalizeOptional(request.phone()),
                normalizeOptional(request.city()),
                normalizeOptional(request.state()),
                normalizeCountry(request.country())
        );

        Supplier savedSupplier =
                supplierRepository.save(supplier);

        return SupplierResponse.from(savedSupplier);
    }

    @Transactional(readOnly = true)
    public List<SupplierResponse> findAll(
            UUID companyId
    ) {
        findCompany(companyId);

        return supplierRepository
                .findAllByCompany_IdOrderByTradeNameAsc(
                        companyId
                )
                .stream()
                .map(SupplierResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public SupplierResponse findById(
            UUID companyId,
            UUID supplierId
    ) {
        return SupplierResponse.from(
                findSupplier(companyId, supplierId)
        );
    }

    @Transactional(readOnly = true)
    public Supplier findEntity(
            UUID companyId,
            UUID supplierId
    ) {
        return findSupplier(companyId, supplierId);
    }

    @Transactional
    public SupplierResponse update(
            UUID companyId,
            UUID supplierId,
            UpdateSupplierRequest request
    ) {
        Supplier supplier =
                findSupplier(companyId, supplierId);

        String taxId =
                normalizeOptional(request.taxId());

        validateDuplicateTaxId(
                companyId,
                taxId,
                supplierId
        );

        supplier.update(
                normalizeRequired(request.legalName()),
                normalizeRequired(request.tradeName()),
                taxId,
                normalizeOptional(request.email()),
                normalizeOptional(request.phone()),
                normalizeOptional(request.city()),
                normalizeOptional(request.state()),
                normalizeCountry(request.country()),
                request.status()
        );

        Supplier updatedSupplier =
                supplierRepository.saveAndFlush(supplier);

        return SupplierResponse.from(updatedSupplier);
    }

    @Transactional
    public void delete(
            UUID companyId,
            UUID supplierId
    ) {
        Supplier supplier =
                findSupplier(companyId, supplierId);

        supplierRepository.delete(supplier);
    }

    private Company findCompany(UUID companyId) {
        return companyRepository
                .findById(companyId)
                .orElseThrow(() ->
                        new NoSuchElementException(
                                "Empresa não encontrada"
                        )
                );
    }

    private Supplier findSupplier(
            UUID companyId,
            UUID supplierId
    ) {
        return supplierRepository
                .findByIdAndCompany_Id(
                        supplierId,
                        companyId
                )
                .orElseThrow(() ->
                        new NoSuchElementException(
                                "Fornecedor não encontrado para esta empresa"
                        )
                );
    }

    private void validateDuplicateTaxId(
            UUID companyId,
            String taxId,
            UUID ignoredSupplierId
    ) {
        if (taxId == null) {
            return;
        }

        boolean duplicated;

        if (ignoredSupplierId == null) {
            duplicated = supplierRepository
                    .existsByCompany_IdAndTaxIdIgnoreCase(
                            companyId,
                            taxId
                    );
        } else {
            duplicated = supplierRepository
                    .existsByCompany_IdAndTaxIdIgnoreCaseAndIdNot(
                            companyId,
                            taxId,
                            ignoredSupplierId
                    );
        }

        if (duplicated) {
            throw new IllegalArgumentException(
                    "Já existe um fornecedor com esse documento nesta empresa"
            );
        }
    }

    private String normalizeRequired(String value) {
        return value.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private String normalizeCountry(String country) {
        if (country == null || country.isBlank()) {
            return "Brasil";
        }

        return country.trim();
    }
}