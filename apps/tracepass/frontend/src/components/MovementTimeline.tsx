import SelectionContext from "./SelectionContext";
import RecordActions from "./RecordActions";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import JourneyMap from "./JourneyMap";
import LocationPicker from "./LocationPicker";
import { getPosition } from "../services/mapPosition";
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

type Batch = {
  id: string;
  batchCode: string;
};

type MovementType =
  | "PRODUCTION"
  | "STORAGE"
  | "DISPATCH"
  | "IN_TRANSIT"
  | "RECEIPT"
  | "QUALITY_CHECK"
  | "BLOCK"
  | "RELEASE"
  | "ADJUSTMENT"
  | "COMPLETION";

type Movement = {
  id: string;
  companyId: string;
  companyName: string;
  productId: string;
  productName: string;
  batchId: string;
  batchCode: string;
  movementType: MovementType;
  title: string;
  description: string | null;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  responsibleName: string | null;
  quantity: number | null;
  occurredAt: string;
  createdAt: string;
};

type MovementForm = {
  movementType: MovementType;
  title: string;
  description: string;
  locationName: string;
  responsibleName: string;
  quantity: string;
  latitude: string;
  longitude: string;
  occurredAt: string;
};

type MovementTimelineProps = {
  companies: CompanyOption[];
  initialBatch?: { id: string; companyId: string; productId: string };
};

const movementLabels: Record<MovementType, string> = {
  PRODUCTION: "Produção",
  STORAGE: "Armazenamento",
  DISPATCH: "Expedição",
  IN_TRANSIT: "Em trânsito",
  RECEIPT: "Recebimento",
  QUALITY_CHECK: "Inspeção de qualidade",
  BLOCK: "Bloqueio",
  RELEASE: "Liberação",
  ADJUSTMENT: "Ajuste",
  COMPLETION: "Conclusão",
};

function createDefaultDateTime() {
  const date = new Date(Date.now() - 60_000);
  const offset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
}

function createInitialForm(): MovementForm {
  return {
    movementType: "IN_TRANSIT",
    title: "",
    description: "",
    locationName: "",
    responsibleName: "",
    quantity: "",
    latitude: "",
    longitude: "",
    occurredAt: createDefaultDateTime(),
  };
}

