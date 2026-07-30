package dev.enzoteixeira.tracepass.batch;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BatchRepository extends JpaRepository<Batch, UUID> {

    List<Batch> findAllByProduct_IdOrderByCreatedAtDesc(
            UUID productId
    );

    Optional<Batch> findByIdAndProduct_Id(
            UUID batchId,
            UUID productId
    );

    boolean existsByProduct_IdAndBatchCodeIgnoreCase(
            UUID productId,
            String batchCode
    );

    boolean existsByProduct_IdAndBatchCodeIgnoreCaseAndIdNot(
            UUID productId,
            String batchCode,
            UUID batchId
    );
}