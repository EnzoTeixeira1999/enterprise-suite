package dev.enzoteixeira.tracepass.product;

import dev.enzoteixeira.tracepass.company.Company;
import dev.enzoteixeira.tracepass.company.CompanyRepository;
import dev.enzoteixeira.tracepass.product.dto.CreateProductRequest;
import dev.enzoteixeira.tracepass.product.dto.ProductResponse;
import dev.enzoteixeira.tracepass.product.dto.UpdateProductRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CompanyRepository companyRepository;

    public ProductService(
            ProductRepository productRepository,
            CompanyRepository companyRepository
    ) {
        this.productRepository = productRepository;
        this.companyRepository = companyRepository;
    }

    @Transactional
    public ProductResponse create(
            UUID companyId,
            CreateProductRequest request
    ) {
        Company company = findCompany(companyId);
        String sku = normalizeSku(request.sku());

        if (productRepository.existsByCompany_IdAndSkuIgnoreCase(
                companyId,
                sku
        )) {
            throw new IllegalArgumentException(
                    "Já existe um produto com esse SKU nesta empresa"
            );
        }

        Product product = new Product(
                company,
                sku,
                request.name().trim(),
                normalizeOptional(request.description()),
                normalizeOptional(request.category()),
                request.unit()
        );

        Product savedProduct = productRepository.save(product);

        return ProductResponse.from(savedProduct);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> findAll(UUID companyId) {
        findCompany(companyId);

        return productRepository
                .findAllByCompany_IdOrderByCreatedAtDesc(companyId)
                .stream()
                .map(ProductResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse findById(
            UUID companyId,
            UUID productId
    ) {
        return ProductResponse.from(
                findProduct(companyId, productId)
        );
    }

    @Transactional
    public ProductResponse update(
            UUID companyId,
            UUID productId,
            UpdateProductRequest request
    ) {
        Product product = findProduct(companyId, productId);
        String sku = normalizeSku(request.sku());

        if (productRepository
                .existsByCompany_IdAndSkuIgnoreCaseAndIdNot(
                        companyId,
                        sku,
                        productId
                )) {
            throw new IllegalArgumentException(
                    "Já existe outro produto com esse SKU nesta empresa"
            );
        }

        product.update(
                sku,
                request.name().trim(),
                normalizeOptional(request.description()),
                normalizeOptional(request.category()),
                request.unit(),
                request.status()
        );

        Product updatedProduct =
                productRepository.saveAndFlush(product);

        return ProductResponse.from(updatedProduct);
    }

    @Transactional
    public void delete(
            UUID companyId,
            UUID productId
    ) {
        Product product = findProduct(companyId, productId);
        productRepository.delete(product);
    }

    private Company findCompany(UUID companyId) {
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new NoSuchElementException(
                        "Empresa não encontrada"
                ));
    }

    private Product findProduct(
            UUID companyId,
            UUID productId
    ) {
        return productRepository
                .findByIdAndCompany_Id(productId, companyId)
                .orElseThrow(() -> new NoSuchElementException(
                        "Produto não encontrado"
                ));
    }

    private String normalizeSku(String sku) {
        return sku.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}