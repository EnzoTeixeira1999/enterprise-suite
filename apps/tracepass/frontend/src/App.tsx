import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import "./App.css";
import ProductPanel from "./components/ProductPanel";
import BatchPanel from "./components/BatchPanel";
import MovementTimeline from "./components/MovementTimeline";
import PublicPassport from "./components/PublicPassport";
import SupplierPanel from "./components/SupplierPanel";
import IncidentPanel from "./components/IncidentPanel";
import { apiFetch } from "./services/api";

type ApiStatus = "checking" | "online" | "offline";
type View = "landing" | "dashboard";
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
    /^\/passport\/([0-9a-f-]{36})\/?$/i,
  );

  return match?.[1] ?? null;
}

function App() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [view, setView] = useState<View>("landing");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companiesError, setCompaniesError] = useState("");
  const [form, setForm] = useState<CompanyForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    apiFetch("/actuator/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Falha ao consultar a API");
        }

        return response.json();
      })
      .then((data) => {
        setApiStatus(data.status === "UP" ? "online" : "offline");
      })
      .catch(() => {
        setApiStatus("offline");
      });
  }, []);

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
    if (view === "dashboard") {
      void loadCompanies();
    }
  }, [view, loadCompanies]);

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

  const statusText: Record<ApiStatus, string> = {
    checking: "Verificando API...",
    online: "API conectada",
    offline: "API desconectada",
  };

  const activeCompanies = companies.filter(
    (company) => company.status === "ACTIVE",
  ).length;

  const attentionCompanies = companies.filter(
    (company) => company.status !== "ACTIVE",
  ).length;

  const passportId = getPassportIdFromPath();

  if (passportId) {
    return <PublicPassport passportId={passportId} />;
  }

  return (
    <main className={`app ${view === "dashboard" ? "app--dashboard" : ""}`}>
      <header className="header">
        <div className="brand">
          <div className="brand__symbol">TP</div>

          <div>
            <h1>TracePass</h1>
            <p>Rastreabilidade e passaporte digital</p>
          </div>
        </div>

        <div className="header__actions">
          {view === "dashboard" && (
            <button
              className="secondary-button"
              type="button"
              onClick={() => setView("landing")}
            >
              Voltar à apresentação
            </button>
          )}

          <div className={`status status--${apiStatus}`}>
            <span className="status__dot" />
            {statusText[apiStatus]}
          </div>
        </div>
      </header>

      {view === "landing" ? (
        <>
          <section className="hero">
            <p className="hero__label">CONTROLE DE PONTA A PONTA</p>

            <h2>Acompanhe toda a jornada de um produto.</h2>

            <p className="hero__description">
              Registre produtos, lotes, fornecedores e movimentações em uma
              linha do tempo confiável e transparente.
            </p>

            <button
              type="button"
              onClick={() => setView("dashboard")}
            >
              Iniciar demonstração
            </button>
          </section>

          <section className="features">
            <article>
              <span>01</span>
              <h3>Produtos e lotes</h3>
              <p>Identificação individual e histórico centralizado.</p>
            </article>

            <article>
              <span>02</span>
              <h3>Movimentações</h3>
              <p>Acompanhamento da origem até o destino final.</p>
            </article>

            <article>
              <span>03</span>
              <h3>Passaporte digital</h3>
              <p>Consulta pública por QR Code para clientes e parceiros.</p>
            </article>
          </section>
        </>
      ) : (
        <section className="dashboard">
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
              <strong>{attentionCompanies}</strong>
              <p>Inativas ou suspensas</p>
            </article>
          </section>

          <section className="workspace">
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
                    </article>
                  ))}
                </div>
              )}
            </article>
          </section>

          <ProductPanel companies={companies} />
          <SupplierPanel companies={companies} />
          <BatchPanel companies={companies} />
          <MovementTimeline companies={companies} />
          <IncidentPanel companies={companies} />
        </section>
      )}
    </main>
  );
}

export default App;