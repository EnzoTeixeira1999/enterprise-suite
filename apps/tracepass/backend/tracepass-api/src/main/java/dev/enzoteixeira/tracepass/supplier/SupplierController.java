package dev.enzoteixeira.tracepass.supplier;

import dev.enzoteixeira.tracepass.supplier.dto.CreateSupplierRequest;
import dev.enzoteixeira.tracepass.supplier.dto.SupplierResponse;
import dev.enzoteixeira.tracepass.supplier.dto.UpdateSupplierRequest;
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
@RequestMapping(
        "/api/companies/{companyId}/suppliers"
)
@Tag(
        name = "Fornecedores",
        description = "Cadastro e gerenciamento dos fornecedores responsáveis pela origem dos lotes"
)
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(
            SupplierService supplierService
    ) {
        this.supplierService = supplierService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
            summary = "Cadastrar fornecedor",
            description = "Cadastra um novo fornecedor vinculado à empresa"
    )
    public SupplierResponse create(
            @PathVariable UUID companyId,
            @Valid
            @RequestBody
            CreateSupplierRequest request
    ) {
        return supplierService.create(
                companyId,
                request
        );
    }

    @GetMapping
    @Operation(
            summary = "Listar fornecedores",
            description = "Retorna todos os fornecedores cadastrados na empresa"
    )
    public List<SupplierResponse> findAll(
            @PathVariable UUID companyId
    ) {
        return supplierService.findAll(companyId);
    }

    @GetMapping("/{supplierId}")
    @Operation(
            summary = "Consultar fornecedor",
            description = "Consulta um fornecedor pelo seu identificador"
    )
    public SupplierResponse findById(
            @PathVariable UUID companyId,
            @PathVariable UUID supplierId
    ) {
        return supplierService.findById(
                companyId,
                supplierId
        );
    }

    @PutMapping("/{supplierId}")
    @Operation(
            summary = "Atualizar fornecedor",
            description = "Atualiza os dados e o status de um fornecedor existente"
    )
    public SupplierResponse update(
            @PathVariable UUID companyId,
            @PathVariable UUID supplierId,
            @Valid
            @RequestBody
            UpdateSupplierRequest request
    ) {
        return supplierService.update(
                companyId,
                supplierId,
                request
        );
    }

    @DeleteMapping("/{supplierId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
            summary = "Excluir fornecedor",
            description = "Exclui um fornecedor cadastrado na empresa"
    )
    public void delete(
            @PathVariable UUID companyId,
            @PathVariable UUID supplierId
    ) {
        supplierService.delete(
                companyId,
                supplierId
        );
    }
}