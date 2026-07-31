import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import BatchReleaseCard from "./BatchReleaseCard";
import { apiFetch } from "../services/api";

type CompanyOption = {
  id: string;
  tradeName: string;
};

type Product = {
  id: string;
  name: string;
  sku: string;
};

type BatchStatus =
  | "REGISTERED"
  | "IN_STORAGE"
  | "IN_TRANSIT"
  | "BLOCKED"
  | "COMPLETED"
  | "EXPIRED";

type Batch = {
  id: string;
  batchCode: string;
  status: BatchStatus;
};

type IncidentType =
  | "QUALITY_DEVIATION"
  | "TEMPERATURE_ALERT"
  | "DAMAGE"
  | "DOCUMENTATION"
  | "DELIVERY_DELAY"
  | "OTHER";

type IncidentSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

type IncidentStatus =
  | "OPEN"
  | "INVESTIGATING"
  | "RESOLVED";

type Incident = {
  id: string;

  companyId: string;
  companyName: string;

  productId: string;
  productName: string;
  productSku: string;

  batchId: string;
  batchCode: string;
  batchStatus: BatchStatus;

  incidentType: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;

  title: string;
  description: string | null;
  locationName: string | null;
  reportedBy: string | null;

  automaticBlock: boolean;

  occurredAt: string;
  resolvedAt: string | null;
  resolutionNotes: string | null;

  createdAt: string;
  updatedAt: string;
};

type IncidentForm = {
  incidentType: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  locationName: string;
  reportedBy: string;
  occurredAt: string;
};

type IncidentPanelProps = {
  companies: CompanyOption[];
};

const incidentTypeLabels: Record<
  IncidentType,
  string
> = {
  QUALITY_DEVIATION: "Desvio de qualidade",
  TEMPERATURE_ALERT: "Alerta de temperatura",
  DAMAGE: "Avaria ou dano",
  DOCUMENTATION: "Problema documental",
  DELIVERY_DELAY: "Atraso na entrega",
  OTHER: "Outra ocorrência",
};

const severityLabels: Record<
  IncidentSeverity,
  string
> = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
  CRITICAL: "Crítica",
};

const statusLabels: Record<
  IncidentStatus,
  string
> = {
  OPEN: "Aberta",
  INVESTIGATING: "Em investigação",
  RESOLVED: "Resolvida",
};

function createLocalDateTime() {
  const date = new Date(
    Date.now() - 60_000,
  );

  const timezoneOffset =
    date.getTimezoneOffset() * 60_000;

  return new Date(
    date.getTime() - timezoneOffset,
  )
    .toISOString()
    .slice(0, 16);
}

function createInitialForm(): IncidentForm {
  return {
    incidentType: "QUALITY_DEVIATION",
    severity: "MEDIUM",
    title: "",
    description: "",
    locationName: "",
    reportedBy: "",
    occurredAt: createLocalDateTime(),
  };
}

