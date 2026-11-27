import RecordActions from "./components/RecordActions";
import RecordAudit from "./components/RecordAudit";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import "./App.css";
import "./experience.css";
import { demoWorkspacePath, isDemoWorkspacePath } from "./services/demoWorkspace";
import { demoPath } from "./demoPassport";
import ProductPanel from "./components/ProductPanel";
import BatchOverview, { type BatchSelection } from "./components/BatchOverview";
import routeConcept from "./assets/tracepass-route-illustration.webp";
import BatchPanel from "./components/BatchPanel";
import MovementTimeline from "./components/MovementTimeline";
import PublicPassport from "./components/PublicPassport";
import SupplierPanel from "./components/SupplierPanel";
import IncidentPanel from "./components/IncidentPanel";
import { apiFetch, setAdminToken, setEditingPortfolio } from "./services/api";
import { setPortfolioEditor } from "./services/portfolioDemo";

const previewStops = [
  { title: "Origem", description: "Registro da saída" },
  { title: "Transferência", description: "Passagem pelo centro logístico" },
  { title: "Chegada", description: "Recebimento no destino" },
];

const demoGuide = [
  { title: "Abra um lote", description: "Vá a Lotes para usar a remessa fictícia que já vem cadastrada. Também é possível cadastrar seu próprio produto, fornecedor e lote." },
  { title: "Registre um evento", description: "Em Movimentações, selecione o lote, informe o evento e marque o local no mapa. Salve para acrescentar o ponto à jornada." },
  { title: "Confira o passaporte", description: "Em Lotes, abra o passaporte do mesmo lote e compare o mapa com a linha do tempo. Use Ocorrências se precisar simular um desvio." },
];

function DemoGuide() {
  return (
    <ol className="demo-guide-list">
      {demoGuide.map(({ title, description }, index) => (
        <li key={title}>
          <span aria-hidden="true">{index + 1}</span>
          <div><h3>{title}</h3><p>{description}</p></div>
        </li>
      ))}
    </ol>
  );
}

type View = "landing" | "dashboard";
const workflowSteps = ["Empresas", "Produtos", "Fornecedores", "Lotes", "Movimentações"] as const;
type Area = typeof workflowSteps[number] | "Ocorrências";

const areaHelp: Record<Area, string> = {
  Empresas: "Use uma empresa existente ou cadastre a organização responsável pela operação. Selecione a mesma empresa nos cadastros de produtos, fornecedores e lotes para vincular os registros.",
  Produtos: "Cadastre o nome, o SKU e a unidade de medida. O SKU identifica o produto no catálogo e pode ser usado em vários lotes. Você pode cadastrar produtos e fornecedores em qualquer ordem.",
  Fornecedores: "Cadastre a empresa que fornece o produto. Ao criar o lote, selecione o fornecedor daquela remessa para que a origem apareça no passaporte. Se já estiver cadastrado, siga para Lotes.",
  Lotes: "Selecione o produto e o fornecedor da mesma empresa. Informe o código do lote, a data de fabricação e a quantidade inicial. Depois de salvar, use Ver passaporte para consultar a ficha pública ou abra a jornada para registrar movimentações.",
  Movimentações: "Registre cada evento conforme ele acontecer, como armazenamento, expedição ou recebimento. Selecione o lote, informe quando e onde aconteceu e marque o ponto no mapa quando houver coordenadas. Você pode voltar a esta etapa sempre que houver um novo evento.",
  Ocorrências: "Abra esta área quando precisar consultar ou registrar um desvio, como avaria ou falha de qualidade. Selecione o lote, informe o que houve e registre a resolução após o tratamento. A gravidade alta ou crítica pode acionar bloqueio automático.",
};

const areaGoals: Record<Area, string> = {
  Empresas: "Defina quem opera",
  Produtos: "Identifique o que será rastreado",
  Fornecedores: "Registre de onde vem",
  Lotes: "Vincule produto e fornecedor",
  Movimentações: "Registre o caminho do lote",
  Ocorrências: "Trate desvios e libere o lote",
};
type CompanyStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

type Company = {
  id: string;
  legalName: string;
  tradeName: string;
  taxId: string;
  status: CompanyStatus;
  createdAt: string;
  updatedAt: string;
};

type CompanyForm = {
  legalName: string;
  tradeName: string;
  taxId: string;
};

type Feedback = {
  type: "success" | "error";
  message: string;
};

const initialForm: CompanyForm = {
  legalName: "",
  tradeName: "",
  taxId: "",
};

