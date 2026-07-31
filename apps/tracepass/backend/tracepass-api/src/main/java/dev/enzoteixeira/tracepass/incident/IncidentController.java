package dev.enzoteixeira.tracepass.incident;

import dev.enzoteixeira.tracepass.incident.dto.CreateIncidentRequest;
import dev.enzoteixeira.tracepass.incident.dto.IncidentResponse;
import dev.enzoteixeira.tracepass.incident.dto.ResolveIncidentRequest;
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
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(
            IncidentService incidentService
    ) {
        this.incidentService = incidentService;
    }

    @GetMapping("/incidents")
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

    @GetMapping(
            "/products/{productId}/batches/{batchId}/incidents/open-count"
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