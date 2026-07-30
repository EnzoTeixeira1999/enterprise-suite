package dev.enzoteixeira.tracepass.passport;

import dev.enzoteixeira.tracepass.passport.dto.PassportResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/public/passports")
public class PassportController {

    private final PassportService passportService;

    public PassportController(
            PassportService passportService
    ) {
        this.passportService = passportService;
    }

    @GetMapping("/{batchId}")
    public PassportResponse findByBatchId(
            @PathVariable UUID batchId
    ) {
        return passportService.findByBatchId(batchId);
    }
}