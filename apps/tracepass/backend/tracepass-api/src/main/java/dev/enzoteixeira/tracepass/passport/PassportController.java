package dev.enzoteixeira.tracepass.passport;

import dev.enzoteixeira.tracepass.passport.dto.PassportResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/public/passports")
@Tag(
        name = "Passaporte Público",
        description = "Consulta pública da procedência, jornada, segurança e autenticidade dos lotes"
)
public class PassportController {

    private final PassportService passportService;

    public PassportController(
            PassportService passportService
    ) {
        this.passportService = passportService;
    }

    @GetMapping("/{batchId}")
    @Operation(
            summary = "Consultar passaporte público",
            description = "Retorna o passaporte digital completo de um lote, incluindo origem, movimentações e histórico de segurança"
    )
    public PassportResponse findByBatchId(
            @PathVariable UUID batchId
    ) {
        return passportService.findByBatchId(batchId);
    }
}