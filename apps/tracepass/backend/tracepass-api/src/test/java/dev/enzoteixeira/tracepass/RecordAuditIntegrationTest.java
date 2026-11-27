package dev.enzoteixeira.tracepass;

import dev.enzoteixeira.tracepass.audit.RecordAuditController;
import dev.enzoteixeira.tracepass.audit.RecordAuditController.ArchiveRequest;
import dev.enzoteixeira.tracepass.audit.RecordAuditController.MovementCorrection;
import dev.enzoteixeira.tracepass.company.CompanyService;
import dev.enzoteixeira.tracepass.company.CompanyStatus;
import dev.enzoteixeira.tracepass.company.dto.UpdateCompanyRequest;
import dev.enzoteixeira.tracepass.passport.PassportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional
class RecordAuditIntegrationTest {
    @Autowired JdbcClient jdbc;
    @Autowired RecordAuditController audit;
    @Autowired CompanyService companies;
    @Autowired PassportService passports;

    @Test
    void archivesRecordsWithoutLosingPassportOrOriginalValues() {
        UUID company = UUID.randomUUID();
        UUID product = UUID.randomUUID();
        UUID supplier = UUID.randomUUID();
        UUID batch = UUID.randomUUID();
        UUID movement = UUID.randomUUID();
        UUID safetyEvent = UUID.randomUUID();
        String document = company.toString().replace("-", "");
        jdbc.sql("INSERT INTO companies (id, legal_name, trade_name, tax_id) VALUES (?, 'Auditoria', 'Nome anterior', ?)")
                .params(company, document).update();
        jdbc.sql("INSERT INTO products (id, company_id, sku, name, unit) VALUES (?, ?, 'AUDIT', 'Produto', 'UNIT')")
                .params(product, company).update();
        jdbc.sql("INSERT INTO suppliers (id, company_id, legal_name, trade_name) VALUES (?, ?, 'Origem', 'Origem')")
                .params(supplier, company).update();
        jdbc.sql("""
                INSERT INTO batches (id, product_id, supplier_id, batch_code, manufacture_date, initial_quantity, current_quantity)
                VALUES (?, ?, ?, 'AUDIT-01', current_date, 10, 10)
                """).params(batch, product, supplier).update();
        addMovement(batch, movement, "STORAGE");
        addMovement(batch, safetyEvent, "BLOCK");

        companies.update(company, new UpdateCompanyRequest("Auditoria", "Nome corrigido", document, CompanyStatus.ACTIVE));
        audit.editMovement(movement, new MovementCorrection("Local corrigido", null, "Curitiba", null,
                new BigDecimal("-25.44"), new BigDecimal("-49.27")));
        ArchiveRequest reason = new ArchiveRequest("Cadastro duplicado");
        assertThatThrownBy(() -> audit.archive("suppliers", supplier, reason)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> audit.archive("movements", safetyEvent, reason)).isInstanceOf(IllegalArgumentException.class);
        audit.archive("movements", movement, reason);
        audit.archive("batches", batch, reason);
        audit.archive("products", product, reason);
        audit.archive("suppliers", supplier, reason);
        audit.archive("companies", company, reason);

        var passport = passports.findByBatchId(batch);
        assertThat(passport.batch().archivedAt()).isNotNull();
        assertThat(passport.archivedMovements()).isEqualTo(1);
        assertThat(passport.movements()).extracting(item -> item.id()).containsExactly(safetyEvent);
        assertThat(companies.findAll()).noneMatch(item -> item.id().equals(company));
        assertThat(audit.history(null)).anySatisfy(entry -> {
            assertThat(entry.recordId()).isEqualTo(company);
            assertThat(entry.action()).isEqualTo("EDITED");
            assertThat(entry.beforeData()).contains("Nome anterior");
            assertThat(entry.afterData()).contains("Nome corrigido");
        }).anySatisfy(entry -> {
            assertThat(entry.recordId()).isEqualTo(movement);
            assertThat(entry.action()).isEqualTo("ARCHIVED");
            assertThat(entry.reason()).isEqualTo("Cadastro duplicado");
            assertThat(entry.beforeData()).contains("Local corrigido");
        });
    }

    private void addMovement(UUID batch, UUID movement, String type) {
        jdbc.sql("INSERT INTO movements (id, batch_id, movement_type, title, occurred_at) VALUES (?, ?, ?, 'Evento inicial', now())")
                .params(movement, batch, type).update();
    }
}
