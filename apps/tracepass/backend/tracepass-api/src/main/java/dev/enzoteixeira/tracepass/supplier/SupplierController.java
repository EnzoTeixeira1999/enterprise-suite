package dev.enzoteixeira.tracepass.supplier;

import dev.enzoteixeira.tracepass.supplier.dto.CreateSupplierRequest;
import dev.enzoteixeira.tracepass.supplier.dto.SupplierResponse;
import dev.enzoteixeira.tracepass.supplier.dto.UpdateSupplierRequest;
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
public class SupplierController {

    private final SupplierService supplierService;

    public SupplierController(
            SupplierService supplierService
    ) {
        this.supplierService = supplierService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
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
    public List<SupplierResponse> findAll(
            @PathVariable UUID companyId
    ) {
        return supplierService.findAll(companyId);
    }

    @GetMapping("/{supplierId}")
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