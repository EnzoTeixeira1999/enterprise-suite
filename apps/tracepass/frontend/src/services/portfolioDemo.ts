import {
  getWorkspace, requestDemoWorkspace, saveWorkspace, seedDemoWorkspace, type Workspace,
} from "./demoWorkspace";

const base = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/+$/, "");
const endpoint = "/api/portfolio-demo";
const publicEndpoint = "/api/public/portfolio-demo";
type Snapshot = { revision: number; workspace: Workspace | null };

let publicSnapshot: Promise<Snapshot> | undefined;
let editorToken = "";
let mutations = Promise.resolve();

function readSnapshot(path: string, token?: string): Promise<Snapshot> {
  return fetch(base + path, {
    headers: token ? { Authorization: "Bearer " + token } : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(22_000),
  }).then((response) => {
    if (!response.ok) throw new Error("Não foi possível carregar a demonstração hospedada.");
    return response.json() as Promise<Snapshot>;
  });
}

function readPublic() {
  return publicSnapshot ??= readSnapshot(publicEndpoint).catch(() => {
    publicSnapshot = undefined;
    return { revision: 0, workspace: null };
  });
}

export type PublishedPassport = {
  id: string;
  code: string;
  product: string;
  featured: boolean;
};

export function publishedPassportPath(id: string) {
  return "/laboratorio/publico/passport/" + encodeURIComponent(id);
}

export async function listPublishedPassports(): Promise<PublishedPassport[]> {
  const { workspace } = await readPublic();
  if (!workspace) throw new Error("Catálogo de passaportes indisponível.");
  const products = new Map(workspace.products.map((product) => [product.id, product.name]));
  return workspace.batches.flatMap((batch) => {
    const product = products.get(String(batch.productId));
    if (batch.archivedAt || typeof batch.batchCode !== "string" || typeof product !== "string") return [];
    return [{ id: batch.id, code: batch.batchCode, product, featured: batch.id === workspace.featuredBatchId }];
  });
}

export function setPortfolioEditor(token: string) {
  editorToken = token;
}

async function saveSnapshot(snapshot: Snapshot, token: string) {
  const response = await fetch(base + endpoint, {
    method: "PUT",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(snapshot),
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 409) {
    return Response.json({ message: "A demonstração mudou em outra sessão. Atualize os dados e tente novamente." }, { status: 409 });
  }
  if (!response.ok) {
    return Response.json({ message: "Não foi possível salvar a demonstração hospedada." }, { status: response.status });
  }
  publicSnapshot = undefined;
  return null;
}

function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const next = mutations.then(operation);
  mutations = next.then(() => undefined, () => undefined);
  return next;
}

export async function visitorRequest(path: string, options?: RequestInit, featured = false) {
  if (featured) {
    const snapshot = await readPublic();
    return requestDemoWorkspace(path, options, snapshot.workspace ?? seedDemoWorkspace());
  }
  const mutation = options?.method && options.method !== "GET";
  const operation = async () => {
    const local = getWorkspace(await readPublic().then(({ workspace }) => workspace ?? undefined));
    const workspace = mutation ? structuredClone(local) : local;
    const result = await requestDemoWorkspace(path, options, workspace);
    if (mutation && result.ok) saveWorkspace(workspace);
    return result;
  };
  return mutation ? enqueue(operation) : operation();
}

export async function editorRequest(path: string, options?: RequestInit) {
  const token = editorToken;
  const mutation = options?.method && options.method !== "GET";
  const operation = async () => {
    const snapshot = await readSnapshot(endpoint, token);
    const workspace = snapshot.workspace ?? seedDemoWorkspace();
    const result = await requestDemoWorkspace(path, options, workspace);
    if (!mutation || !result.ok) return result;
    return (await saveSnapshot({ ...snapshot, workspace }, token)) ?? result;
  };
  return mutation ? enqueue(operation) : operation();
}
