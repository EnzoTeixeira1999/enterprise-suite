import { demoPassport } from "../demoPassport";

export const demoWorkspacePath = "/laboratorio";
const storageKey = "tracepass.workspace.v1";

type RecordData = Record<string, unknown>;
type Row = RecordData & { id: string };
type Workspace = {
  companies: Row[];
  suppliers: Row[];
  products: Row[];
  batches: Row[];
  movements: Row[];
  incidents: Row[];
};

const statusAfterMovement: Record<string, string> = {
  PRODUCTION: "REGISTERED", STORAGE: "IN_STORAGE", DISPATCH: "IN_TRANSIT",
  IN_TRANSIT: "IN_TRANSIT", RECEIPT: "IN_STORAGE", BLOCK: "BLOCKED",
  RELEASE: "IN_STORAGE", COMPLETION: "COMPLETED",
};

function seed(): Workspace {
  const { batch, movements, safety } = demoPassport;
  const stamp = batch.createdAt;
  const company = { id: batch.companyId, companyName: batch.companyName };
  const companyLink = { companyId: company.id, companyName: company.companyName };
  return {
    companies: [{
      id: company.id, legalName: company.companyName, tradeName: company.companyName,
      taxId: "00000000000000", status: "ACTIVE", createdAt: stamp, updatedAt: stamp,
    }],
    suppliers: [{
      ...companyLink, id: batch.supplierId!, legalName: batch.supplierName, tradeName: batch.supplierName,
      taxId: null, email: null, phone: null, city: batch.supplierCity, state: batch.supplierState,
      country: batch.supplierCountry, status: "ACTIVE", createdAt: stamp, updatedAt: stamp,
    }],
    products: [{
      ...companyLink, id: batch.productId, sku: batch.productSku, name: batch.productName,
      category: "Sensores", description: null, unit: batch.productUnit,
      status: "ACTIVE", createdAt: stamp, updatedAt: stamp,
    }],
    batches: [{ ...batch, id: "09bd8de5-6bbd-4667-811f-41fcae0f34c4" }],
    movements: movements.map((movement) => ({ ...movement, batchId: "09bd8de5-6bbd-4667-811f-41fcae0f34c4" })),
    incidents: safety.incidents.map((incident) => ({
      ...companyLink, ...incident, productId: batch.productId, productName: batch.productName, productSku: batch.productSku,
      batchId: "09bd8de5-6bbd-4667-811f-41fcae0f34c4", batchCode: batch.batchCode, batchStatus: batch.status,
      description: null, locationName: "Unidade de Recebimento São José", reportedBy: null,
      resolutionNotes: "Embalagem inspecionada.", createdAt: stamp, updatedAt: stamp,
    })),
  };
}

let workspaceCache: Workspace | undefined;

function getWorkspace(): Workspace {
  if (workspaceCache) return workspaceCache;
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      workspaceCache = JSON.parse(saved) as Workspace;
      return workspaceCache;
    }
  } catch {
    // A browser that blocks storage can still run the demonstration in memory.
  }
  workspaceCache = seed();
  return workspaceCache;
}

function saveWorkspace(workspace: Workspace) {
  workspaceCache = workspace;
  try { window.localStorage.setItem(storageKey, JSON.stringify(workspace)); } catch { /* Keep in memory. */ }
}

function error(status: number, message: string) {
  return Response.json({ message }, { status });
}

