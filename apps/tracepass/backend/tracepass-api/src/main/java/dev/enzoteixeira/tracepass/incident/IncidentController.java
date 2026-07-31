package dev.enzoteixeira.tracepass.incident;

import dev.enzoteixeira.tracepass.incident.dto.CreateIncidentRequest;
import dev.enzoteixeira.tracepass.incident.dto.IncidentResponse;
import dev.enzoteixeira.tracepass.incident.dto.ReleaseBatchRequest;
import dev.enzoteixeira.tracepass.incident.dto.ResolveIncidentRequest;
import dev.enzoteixeira.tracepass.movement.dto.MovementResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/companies/{companyId}")
@Tag(
        name = "Ocorrências e Segurança",
        description = "Gestão de desvios, bloqueios automáticos, investigações e liberações controladas dos lotes"
)
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(
            IncidentService incidentService
    ) {
        this.incidentService = incidentService;
    }

    @GetMapping("/incidents")
    @Operation(
            summary = "Listar ocorrências da empresa",
            description = "Retorna todas as ocorrências de rastreabilidade registradas na empresa"
    )
    public List<IncidentResponse> findAllByCompany(
            @PathVariable UUID companyId
    ) {
        return incidentService.findAllByCompany(
                companyId
        );
    }

    @GetMapping(
            "/products/{productId}/batches/{batchId}/incidents"
    )
    @Operation(
            summary = "Consultar ocorrências do lote",
            description = "Retorna o histórico de ocorrências registradas em um lote"
    )
    public List<IncidentResponse> findAllByBatch(
            @PathVariable UUID companyId,
            @PathVariable UUID productId,
            @PathVariable UUID batchId
    ) {
        return incidentService.findAllByBatch(
                companyId,
                productId,
                batchId
        );
    }

    @PostMapping(
            "/products/{productId}/batches/{batchId}/incidents"
    )
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
            summary = "Registrar ocorrência",
            description = "Registra um desvio de rastreabilidade e pode bloquear automaticamente o lote de acordo com a gravidade"
    )
    public IncidentResponse create(
            @PathVariable UUID companyId,
            @PathVariable UUID productId,
            @PathVariable UUID batchId,
            @Valid
            @RequestBody
            CreateIncidentRequest request
    ) {
        return incidentService.create(
                companyId,
                productId,
                batchId,
                request
        );
    }

    @PatchMapping(
            "/products/{productId}/batches/{batchId}/incidents/{incidentId}/investigation"
    )
    @Operation(
            summary = "Iniciar investigação",
            description = "Altera uma ocorrência aberta para o estado de investigação"
    )
    public IncidentResponse startInvestigation(
            @PathVariable UUID companyId,
            @PathVariable UUID productId,
            @PathVariable UUID batchId,
            @PathVariable UUID incidentId
    ) {
        return incidentService.startInvestigation(
                companyId,
                productId,
                batchId,
                incidentId
        );
    }

    @PatchMapping(
            "/products/{productId}/batches/{batchId}/incidents/{incidentId}/resolve"
    )
    @Operation(
            summary = "Resolver ocorrência",
            description = "Finaliza uma ocorrência e registra as ações executadas durante o tratamento"
    )
    public IncidentResponse resolve(
            @PathVariable UUID companyId,
            @PathVariable UUID productId,
            @PathVariable UUID batchId,
            @PathVariable UUID incidentId,
            @Valid
            @RequestBody
            ResolveIncidentRequest request
    ) {
        return incidentService.resolve(
                companyId,
                productId,
                batchId,
                incidentId,
                request
        );
    }

    @PostMapping(
            "/products/{productId}/batches/{batchId}/release"
    )
    @Operation(
            summary = "Autorizar liberação do lote",
            description = "Autoriza o retorno do lote à operação depois que todas as ocorrências forem resolvidas"
    )
    public MovementResponse releaseBatch(
            @PathVariable UUID companyId,
            @PathVariable UUID productId,
            @PathVariable UUID batchId,
            @Valid
            @RequestBody
            ReleaseBatchRequest request
    ) {
        return incidentService.releaseBatch(
                companyId,
                productId,
                batchId,
                request
        );
    }

    @GetMapping(
            "/products/{productId}/batches/{batchId}/incidents/open-count"
    )
    @Operation(
            summary = "Contar ocorrências pendentes",
            description = "Retorna a quantidade de ocorrências abertas ou em investigação no lote"
    )
    public long countOpenByBatch(
            @PathVariable UUID companyId,
            @PathVariable UUID productId,
            @PathVariable UUID batchId
    ) {
        return incidentService.countOpenByBatch(
                companyId,
                productId,
                batchId
        );
    }
}