import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { apiFetch } from "../services/api";

type CompanyOption = {
  id: string;
  tradeName: string;
};

type ProductUnit =
  | "UNIT"
  | "KG"
  | "LITER"
  | "BOX"
  | "METER";

type Product = {
  id: string;
  name: string;
  sku: string;
  unit: ProductUnit;
};

type SupplierStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED";

type Supplier = {
  id: string;
  tradeName: string;
  legalName: string;
  taxId: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  status: SupplierStatus;
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

  supplierId: string | null;
  supplierName: string | null;
  supplierTaxId: string | null;
  supplierCity: string | null;
  supplierState: string | null;
  supplierCountry: string | null;

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
  supplierId: string;
  manufactureDate: string;
  expirationDate: string;
  initialQuantity: string;
};

type BatchPanelProps = {
  companies: CompanyOption[];
};

const today = new Date()
  .toISOString()
  .slice(0, 10);

const initialForm: BatchForm = {
  batchCode: "",
  supplierId: "",
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

function BatchPanel({
  companies,
}: BatchPanelProps) {
  const [
    selectedCompanyId,
    setSelectedCompanyId,
  ] = useState("");

  const [
    selectedProductId,
    setSelectedProductId,
  ] = useState("");

  const [products, setProducts] =
    useState<Product[]>([]);

  const [suppliers, setSuppliers] =
    useState<Supplier[]>([]);

  const [batches, setBatches] =
    useState<Batch[]>([]);

  const [form, setForm] =
    useState<BatchForm>(initialForm);

  const [
    loadingProducts,
    setLoadingProducts,
  ] = useState(false);

  const [
    loadingSuppliers,
    setLoadingSuppliers,
  ] = useState(false);

  const [
    loadingBatches,
    setLoadingBatches,
  ] = useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  useEffect(() => {
    if (companies.length === 0) {
      setSelectedCompanyId("");
      setSelectedProductId("");
      setProducts([]);
      setSuppliers([]);
      setBatches([]);
      return;
    }

    const companyExists = companies.some(
      (company) =>
        company.id === selectedCompanyId,
    );

    if (!companyExists) {
      setSelectedCompanyId(companies[0].id);
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
        setMessageType("error");
        setMessage(
          "Não foi possível carregar os produtos.",
        );
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    },
    [selectedCompanyId],
  );

  const loadSuppliers = useCallback(
    async () => {
      if (!selectedCompanyId) {
        setSuppliers([]);
        return;
      }

      setLoadingSuppliers(true);

      try {
        const response = await apiFetch(
          `/api/companies/${selectedCompanyId}/suppliers`,
        );

        if (!response.ok) {
          throw new Error();
        }

        const data: Supplier[] =
          await response.json();

        const activeSuppliers = data.filter(
          (supplier) =>
            supplier.status === "ACTIVE",
        );

        setSuppliers(activeSuppliers);
      } catch {
        setMessageType("error");
        setMessage(
          "Não foi possível carregar os fornecedores.",
        );
        setSuppliers([]);
      } finally {
        setLoadingSuppliers(false);
      }
    },
    [selectedCompanyId],
  );

  useEffect(() => {
    void loadProducts();
    void loadSuppliers();
  }, [loadProducts, loadSuppliers]);

  useEffect(() => {
    setForm((currentForm) => {
      const selectedSupplierExists =
        suppliers.some(
          (supplier) =>
            supplier.id ===
            currentForm.supplierId,
        );

      if (selectedSupplierExists) {
        return currentForm;
      }

      return {
        ...currentForm,
        supplierId:
          suppliers.length > 0
            ? suppliers[0].id
            : "",
      };
    });
  }, [suppliers]);

  useEffect(() => {
    if (products.length === 0) {
      setSelectedProductId("");
      setBatches([]);
      return;
    }

    const productExists = products.some(
      (product) =>
        product.id === selectedProductId,
    );

    if (!productExists) {
      setSelectedProductId(products[0].id);
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
      setMessage("");

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
        setMessageType("error");
        setMessage(
          "Não foi possível carregar os lotes.",
        );
        setBatches([]);
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

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !selectedCompanyId ||
      !selectedProductId
    ) {
      setMessageType("error");
      setMessage(
        "Selecione uma empresa e um produto.",
      );
      return;
    }

    if (!form.supplierId) {
      setMessageType("error");
      setMessage(
        "Selecione o fornecedor de origem.",
      );
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const response = await apiFetch(
        `/api/companies/${selectedCompanyId}/products/${selectedProductId}/batches`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            batchCode: form.batchCode,
            supplierId: form.supplierId,
            manufactureDate:
              form.manufactureDate,
            expirationDate:
              form.expirationDate || null,
            initialQuantity: Number(
              form.initialQuantity,
            ),
          }),
        },
      );

      const responseData = await response
        .json()
        .catch(() => null);

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

      setForm((currentForm) => ({
        ...initialForm,
        supplierId:
          currentForm.supplierId,
      }));

      setMessageType("success");
      setMessage(
        "Lote cadastrado e fornecedor vinculado com sucesso.",
      );
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

    return date
      .split("-")
      .reverse()
      .join("/");
  }

  function calculatePercentage(batch: Batch) {
    if (batch.initialQuantity === 0) {
      return 0;
    }

    return Math.round(
      (batch.currentQuantity /
        batch.initialQuantity) *
        100,
    );
  }

  function formatSupplierDetails(
    batch: Batch,
  ) {
    if (!batch.supplierId) {
      return "Fornecedor ainda não informado";
    }

    const location = [
      batch.supplierCity,
      batch.supplierState,
      batch.supplierCountry,
    ]
      .filter(Boolean)
      .join(", ");

    return [
      batch.supplierTaxId,
      location,
    ]
      .filter(Boolean)
      .join(" • ");
  }

  return (
    <section className="batch-module">
      <div className="batch-module__heading">
        <div>
          <p>CONTROLE DE LOTES</p>

          <h2>Lotes rastreados</h2>

          <span>
            Acompanhe fabricação, validade,
            fornecedor e quantidade disponível.
          </span>
        </div>

        <div className="batch-filters">
          <label>
            Empresa

            <select
              value={selectedCompanyId}
              onChange={(event) => {
                setSelectedCompanyId(
                  event.target.value,
                );

                setSelectedProductId("");
                setProducts([]);
                setSuppliers([]);
                setBatches([]);

                setForm({
                  ...initialForm,
                  supplierId: "",
                });
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
              onChange={(event) =>
                setSelectedProductId(
                  event.target.value,
                )
              }
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
                  updateForm(
                    "batchCode",
                    event.target.value,
                  )
                }
                placeholder="Ex.: LOTE-2026-002"
                maxLength={64}
                required
              />
            </label>

            <label>
              Fornecedor de origem

              <select
                className="batch-supplier-select"
                value={form.supplierId}
                onChange={(event) =>
                  updateForm(
                    "supplierId",
                    event.target.value,
                  )
                }
                disabled={
                  loadingSuppliers ||
                  suppliers.length === 0
                }
                required
              >
                {loadingSuppliers && (
                  <option value="">
                    Carregando fornecedores...
                  </option>
                )}

                {!loadingSuppliers &&
                  suppliers.length === 0 && (
                    <option value="">
                      Cadastre um fornecedor
                    </option>
                  )}

                {!loadingSuppliers &&
                  suppliers.length > 0 && (
                    <option value="">
                      Selecione o fornecedor
                    </option>
                  )}

                {suppliers.map((supplier) => (
                  <option
                    value={supplier.id}
                    key={supplier.id}
                  >
                    {supplier.tradeName}
                    {supplier.city
                      ? ` — ${supplier.city}`
                      : ""}
                  </option>
                ))}
              </select>

              <small className="batch-supplier-help">
                Define a procedência empresarial
                deste lote.
              </small>
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
              disabled={
                submitting ||
                !selectedProductId ||
                !form.supplierId
              }
            >
              {submitting
                ? "Registrando..."
                : "Registrar lote"}
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

        <article className="panel batch-list-panel">
          <div className="panel__header">
            <div>
              <span>ESTOQUE POR LOTE</span>
              <h3>Lotes do produto</h3>
            </div>

            <strong>{batches.length}</strong>
          </div>

          {loadingBatches && (
            <p className="empty-message">
              Carregando lotes...
            </p>
          )}

          {!loadingBatches &&
            batches.length === 0 && (
              <p className="empty-message">
                Nenhum lote cadastrado para
                este produto.
              </p>
            )}

          {!loadingBatches && (
            <div className="batch-list">
              {batches.map((batch) => {
                const percentage =
                  calculatePercentage(batch);

                const supplierInitial =
                  batch.supplierName
                    ?.charAt(0)
                    .toUpperCase() ?? "?";

                return (
                  <article
                    className="batch-item"
                    key={batch.id}
                  >
                    <div className="batch-item__top">
                      <div>
                        <span>
                          {batch.productSku}
                        </span>

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
                        <span>
                          Quantidade disponível
                        </span>

                        <strong>
                          {batch.currentQuantity}{" "}
                          {
                            unitLabels[
                              batch.productUnit
                            ]
                          }
                        </strong>
                      </div>

                      <span>{percentage}%</span>
                    </div>

                    <div className="batch-progress">
                      <span
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <div className="batch-dates">
                      <span>
                        Fabricação

                        <strong>
                          {formatDate(
                            batch.manufactureDate,
                          )}
                        </strong>
                      </span>

                      <span>
                        Validade

                        <strong>
                          {formatDate(
                            batch.expirationDate,
                          )}
                        </strong>
                      </span>

                      <span>
                        Quantidade inicial

                        <strong>
                          {batch.initialQuantity}
                        </strong>
                      </span>
                    </div>

                    <div
                      className={`batch-origin-card ${
                        batch.supplierId
                          ? ""
                          : "batch-origin-card--missing"
                      }`}
                    >
                      <div className="batch-origin-card__symbol">
                        {supplierInitial}
                      </div>

                      <div className="batch-origin-card__content">
                        <span>
                          FORNECEDOR DE ORIGEM
                        </span>

                        <strong>
                          {batch.supplierName ??
                            "Origem não informada"}
                        </strong>

                        <small>
                          {formatSupplierDetails(
                            batch,
                          )}
                        </small>
                      </div>

                      <span className="batch-origin-card__status">
                        {batch.supplierId
                          ? "Procedência vinculada"
                          : "Origem pendente"}
                      </span>
                    </div>

                    <div className="batch-item__actions">
                      <div>
                        <span>
                          PASSAPORTE DIGITAL
                        </span>

                        <small>
                          Consulta pública, mapa e
                          QR Code
                        </small>
                      </div>

                      <a
                        className="batch-passport-link"
                        href={`/passport/${batch.id}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Abrir passaporte público do lote ${batch.batchCode}`}
                      >
                        Ver passaporte

                        <span aria-hidden="true">
                          ↗
                        </span>
                      </a>
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