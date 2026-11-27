package dev.enzoteixeira.tracepass.demo;

import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

@RestController
public class PortfolioDemoController {
    private static final List<String> COLLECTIONS =
            List.of("companies", "suppliers", "products", "batches", "movements", "incidents");

    private final JdbcTemplate database;
    private final ObjectMapper json;

    public PortfolioDemoController(JdbcTemplate database, ObjectMapper json) {
        this.database = database;
        this.json = json;
    }

    @GetMapping("/api/portfolio-demo")
    public Snapshot read() {
        return database.queryForObject(
                "SELECT revision, snapshot FROM portfolio_demo WHERE singleton = 1",
                (row, index) -> {
                    String snapshot = row.getString("snapshot");
                    return new Snapshot(row.getLong("revision"), snapshot == null ? null : json.readTree(snapshot));
                });
    }

    @GetMapping("/api/public/portfolio-demo")
    public ResponseEntity<Snapshot> publicDemo() {
        Snapshot saved = read();
        if (saved.workspace() == null) {
            return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(saved);
        }
        ObjectNode visible = ((ObjectNode) saved.workspace()).deepCopy();
        visible.remove("audit");
        for (String collection : COLLECTIONS) {
            for (JsonNode row : visible.path(collection)) {
                ((ObjectNode) row).remove(List.of("taxId", "supplierTaxId", "email", "phone", "reportedBy", "resolutionNotes"));
            }
        }
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
                .body(new Snapshot(saved.revision(), visible));
    }

    @PutMapping("/api/portfolio-demo")
    public Snapshot save(@RequestBody Snapshot input) {
        JsonNode workspace = input.workspace();
        if (workspace == null || !workspace.isObject() || input.revision() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        for (String collection : COLLECTIONS) {
            JsonNode rows = workspace.path(collection);
            if (!rows.isArray()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
            for (JsonNode row : rows) {
                if (!row.isObject() || !row.path("id").isString()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
                }
            }
        }
        JsonNode audit = workspace.path("audit");
        if (!audit.isMissingNode() && !audit.isArray()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        }
        String serialized = json.writeValueAsString(workspace);
        if (serialized.length() > 1_000_000) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE);
        }
        int updated = database.update(
                "UPDATE portfolio_demo SET snapshot = ?, revision = revision + 1 WHERE singleton = 1 AND revision = ?",
                serialized, input.revision());
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT);
        }
        return new Snapshot(input.revision() + 1, workspace);
    }

    public record Snapshot(long revision, JsonNode workspace) {}
}
