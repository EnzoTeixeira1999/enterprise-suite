package dev.enzoteixeira.tracepass.audit;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;
import java.util.UUID;

@Service
public class RecordArchiveService {
    private final JdbcClient jdbc;

    public RecordArchiveService(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Transactional
    public void archive(String entity, UUID id, String reason) {
        String table = switch (entity) {
            case "companies", "products", "suppliers", "batches", "movements" -> entity;
            default -> throw new NoSuchElementException("Tipo de registro desconhecido");
        };
        lockActive(table, id);
        if (entity.equals("movements")) requireActiveMovementBatch(id);
        String dependencies = switch (entity) {
            case "companies" -> "SELECT id FROM products WHERE company_id = :id AND archived_at IS NULL UNION ALL SELECT id FROM suppliers WHERE company_id = :id AND archived_at IS NULL";
            case "products" -> "SELECT id FROM batches WHERE product_id = :id AND archived_at IS NULL";
            case "suppliers" -> "SELECT id FROM batches WHERE supplier_id = :id AND archived_at IS NULL";
            case "batches" -> "SELECT id FROM traceability_incidents WHERE batch_id = :id AND status <> 'RESOLVED'";
            case "movements" -> "SELECT id FROM movements WHERE id = :id AND movement_type IN ('BLOCK', 'RELEASE')";
            default -> throw new IllegalStateException();
        };
        if (jdbc.sql("SELECT EXISTS (" + dependencies + ")").param("id", id).query(Boolean.class).single()) {
            throw new IllegalArgumentException(switch (entity) {
                case "companies" -> "Arquive primeiro os produtos e fornecedores ativos desta empresa.";
                case "products", "suppliers" -> "Arquive primeiro os lotes vinculados a este cadastro.";
                case "batches" -> "Resolva as ocorrências ativas antes de arquivar o lote.";
                default -> "Eventos de bloqueio e liberação permanecem no histórico de segurança.";
            });
        }
        String normalizedReason = reason == null ? "" : reason.strip();
        jdbc.sql("SELECT set_config('tracepass.archive_reason', :reason, true)")
                .param("reason", normalizedReason).query(String.class).single();
        jdbc.sql("UPDATE " + table + " SET archived_at = now() WHERE id = :id").param("id", id).update();
    }

    void lockActive(String table, UUID id) {
        jdbc.sql("SELECT id FROM " + table + " WHERE id = :id AND archived_at IS NULL FOR UPDATE")
                .param("id", id).query(UUID.class).optional()
                .orElseThrow(() -> new NoSuchElementException("Registro ativo não encontrado"));
    }

    void requireActiveMovementBatch(UUID id) {
        jdbc.sql("""
                SELECT b.id FROM batches b JOIN movements m ON m.batch_id = b.id
                WHERE m.id = :id AND b.archived_at IS NULL FOR SHARE OF b
                """).param("id", id).query(UUID.class).optional()
                .orElseThrow(() -> new IllegalArgumentException("O lote está arquivado."));
    }

}