function string(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function matching(rows: Row[], field: string, value: string) {
  return rows.filter((row) => row[field] === value);
}

function movementsFor(workspace: Workspace, batchId: string) {
  return matching(workspace.movements, "batchId", batchId).sort((a, b) => (
    Date.parse(string(a.occurredAt)) - Date.parse(string(b.occurredAt))
  ));
}

function activeIncidents(rows: Row[]) {
  return rows.filter((incident) => incident.status !== "RESOLVED");
}

function addMovement(workspace: Workspace, batch: Row, movement: RecordData, stamp: string) {
  const previousStatus = batch.status;
  const type = string(movement.movementType);
  if (previousStatus !== "BLOCKED" || type === "RELEASE") {
    batch.status = statusAfterMovement[type] ?? previousStatus;
  }
  batch.updatedAt = stamp;
  const record: Row = {
    ...movement, id: crypto.randomUUID(), companyId: batch.companyId, companyName: batch.companyName,
    productId: batch.productId, productName: batch.productName, batchId: batch.id,
    batchCode: batch.batchCode, createdAt: stamp,
  };
  workspace.movements.push(record);
  return record;
}

export function isDemoWorkspacePath(path = window.location.pathname) {
  return path === demoWorkspacePath || path.startsWith(demoWorkspacePath + "/");
}

export function batchPassportPath(id: string) {
  return (isDemoWorkspacePath() ? demoWorkspacePath : "") + "/passport/" + id;
}

export async function requestDemoWorkspace(path: string, options?: RequestInit): Promise<Response> {
  options?.signal?.throwIfAborted();
  const workspace = getWorkspace();
  const method = options?.method ?? "GET";
  const [, api, scope, companyId, type, productId, batchSegment, batchId, resource, incidentId, action] = path.split("/");
  if (api !== "api") return error(404, "Endereço não encontrado.");

  if (scope === "public" && companyId === "passports" && method === "GET") {
    const batch = workspace.batches.find((row) => row.id === type);
    if (!batch) return error(404, "Passaporte não encontrado neste navegador.");
    const incidents = matching(workspace.incidents, "batchId", batch.id);
    const active = activeIncidents(incidents);
    return Response.json({
      passportId: batch.id, verificationStatus: "DEMO", batch,
      movements: movementsFor(workspace, batch.id), generatedAt: new Date().toISOString(),
      safety: {
        status: batch.status === "BLOCKED" ? "BLOCKED" : active.length ? "ATTENTION" : "CLEAR",
        totalIncidents: incidents.length, activeIncidents: active.length,
        resolvedIncidents: incidents.length - active.length,
        criticalActiveIncidents: active.filter((row) => row.severity === "CRITICAL").length,
        hasAutomaticBlocks: incidents.some((row) => row.automaticBlock), incidents,
      },
    });
  }

  if (scope !== "companies") return error(404, "Endereço não encontrado.");
  const body = typeof options?.body === "string" ? JSON.parse(options.body) as RecordData : {};
  const stamp = new Date().toISOString();
  const create = (rows: Row[], data: RecordData) => {
    const row: Row = { ...data, id: crypto.randomUUID(), createdAt: stamp, updatedAt: stamp };
    rows.push(row);
    saveWorkspace(workspace);
    return Response.json(row, { status: 201 });
  };

  if (!companyId) {
    if (method === "GET") return Response.json(workspace.companies);
    if (method === "POST") {
      if (workspace.companies.some((row) => row.taxId === string(body.taxId))) return error(409, "Documento já cadastrado.");
      return create(workspace.companies, { ...body, status: "ACTIVE" });
    }
  }
  const company = workspace.companies.find((row) => row.id === companyId);
  if (!company) return error(404, "Empresa não encontrada.");
  const companyLink = { companyId, companyName: company.tradeName };
  if (type === "batch-overview" && method === "GET") {
    return Response.json(matching(workspace.batches, "companyId", companyId).map((batch) => {
      const last = movementsFor(workspace, batch.id).at(-1);
      return { ...batch, sku: batch.productSku, lastEvent: last?.title, lastLocation: last?.locationName,
        lastOccurredAt: last?.occurredAt, openIncidents: activeIncidents(matching(workspace.incidents, "batchId", batch.id)).length };
    }));
  }
  if (type === "incidents" && method === "GET") {
    return Response.json(matching(workspace.incidents, "companyId", companyId));
  }
  if (type === "suppliers" && !productId) {
    if (method === "GET") return Response.json(matching(workspace.suppliers, "companyId", companyId));
    if (method === "POST") return create(workspace.suppliers, { ...body, ...companyLink, status: "ACTIVE" });
  }
  if (type !== "products") return error(404, "Área não encontrada.");
  const products = matching(workspace.products, "companyId", companyId);
  if (!productId) {
    if (method === "GET") return Response.json(products);
    if (method === "POST") {
      if (products.some((row) => string(row.sku).toLowerCase() === string(body.sku).toLowerCase())) return error(409, "SKU já cadastrado.");
      return create(workspace.products, { ...body, ...companyLink, status: "ACTIVE" });
    }
  }
  const product = products.find((row) => row.id === productId);
  if (!product || batchSegment !== "batches") return error(404, "Produto ou área não encontrado.");
  const batches = matching(workspace.batches, "productId", productId);
  if (!batchId) {
    if (method === "GET") return Response.json(batches);
    if (method === "POST") {
      const supplier = workspace.suppliers.find((row) => row.id === body.supplierId && row.companyId === companyId);
      if (!supplier) return error(400, "Selecione um fornecedor desta empresa.");
      if (batches.some((row) => string(row.batchCode).toLowerCase() === string(body.batchCode).toLowerCase())) return error(409, "Código de lote já cadastrado.");
      if (body.expirationDate && string(body.expirationDate) < string(body.manufactureDate)) return error(400, "A validade deve ser posterior à fabricação.");
      if (!(Number(body.initialQuantity) > 0)) return error(400, "Informe uma quantidade positiva.");
      return create(workspace.batches, {
        ...body, ...companyLink, productId, productName: product.name, productSku: product.sku, productUnit: product.unit,
        supplierName: supplier.tradeName, supplierTaxId: supplier.taxId, supplierCity: supplier.city,
        supplierState: supplier.state, supplierCountry: supplier.country, currentQuantity: body.initialQuantity, status: "REGISTERED",
      });
    }
  }
  const batch = batches.find((row) => row.id === batchId);
  if (!batch) return error(404, "Lote não encontrado.");
  const incidents = matching(workspace.incidents, "batchId", batch.id);
  if (resource === "movements") {
    if (method === "GET") return Response.json(movementsFor(workspace, batch.id));
    if (method === "POST") {
      if (batch.status === "BLOCKED") return error(409, "Trate as ocorrências e libere o lote antes de continuar.");
      const movement = addMovement(workspace, batch, body, stamp);
      saveWorkspace(workspace);
      return Response.json(movement, { status: 201 });
    }
  }
  if (resource === "incidents") {
    if (method === "GET") return Response.json(incidents.map((row) => ({ ...row, batchStatus: batch.status })));
    if (method === "POST" && !incidentId) {
      const automaticBlock = body.severity === "HIGH" || body.severity === "CRITICAL";
      if (automaticBlock) batch.status = "BLOCKED";
      return create(workspace.incidents, {
        ...body, ...companyLink, productId, productName: product.name, productSku: product.sku,
        batchId, batchCode: batch.batchCode, batchStatus: batch.status, status: "OPEN",
        automaticBlock, resolvedAt: null, resolutionNotes: null,
      });
    }
    const incident = incidents.find((row) => row.id === incidentId);
    if (method === "PATCH" && incident && (action === "investigation" || action === "resolve")) {
      if (incident.status === "RESOLVED") return error(409, "Ocorrência já resolvida.");
      if (action === "resolve" && !string(body.resolutionNotes)) return error(400, "Descreva como a ocorrência foi resolvida.");
      Object.assign(incident, action === "resolve"
        ? { status: "RESOLVED", resolvedAt: stamp, resolutionNotes: string(body.resolutionNotes) }
        : { status: "INVESTIGATING" }, { updatedAt: stamp, batchStatus: batch.status });
      saveWorkspace(workspace);
      return Response.json(incident);
    }
  }
  if (resource === "release" && method === "POST") {
    if (batch.status !== "BLOCKED" || activeIncidents(incidents).length) return error(409, "Resolva as ocorrências antes de liberar o lote.");
    const movement = addMovement(workspace, batch, {
      movementType: "RELEASE", title: "Lote liberado após inspeção", description: body.releaseNotes,
      locationName: body.locationName, latitude: body.latitude, longitude: body.longitude,
      responsibleName: body.releasedBy, quantity: batch.currentQuantity, occurredAt: stamp,
    }, stamp);
    saveWorkspace(workspace);
    return Response.json(movement, { status: 201 });
  }
  return error(404, "Ação não encontrada na demonstração.");
}
