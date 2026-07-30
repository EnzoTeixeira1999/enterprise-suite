package dev.enzoteixeira.tracepass.company;

import dev.enzoteixeira.tracepass.company.dto.CreateCompanyRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompanyServiceTest {

    @Mock
    private CompanyRepository companyRepository;

    @InjectMocks
    private CompanyService companyService;

    @Test
    void shouldCreateCompanySuccessfully() {
        CreateCompanyRequest request = new CreateCompanyRequest(
                "TracePass Tecnologia Ltda",
                "TracePass",
                "12.345.678/0001-90"
        );

        when(companyRepository.existsByTaxId(request.taxId()))
                .thenReturn(false);

        when(companyRepository.save(any(Company.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = companyService.create(request);

        assertNotNull(response.id());
        assertEquals("TracePass Tecnologia Ltda", response.legalName());
        assertEquals("TracePass", response.tradeName());
        assertEquals("12.345.678/0001-90", response.taxId());
        assertEquals(CompanyStatus.ACTIVE, response.status());

        verify(companyRepository).existsByTaxId(request.taxId());
        verify(companyRepository).save(any(Company.class));
    }

    @Test
    void shouldRejectDuplicatedTaxId() {
        CreateCompanyRequest request = new CreateCompanyRequest(
                "Empresa Duplicada Ltda",
                "Empresa Duplicada",
                "12.345.678/0001-90"
        );

        when(companyRepository.existsByTaxId(request.taxId()))
                .thenReturn(true);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> companyService.create(request)
        );

        assertEquals(
                "Já existe uma empresa cadastrada com esse documento",
                exception.getMessage()
        );

        verify(companyRepository, never()).save(any(Company.class));
    }
}