const statusLabels: Record<CompanyStatus, string> = {
  ACTIVE: "Ativa",
  INACTIVE: "Inativa",
  SUSPENDED: "Suspensa",
};

function getPassportIdFromPath() {
  const match = window.location.pathname.match(
    /^(?:\/laboratorio(?:\/publico)?)?\/passport\/([0-9a-f-]{36})\/?$/i,
  );

  return match?.[1] ?? null;
}

function App() {
  const isWorkshop = window.location.pathname.replace(/\/$/, "") === demoWorkspacePath;
  const [view, setView] = useState<View>(isWorkshop ? "dashboard" : "landing");
  const [showAudit, setShowAudit] = useState(false);
  const [portfolioMode, setPortfolioMode] = useState(false);
  const [area, setArea] = useState<Area>(isWorkshop ? "Empresas" : "Lotes");
  const [batchRevision, setBatchRevision] = useState(0);
  const [selectedBatch, setSelectedBatch] = useState<BatchSelection>();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companiesError, setCompaniesError] = useState("");
  const [form, setForm] = useState<CompanyForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [adminAccessOpen, setAdminAccessOpen] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const loadCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    setCompaniesError("");

    try {
      const response = await apiFetch("/api/companies");

      if (!response.ok) {
        throw new Error("Não foi possível carregar as empresas");
      }

      const data: Company[] = await response.json();
      setCompanies(data);
    } catch {
      setCompaniesError(
        "Não foi possível consultar as empresas. Verifique se a API está ligada.",
      );
    } finally {
      setLoadingCompanies(false);
    }
  }, []);

  useEffect(() => {
    if (isWorkshop) void loadCompanies();
  }, [isWorkshop, loadCompanies]);

  async function handleAdminAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const accessForm = event.currentTarget;
    const token = String(new FormData(accessForm).get("adminToken") ?? "").trim();
    if (!token || signingIn) return;

    setSigningIn(true);
    setAdminError("");
    setAdminToken(token);
    try {
      const response = await apiFetch("/api/companies", {
        signal: AbortSignal.timeout(30_000),
      });
      if (response.status === 401) {
        throw new Error("Chave inválida ou acesso administrativo indisponível.");
      }
      const data: unknown = response.ok ? await response.json() : null;
      if (!Array.isArray(data)) {
        throw new Error("Não foi possível verificar o acesso. O servidor pode estar iniciando.");
      }
      setCompanies(data);
      setPortfolioEditor(token);
      accessForm.reset();
      setAdminAccessOpen(false);
      setView("dashboard");
    } catch (error) {
      setAdminToken("");
      setAdminError(error instanceof DOMException && error.name === "TimeoutError"
        ? "O servidor está demorando. Tente novamente em instantes."
        : error instanceof Error ? error.message : "Falha ao acessar o painel.");
    } finally {
      setSigningIn(false);
    }
  }

  function switchPortfolioMode(enabled: boolean) {
    setEditingPortfolio(enabled);
    setPortfolioMode(enabled);
    setShowAudit(false);
    setSelectedBatch(undefined);
    setCompanies([]);
    setForm(initialForm);
    setFeedback(null);
    setArea("Empresas");
    void loadCompanies();
  }

  function leaveDashboard() {
    setEditingPortfolio(false);
    setPortfolioEditor("");
    setPortfolioMode(false);
    setAdminToken("");
    setShowAudit(false);
    setCompanies([]);
    setForm(initialForm);
    setFeedback(null);
    setSelectedBatch(undefined);
    setArea("Lotes");
    setView("landing");
  }

  async function handleCreateCompany(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const response = await apiFetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.message ?? "Não foi possível cadastrar a empresa",
        );
      }

      const createdCompany = responseData as Company;

      setCompanies((currentCompanies) => [
        ...currentCompanies,
        createdCompany,
      ]);

      setForm(initialForm);
      setFeedback({
        type: "success",
        message: "Empresa cadastrada com sucesso.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível cadastrar a empresa.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function updateForm(field: keyof CompanyForm, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(date));
  }

  const activeCompanies = companies.filter(
    (company) => company.status === "ACTIVE",
  ).length;

  const attentionCompanies = companies.filter(
    (company) => company.status !== "ACTIVE",
  ).length;

  if (window.location.pathname.replace(/\/$/, "") === demoPath) {
    return <PublicPassport passportId="destaque" featured />;
  }

  const isIncidentArea = area === "Ocorrências";
  const step = isIncidentArea ? -1 : workflowSteps.indexOf(area);
  const previousArea = step > 0 ? workflowSteps[step - 1] : undefined;
  const nextArea = step >= 0 ? workflowSteps[step + 1] : undefined;

  function goToArea(target: Area) {
    setSelectedBatch(undefined);
    setArea(target);
  }

  const passportId = getPassportIdFromPath();

  if (passportId) {
    return <PublicPassport passportId={passportId} workspace={isDemoWorkspacePath() && !window.location.pathname.startsWith("/laboratorio/publico/")} featured={window.location.pathname.startsWith("/laboratorio/publico/")} />;
  }

  return (
    <main className={`app ${view === "dashboard" ? "app--dashboard" : ""}`}>
      <header className="header">
        <div className="brand">
          <span className="brand__symbol" aria-hidden="true">TP</span>

          <div>
            <strong className="brand__name">TracePass</strong>
          </div>
        </div>

        <div className="header__actions">
          {view === "dashboard" && !showAudit && <button className="secondary-button" type="button"
            onClick={() => setShowAudit(true)}>Histórico de alterações</button>}
          {view === "dashboard" && !isWorkshop && <button className="secondary-button" type="button"
            disabled={loadingCompanies} onClick={() => switchPortfolioMode(!portfolioMode)}>
            {portfolioMode ? "Voltar à base administrativa" : "Demonstração do portfólio"}
          </button>}
          {isWorkshop ? <a className="secondary-button" href="/">Voltar ao TracePass</a> : view === "dashboard" && (
            <button
              className="secondary-button"
              type="button"
              onClick={leaveDashboard}
            >
              Sair do painel
            </button>
          )}

          {view === "landing" && (
            <button className="secondary-button" type="button" aria-expanded={adminAccessOpen}
              aria-controls={adminAccessOpen ? "admin-access" : undefined} disabled={signingIn}
              onClick={() => { setAdminError(""); setAdminAccessOpen(!adminAccessOpen); }}>
              Acesso administrativo
            </button>
          )}
        </div>
      </header>

      {view === "landing" ? (
        <>
            {adminAccessOpen && (
              <form id="admin-access" className="hero__admin-form" onSubmit={handleAdminAccess}>
                <label htmlFor="admin-token">Chave administrativa</label>
                <input id="admin-token" name="adminToken" type="password" autoComplete="off" required />
                <button className="secondary-button" type="submit" disabled={signingIn}>
                  {signingIn ? "Conectando ao servidor…" : "Entrar"}
                </button>
                {adminError && <p role="alert">{adminError}</p>}
              </form>
            )}
          <section className="product-intro">
            <div className="product-intro__copy">
              <span className="product-intro__category">Rastreabilidade de produtos</span>
              <h1>Do início ao destino</h1>
              <p>Por onde seu produto passou antes de chegar até você? O TracePass reúne esse caminho em um passaporte digital.</p>
              <div className="landing-demo-actions">
                <a className="hero__demo-link" href={demoWorkspacePath}>Testar o TracePass <span aria-hidden="true">↗</span></a>
                <a className="landing-passport-link" href={demoPath}>Ver Passaporte</a>
              </div>
            </div>
            <article className="demo-preview" aria-label="Cenário ilustrativo de rastreabilidade">
              <header>
                <div>
                  <h2>A jornada de uma remessa</h2>
                  <p>Da expedição ao recebimento</p>
                </div>
                <span className="demo-preview__badge">Cenário ilustrativo</span>
              </header>
              <div className="demo-preview__detail">
                <img className="route-illustration__image" src={routeConcept}
                  alt="Mapa ilustrativo de uma região portuária com três etapas numeradas e conectadas em carmim" />
                <ol className="demo-preview__events" aria-label="Destaques da linha do tempo">
                  {previewStops.map((stop, index) => (
                    <li key={stop.title}>
                      <span className="demo-preview__event-number" aria-hidden="true">{index + 1}</span>
                      <div><strong>{stop.title}</strong><small>{stop.description}</small></div>
                    </li>
                  ))}
                </ol>
              </div>
            </article>
          </section>
          <section className="landing-capabilities" aria-label="O que você pode consultar">
            <article><span aria-hidden="true">⌖</span><div><h2>De onde veio?</h2><p>Identifique o produto e o fornecedor de origem.</p></div></article>
            <article><span aria-hidden="true">⇄</span><div><h2>O que mudou no caminho?</h2><p>Veja as movimentações e como cada ocorrência foi tratada.</p></div></article>
            <article><span aria-hidden="true">▦</span><div><h2>Como consultar?</h2><p>Abra o passaporte pelo QR Code ou compartilhe o link.</p></div></article>
          </section>
          <section className="landing-guide" aria-labelledby="landing-guide-title">
            <header>
              <div>
                <h2 id="landing-guide-title">Como testar o TracePass</h2>
                <p>Use o cenário fictício para acompanhar uma remessa do registro ao passaporte.</p>
              </div>
              <a className="landing-passport-link" href={demoWorkspacePath}>Abrir demonstração <span aria-hidden="true">↗</span></a>
            </header>
            <DemoGuide />
          </section>
        </>
      ) : (
        <section className="dashboard">
          {showAudit ? <RecordAudit onClose={() => setShowAudit(false)} /> : <>
          {portfolioMode && <section className="workspace-intro">
            <div>
              <h1>Demonstração do portfólio</h1>
              <p>Use dados fictícios. Os cadastros salvos aqui ficam disponíveis aos visitantes.</p>
            </div>
            <a href={demoPath} className="landing-passport-link" target="_blank" rel="noreferrer">Ver passaporte publicado</a>
          </section>}
          <header className="workspace-intro">
            <div>
              <h1>{isWorkshop ? "Demonstração interativa" : portfolioMode ? "Cadastros da demonstração" : "Painel de rastreabilidade"}</h1>
              <p>{isWorkshop
                ? "Experimente o fluxo completo com dados fictícios. Os registros ficam neste navegador."
                : "Cadastre, acompanhe e compartilhe os registros dos seus lotes."}</p>
            </div>
            {isWorkshop && <a className="landing-passport-link" href={demoPath}>Ver Passaporte</a>}
          </header>
          {isWorkshop && (
            <details className="workspace-quickstart">
              <summary>Como testar com o lote pronto</summary>
              <DemoGuide />
            </details>
          )}
          <section className="workspace-flow" aria-labelledby="workspace-flow-title">
            <div className="workspace-flow__heading">
              <h2 id="workspace-flow-title">Fluxo de rastreabilidade</h2>
              <span>{isIncidentArea ? "Tratamento de desvios" : `Etapa ${step + 1} de ${workflowSteps.length}`}</span>
            </div>
            <nav aria-label="Etapas da rastreabilidade">
              <ol className="workspace-steps">
                {workflowSteps.map((item, index) => (
                  <li key={item}>
                    <button type="button" aria-current={area === item ? "step" : undefined}
                      onClick={() => goToArea(item)}>
                      <span className="workspace-step-number" aria-hidden="true">{index + 1}</span>
                      <strong>{item}</strong>
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="workspace-flow__guide">
              <div aria-live="polite"><strong>{areaGoals[area]}</strong><p>{areaHelp[area]}</p></div>
              <div className="workspace-flow__actions">
                {previousArea && <button className="secondary-button" type="button"
                  onClick={() => goToArea(previousArea)}>← {previousArea}</button>}
                {nextArea && <button className="primary-button" type="button"
                  onClick={() => goToArea(nextArea)}>Próxima: {nextArea} →</button>}
                {isIncidentArea && <button className="secondary-button" type="button"
                  onClick={() => goToArea("Lotes")}>← Voltar aos lotes</button>}
              </div>
            </div>
            <div className="workspace-flow__exception">
              <p>Registre uma ocorrência se houver um desvio no lote.</p>
              <button className="secondary-button" type="button" aria-current={isIncidentArea ? "true" : undefined}
                onClick={() => setArea("Ocorrências")}>Ocorrências <span>Opcional</span></button>
            </div>
          </section>
          {companiesError && (
            <p role="alert">{companiesError} <button type="button" className="secondary-button"
              onClick={() => void loadCompanies()}>Tentar novamente</button></p>
          )}
          {loadingCompanies && area !== "Empresas" && <p role="status">Carregando empresas…</p>}
          {area === "Empresas" && <>
          <div className="dashboard__heading">
            <div>
              <p className="dashboard__eyebrow">PAINEL ADMINISTRATIVO</p>
              <h2>Empresas conectadas</h2>
              <p>
                Gerencie as organizações que utilizam a infraestrutura do
                TracePass.
              </p>
            </div>

            <button
              className="secondary-button"
              type="button"
              onClick={() => void loadCompanies()}
            >
              Atualizar dados
            </button>
          </div>

          <section className="metrics">
            <article className="metric-card">
              <span>Total de empresas</span>
              <strong>{companies.length}</strong>
              <p>Organizações cadastradas</p>
            </article>

            <article className="metric-card">
              <span>Empresas ativas</span>
              <strong>{activeCompanies}</strong>
              <p>Operando normalmente</p>
            </article>

            <article className="metric-card">
              <span>Exigem atenção</span>
              <strong data-metric-tone={attentionCompanies > 0 ? "attention" : undefined}>{attentionCompanies}</strong>
              <p>Inativas ou suspensas</p>
            </article>
          </section>

          <section className="workspace" key={portfolioMode ? "portfolio" : "regular"}>
            <article className="panel form-panel">
              <div className="panel__header">
                <div>
                  <span>NOVO CADASTRO</span>
                  <h3>Adicionar empresa</h3>
                </div>
              </div>

              <form onSubmit={handleCreateCompany}>
                <label>
                  Razão social
                  <input
                    type="text"
                    value={form.legalName}
                    onChange={(event) =>
                      updateForm("legalName", event.target.value)
                    }
                    placeholder="Ex.: Empresa Tecnologia Ltda"
                    maxLength={160}
                    required
                  />
                </label>

                <label>
                  Nome fantasia
                  <input
                    type="text"
                    value={form.tradeName}
                    onChange={(event) =>
                      updateForm("tradeName", event.target.value)
                    }
                    placeholder="Ex.: Empresa Tech"
                    maxLength={120}
                    required
                  />
                </label>

                <label>
                  Documento
                  <input
                    type="text"
                    value={form.taxId}
                    onChange={(event) =>
                      updateForm("taxId", event.target.value)
                    }
                    placeholder="Ex.: 00.000.000/0001-00"
                    maxLength={32}
                    required
                  />
                </label>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Cadastrando..." : "Cadastrar empresa"}
                </button>

                {feedback && (
                  <p className={`feedback feedback--${feedback.type}`}>
                    {feedback.message}
                  </p>
                )}
              </form>
            </article>

            <article className="panel companies-panel">
              <div className="panel__header">
                <div>
                  <span>BASE EMPRESARIAL</span>
                  <h3>Empresas cadastradas</h3>
                </div>

                <strong>{companies.length}</strong>
              </div>

              {loadingCompanies && (
                <p className="empty-message">Carregando empresas...</p>
              )}

              {!loadingCompanies && companiesError && (
                <p className="feedback feedback--error">
                  {companiesError}
                </p>
              )}

              {!loadingCompanies &&
                !companiesError &&
                companies.length === 0 && (
                  <p className="empty-message">
                    Nenhuma empresa cadastrada.
                  </p>
                )}

              {!loadingCompanies && !companiesError && (
                <div className="company-list">
                  {companies.map((company) => (
                    <article className="company-item" key={company.id}>
                      <div className="company-item__symbol">
                        {company.tradeName.charAt(0).toUpperCase()}
                      </div>

                      <div className="company-item__content">
                        <h4>{company.tradeName}</h4>
                        <p>{company.legalName}</p>
                        <small>
                          Cadastrada em {formatDate(company.createdAt)}
                        </small>
                      </div>

                      <div className="company-item__document">
                        <span>DOCUMENTO</span>
                        <strong>{company.taxId}</strong>
                      </div>

                      <span
                        className={`company-status company-status--${company.status.toLowerCase()}`}
                      >
                        {statusLabels[company.status]}
                      </span>
                      <RecordActions entity="companies" record={company} name={company.tradeName}
                        editPath={`/api/companies/${company.id}`} onSaved={loadCompanies} />
                    </article>
                  ))}
                </div>
              )}
            </article>
          </section>

          </>}
          {area === "Produtos" && <ProductPanel companies={companies} />}
          {area === "Fornecedores" && <SupplierPanel companies={companies} />}
          {area === "Lotes" && (
            <>
              <BatchPanel companies={companies} onCreated={() => setBatchRevision((current) => current + 1)} />
              <BatchOverview revision={batchRevision} companies={companies} onOpenArea={(batch, target) => {
                setSelectedBatch(batch);
                setArea(target);
              }} />
            </>
          )}
          {area === "Movimentações" && <MovementTimeline companies={companies} initialBatch={selectedBatch} />}
          {area === "Ocorrências" && <IncidentPanel companies={companies} initialBatch={selectedBatch} />}
          </>}
        </section>
      )}
    </main>
  );
}

export default App;
