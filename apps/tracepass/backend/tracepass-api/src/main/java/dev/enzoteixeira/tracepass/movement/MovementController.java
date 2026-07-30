package dev.enzoteixeira.tracepass.movement;

import dev.enzoteixeira.tracepass.movement.dto.CreateMovementRequest;
import dev.enzoteixeira.tracepass.movement.dto.MovementResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping(
        "/api/companies/{companyId}"
                + "/products/{productId}"
                + "/batches/{batchId}"
                + "/movements"
)
@Tag(
        name = "Movimentações",
        description = "Linha do tempo rastreável e imutável dos lotes"
)
public class MovementController {

    private final MovementService movementService;

    public MovementController(MovementService movementService) {
        this.movementService = movementService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
            summary = "Registrar movimentação",
            description = "Adiciona um novo evento à linha do tempo do lote"
    )
    public MovementResponse create(
            @PathVariable("companyId") UUID companyId,
            @PathVariable("productId") UUID productId,
            @PathVariable("batchId") UUID batchId,
            @Valid @RequestBody CreateMovementRequest request
    ) {
        return movementService.create(
                companyId,
                productId,
                batchId,
                request
        );
    }

    @GetMapping
    @Operation(
            summary = "Consultar linha do tempo",
            description = "Retorna os eventos do lote em ordem cronológica"
    )
    public List<MovementResponse> findAll(
            @PathVariable("companyId") UUID companyId,
            @PathVariable("productId") UUID productId,
            @PathVariable("batchId") UUID batchId
    ) {
        return movementService.findAll(
                companyId,
                productId,
                batchId
        );
    }

    @GetMapping("/{movementId}")
    @Operation(
            summary = "Consultar movimentação",
            description = "Consulta um evento específico da linha do tempo"
    )
    public MovementResponse findById(
            @PathVariable("companyId") UUID companyId,
            @PathVariable("productId") UUID productId,
            @PathVariable("batchId") UUID batchId,
            @PathVariable("movementId") UUID movementId
    ) {
        return movementService.findById(
                companyId,
                productId,
                batchId,
                movementId
        );
    }
}