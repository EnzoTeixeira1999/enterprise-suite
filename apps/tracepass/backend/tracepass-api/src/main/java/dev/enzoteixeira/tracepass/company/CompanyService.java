package dev.enzoteixeira.tracepass.company;

import dev.enzoteixeira.tracepass.company.dto.CompanyResponse;
import dev.enzoteixeira.tracepass.company.dto.CreateCompanyRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;

    public CompanyService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    @Transactional
    public CompanyResponse create(CreateCompanyRequest request) {
        String taxId = request.taxId().trim();

        if (companyRepository.existsByTaxId(taxId)) {
            throw new IllegalArgumentException(
                    "Já existe uma empresa cadastrada com esse documento"
            );
        }

        Company company = new Company(
                request.legalName().trim(),
                request.tradeName().trim(),
                taxId
        );

        Company savedCompany = companyRepository.save(company);

        return CompanyResponse.from(savedCompany);
    }

    @Transactional(readOnly = true)
    public List<CompanyResponse> findAll() {
        return companyRepository.findAll()
                .stream()
                .map(CompanyResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CompanyResponse findById(UUID id) {
        return companyRepository.findById(id)
                .map(CompanyResponse::from)
                .orElseThrow(() -> new NoSuchElementException(
                        "Empresa não encontrada"
                ));
    }
}