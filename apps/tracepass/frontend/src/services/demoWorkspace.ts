import { demoPassport } from "../demoPassport";

export const demoWorkspacePath = "/laboratorio";
const storageKey = "tracepass.workspace.v1";

type RecordData = Record<string, unknown>;
type Row = RecordData & { id: string };
type Entity = "companies" | "products" | "suppliers" | "batches" | "movements";
type AuditEntry = {
  id: number; entity: Entity; recordId: string; action: "EDITED" | "ARCHIVED";
  reason: string | null; beforeData: string; afterData: string; recordedAt: string;
};
type Workspace = {
  companies: Row[];
  suppliers: Row[];
  products: Row[];
  batches: Row[];
  movements: Row[];
  incidents: Row[];
  audit?: AuditEntry[];
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

function active(rows: Row[]) {
  return rows.filter((row) => !row.archivedAt);
}

function batchDetails(workspace: Workspace, batch: Row) {
  const product = workspace.products.find((row) => row.id === batch.productId);
  const supplier = workspace.suppliers.find((row) => row.id === batch.supplierId);
  const company = workspace.companies.find((row) => row.id === batch.companyId);
  return {
    ...batch, companyName: company?.tradeName,
    productName: product?.name, productSku: product?.sku, productUnit: product?.unit,
    supplierName: supplier?.tradeName ?? null, supplierTaxId: supplier?.taxId ?? null,
    supplierCity: supplier?.city ?? null, supplierState: supplier?.state ?? null,
    supplierCountry: supplier?.country ?? null,
  };
}

const editableFields: Record<Entity, string[]> = {
  companies: ["legalName", "tradeName", "taxId", "status"],
  products: ["sku", "name", "description", "category", "unit", "status"],
  suppliers: ["legalName", "tradeName", "taxId", "email", "phone", "city", "state", "country", "status"],
  batches: ["batchCode", "manufactureDate", "expirationDate", "supplierId", "currentQuantity"],
  movements: ["title", "description", "locationName", "responsibleName", "latitude", "longitude"],
};

function auditChange(workspace: Workspace, entity: Entity, row: Row, changes: RecordData, stamp: string, reason?: string) {
  if (Object.entries(changes).every(([key, value]) => (row[key] ?? null) === value)) return;
  const beforeData = JSON.stringify(row);
  Object.assign(row, changes, { updatedAt: stamp });
  const audit = workspace.audit ??= [];
  audit.unshift({
    id: (audit[0]?.id ?? 0) + 1, entity, recordId: row.id,
    action: changes.archivedAt ? "ARCHIVED" : "EDITED", reason: reason || null,
    beforeData, afterData: JSON.stringify(row), recordedAt: stamp,
  });
  saveWorkspace(workspace);
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
  const [pathname, query = ""] = path.split("?", 2);
  const [, api, scope, companyId, type, productId, batchSegment, batchId, resource, incidentId, action] = pathname.split("/");
  if (api !== "api") return error(404, "Endereço não encontrado.");
  const body = typeof options?.body === "string" ? JSON.parse(options.body) as RecordData : {};
  const stamp = new Date().toISOString();
  const edit = (entity: Entity, row: Row) => {
    const changes = Object.fromEntries(editableFields[entity].map((key) => [key,
      typeof body[key] === "string" ? string(body[key]) || null : body[key] ?? null,
    ]));
    auditChange(workspace, entity, row, changes, stamp);
    return Response.json(row);
  };

  if (scope === "audit") {
    if (!companyId && method === "GET") {
      const cursor = Number(new URLSearchParams(query).get("before") ?? Number.MAX_SAFE_INTEGER);
      return Response.json((workspace.audit ?? []).filter((entry) => entry.id < cursor).slice(0, 50));
    }
    const entity = companyId as Entity;
    if (!Object.hasOwn(editableFields, entity)) return error(404, "Tipo de registro desconhecido.");
    const row = active(workspace[entity]).find((item) => item.id === type);
    if (!row) return error(404, "Registro ativo não encontrado.");
    if (entity === "movements" && !active(workspace.batches).some((batch) => batch.id === row.batchId)) {
      return error(409, "O lote está arquivado.");
    }
    if (method === "PUT" && entity === "movements") {
      if (!string(body.title) || string(body.title).length > 120) return error(400, "Informe um título válido.");
      const { latitude, longitude } = body;
      if ((latitude == null) !== (longitude == null) || (latitude != null &&
        (typeof latitude !== "number" || typeof longitude !== "number" || Math.abs(latitude) > 90 || Math.abs(longitude) > 180))) {
        return error(400, "Informe latitude e longitude válidas juntas.");
      }
      return edit(entity, row);
    }
    if (method === "DELETE") {
      const reason = string(body.reason);
      if (reason.length > 500) return error(400, "O motivo pode ter até 500 caracteres.");
      const blockers = {
        companies: () => active([...workspace.products, ...workspace.suppliers]).some((item) => item.companyId === row.id),
        products: () => active(workspace.batches).some((item) => item.productId === row.id),
        suppliers: () => active(workspace.batches).some((item) => item.supplierId === row.id),
        batches: () => activeIncidents(matching(workspace.incidents, "batchId", row.id)).length > 0,
        movements: () => ["BLOCK", "RELEASE"].includes(string(row.movementType)),
      };
      const messages = {
        companies: "Arquive primeiro os produtos e fornecedores ativos desta empresa.",
        products: "Arquive primeiro os lotes vinculados a este cadastro.",
        suppliers: "Arquive primeiro os lotes vinculados a este cadastro.",
        batches: "Resolva as ocorrências ativas antes de arquivar o lote.",
        movements: "Eventos de bloqueio e liberação permanecem no histórico de segurança.",
      };
      if (blockers[entity]()) return error(409, messages[entity]);
      auditChange(workspace, entity, row, { archivedAt: stamp }, stamp, reason);
      return new Response(null, { status: 204 });
    }
  }

  if (scope === "public" && companyId === "passports" && method === "GET") {
    const batch = workspace.batches.find((row) => row.id === type);
    if (!batch) return error(404, "Passaporte não encontrado neste navegador.");
    const incidents = matching(workspace.incidents, "batchId", batch.id);
    const active = activeIncidents(incidents);
    const movements = movementsFor(workspace, batch.id);
    const visibleMovements = movements.filter((row) => !row.archivedAt);
    return Response.json({
      passportId: batch.id, verificationStatus: "DEMO", batch: batchDetails(workspace, batch),
      movements: visibleMovements, archivedMovements: movements.length - visibleMovements.length,
      generatedAt: new Date().toISOString(),
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
  const create = (rows: Row[], data: RecordData) => {
    const row: Row = { ...data, id: crypto.randomUUID(), createdAt: stamp, updatedAt: stamp };
    rows.push(row);
    saveWorkspace(workspace);
    return Response.json(row, { status: 201 });
  };

  if (!companyId) {
    if (method === "GET") return Response.json(active(workspace.companies));
    if (method === "POST") {
      if (workspace.companies.some((row) => row.taxId === string(body.taxId))) return error(409, "Documento já cadastrado.");
      return create(workspace.companies, { ...body, status: "ACTIVE" });
    }
  }
  const company = active(workspace.companies).find((row) => row.id === companyId);
  if (!company) return error(404, "Empresa não encontrada.");
  if (!type && method === "PUT") {
    if (!string(body.legalName) || !string(body.tradeName) || !string(body.taxId)) return error(400, "Informe o nome e o documento da empresa.");
    if (workspace.companies.some((row) => row.id !== company.id && row.taxId === string(body.taxId))) return error(409, "Documento já cadastrado.");
    return edit("companies", company);
  }
  const companyLink = { companyId, companyName: company.tradeName };
  if (type === "batch-overview" && method === "GET") {
    return Response.json(active(matching(workspace.batches, "companyId", companyId)).map((record) => {
      const batch = batchDetails(workspace, record);
      const last = active(movementsFor(workspace, record.id)).at(-1);
      return { ...batch, sku: batch.productSku, lastEvent: last?.title, lastLocation: last?.locationName,
        lastOccurredAt: last?.occurredAt, openIncidents: activeIncidents(matching(workspace.incidents, "batchId", record.id)).length };
    }));
  }
  if (type === "incidents" && method === "GET") {
    return Response.json(matching(workspace.incidents, "companyId", companyId));
  }
  if (type === "suppliers") {
    const suppliers = matching(workspace.suppliers, "companyId", companyId);
    if (!productId && method === "GET") return Response.json(active(suppliers));
    if (!productId && method === "POST") return create(workspace.suppliers, { ...body, ...companyLink, status: "ACTIVE" });
    const supplier = active(suppliers).find((row) => row.id === productId);
    if (supplier && method === "PUT") {
      if (!string(body.legalName) || !string(body.tradeName)) return error(400, "Informe os nomes do fornecedor.");
      return edit("suppliers", supplier);
    }
  }
  if (type !== "products") return error(404, "Área não encontrada.");
  const products = matching(workspace.products, "companyId", companyId);
  if (!productId) {
    if (method === "GET") return Response.json(active(products));
    if (method === "POST") {
      if (products.some((row) => string(row.sku).toLowerCase() === string(body.sku).toLowerCase())) return error(409, "SKU já cadastrado.");
      return create(workspace.products, { ...body, ...companyLink, status: "ACTIVE" });
    }
  }
  const product = active(products).find((row) => row.id === productId);
  if (product && !batchSegment && method === "PUT") {
    if (!string(body.sku) || !string(body.name)) return error(400, "Informe o SKU e o nome do produto.");
    if (products.some((row) => row.id !== product.id && string(row.sku).toLowerCase() === string(body.sku).toLowerCase())) return error(409, "SKU já cadastrado.");
    return edit("products", product);
  }
  if (!product || batchSegment !== "batches") return error(404, "Produto ou área não encontrado.");
  const batches = matching(workspace.batches, "productId", productId);
  if (!batchId) {
    if (method === "GET") return Response.json(active(batches).map((row) => batchDetails(workspace, row)));
    if (method === "POST") {
      const supplier = active(workspace.suppliers).find((row) => row.id === body.supplierId && row.companyId === companyId);
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
  const batch = active(batches).find((row) => row.id === batchId);
  if (!batch) return error(404, "Lote não encontrado.");
  if (!resource && method === "PUT") {
    const supplier = active(workspace.suppliers).find((row) => row.id === body.supplierId && row.companyId === companyId);
    if (body.supplierId && !supplier) return error(400, "Selecione um fornecedor ativo desta empresa.");
    if (!string(body.batchCode) || !string(body.manufactureDate)) return error(400, "Informe o código e a data de fabricação.");
    if (body.expirationDate && string(body.expirationDate) < string(body.manufactureDate)) return error(400, "A validade deve ser posterior à fabricação.");
    if (batches.some((row) => row.id !== batch.id && string(row.batchCode).toLowerCase() === string(body.batchCode).toLowerCase())) return error(409, "Código de lote já cadastrado.");
    if (typeof body.currentQuantity !== "number" || body.currentQuantity < 0 || body.currentQuantity > Number(batch.initialQuantity)) return error(400, "A quantidade deve estar entre zero e a quantidade inicial.");
    return edit("batches", batch);
  }
  const incidents = matching(workspace.incidents, "batchId", batch.id);
  if (resource === "movements") {
    if (method === "GET") return Response.json(active(movementsFor(workspace, batch.id)));
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
