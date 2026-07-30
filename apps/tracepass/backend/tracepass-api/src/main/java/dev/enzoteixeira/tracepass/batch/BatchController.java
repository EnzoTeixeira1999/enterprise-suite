package dev.enzoteixeira.tracepass.batch;

import dev.enzoteixeira.tracepass.batch.dto.BatchResponse;
import dev.enzoteixeira.tracepass.batch.dto.CreateBatchRequest;
import dev.enzoteixeira.tracepass.batch.dto.UpdateBatchRequest;
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
        "/api/companies/{companyId}/products/{productId}/batches"
)
@Tag(
        name = "Lotes",
        description = "Cadastro e gerenciamento dos lotes rastreados"
)
public class BatchController {

    private final BatchService batchService;

    public BatchController(BatchService batchService) {
        this.batchService = batchService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
            summary = "Cadastrar lote",
            description = "Cadastra um lote vinculado a um produto"
    )
    public BatchResponse create(
            @PathVariable("companyId") UUID companyId,
            @PathVariable("productId") UUID productId,
            @Valid @RequestBody CreateBatchRequest request
    ) {
        return batchService.create(
                companyId,
                productId,
                request
        );
    }

    @GetMapping
    @Operation(
            summary = "Listar lotes",
            description = "Lista todos os lotes de um produto"
    )
    public List<BatchResponse> findAll(
            @PathVariable("companyId") UUID companyId,
            @PathVariable("productId") UUID productId
    ) {
        return batchService.findAll(
                companyId,
                productId
        );
    }

    @GetMapping("/{batchId}")
    @Operation(
            summary = "Consultar lote",
            description = "Consulta um lote específico de um produto"
    )
    public BatchResponse findById(
            @PathVariable("companyId") UUID companyId,
            @PathVariable("productId") UUID productId,
            @PathVariable("batchId") UUID batchId
    ) {
        return batchService.findById(
                companyId,
                productId,
                batchId
        );
    }

    @PutMapping("/{batchId}")
    @Operation(
            summary = "Atualizar lote",
            description = "Atualiza os dados, a quantidade e o status de um lote"
    )
    public BatchResponse update(
            @PathVariable("companyId") UUID companyId,
            @PathVariable("productId") UUID productId,
            @PathVariable("batchId") UUID batchId,
            @Valid @RequestBody UpdateBatchRequest request
    ) {
        return batchService.update(
                companyId,
                productId,
                batchId,
                request
        );
    }

    @DeleteMapping("/{batchId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
            summary = "Excluir lote",
            description = "Exclui um lote pertencente a um produto"
    )
    public void delete(
            @PathVariable("companyId") UUID companyId,
            @PathVariable("productId") UUID productId,
            @PathVariable("batchId") UUID batchId
    ) {
        batchService.delete(
                companyId,
                productId,
                batchId
        );
    }
}