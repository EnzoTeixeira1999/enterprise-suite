import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

type CompanyOption = {
  id: string;
  tradeName: string;
};

type ProductUnit = "UNIT" | "KG" | "LITER" | "BOX" | "METER";

type Product = {
  id: string;
  name: string;
  sku: string;
  unit: ProductUnit;
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
  companyId: string;
  companyName: string;
  productId: string;
  productName: string;
  productSku: string;
  productUnit: ProductUnit;
  batchCode: string;
  manufactureDate: string;
  expirationDate: string | null;
  initialQuantity: number;
  currentQuantity: number;
  status: BatchStatus;
  createdAt: string;
  updatedAt: string;
};

type BatchForm = {
  batchCode: string;
  manufactureDate: string;
  expirationDate: string;
  initialQuantity: string;
};

type BatchPanelProps = {
  companies: CompanyOption[];
};

const today = new Date().toISOString().slice(0, 10);

const initialForm: BatchForm = {
  batchCode: "",
  manufactureDate: today,
  expirationDate: "",
  initialQuantity: "",
};

const statusLabels: Record<BatchStatus, string> = {
  REGISTERED: "Registrado",
  IN_STORAGE: "Armazenado",
  IN_TRANSIT: "Em trânsito",
  BLOCKED: "Bloqueado",
  COMPLETED: "Concluído",
  EXPIRED: "Vencido",
};

const unitLabels: Record<ProductUnit, string> = {
  UNIT: "unidades",
  KG: "kg",
  LITER: "litros",
  BOX: "caixas",
  METER: "metros",
};

