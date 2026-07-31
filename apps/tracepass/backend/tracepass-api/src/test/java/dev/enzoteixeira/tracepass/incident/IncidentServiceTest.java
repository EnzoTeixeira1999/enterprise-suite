package dev.enzoteixeira.tracepass.incident;

import dev.enzoteixeira.tracepass.batch.Batch;
import dev.enzoteixeira.tracepass.batch.BatchRepository;
import dev.enzoteixeira.tracepass.batch.BatchStatus;
import dev.enzoteixeira.tracepass.company.Company;
import dev.enzoteixeira.tracepass.incident.dto.CreateIncidentRequest;
import dev.enzoteixeira.tracepass.incident.dto.ReleaseBatchRequest;
import dev.enzoteixeira.tracepass.incident.dto.ResolveIncidentRequest;
import dev.enzoteixeira.tracepass.movement.MovementService;
import dev.enzoteixeira.tracepass.movement.MovementType;
import dev.enzoteixeira.tracepass.movement.dto.CreateMovementRequest;
import dev.enzoteixeira.tracepass.movement.dto.MovementResponse;
import dev.enzoteixeira.tracepass.product.Product;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class IncidentServiceTest {

    private static final UUID COMPANY_ID =
            UUID.randomUUID();

    private static final UUID PRODUCT_ID =
            UUID.randomUUID();

    private static final UUID BATCH_ID =
            UUID.randomUUID();

    @Mock
    private TraceabilityIncidentRepository
            incidentRepository;

    @Mock
    private BatchRepository batchRepository;

    @Mock
    private MovementService movementService;

    @Mock
    private Batch batch;

    @Mock
    private Product product;

    @Mock
    private Company company;

    @InjectMocks
    private IncidentService incidentService;

    @Test
    void shouldBlockBatchWhenCriticalIncidentIsCreated() {
        configureBatchRoute();
        configureIncidentResponseData();

        when(batch.getStatus())
                .thenReturn(BatchStatus.BLOCKED);

        when(incidentRepository.save(
                any(TraceabilityIncident.class)
        )).thenAnswer(
                invocation ->
                        invocation.getArgument(0)
        );

        CreateIncidentRequest request =
                new CreateIncidentRequest(
                        IncidentType.TEMPERATURE_ALERT,
                        IncidentSeverity.CRITICAL,
                        "Temperatura fora da faixa segura",
                        "Leitura acima do limite configurado",
                        "Rota Florianopolis - Sao Jose",
                        "Sensor IoT CT-001",
                        OffsetDateTime
                                .now(ZoneOffset.UTC)
                                .minusMinutes(1)
                );

        var response = incidentService.create(
                COMPANY_ID,
                PRODUCT_ID,
                BATCH_ID,
                request
        );

        assertNotNull(response.id());

        assertEquals(
                IncidentSeverity.CRITICAL,
                response.severity()
        );

        assertEquals(
                IncidentStatus.OPEN,
                response.status()
        );

        assertEquals(
                BatchStatus.BLOCKED,
                response.batchStatus()
        );

        assertTrue(response.automaticBlock());

        verify(batch).changeStatus(
                BatchStatus.BLOCKED
        );

        verify(batchRepository).save(batch);

        verify(incidentRepository).save(
                any(TraceabilityIncident.class)
        );
    }

    @Test
    void shouldResolveIncidentSuccessfully() {
        configureIncidentResponseData();

        TraceabilityIncident incident =
                new TraceabilityIncident(
                        batch,
                        IncidentType.DAMAGE,
                        IncidentSeverity.HIGH,
                        "Dano na embalagem",
                        "Embalagem externa danificada",
                        "Centro de Distribuicao",
                        "Equipe de Inspecao",
                        OffsetDateTime
                                .now(ZoneOffset.UTC)
                                .minusMinutes(10)
                );

        when(incidentRepository.findById(
                incident.getId()
        )).thenReturn(Optional.of(incident));

        when(incidentRepository.saveAndFlush(
                incident
        )).thenReturn(incident);

        ResolveIncidentRequest request =
                new ResolveIncidentRequest(
                        "Embalagem substituida e lote inspecionado"
                );

        var response = incidentService.resolve(
                COMPANY_ID,
                PRODUCT_ID,
                BATCH_ID,
                incident.getId(),
                request
        );

        assertEquals(
                IncidentStatus.RESOLVED,
                response.status()
        );

        assertEquals(
                "Embalagem substituida e lote inspecionado",
                response.resolutionNotes()
        );

        assertNotNull(response.resolvedAt());

        verify(incidentRepository)
                .saveAndFlush(incident);
    }

    @Test
    void shouldRejectReleaseWhenIncidentIsUnresolved() {
        configureBatchRoute();

        when(batch.getStatus())
                .thenReturn(BatchStatus.BLOCKED);

        when(incidentRepository
                .countByBatchIdAndStatusNot(
                        BATCH_ID,
                        IncidentStatus.RESOLVED
                ))
                .thenReturn(1L);

        ReleaseBatchRequest request =
                new ReleaseBatchRequest(
                        "Equipe de Qualidade",
                        "Inspecao concluida",
                        "Centro de Distribuicao",
                        null,
                        null
                );

        IllegalStateException exception =
                assertThrows(
                        IllegalStateException.class,
                        () ->
                                incidentService
                                        .releaseBatch(
                                                COMPANY_ID,
                                                PRODUCT_ID,
                                                BATCH_ID,
                                                request
                                        )
                );

        assertEquals(
                "Todas as ocorrências precisam estar resolvidas antes da liberação",
                exception.getMessage()
        );

        verifyNoInteractions(movementService);
    }

    @Test
    void shouldReleaseBatchWhenAllIncidentsAreResolved() {
        configureBatchRoute();

        when(batch.getStatus())
                .thenReturn(BatchStatus.BLOCKED);

        when(batch.getCurrentQuantity())
                .thenReturn(
                        new BigDecimal("500.000")
                );

        when(incidentRepository
                .countByBatchIdAndStatusNot(
                        BATCH_ID,
                        IncidentStatus.RESOLVED
                ))
                .thenReturn(0L);

        MovementResponse expectedMovement =
                org.mockito.Mockito.mock(
                        MovementResponse.class
                );

        when(movementService.create(
                eq(COMPANY_ID),
                eq(PRODUCT_ID),
                eq(BATCH_ID),
                any(CreateMovementRequest.class)
        )).thenReturn(expectedMovement);

        ReleaseBatchRequest request =
                new ReleaseBatchRequest(
                        "Equipe de Qualidade",
                        "Produto inspecionado e aprovado",
                        "Centro de Distribuicao",
                        new BigDecimal("-27.594870"),
                        new BigDecimal("-48.548220")
                );

        MovementResponse response =
                incidentService.releaseBatch(
                        COMPANY_ID,
                        PRODUCT_ID,
                        BATCH_ID,
                        request
                );

        assertSame(
                expectedMovement,
                response
        );

        ArgumentCaptor<CreateMovementRequest>
                movementCaptor =
                ArgumentCaptor.forClass(
                        CreateMovementRequest.class
                );

        verify(movementService).create(
                eq(COMPANY_ID),
                eq(PRODUCT_ID),
                eq(BATCH_ID),
                movementCaptor.capture()
        );

        CreateMovementRequest movementRequest =
                movementCaptor.getValue();

        assertEquals(
                MovementType.RELEASE,
                movementRequest.movementType()
        );

        assertEquals(
                "Equipe de Qualidade",
                movementRequest.responsibleName()
        );

        assertEquals(
                "Produto inspecionado e aprovado",
                movementRequest.description()
        );

        assertEquals(
                new BigDecimal("500.000"),
                movementRequest.quantity()
        );

        assertEquals(
                new BigDecimal("-27.594870"),
                movementRequest.latitude()
        );

        assertEquals(
                new BigDecimal("-48.548220"),
                movementRequest.longitude()
        );
    }

    private void configureBatchRoute() {
        when(batchRepository
                .findByIdAndProduct_Id(
                        BATCH_ID,
                        PRODUCT_ID
                ))
                .thenReturn(Optional.of(batch));

        configureCompanyRoute();
    }

    private void configureCompanyRoute() {
        when(batch.getProduct())
                .thenReturn(product);

        when(product.getCompany())
                .thenReturn(company);

        when(company.getId())
                .thenReturn(COMPANY_ID);
    }

    private void configureIncidentResponseData() {
        configureCompanyRoute();

        when(company.getTradeName())
                .thenReturn(
                        "TracePass Enterprise"
                );

        when(product.getId())
                .thenReturn(PRODUCT_ID);

        when(product.getName())
                .thenReturn(
                        "Sensor de Temperatura IoT"
                );

        when(product.getSku())
                .thenReturn(
                        "SENSOR-TEMP-001"
                );

        when(batch.getId())
                .thenReturn(BATCH_ID);

        when(batch.getBatchCode())
                .thenReturn(
                        "LOTE-2026-001"
                );

        when(batch.getStatus())
                .thenReturn(BatchStatus.BLOCKED);
    }
}