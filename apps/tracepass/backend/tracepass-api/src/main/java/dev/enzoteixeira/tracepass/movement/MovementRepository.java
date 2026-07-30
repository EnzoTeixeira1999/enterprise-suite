package dev.enzoteixeira.tracepass.movement;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MovementRepository
        extends JpaRepository<Movement, UUID> {

    List<Movement> findAllByBatch_IdOrderByOccurredAtAsc(
            UUID batchId
    );

    Optional<Movement> findByIdAndBatch_Id(
            UUID movementId,
            UUID batchId
    );
}