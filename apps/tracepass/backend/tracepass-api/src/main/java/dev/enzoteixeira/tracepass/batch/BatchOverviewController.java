package dev.enzoteixeira.tracepass.batch;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
public class BatchOverviewController {
    private final JdbcClient jdbc;

    public BatchOverviewController(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @GetMapping("/api/companies/{companyId}/batch-overview")
    public List<BatchOverview> list(@PathVariable UUID companyId) {
        return jdbc.sql("""
                SELECT b.id, p.company_id, p.id AS product_id, b.batch_code,
                       p.name AS product_name, p.sku, b.status, b.expiration_date,
                       last_move.title AS last_event, last_move.location_name AS last_location,
                       last_move.occurred_at AS last_occurred_at, incidents.open_incidents
                FROM batches b
                JOIN products p ON p.id = b.product_id
                LEFT JOIN LATERAL (
                    SELECT title, location_name, occurred_at
                    FROM movements
                    WHERE batch_id = b.id AND archived_at IS NULL
                    ORDER BY occurred_at DESC, created_at DESC, id DESC
                    LIMIT 1
                ) last_move ON TRUE
                CROSS JOIN LATERAL (
                    SELECT count(*) AS open_incidents
                    FROM traceability_incidents
                    WHERE batch_id = b.id AND status IN ('OPEN', 'INVESTIGATING')
                ) incidents
                WHERE p.company_id = :companyId AND b.archived_at IS NULL
                ORDER BY b.created_at DESC, b.id
                """)
                .param("companyId", companyId)
                .query(BatchOverview.class)
                .list();
    }

    public record BatchOverview(
            UUID id, UUID companyId, UUID productId, String batchCode, String productName,
            String sku, String status, LocalDate expirationDate, String lastEvent,
            String lastLocation, OffsetDateTime lastOccurredAt, long openIncidents
    ) {}
}
