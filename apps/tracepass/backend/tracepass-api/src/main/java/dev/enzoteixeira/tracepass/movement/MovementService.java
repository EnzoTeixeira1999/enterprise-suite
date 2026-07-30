package dev.enzoteixeira.tracepass.movement;

import dev.enzoteixeira.tracepass.batch.Batch;
import dev.enzoteixeira.tracepass.batch.BatchRepository;
import dev.enzoteixeira.tracepass.batch.BatchStatus;
import dev.enzoteixeira.tracepass.movement.dto.CreateMovementRequest;
import dev.enzoteixeira.tracepass.movement.dto.MovementResponse;
import dev.enzoteixeira.tracepass.product.Product;
import dev.enzoteixeira.tracepass.product.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class MovementService {

    private final MovementRepository movementRepository;
    private final BatchRepository batchRepository;
    private final ProductRepository productRepository;

    public MovementService(
            MovementRepository movementRepository,
            BatchRepository batchRepository,
            ProductRepository productRepository
    ) {
        this.movementRepository = movementRepository;
        this.batchRepository = batchRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public MovementResponse create(
            UUID companyId,
            UUID productId,
            UUID batchId,
            CreateMovementRequest request
    ) {
        findProduct(companyId, productId);
        Batch batch = findBatch(productId, batchId);

        validateCoordinates(
                request.latitude(),
                request.longitude()
        );

        Movement movement = new Movement(
                batch,
                request.movementType(),
                request.title().trim(),
                normalizeOptional(request.description()),
                normalizeOptional(request.locationName()),
                request.latitude(),
                request.longitude(),
                normalizeOptional(request.responsibleName()),
                request.quantity(),
                request.occurredAt()
        );

        updateBatchStatus(
                batch,
                request.movementType()
        );

        Movement savedMovement =
                movementRepository.save(movement);

        return MovementResponse.from(savedMovement);
    }

    @Transactional(readOnly = true)
    public List<MovementResponse> findAll(
            UUID companyId,
            UUID productId,
            UUID batchId
    ) {
        findProduct(companyId, productId);
        findBatch(productId, batchId);

        return movementRepository
                .findAllByBatch_IdOrderByOccurredAtAsc(batchId)
                .stream()
                .map(MovementResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MovementResponse> findAllPublic(
            UUID batchId
    ) {
        if (!batchRepository.existsById(batchId)) {
            throw new NoSuchElementException(
                    "Passaporte do lote não encontrado"
            );
        }

        return movementRepository
                .findAllByBatch_IdOrderByOccurredAtAsc(batchId)
                .stream()
                .map(MovementResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public MovementResponse findById(
            UUID companyId,
            UUID productId,
            UUID batchId,
            UUID movementId
    ) {
        findProduct(companyId, productId);
        findBatch(productId, batchId);

        Movement movement = movementRepository
                .findByIdAndBatch_Id(movementId, batchId)
                .orElseThrow(() -> new NoSuchElementException(
                        "Movimentação não encontrada"
                ));

        return MovementResponse.from(movement);
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

    private void validateCoordinates(
            BigDecimal latitude,
            BigDecimal longitude
    ) {
        boolean latitudeProvided = latitude != null;
        boolean longitudeProvided = longitude != null;

        if (latitudeProvided != longitudeProvided) {
            throw new IllegalArgumentException(
                    "Latitude e longitude devem ser informadas juntas"
            );
        }
    }

    private void updateBatchStatus(
            Batch batch,
            MovementType movementType
    ) {
        BatchStatus newStatus = switch (movementType) {
            case PRODUCTION -> BatchStatus.REGISTERED;

            case STORAGE, RECEIPT, RELEASE ->
                    BatchStatus.IN_STORAGE;

            case DISPATCH, IN_TRANSIT ->
                    BatchStatus.IN_TRANSIT;

            case BLOCK -> BatchStatus.BLOCKED;

            case COMPLETION -> BatchStatus.COMPLETED;

            case QUALITY_CHECK, ADJUSTMENT ->
                    batch.getStatus();
        };

        batch.changeStatus(newStatus);
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}