package dev.enzoteixeira.tracepass.batch;

import dev.enzoteixeira.tracepass.batch.dto.BatchResponse;
import dev.enzoteixeira.tracepass.batch.dto.CreateBatchRequest;
import dev.enzoteixeira.tracepass.batch.dto.UpdateBatchRequest;
import dev.enzoteixeira.tracepass.product.Product;
import dev.enzoteixeira.tracepass.product.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class BatchService {

    private final BatchRepository batchRepository;
    private final ProductRepository productRepository;

    public BatchService(
            BatchRepository batchRepository,
            ProductRepository productRepository
    ) {
        this.batchRepository = batchRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public BatchResponse create(
            UUID companyId,
            UUID productId,
            CreateBatchRequest request
    ) {
        Product product = findProduct(companyId, productId);
        String batchCode = normalizeBatchCode(request.batchCode());

        validateDates(
                request.manufactureDate(),
                request.expirationDate()
        );

        if (batchRepository
                .existsByProduct_IdAndBatchCodeIgnoreCase(
                        productId,
                        batchCode
                )) {
            throw new IllegalArgumentException(
                    "Já existe um lote com esse código neste produto"
            );
        }

        Batch batch = new Batch(
                product,
                batchCode,
                request.manufactureDate(),
                request.expirationDate(),
                request.initialQuantity()
        );

        Batch savedBatch = batchRepository.save(batch);

        return BatchResponse.from(savedBatch);
    }

    @Transactional(readOnly = true)
    public List<BatchResponse> findAll(
            UUID companyId,
            UUID productId
    ) {
        findProduct(companyId, productId);

        return batchRepository
                .findAllByProduct_IdOrderByCreatedAtDesc(productId)
                .stream()
                .map(BatchResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public BatchResponse findById(
            UUID companyId,
            UUID productId,
            UUID batchId
    ) {
        findProduct(companyId, productId);

        return BatchResponse.from(
                findBatch(productId, batchId)
        );
    }

    @Transactional
    public BatchResponse update(
            UUID companyId,
            UUID productId,
            UUID batchId,
            UpdateBatchRequest request
    ) {
        findProduct(companyId, productId);
        Batch batch = findBatch(productId, batchId);
        String batchCode = normalizeBatchCode(request.batchCode());

        validateDates(
                request.manufactureDate(),
                request.expirationDate()
        );

        validateCurrentQuantity(
                batch.getInitialQuantity(),
                request.currentQuantity()
        );

        if (batchRepository
                .existsByProduct_IdAndBatchCodeIgnoreCaseAndIdNot(
                        productId,
                        batchCode,
                        batchId
                )) {
            throw new IllegalArgumentException(
                    "Já existe outro lote com esse código neste produto"
            );
        }

        batch.update(
                batchCode,
                request.manufactureDate(),
                request.expirationDate(),
                request.currentQuantity(),
                request.status()
        );

        Batch updatedBatch = batchRepository.saveAndFlush(batch);

        return BatchResponse.from(updatedBatch);
    }

    @Transactional
    public void delete(
            UUID companyId,
            UUID productId,
            UUID batchId
    ) {
        findProduct(companyId, productId);
        Batch batch = findBatch(productId, batchId);
        batchRepository.delete(batch);
    }

    private Product findProduct(
            UUID companyId,
            UUID productId
    ) {
        return productRepository
                .findByIdAndCompany_Id(productId, companyId)
                .orElseThrow(() -> new NoSuchElementException(
                        "Produto não encontrado para esta empresa"
                ));
    }

    private Batch findBatch(
            UUID productId,
            UUID batchId
    ) {
        return batchRepository
                .findByIdAndProduct_Id(batchId, productId)
                .orElseThrow(() -> new NoSuchElementException(
                        "Lote não encontrado para este produto"
                ));
    }

    private void validateDates(
            LocalDate manufactureDate,
            LocalDate expirationDate
    ) {
        if (
                expirationDate != null
                        && expirationDate.isBefore(manufactureDate)
        ) {
            throw new IllegalArgumentException(
                    "A validade não pode ser anterior à fabricação"
            );
        }
    }

    private void validateCurrentQuantity(
            BigDecimal initialQuantity,
            BigDecimal currentQuantity
    ) {
        if (currentQuantity.compareTo(initialQuantity) > 0) {
            throw new IllegalArgumentException(
                    "A quantidade atual não pode superar a quantidade inicial"
            );
        }
    }

    private String normalizeBatchCode(String batchCode) {
        return batchCode.trim().toUpperCase(Locale.ROOT);
    }
}