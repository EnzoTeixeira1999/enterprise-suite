package dev.enzoteixeira.tracepass.audit;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/audit")
public class RecordAuditController {
    private final JdbcClient jdbc;

    private final RecordArchiveService archives;

    public RecordAuditController(JdbcClient jdbc, RecordArchiveService archives) {
        this.jdbc = jdbc;
        this.archives = archives;
    }

    @GetMapping
    public List<AuditEntry> history(@RequestParam(required = false) Long before) {
        return jdbc.sql("""
                SELECT id, entity, record_id, action, reason, before_data::text AS before_data,
                       after_data::text AS after_data, recorded_at
                FROM tracepass_audit WHERE id < :before ORDER BY id DESC LIMIT 50
                """).param("before", before == null ? Long.MAX_VALUE : before).query(AuditEntry.class).list();
    }

    @DeleteMapping("/{entity}/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archive(@PathVariable String entity, @PathVariable UUID id,
                        @Valid @RequestBody ArchiveRequest request) {
        archives.archive(entity, id, request.reason());
    }

    @PutMapping("/movements/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void editMovement(@PathVariable UUID id, @Valid @RequestBody MovementCorrection request) {
        archives.lockActive("movements", id);
        archives.requireActiveMovementBatch(id);
        if ((request.latitude() == null) != (request.longitude() == null)) {
            throw new IllegalArgumentException("Informe latitude e longitude juntas.");
        }
        jdbc.sql("""
                UPDATE movements SET title = :title, description = :description, location_name = :location,
                    responsible_name = :responsible, latitude = :latitude, longitude = :longitude WHERE id = :id
                """).param("id", id).param("title", request.title().strip())
                .param("description", optionalText(request.description())).param("location", optionalText(request.locationName()))
                .param("responsible", optionalText(request.responsibleName()))
                .param("latitude", request.latitude()).param("longitude", request.longitude()).update();
    }

    private static String optionalText(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }

    public record ArchiveRequest(@Size(max = 500) String reason) {}
    public record MovementCorrection(
            @NotBlank @Size(max = 120) String title,
            @Size(max = 500) String description,
            @Size(max = 160) String locationName,
            @Size(max = 120) String responsibleName,
            @DecimalMin("-90") @DecimalMax("90") @Digits(integer = 3, fraction = 6) BigDecimal latitude,
            @DecimalMin("-180") @DecimalMax("180") @Digits(integer = 3, fraction = 6) BigDecimal longitude
    ) {}
    public record AuditEntry(long id, String entity, UUID recordId, String action, String reason,
                             String beforeData, String afterData, OffsetDateTime recordedAt) {}
}
