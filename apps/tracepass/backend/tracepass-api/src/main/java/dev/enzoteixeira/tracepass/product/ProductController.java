package dev.enzoteixeira.tracepass.product;

import dev.enzoteixeira.tracepass.product.dto.CreateProductRequest;
import dev.enzoteixeira.tracepass.product.dto.ProductResponse;
import dev.enzoteixeira.tracepass.product.dto.UpdateProductRequest;
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
@RequestMapping("/api/companies/{companyId}/products")
@Tag(
        name = "Produtos",
        description = "Cadastro e gerenciamento dos produtos rastreados"
)
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
            summary = "Cadastrar produto",
            description = "Cadastra um produto vinculado a uma empresa"
    )
    public ProductResponse create(
            @PathVariable("companyId") UUID companyId,
            @Valid @RequestBody CreateProductRequest request
    ) {
        return productService.create(companyId, request);
    }

    @GetMapping
    @Operation(
            summary = "Listar produtos",
            description = "Lista todos os produtos de uma empresa"
    )
    public List<ProductResponse> findAll(
            @PathVariable("companyId") UUID companyId
    ) {
        return productService.findAll(companyId);
    }

    @GetMapping("/{productId}")
    @Operation(
            summary = "Consultar produto",
            description = "Consulta um produto específico de uma empresa"
    )
    public ProductResponse findById(
            @PathVariable("companyId") UUID companyId,
            @PathVariable("productId") UUID productId
    ) {
        return productService.findById(companyId, productId);
    }

    @PutMapping("/{productId}")
    @Operation(
            summary = "Atualizar produto",
            description = "Atualiza os dados e o status de um produto"
    )
    public ProductResponse update(
            @PathVariable("companyId") UUID companyId,
            @PathVariable("productId") UUID productId,
            @Valid @RequestBody UpdateProductRequest request
    ) {
        return productService.update(
                companyId,
                productId,
                request
        );
    }

    @DeleteMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(
            summary = "Excluir produto",
            description = "Exclui um produto pertencente a uma empresa"
    )
    public void delete(
            @PathVariable("companyId") UUID companyId,
            @PathVariable("productId") UUID productId
    ) {
        productService.delete(companyId, productId);
    }
}