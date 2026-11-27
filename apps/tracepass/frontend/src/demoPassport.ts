import type { PassportData } from "./components/PublicPassport";

export const demoPath = "/demo";
const id = "demo-lote-2026-001";
const productName = "Sensor de Temperatura IoT";
const batchCode = "LOTE-2026-001";
const stops = [
  ["Produção", "Florianópolis", -27.5969, -48.5495, "PRODUCTION"],
  ["Armazenamento", "Centro de Distribuição", -27.594, -48.571, "STORAGE"],
  ["Despacho para São José", "Unidade de Expedição", -27.592, -48.594, "DISPATCH"],
  ["Bloqueio preventivo", "Unidade de Recebimento São José", -27.607, -48.613, "BLOCK"],
  ["Liberação após inspeção", "Controle de Qualidade São José", -27.61, -48.625, "RELEASE"],
] as const;

export const demoPassport: PassportData = {
  passportId: id, verificationStatus: "DEMO", generatedAt: "2026-08-03T14:00:00-03:00",
  batch: {
    id, batchCode, productName, companyId: "demo", companyName: "TracePass Enterprise",
    productId: "sensor-demo", productSku: "SENSOR-TEMP-001", productUnit: "UNIT",
    supplierId: "fornecedor-demo", supplierName: "SensoriTech (exemplo)",
    supplierTaxId: null, supplierCity: "Joinville", supplierState: "SC", supplierCountry: "Brasil",
    manufactureDate: "2026-08-03", expirationDate: "2030-08-03",
    initialQuantity: 500, currentQuantity: 500, status: "IN_STORAGE",
    createdAt: "2026-08-03T08:00:00-03:00", updatedAt: "2026-08-03T14:00:00-03:00",
  },
  movements: stops.map(([title, locationName, latitude, longitude, movementType], index) => {
    const occurredAt = new Date(Date.UTC(2026, 7, 3, 11 + index)).toISOString();
    return {
      id: "demo-event-" + index, companyId: "demo", companyName: "TracePass Enterprise",
      productId: "sensor-demo", productName, batchId: id, batchCode, movementType,
      title, locationName, latitude, longitude, description: null,
      responsibleName: null, quantity: 500, occurredAt, createdAt: occurredAt,
    };
  }),
  safety: {
    status: "CLEAR", totalIncidents: 1, activeIncidents: 0, resolvedIncidents: 1,
    criticalActiveIncidents: 0, hasAutomaticBlocks: true,
    incidents: [{
      id: "demo-dano", incidentType: "DAMAGE", severity: "HIGH", status: "RESOLVED",
      title: "Avaria na embalagem", automaticBlock: true,
      occurredAt: "2026-08-03T11:00:00-03:00", resolvedAt: "2026-08-03T12:00:00-03:00",
    }],
  },
};
