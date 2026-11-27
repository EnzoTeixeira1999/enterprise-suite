import { useEffect, useState } from "react";
import { apiFetch } from "../services/api";

type Entry = {
  id: number; entity: string; recordId: string; action: "EDITED" | "ARCHIVED";
  reason?: string; beforeData: string; afterData: string; recordedAt: string;
};

const entityLabels: Record<string, string> = {
  companies: "Empresa", products: "Produto", suppliers: "Fornecedor", batches: "Lote", movements: "Movimentação",
};
const fieldLabels: Record<string, string> = {
  legalName: "Razão social", tradeName: "Nome fantasia", taxId: "Documento", name: "Nome", sku: "SKU",
  unit: "Unidade", category: "Categoria", description: "Descrição", status: "Status", email: "E-mail",
  phone: "Telefone", city: "Cidade", state: "Estado", country: "País", batchCode: "Código do lote",
  manufactureDate: "Fabricação", expirationDate: "Validade", supplierId: "ID do fornecedor", currentQuantity: "Quantidade atual",
  initialQuantity: "Quantidade inicial", title: "Título", locationName: "Local", responsibleName: "Responsável",
  latitude: "Latitude", longitude: "Longitude", archivedAt: "Arquivado em", occurredAt: "Data do evento", movementType: "Tipo do evento",
};
const ignored = new Set(["updatedAt", "createdAt"]);
const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function snapshot(data: string): Record<string, unknown> {
  return Object.fromEntries(Object.entries(JSON.parse(data) as Record<string, unknown>)
    .map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()), value]));
}

function display(value: unknown) {
  return value == null || value === "" ? "—" : String(value);
}

function AuditRow({ entry }: { entry: Entry }) {
  const before = snapshot(entry.beforeData);
  const after = snapshot(entry.afterData);
  const label = before.tradeName ?? before.name ?? before.batchCode ?? before.title ?? entry.recordId;
  const fields = Object.keys({ ...before, ...after }).filter((key) => !ignored.has(key) && (
    entry.action === "EDITED" ? (before[key] ?? null) !== (after[key] ?? null) : key in fieldLabels && before[key] != null
  ));

  return (
    <details className="record-audit__entry">
      <summary>
        <span><strong>{display(label)}</strong> <small>{entityLabels[entry.entity] ?? entry.entity}</small></span>
        <span>{entry.action === "ARCHIVED" ? "Arquivado" : "Editado"} · <time dateTime={entry.recordedAt}>{dateFormat.format(new Date(entry.recordedAt))}</time></span>
      </summary>
      <div className="record-audit__details">
        <p>ID do registro <code>{entry.recordId}</code></p>
        {entry.reason && <p>Motivo: {entry.reason}</p>}
        <table>
          <thead><tr><th>Campo</th><th>{entry.action === "ARCHIVED" ? "Valor ao arquivar" : "Antes"}</th>{entry.action === "EDITED" && <th>Depois</th>}</tr></thead>
          <tbody>{fields.map((key) => <tr key={key}>
            <th scope="row">{fieldLabels[key] ?? key}</th><td>{display(before[key])}</td>
            {entry.action === "EDITED" && <td>{display(after[key])}</td>}
          </tr>)}</tbody>
        </table>
      </div>
    </details>
  );
}

export default function RecordAudit({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState<{ entries: Entry[]; next: number | null }>({ entries: [], next: null });
  const [request, setRequest] = useState<{ cursor: number | null }>({ cursor: null });
  const [loaded, setLoaded] = useState<typeof request>();
  const [error, setError] = useState("");
  const loading = loaded !== request;

  useEffect(() => {
    const controller = new AbortController();
    const path = request.cursor === null ? "/api/audit" : `/api/audit?before=${request.cursor}`;
    apiFetch(path, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("Não foi possível consultar o histórico.");
      const entries = await response.json() as Entry[];
      if (controller.signal.aborted) return;
      setPage((previous) => ({
        entries: request.cursor === null ? entries : [...previous.entries, ...entries],
        next: entries.length === 50 ? entries.at(-1)?.id ?? null : null,
      }));
      setError("");
    }).catch(() => {
      if (!controller.signal.aborted) setError("Não foi possível consultar o histórico de alterações.");
    }).finally(() => {
      if (!controller.signal.aborted) setLoaded(request);
    });
    return () => controller.abort();
  }, [request]);

  return (
    <section className="record-audit" aria-labelledby="record-audit-title">
      <header><div><h2 id="record-audit-title">Histórico de alterações</h2>
        <p>Consulte edições e arquivamentos. Abra um registro para comparar os valores.</p></div>
        <button className="secondary-button" type="button" onClick={onClose}>Fechar histórico</button>
      </header>
      {loading && <p role="status">Carregando histórico…</p>}
      {error && <p role="alert">{error} <button className="secondary-button" type="button" onClick={() => setRequest({ ...request })}>Tentar novamente</button></p>}
      {!loading && !error && page.entries.length === 0 && <p>Nenhuma alteração registrada.</p>}
      {page.entries.map((entry) => <AuditRow key={entry.id} entry={entry} />)}
      {page.next !== null && !loading && !error && <button className="secondary-button" type="button" onClick={() => setRequest({ cursor: page.next })}>Ver alterações anteriores</button>}
    </section>
  );
}