function MovementTimeline({
  companies,
  initialBatch,
}: MovementTimelineProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState(initialBatch?.companyId ?? "");
  const [selectedProductId, setSelectedProductId] = useState(initialBatch?.productId ?? "");
  const [selectedBatchId, setSelectedBatchId] = useState(initialBatch?.id ?? "");
  const [productsReady, setProductsReady] = useState(false);
  const [batchesReady, setBatchesReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [form, setForm] = useState<MovementForm>(
    createInitialForm,
  );
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  useEffect(() => {
    if (companies.length === 0) {
      setSelectedCompanyId("");
      return;
    }

    const companyExists = companies.some(
      (company) => company.id === selectedCompanyId,
    );

    if (!companyExists) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

  const loadProducts = useCallback(async (signal: AbortSignal) => {
    if (!selectedCompanyId) {
      setProducts([]);
      return;
    }

    try {
      const response = await apiFetch(
        `/api/companies/${selectedCompanyId}/products`, { signal },
      );

      if (!response.ok) {
        throw new Error();
      }

      const data: Product[] = await response.json();
      if (signal.aborted) return;
      setProducts(data);
      setProductsReady(true);
    } catch {
      if (signal.aborted) return;
      setProductsReady(true);
      setProducts([]);
      setMessageType("error");
      setMessage("Não foi possível carregar os produtos.");
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    const controller = new AbortController();
    void loadProducts(controller.signal);
    return () => controller.abort();
  }, [loadProducts]);

  useEffect(() => {
    if (!productsReady) return;
    if (products.length === 0) {
      setSelectedProductId("");
      setBatches([]);
      return;
    }

    const productExists = products.some(
      (product) => product.id === selectedProductId,
    );

    if (!productExists) {
      setSelectedProductId(products[0].id);
    }
  }, [products, productsReady, selectedProductId]);

  const loadBatches = useCallback(async (signal: AbortSignal) => {
    if (!selectedCompanyId || !selectedProductId) {
      setBatches([]);
      return;
    }

    try {
      const response = await apiFetch(
        `/api/companies/${selectedCompanyId}/products/${selectedProductId}/batches`, { signal },
      );

      if (!response.ok) {
        throw new Error();
      }

      const data: Batch[] = await response.json();
      if (signal.aborted) return;
      setBatches(data);
      setBatchesReady(true);
    } catch {
      if (signal.aborted) return;
      setBatchesReady(true);
      setBatches([]);
      setMessageType("error");
      setMessage("Não foi possível carregar os lotes.");
    }
  }, [selectedCompanyId, selectedProductId]);

  useEffect(() => {
    const controller = new AbortController();
    void loadBatches(controller.signal);
    return () => controller.abort();
  }, [loadBatches]);

  useEffect(() => {
    if (!batchesReady) return;
    if (batches.length === 0) {
      setSelectedBatchId("");
      setMovements([]);
      return;
    }

    const batchExists = batches.some(
      (batch) => batch.id === selectedBatchId,
    );

    if (!batchExists) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, batchesReady, selectedBatchId]);

  const loadMovements = useCallback(async () => {
    if (
      !selectedCompanyId ||
      !selectedProductId ||
      !selectedBatchId
    ) {
      setMovements([]);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await apiFetch(
        `/api/companies/${selectedCompanyId}/products/${selectedProductId}/batches/${selectedBatchId}/movements`,
      );

      if (!response.ok) {
        throw new Error();
      }

      const data: Movement[] = await response.json();
      setMovements(data);
    } catch {
      setMovements([]);
      setMessageType("error");
      setMessage("Não foi possível carregar a linha do tempo.");
    } finally {
      setLoading(false);
    }
  }, [
    selectedCompanyId,
    selectedProductId,
    selectedBatchId,
  ]);

  useEffect(() => {
    void loadMovements();
  }, [loadMovements]);

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
      setMessage("Selecione uma empresa, produto e lote.");
      return;
    }

    if ((form.latitude || form.longitude) && !getPosition(form.latitude, form.longitude)) {
      setMessageType("error");
      setMessage("Informe uma latitude e uma longitude válidas.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const response = await apiFetch(
        `/api/companies/${selectedCompanyId}/products/${selectedProductId}/batches/${selectedBatchId}/movements`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            movementType: form.movementType,
            title: form.title,
            description: form.description || null,
            locationName: form.locationName || null,
            responsibleName: form.responsibleName || null,
            quantity: form.quantity
              ? Number(form.quantity)
              : null,
            latitude: form.latitude
              ? Number(form.latitude)
              : null,
            longitude: form.longitude
              ? Number(form.longitude)
              : null,
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
            "Não foi possível registrar o evento",
        );
      }

      setMovements((currentMovements) => [
        ...currentMovements,
        responseData as Movement,
      ]);

      setForm(createInitialForm());
      setMessageType("success");
      setMessage("Evento adicionado à linha do tempo.");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar o evento.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function updateForm<K extends keyof MovementForm>(
    field: K,
    value: MovementForm[K],
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function formatDateTime(date: string) {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(date));
  }

  const previousLocatedMovement =
    [...movements]
      .reverse()
      .find(
        (movement) =>
          movement.latitude !== null &&
          movement.longitude !== null,
      ) ?? null;

  return (
    <section className="movement-module">
      <div className="movement-module__heading">
        <div>
          <p>JORNADA RASTREÁVEL</p>
          <h2>Linha do tempo</h2>
          <span>
            Eventos permanentes que contam a trajetória
            completa do lote.
          </span>
        </div>

        <SelectionContext title="Lote da movimentação" hint={companies.length === 0 ? "Cadastre uma empresa na etapa Empresas para continuar." : "Confira empresa, produto e lote. O novo evento será registrado neste lote."}>
          <label>
            <span><b aria-hidden="true">1</b> Empresa</span>
            <select
              value={selectedCompanyId}
              disabled={companies.length === 0}
              onChange={(event) => {
                setSelectedCompanyId(event.target.value);
                setSelectedProductId("");
                setSelectedBatchId("");
                setProducts([]);
                setBatches([]);
                setProductsReady(false);
                setBatchesReady(false);
              }}
            >
              {companies.length === 0 && <option value="">Nenhuma empresa cadastrada</option>}
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
            <span><b aria-hidden="true">2</b> Produto</span>
            <select
              value={selectedProductId}
              onChange={(event) => {
                setSelectedProductId(event.target.value);
                setSelectedBatchId("");
                setBatches([]);
                setBatchesReady(false);
              }}
              disabled={!productsReady || products.length === 0}
            >
              {products.length === 0 && (
                <option value="">{!selectedCompanyId ? "Escolha uma empresa primeiro" : !productsReady ? "Carregando produtos…" : "Nenhum produto nesta empresa"}</option>
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
            <span><b aria-hidden="true">3</b> Lote</span>
            <select
              value={selectedBatchId}
              onChange={(event) =>
                setSelectedBatchId(event.target.value)
              }
              disabled={!batchesReady || batches.length === 0}
            >
              {batches.length === 0 && (
                <option value="">{!selectedProductId ? "Escolha um produto primeiro" : !batchesReady ? "Carregando lotes…" : "Nenhum lote neste produto"}</option>
              )}

              {batches.map((batch) => (
                <option
                  value={batch.id}
                  key={batch.id}
                >
                  {batch.batchCode}
                </option>
              ))}
            </select>
          </label>
        </SelectionContext>
      </div>

      <div className="movement-workspace">
        <article className="panel movement-form-panel">
          <div className="panel__header">
            <div>
              <span>NOVO EVENTO</span>
              <h3>Registrar movimentação</h3>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label>
              Tipo
              <select
                value={form.movementType}
                onChange={(event) =>
                  updateForm(
                    "movementType",
                    event.target.value as MovementType,
                  )
                }
              >
                {Object.entries(movementLabels).map(
                  ([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              Título
              <input
                value={form.title}
                onChange={(event) =>
                  updateForm("title", event.target.value)
                }
                placeholder="Ex.: Lote enviado para transporte"
                maxLength={120}
                required
              />
            </label>

            <label>
              Local
              <input
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
              Responsável
              <input
                value={form.responsibleName}
                onChange={(event) =>
                  updateForm(
                    "responsibleName",
                    event.target.value,
                  )
                }
                placeholder="Ex.: Equipe logística"
                maxLength={120}
              />
            </label>

            <div className="movement-form__row">
              <label>
                Quantidade
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(event) =>
                    updateForm(
                      "quantity",
                      event.target.value,
                    )
                  }
                  min="0.001"
                  step="0.001"
                />
              </label>

              <label>
                Data e horário
                <input
                  type="datetime-local"
                  value={form.occurredAt}
                  onChange={(event) =>
                    updateForm(
                      "occurredAt",
                      event.target.value,
                    )
                  }
                  required
                />
              </label>
            </div>

            <LocationPicker
              latitude={form.latitude}
              longitude={form.longitude}
              origin={previousLocatedMovement}
              onSelect={(latitude, longitude) => {
                updateForm("latitude", latitude);
                updateForm("longitude", longitude);
              }}
            />

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
                placeholder="Descreva o que aconteceu"
                maxLength={500}
                rows={4}
              />
            </label>

            <button
              className="primary-button"
              type="submit"
              disabled={submitting || !selectedBatchId}
            >
              {submitting
                ? "Registrando..."
                : "Adicionar evento"}
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

        <article className="panel timeline-panel">
          <div className="panel__header">
            <div>
              <span>HISTÓRICO AUDITÁVEL</span>
              <h3>Jornada do lote</h3>
            </div>

            <strong>{movements.length}</strong>
          </div>

          {loading && (
            <p className="empty-message">
              Carregando eventos...
            </p>
          )}

          {!loading && movements.length === 0 && (
            <p className="empty-message">
              Nenhuma movimentação registrada.
            </p>
          )}

          {!loading && (
            <div className="timeline">
              {movements.map((movement, index) => (
                <article
                  className="timeline-item"
                  key={movement.id}
                >
                  <div className="timeline-item__marker">
                    <span>{index + 1}</span>
                  </div>

                  <div className="timeline-item__content">
                    <div className="timeline-item__top">
                      <span>
                        {
                          movementLabels[
                            movement.movementType
                          ]
                        }
                      </span>

                      <time>
                        {formatDateTime(
                          movement.occurredAt,
                        )}
                      </time>
                    </div>

                    <h4>{movement.title}</h4>

                    {movement.description && (
                      <p>{movement.description}</p>
                    )}

                    <div className="timeline-item__metadata">
                      {movement.locationName && (
                        <span>
                          Local
                          <strong>
                            {movement.locationName}
                          </strong>
                        </span>
                      )}

                      {movement.responsibleName && (
                        <span>
                          Responsável
                          <strong>
                            {movement.responsibleName}
                          </strong>
                        </span>
                      )}

                      {movement.quantity && (
                        <span>
                          Quantidade
                          <strong>
                            {movement.quantity}
                          </strong>
                        </span>
                      )}
                    </div>
                    <RecordActions entity="movements" record={movement} name={movement.title}
                      archiveDisabled={movement.movementType === "BLOCK" || movement.movementType === "RELEASE"}
                      onSaved={loadMovements} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </div>

      <JourneyMap movements={movements} />
    </section>
  );
}

export default MovementTimeline;