function IncidentPanel({
  companies,
}: IncidentPanelProps) {
  const [
    selectedCompanyId,
    setSelectedCompanyId,
  ] = useState("");

  const [
    selectedProductId,
    setSelectedProductId,
  ] = useState("");

  const [
    selectedBatchId,
    setSelectedBatchId,
  ] = useState("");

  const [products, setProducts] =
    useState<Product[]>([]);

  const [batches, setBatches] =
    useState<Batch[]>([]);

  const [incidents, setIncidents] =
    useState<Incident[]>([]);

  const [
    companyIncidents,
    setCompanyIncidents,
  ] = useState<Incident[]>([]);

  const [form, setForm] =
    useState<IncidentForm>(
      createInitialForm,
    );

  const [
    loadingProducts,
    setLoadingProducts,
  ] = useState(false);

  const [
    loadingBatches,
    setLoadingBatches,
  ] = useState(false);

  const [
    loadingIncidents,
    setLoadingIncidents,
  ] = useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [
    updatingIncidentId,
    setUpdatingIncidentId,
  ] = useState<string | null>(null);

  const [
    resolvingIncidentId,
    setResolvingIncidentId,
  ] = useState<string | null>(null);

  const [
    resolutionNotes,
    setResolutionNotes,
  ] = useState("");

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<"success" | "error">(
      "success",
    );

  useEffect(() => {
    if (companies.length === 0) {
      setSelectedCompanyId("");
      setSelectedProductId("");
      setSelectedBatchId("");
      setProducts([]);
      setBatches([]);
      setIncidents([]);
      setCompanyIncidents([]);
      return;
    }

    const companyExists =
      companies.some(
        (company) =>
          company.id ===
          selectedCompanyId,
      );

    if (!companyExists) {
      setSelectedCompanyId(
        companies[0].id,
      );
    }
  }, [companies, selectedCompanyId]);

  const loadProducts = useCallback(
    async () => {
      if (!selectedCompanyId) {
        setProducts([]);
        return;
      }

      setLoadingProducts(true);

      try {
        const response = await apiFetch(
          `/api/companies/${selectedCompanyId}/products`,
        );

        if (!response.ok) {
          throw new Error();
        }

        const data: Product[] =
          await response.json();

        setProducts(data);
      } catch {
        setProducts([]);
        setMessageType("error");
        setMessage(
          "Não foi possível carregar os produtos.",
        );
      } finally {
        setLoadingProducts(false);
      }
    },
    [selectedCompanyId],
  );

  const loadCompanyIncidents =
    useCallback(async () => {
      if (!selectedCompanyId) {
        setCompanyIncidents([]);
        return;
      }

      try {
        const response = await apiFetch(
          `/api/companies/${selectedCompanyId}/incidents`,
        );

        if (!response.ok) {
          throw new Error();
        }

        const data: Incident[] =
          await response.json();

        setCompanyIncidents(data);
      } catch {
        setCompanyIncidents([]);
      }
    }, [selectedCompanyId]);

  useEffect(() => {
    void loadProducts();
    void loadCompanyIncidents();
  }, [
    loadProducts,
    loadCompanyIncidents,
  ]);

  useEffect(() => {
    if (products.length === 0) {
      setSelectedProductId("");
      setSelectedBatchId("");
      setBatches([]);
      setIncidents([]);
      return;
    }

    const productExists = products.some(
      (product) =>
        product.id ===
        selectedProductId,
    );

    if (!productExists) {
      setSelectedProductId(
        products[0].id,
      );
    }
  }, [products, selectedProductId]);

  const loadBatches = useCallback(
    async () => {
      if (
        !selectedCompanyId ||
        !selectedProductId
      ) {
        setBatches([]);
        return;
      }

      setLoadingBatches(true);

      try {
        const response = await apiFetch(
          `/api/companies/${selectedCompanyId}/products/${selectedProductId}/batches`,
        );

        if (!response.ok) {
          throw new Error();
        }

        const data: Batch[] =
          await response.json();

        setBatches(data);
      } catch {
        setBatches([]);
        setMessageType("error");
        setMessage(
          "Não foi possível carregar os lotes.",
        );
      } finally {
        setLoadingBatches(false);
      }
    },
    [
      selectedCompanyId,
      selectedProductId,
    ],
  );

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  useEffect(() => {
    if (batches.length === 0) {
      setSelectedBatchId("");
      setIncidents([]);
      return;
    }

    const batchExists = batches.some(
      (batch) =>
        batch.id === selectedBatchId,
    );

    if (!batchExists) {
      setSelectedBatchId(
        batches[0].id,
      );
    }
  }, [batches, selectedBatchId]);

  const loadBatchIncidents =
    useCallback(async () => {
      if (
        !selectedCompanyId ||
        !selectedProductId ||
        !selectedBatchId
      ) {
        setIncidents([]);
        return;
      }

      setLoadingIncidents(true);

      try {
        const response = await apiFetch(
          `/api/companies/${selectedCompanyId}/products/${selectedProductId}/batches/${selectedBatchId}/incidents`,
        );

        if (!response.ok) {
          throw new Error();
        }

        const data: Incident[] =
          await response.json();

        setIncidents(data);
      } catch {
        setIncidents([]);
        setMessageType("error");
        setMessage(
          "Não foi possível carregar as ocorrências.",
        );
      } finally {
        setLoadingIncidents(false);
      }
    }, [
      selectedCompanyId,
      selectedProductId,
      selectedBatchId,
    ]);

  useEffect(() => {
    void loadBatchIncidents();
  }, [loadBatchIncidents]);

  function updateForm<
    Field extends keyof IncidentForm,
  >(
    field: Field,
    value: IncidentForm[Field],
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function updateIncidentLists(
    updatedIncident: Incident,
  ) {
    setIncidents((current) =>
      current.map((incident) =>
        incident.id ===
        updatedIncident.id
          ? updatedIncident
          : incident,
      ),
    );

    setCompanyIncidents((current) =>
      current.map((incident) =>
        incident.id ===
        updatedIncident.id
          ? updatedIncident
          : incident,
      ),
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !selectedCompanyId ||
      !selectedProductId ||
      !selectedBatchId
    ) {
      setMessageType("error");
      setMessage(
        "Selecione empresa, produto e lote.",
      );
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const response = await apiFetch(
        `/api/companies/${selectedCompanyId}/products/${selectedProductId}/batches/${selectedBatchId}/incidents`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ...form,
            occurredAt: new Date(
              form.occurredAt,
            ).toISOString(),
          }),
        },
      );

      const responseData = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.message ??
            "Não foi possível registrar a ocorrência.",
        );
      }

      const savedIncident =
        responseData as Incident;

      setIncidents((current) => [
        savedIncident,
        ...current,
      ]);

      setCompanyIncidents((current) => [
        savedIncident,
        ...current,
      ]);

      setBatches((current) =>
        current.map((batch) =>
          batch.id ===
          savedIncident.batchId
            ? {
                ...batch,
                status:
                  savedIncident.batchStatus,
              }
            : batch,
        ),
      );

      setForm(createInitialForm());

      setMessageType("success");
      setMessage(
        savedIncident.automaticBlock
          ? "Ocorrência registrada e lote bloqueado automaticamente."
          : "Ocorrência registrada com sucesso.",
      );
    } catch (requestError) {
      setMessageType("error");
      setMessage(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível registrar a ocorrência.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function startInvestigation(
    incidentId: string,
  ) {
    setUpdatingIncidentId(incidentId);
    setMessage("");

    try {
      const response = await apiFetch(
        `/api/companies/${selectedCompanyId}/products/${selectedProductId}/batches/${selectedBatchId}/incidents/${incidentId}/investigation`,
        {
          method: "PATCH",
        },
      );

      const responseData = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.message ??
            "Não foi possível iniciar a investigação.",
        );
      }

      updateIncidentLists(
        responseData as Incident,
      );

      setMessageType("success");
      setMessage(
        "Investigação iniciada.",
      );
    } catch (requestError) {
      setMessageType("error");
      setMessage(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível iniciar a investigação.",
      );
    } finally {
      setUpdatingIncidentId(null);
    }
  }

  async function resolveIncident(
    incidentId: string,
  ) {
    if (!resolutionNotes.trim()) {
      setMessageType("error");
      setMessage(
        "Descreva como a ocorrência foi resolvida.",
      );
      return;
    }

    setUpdatingIncidentId(incidentId);
    setMessage("");

    try {
      const response = await apiFetch(
        `/api/companies/${selectedCompanyId}/products/${selectedProductId}/batches/${selectedBatchId}/incidents/${incidentId}/resolve`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            resolutionNotes:
              resolutionNotes.trim(),
          }),
        },
      );

      const responseData = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.message ??
            "Não foi possível resolver a ocorrência.",
        );
      }

      updateIncidentLists(
        responseData as Incident,
      );

      setResolvingIncidentId(null);
      setResolutionNotes("");

      setMessageType("success");
      setMessage(
        "Ocorrência marcada como resolvida. O lote permanece bloqueado até a liberação.",
      );
    } catch (requestError) {
      setMessageType("error");
      setMessage(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível resolver a ocorrência.",
      );
    } finally {
      setUpdatingIncidentId(null);
    }
  }

  function formatDateTime(date: string) {
    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        dateStyle: "short",
        timeStyle: "short",
      },
    ).format(new Date(date));
  }

  const openIncidents =
    companyIncidents.filter(
      (incident) =>
        incident.status !== "RESOLVED",
    ).length;

  const criticalIncidents =
    companyIncidents.filter(
      (incident) =>
        incident.status !== "RESOLVED" &&
        (incident.severity === "HIGH" ||
          incident.severity ===
            "CRITICAL"),
    ).length;

  const automaticBlocks =
    companyIncidents.filter(
      (incident) =>
        incident.automaticBlock,
    ).length;

  const selectedBatch = batches.find(
    (batch) =>
      batch.id === selectedBatchId,
  );
  const unresolvedBatchIncidents =
    incidents.filter(
      (incident) =>
        incident.status !== "RESOLVED",
    ).length;
    
  return (
    <section className="incident-module">
      <div className="incident-module__heading">
        <div>
          <p>
            CONTROLE PREVENTIVO E AUTOMAÇÃO
          </p>

          <h2>Central de ocorrências</h2>

          <span>
            Detecte desvios, investigue riscos e
            bloqueie lotes automaticamente.
          </span>
        </div>

        <div className="incident-filters">
          <label>
            Empresa

            <select
              value={selectedCompanyId}
              onChange={(event) => {
                setSelectedCompanyId(
                  event.target.value,
                );

                setSelectedProductId("");
                setSelectedBatchId("");
                setProducts([]);
                setBatches([]);
                setIncidents([]);
              }}
            >
              {companies.length === 0 && (
                <option value="">
                  Nenhuma empresa
                </option>
              )}

              {companies.map((company) => (
                <option
                  value={company.id}
                  key={company.id}
                >
                  {company.tradeName}
                </option>
              ))}
            </select>
          </label>

          <label>
            Produto

            <select
              value={selectedProductId}
              onChange={(event) => {
                setSelectedProductId(
                  event.target.value,
                );

                setSelectedBatchId("");
                setBatches([]);
                setIncidents([]);
              }}
              disabled={
                loadingProducts ||
                products.length === 0
              }
            >
              {products.length === 0 && (
                <option value="">
                  Nenhum produto
                </option>
              )}

              {products.map((product) => (
                <option
                  value={product.id}
                  key={product.id}
                >
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Lote

            <select
              value={selectedBatchId}
              onChange={(event) =>
                setSelectedBatchId(
                  event.target.value,
                )
              }
              disabled={
                loadingBatches ||
                batches.length === 0
              }
            >
              {batches.length === 0 && (
                <option value="">
                  Nenhum lote
                </option>
              )}

              {batches.map((batch) => (
                <option
                  value={batch.id}
                  key={batch.id}
                >
                  {batch.batchCode}
                  {batch.status === "BLOCKED"
                    ? " — BLOQUEADO"
                    : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="incident-metrics">
        <article>
          <span>Total de ocorrências</span>
          <strong>
            {companyIncidents.length}
          </strong>
          <p>Registros de rastreabilidade</p>
        </article>

        <article>
          <span>Exigem atenção</span>
          <strong>{openIncidents}</strong>
          <p>Abertas ou em investigação</p>
        </article>

        <article className="incident-metric--critical">
          <span>Alta criticidade</span>
          <strong>
            {criticalIncidents}
          </strong>
          <p>Riscos altos ou críticos</p>
        </article>

        <article>
          <span>Bloqueios automáticos</span>
          <strong>
            {automaticBlocks}
          </strong>
          <p>Proteções executadas pelo sistema</p>
        </article>
      </div>

      <div className="incident-workspace">
        <article className="panel incident-form-panel">
          <div className="panel__header">
            <div>
              <span>NOVA OCORRÊNCIA</span>
              <h3>Registrar desvio</h3>
            </div>
          </div>

          {selectedBatch && (
            <div
              className={`incident-selected-batch ${
                selectedBatch.status ===
                "BLOCKED"
                  ? "incident-selected-batch--blocked"
                  : ""
              }`}
            >
              <span>Lote selecionado</span>

              <strong>
                {selectedBatch.batchCode}
              </strong>

              <small>
                {selectedBatch.status ===
                "BLOCKED"
                  ? "Operação bloqueada"
                  : "Operação normal"}
              </small>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label>
              Tipo da ocorrência

              <select
                value={form.incidentType}
                onChange={(event) =>
                  updateForm(
                    "incidentType",
                    event.target
                      .value as IncidentType,
                  )
                }
              >
                {Object.entries(
                  incidentTypeLabels,
                ).map(([value, label]) => (
                  <option
                    value={value}
                    key={value}
                  >
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Gravidade

              <select
                value={form.severity}
                onChange={(event) =>
                  updateForm(
                    "severity",
                    event.target
                      .value as IncidentSeverity,
                  )
                }
              >
                {Object.entries(
                  severityLabels,
                ).map(([value, label]) => (
                  <option
                    value={value}
                    key={value}
                  >
                    {label}
                  </option>
                ))}
              </select>
            </label>

            {(form.severity === "HIGH" ||
              form.severity ===
                "CRITICAL") && (
              <div className="incident-block-warning">
                <span>!</span>

                <p>
                  Esta gravidade bloqueará o
                  lote automaticamente.
                </p>
              </div>
            )}

            <label>
              Título

              <input
                type="text"
                value={form.title}
                onChange={(event) =>
                  updateForm(
                    "title",
                    event.target.value,
                  )
                }
                placeholder="Ex.: Temperatura fora da faixa"
                maxLength={160}
                required
              />
            </label>

            <label>
              Local

              <input
                type="text"
                value={form.locationName}
                onChange={(event) =>
                  updateForm(
                    "locationName",
                    event.target.value,
                  )
                }
                placeholder="Ex.: Centro de distribuição"
                maxLength={160}
              />
            </label>

            <label>
              Detectado por

              <input
                type="text"
                value={form.reportedBy}
                onChange={(event) =>
                  updateForm(
                    "reportedBy",
                    event.target.value,
                  )
                }
                placeholder="Ex.: Sensor IoT CT-001"
                maxLength={120}
              />
            </label>

            <label>
              Data e horário

              <input
                type="datetime-local"
                value={form.occurredAt}
                max={createLocalDateTime()}
                onChange={(event) =>
                  updateForm(
                    "occurredAt",
                    event.target.value,
                  )
                }
                required
              />
            </label>

            <label>
              Descrição

              <textarea
                value={form.description}
                onChange={(event) =>
                  updateForm(
                    "description",
                    event.target.value,
                  )
                }
                placeholder="Descreva o desvio identificado"
                maxLength={1000}
                rows={4}
              />
            </label>

            <button
              className="primary-button"
              type="submit"
              disabled={
                submitting ||
                !selectedBatchId
              }
            >
              {submitting
                ? "Registrando..."
                : "Registrar ocorrência"}
            </button>

            {message && (
              <p
                className={`feedback feedback--${messageType}`}
              >
                {message}
              </p>
            )}
          </form>
        </article>

        <article className="panel incident-list-panel">
          <div className="panel__header">
            <div>
              <span>MONITORAMENTO ATIVO</span>
              <h3>Ocorrências do lote</h3>
            </div>

            <strong>{incidents.length}</strong>
          </div>

          {loadingIncidents && (
            <p className="empty-message">
              Carregando ocorrências...
            </p>
          )}

          {!loadingIncidents &&
            incidents.length === 0 && (
              <p className="empty-message">
                Nenhuma ocorrência registrada
                para este lote.
              </p>
            )}

          {!loadingIncidents && (
            <div className="incident-list">
              {incidents.map((incident) => (
                <article
                  className={`incident-item incident-item--${incident.severity.toLowerCase()}`}
                  key={incident.id}
                >
                  <div className="incident-item__top">
                    <div>
                      <span>
                        {
                          incidentTypeLabels[
                            incident.incidentType
                          ]
                        }
                      </span>

                      <h4>{incident.title}</h4>
                    </div>

                    <div className="incident-item__badges">
                      <span
                        className={`incident-severity incident-severity--${incident.severity.toLowerCase()}`}
                      >
                        {
                          severityLabels[
                            incident.severity
                          ]
                        }
                      </span>

                      <span
                        className={`incident-status incident-status--${incident.status
                          .toLowerCase()
                          .replaceAll("_", "-")}`}
                      >
                        {
                          statusLabels[
                            incident.status
                          ]
                        }
                      </span>
                    </div>
                  </div>

                  {incident.description && (
                    <p className="incident-item__description">
                      {incident.description}
                    </p>
                  )}

                  <div className="incident-item__metadata">
                    <span>
                      Lote
                      <strong>
                        {incident.batchCode}
                      </strong>
                    </span>

                    <span>
                      Local
                      <strong>
                        {incident.locationName ??
                          "Não informado"}
                      </strong>
                    </span>

                    <span>
                      Detectado por
                      <strong>
                        {incident.reportedBy ??
                          "Não informado"}
                      </strong>
                    </span>

                    <span>
                      Ocorrência
                      <strong>
                        {formatDateTime(
                          incident.occurredAt,
                        )}
                      </strong>
                    </span>
                  </div>

                  {incident.automaticBlock && (
                    <div className="incident-automatic-block">
                      <span>!</span>

                      <div>
                        <strong>
                          Bloqueio automático
                          executado
                        </strong>

                        <small>
                          O lote foi impedido de
                          continuar a operação.
                        </small>
                      </div>
                    </div>
                  )}

                  {incident.status ===
                    "RESOLVED" && (
                    <div className="incident-resolution">
                      <span>
                        RESOLUÇÃO REGISTRADA
                      </span>

                      <p>
                        {
                          incident.resolutionNotes
                        }
                      </p>

                      {incident.resolvedAt && (
                        <small>
                          Finalizada em{" "}
                          {formatDateTime(
                            incident.resolvedAt,
                          )}
                        </small>
                      )}
                    </div>
                  )}

                  {incident.status !==
                    "RESOLVED" && (
                    <div className="incident-item__actions">
                      {incident.status ===
                        "OPEN" && (
                        <button
                          type="button"
                          onClick={() =>
                            void startInvestigation(
                              incident.id,
                            )
                          }
                          disabled={
                            updatingIncidentId ===
                            incident.id
                          }
                        >
                          Iniciar investigação
                        </button>
                      )}

                      <button
                        className="incident-resolve-button"
                        type="button"
                        onClick={() => {
                          setResolvingIncidentId(
                            incident.id,
                          );

                          setResolutionNotes("");
                        }}
                      >
                        Resolver ocorrência
                      </button>
                    </div>
                  )}

                  {resolvingIncidentId ===
                    incident.id && (
                    <div className="incident-resolution-form">
                      <label>
                        Como foi resolvida?

                        <textarea
                          value={
                            resolutionNotes
                          }
                          onChange={(event) =>
                            setResolutionNotes(
                              event.target.value,
                            )
                          }
                          placeholder="Descreva a ação corretiva realizada"
                          maxLength={1000}
                          rows={3}
                        />
                      </label>

                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setResolvingIncidentId(
                              null,
                            );

                            setResolutionNotes(
                              "",
                            );
                          }}
                        >
                          Cancelar
                        </button>

                        <button
                          className="incident-confirm-resolution"
                          type="button"
                          onClick={() =>
                            void resolveIncident(
                              incident.id,
                            )
                          }
                          disabled={
                            updatingIncidentId ===
                            incident.id
                          }
                        >
                          {updatingIncidentId ===
                          incident.id
                            ? "Salvando..."
                            : "Confirmar resolução"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </article>
      </div>
      
            {selectedBatch && (
        <BatchReleaseCard
          companyId={selectedCompanyId}
          productId={selectedProductId}
          batchId={selectedBatch.id}
          batchCode={selectedBatch.batchCode}
          batchStatus={selectedBatch.status}
          unresolvedIncidents={
            unresolvedBatchIncidents
          }
          onReleased={() => {
            setBatches((currentBatches) =>
              currentBatches.map((batch) =>
                batch.id ===
                selectedBatch.id
                  ? {
                      ...batch,
                      status: "IN_STORAGE",
                    }
                  : batch,
              ),
            );

            setMessageType("success");
            setMessage(
              "Lote liberado e movimentação registrada.",
            );
          }}
        />
      )}
    </section>
  );
}

export default IncidentPanel;