function BatchPanel({ companies }: BatchPanelProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [form, setForm] = useState<BatchForm>(initialForm);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  useEffect(() => {
    if (companies.length === 0) {
      setSelectedCompanyId("");
      setProducts([]);
      setBatches([]);
      return;
    }

    const companyExists = companies.some(
      (company) => company.id === selectedCompanyId,
    );

    if (!companyExists) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

  const loadProducts = useCallback(async () => {
    if (!selectedCompanyId) {
      setProducts([]);
      return;
    }

    setLoadingProducts(true);

    try {
      const response = await fetch(
        `/api/companies/${selectedCompanyId}/products`,
      );

      if (!response.ok) {
        throw new Error();
      }

      const data: Product[] = await response.json();
      setProducts(data);
    } catch {
      setMessageType("error");
      setMessage("Não foi possível carregar os produtos.");
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
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
  }, [products, selectedProductId]);

  const loadBatches = useCallback(async () => {
    if (!selectedCompanyId || !selectedProductId) {
      setBatches([]);
      return;
    }

    setLoadingBatches(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/companies/${selectedCompanyId}/products/${selectedProductId}/batches`,
      );

      if (!response.ok) {
        throw new Error();
      }

      const data: Batch[] = await response.json();
      setBatches(data);
    } catch {
      setMessageType("error");
      setMessage("Não foi possível carregar os lotes.");
      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  }, [selectedCompanyId, selectedProductId]);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCompanyId || !selectedProductId) {
      setMessageType("error");
      setMessage("Selecione uma empresa e um produto.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/companies/${selectedCompanyId}/products/${selectedProductId}/batches`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            batchCode: form.batchCode,
            manufactureDate: form.manufactureDate,
            expirationDate: form.expirationDate || null,
            initialQuantity: Number(form.initialQuantity),
          }),
        },
      );

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.message ??
            "Não foi possível cadastrar o lote",
        );
      }

      setBatches((currentBatches) => [
        responseData as Batch,
        ...currentBatches,
      ]);

      setForm(initialForm);
      setMessageType("success");
      setMessage("Lote cadastrado com sucesso.");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o lote.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function updateForm(
    field: keyof BatchForm,
    value: string,
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function formatDate(date: string | null) {
    if (!date) {
      return "Sem validade";
    }

    return date.split("-").reverse().join("/");
  }

  function calculatePercentage(batch: Batch) {
    if (batch.initialQuantity === 0) {
      return 0;
    }

    return Math.round(
      (batch.currentQuantity / batch.initialQuantity) * 100,
    );
  }

  return (
    <section className="batch-module">
      <div className="batch-module__heading">
        <div>
          <p>CONTROLE DE LOTES</p>
          <h2>Lotes rastreados</h2>
          <span>
            Acompanhe fabricação, validade e quantidade disponível.
          </span>
        </div>

        <div className="batch-filters">
          <label>
            Empresa
            <select
              value={selectedCompanyId}
              onChange={(event) => {
                setSelectedCompanyId(event.target.value);
                setSelectedProductId("");
                setProducts([]);
                setBatches([]);
              }}
            >
              {companies.length === 0 && (
                <option value="">Nenhuma empresa</option>
              )}

              {companies.map((company) => (
                <option value={company.id} key={company.id}>
                  {company.tradeName}
                </option>
              ))}
            </select>
          </label>

          <label>
            Produto
            <select
              value={selectedProductId}
              onChange={(event) =>
                setSelectedProductId(event.target.value)
              }
              disabled={loadingProducts || products.length === 0}
            >
              {products.length === 0 && (
                <option value="">Nenhum produto</option>
              )}

              {products.map((product) => (
                <option value={product.id} key={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="batch-workspace">
        <article className="panel batch-form-panel">
          <div className="panel__header">
            <div>
              <span>NOVO LOTE</span>
              <h3>Registrar produção</h3>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label>
              Código do lote
              <input
                type="text"
                value={form.batchCode}
                onChange={(event) =>
                  updateForm("batchCode", event.target.value)
                }
                placeholder="Ex.: LOTE-2026-002"
                maxLength={64}
                required
              />
            </label>

            <label>
              Data de fabricação
              <input
                type="date"
                value={form.manufactureDate}
                max={today}
                onChange={(event) =>
                  updateForm(
                    "manufactureDate",
                    event.target.value,
                  )
                }
                required
              />
            </label>

            <label>
              Data de validade
              <input
                type="date"
                value={form.expirationDate}
                min={form.manufactureDate}
                onChange={(event) =>
                  updateForm(
                    "expirationDate",
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Quantidade inicial
              <input
                type="number"
                value={form.initialQuantity}
                onChange={(event) =>
                  updateForm(
                    "initialQuantity",
                    event.target.value,
                  )
                }
                placeholder="Ex.: 500"
                min="0.001"
                step="0.001"
                required
              />
            </label>

            <button
              className="primary-button"
              type="submit"
              disabled={submitting || !selectedProductId}
            >
              {submitting ? "Registrando..." : "Registrar lote"}
            </button>

            {message && (
              <p className={`feedback feedback--${messageType}`}>
                {message}
              </p>
            )}
          </form>
        </article>

        <article className="panel batch-list-panel">
          <div className="panel__header">
            <div>
              <span>ESTOQUE POR LOTE</span>
              <h3>Lotes do produto</h3>
            </div>

            <strong>{batches.length}</strong>
          </div>

          {loadingBatches && (
            <p className="empty-message">Carregando lotes...</p>
          )}

          {!loadingBatches && batches.length === 0 && (
            <p className="empty-message">
              Nenhum lote cadastrado para este produto.
            </p>
          )}

          {!loadingBatches && (
            <div className="batch-list">
              {batches.map((batch) => {
                const percentage = calculatePercentage(batch);

                return (
                  <article className="batch-item" key={batch.id}>
                    <div className="batch-item__top">
                      <div>
                        <span>{batch.productSku}</span>
                        <h4>{batch.batchCode}</h4>
                      </div>

                      <span
                        className={`batch-status batch-status--${batch.status
                          .toLowerCase()
                          .replaceAll("_", "-")}`}
                      >
                        {statusLabels[batch.status]}
                      </span>
                    </div>

                    <div className="batch-quantity">
                      <div>
                        <span>Quantidade disponível</span>
                        <strong>
                          {batch.currentQuantity}{" "}
                          {unitLabels[batch.productUnit]}
                        </strong>
                      </div>

                      <span>{percentage}%</span>
                    </div>

                    <div className="batch-progress">
                      <span style={{ width: `${percentage}%` }} />
                    </div>

                    <div className="batch-dates">
                      <span>
                        Fabricação
                        <strong>
                          {formatDate(batch.manufactureDate)}
                        </strong>
                      </span>

                      <span>
                        Validade
                        <strong>
                          {formatDate(batch.expirationDate)}
                        </strong>
                      </span>

                      <span>
                        Quantidade inicial
                        <strong>{batch.initialQuantity}</strong>
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

export default BatchPanel;