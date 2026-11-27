import { useEffect, useState } from "react";
import { batchPassportPath } from "../services/demoWorkspace";
import { apiFetch } from "../services/api";

export type BatchSelection = { id: string; companyId: string; productId: string };

const statuses = {
  REGISTERED: "Registrado", IN_STORAGE: "Armazenado", IN_TRANSIT: "Em trânsito",
  BLOCKED: "Bloqueado", COMPLETED: "Concluído", EXPIRED: "Vencido",
};

type BatchRow = BatchSelection & {
  batchCode: string;
  productName: string;
  sku: string;
  status: keyof typeof statuses;
  expirationDate: string | null;
  lastEvent: string | null;
  lastLocation: string | null;
  lastOccurredAt: string | null;
  openIncidents: number;
};

type Props = {
  companies: { id: string; tradeName: string }[];
  revision: number;
  onOpenArea: (batch: BatchSelection, area: "Movimentações" | "Ocorrências") => void;
};

export default function BatchOverview({ companies, onOpenArea, revision }: Props) {
  const [chosenCompany, setChosenCompany] = useState("");
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [validity, setValidity] = useState("");
  const [withIncidents, setWithIncidents] = useState(false);
  const [selected, setSelected] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const companyId = companies.some((company) => company.id === chosenCompany)
    ? chosenCompany : companies[0]?.id;

  useEffect(() => {
    if (!companyId) return;
    const controller = new AbortController();
    setRows([]);
    setSelected("");
    setLoading(true);
    setError("");
    apiFetch("/api/companies/" + companyId + "/batch-overview", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<BatchRow[]>;
      })
      .then((data) => { if (!controller.signal.aborted) setRows(data); })
      .catch(() => { if (!controller.signal.aborted) setError("Não foi possível carregar os lotes."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [companyId, attempt, revision]);

  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const term = query.trim().toLocaleLowerCase("pt-BR");
  const visible = rows.filter((row) => {
    const isExpired = row.status === "EXPIRED" || (row.expirationDate !== null && row.expirationDate < today);
    return (!term || [row.batchCode, row.productName, row.sku].some((value) => value.toLocaleLowerCase("pt-BR").includes(term)))
      && (!status || row.status === status)
      && (!validity || (validity === "missing" ? !row.expirationDate : validity === "expired" ? isExpired : Boolean(row.expirationDate) && !isExpired))
      && (!withIncidents || row.openIncidents > 0);
  });
  const batch = visible.find((row) => row.id === selected);

  return (
    <section className="batch-overview" aria-labelledby="batch-overview-title">
      <div className="batch-overview__heading">
        <h2 id="batch-overview-title">Lotes</h2>
        {companyId && <button className="secondary-button" type="button" disabled={loading}
          onClick={() => setAttempt((current) => current + 1)}>Atualizar lotes</button>}
      </div>
      {companies.length === 0 ? <p>Cadastre uma empresa para acompanhar seus lotes.</p> : (
        <>
          <div className="batch-filters">
            <label>Empresa<select value={companyId} onChange={(event) => { setRows([]); setSelected(""); setChosenCompany(event.target.value); }}>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.tradeName}</option>)}
            </select></label>
            <label>Pesquisar<input value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder="Código, produto ou SKU" /></label>
            <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Todos</option>
              {Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select></label>
            <label>Validade<select value={validity} onChange={(event) => setValidity(event.target.value)}>
              <option value="">Todas</option><option value="valid">Dentro da validade</option>
              <option value="expired">Vencidos</option><option value="missing">Sem data</option>
            </select></label>
            <label className="batch-filters__check"><input type="checkbox" checked={withIncidents}
              onChange={(event) => setWithIncidents(event.target.checked)} /> Com ocorrências ativas</label>
          </div>
          {loading && <p role="status">Carregando lotes…</p>}
          {error && <p role="alert">{error} <button className="secondary-button" type="button"
            onClick={() => setAttempt((current) => current + 1)}>Tentar novamente</button></p>}
          {!loading && !error && visible.length === 0 && <p>{rows.length ? "Nenhum lote corresponde aos filtros." : "Nenhum lote cadastrado nesta empresa."}</p>}
          {!loading && !error && visible.length > 0 && (
            <div className="batch-table">
              <table>
                <thead><tr>{["Lote", "Produto", "Status", "Último evento", "Local", "Ocorrências ativas"].map((label) =>
                  <th key={label} scope="col">{label}</th>)}</tr></thead>
                <tbody>{visible.map((row) => <tr key={row.id}>
                  <td><button type="button" className="route-select" aria-expanded={selected === row.id}
                    onClick={() => setSelected(selected === row.id ? "" : row.id)}>{row.batchCode}</button></td>
                  <td>{row.productName}<small>{row.sku}</small></td><td>{statuses[row.status]}</td>
                  <td>{row.lastEvent ?? "—"}{row.lastOccurredAt && <small>{new Date(row.lastOccurredAt).toLocaleString("pt-BR")}</small>}</td>
                  <td>{row.lastLocation ?? "—"}</td><td>{row.openIncidents}</td>
                </tr>)}</tbody>
              </table>
            </div>
          )}
          {batch && (
            <section className="batch-detail" aria-label={"Ficha do lote " + batch.batchCode}>
              <h3>{batch.batchCode}</h3>
              <p>{batch.productName} · {statuses[batch.status]} · Validade: {batch.expirationDate
                ? new Date(batch.expirationDate + "T12:00:00").toLocaleDateString("pt-BR") : "Não informada"}</p>
              <div className="dashboard-nav">
                <button type="button" onClick={() => onOpenArea(batch, "Movimentações")}>Movimentações</button>
                <button type="button" onClick={() => onOpenArea(batch, "Ocorrências")}>Ocorrências</button>
                <a href={batchPassportPath(batch.id)} target="_blank" rel="noreferrer">Abrir passaporte</a>
              </div>
            </section>
          )}
        </>
      )}
    </section>
  );
}
