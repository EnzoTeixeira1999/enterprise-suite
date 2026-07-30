package dev.enzoteixeira.tracepass.company;

import dev.enzoteixeira.tracepass.company.dto.CompanyResponse;
import dev.enzoteixeira.tracepass.company.dto.CreateCompanyRequest;
import dev.enzoteixeira.tracepass.company.dto.UpdateCompanyRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/companies")
@Tag(
        name = "Empresas",
        description = "Cadastro e gerenciamento das empresas que utilizam o TracePass"
)
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
            summary = "Cadastrar empresa",
            description = "Cadastra uma nova empresa na plataforma TracePass"
    )
    public CompanyResponse create(
            @Valid @RequestBody CreateCompanyRequest request
    ) {
        return companyService.create(request);
    }

    @GetMapping
    @Operation(
            summary = "Listar empresas",
            description = "Retorna todas as empresas cadastradas"
    )
    public List<CompanyResponse> findAll() {
        return companyService.findAll();
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Consultar empresa",
            description = "Procura uma empresa pelo seu identificador único"
    )
    public CompanyResponse findById(
            @PathVariable("id") UUID id
    ) {
        return companyService.findById(id);
    }

    @PutMapping("/{id}")
    @Operation(
            summary = "Atualizar empresa",
            description = "Atualiza os dados e o status de uma empresa existente"
    )
    public CompanyResponse update(
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateCompanyRequest request
    ) {
        return companyService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
            summary = "Excluir empresa",
            description = "Exclui permanentemente uma empresa cadastrada"
    )
    public void delete(
            @PathVariable("id") UUID id
    ) {
        companyService.delete(id);
    }
}