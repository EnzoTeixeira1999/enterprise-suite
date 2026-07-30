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
type ProductStatus = "ACTIVE" | "INACTIVE" | "DISCONTINUED";

type Product = {
  id: string;
  companyId: string;
  companyName: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: ProductUnit;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
};

type ProductForm = {
  sku: string;
  name: string;
  description: string;
  category: string;
  unit: ProductUnit;
};

type ProductPanelProps = {
  companies: CompanyOption[];
};

const initialForm: ProductForm = {
  sku: "",
  name: "",
  description: "",
  category: "",
  unit: "UNIT",
};

const unitLabels: Record<ProductUnit, string> = {
  UNIT: "Unidade",
  KG: "Quilograma",
  LITER: "Litro",
  BOX: "Caixa",
  METER: "Metro",
};

function ProductPanel({ companies }: ProductPanelProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  useEffect(() => {
    if (companies.length === 0) {
      setSelectedCompanyId("");
      setProducts([]);
      return;
    }

    const selectedCompanyStillExists = companies.some(
      (company) => company.id === selectedCompanyId,
    );

    if (!selectedCompanyStillExists) {
      setSelectedCompanyId(companies[0].id);
    }
  }, [companies, selectedCompanyId]);

  const loadProducts = useCallback(async () => {
    if (!selectedCompanyId) {
      setProducts([]);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/companies/${selectedCompanyId}/products`,
      );

      if (!response.ok) {
        throw new Error("Não foi possível carregar os produtos");
      }

      const data: Product[] = await response.json();
      setProducts(data);
    } catch {
      setMessageType("error");
      setMessage(
        "Não foi possível consultar os produtos da empresa.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedCompanyId) {
      setMessageType("error");
      setMessage("Selecione uma empresa antes de cadastrar.");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/companies/${selectedCompanyId}/products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        },
      );

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.message ??
            "Não foi possível cadastrar o produto",
        );
      }

      setProducts((currentProducts) => [
        responseData as Product,
        ...currentProducts,
      ]);

      setForm(initialForm);
      setMessageType("success");
      setMessage("Produto cadastrado com sucesso.");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o produto.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function updateForm(
    field: keyof ProductForm,
    value: string,
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  return (
    <section className="product-module">
      <div className="product-module__heading">
        <div>
          <p>CATÁLOGO RASTREÁVEL</p>
          <h2>Produtos</h2>
          <span>
            Cadastre os itens que receberão lotes e histórico de
            movimentações.
          </span>
        </div>

        <label>
          Empresa selecionada
          <select
            value={selectedCompanyId}
            onChange={(event) =>
              setSelectedCompanyId(event.target.value)
            }
          >
            {companies.length === 0 && (
              <option value="">Nenhuma empresa cadastrada</option>
            )}

            {companies.map((company) => (
              <option value={company.id} key={company.id}>
                {company.tradeName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="product-workspace">
        <article className="panel product-form-panel">
          <div className="panel__header">
            <div>
              <span>NOVO PRODUTO</span>
              <h3>Adicionar ao catálogo</h3>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label>
              SKU
              <input
                type="text"
                value={form.sku}
                onChange={(event) =>
                  updateForm("sku", event.target.value)
                }
                placeholder="Ex.: SENSOR-TEMP-001"
                maxLength={64}
                required
              />
            </label>

            <label>
              Nome do produto
              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  updateForm("name", event.target.value)
                }
                placeholder="Ex.: Sensor de temperatura"
                maxLength={160}
                required
              />
            </label>

            <label>
              Categoria
              <input
                type="text"
                value={form.category}
                onChange={(event) =>
                  updateForm("category", event.target.value)
                }
                placeholder="Ex.: Monitoramento"
                maxLength={100}
              />
            </label>

            <label>
              Unidade
              <select
                value={form.unit}
                onChange={(event) =>
                  updateForm("unit", event.target.value)
                }
              >
                {Object.entries(unitLabels).map(
                  ([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label>
              Descrição
              <textarea
                value={form.description}
                onChange={(event) =>
                  updateForm("description", event.target.value)
                }
                placeholder="Descreva a finalidade do produto"
                maxLength={500}
                rows={4}
              />
            </label>

            <button
              className="primary-button"
              type="submit"
              disabled={submitting || !selectedCompanyId}
            >
              {submitting ? "Cadastrando..." : "Cadastrar produto"}
            </button>

            {message && (
              <p className={`feedback feedback--${messageType}`}>
                {message}
              </p>
            )}
          </form>
        </article>

        <article className="panel product-list-panel">
          <div className="panel__header">
            <div>
              <span>PRODUTOS RASTREADOS</span>
              <h3>Catálogo da empresa</h3>
            </div>

            <strong>{products.length}</strong>
          </div>

          {loading && (
            <p className="empty-message">Carregando produtos...</p>
          )}

          {!loading && products.length === 0 && !message && (
            <p className="empty-message">
              Nenhum produto cadastrado nesta empresa.
            </p>
          )}

          {!loading && (
            <div className="product-list">
              {products.map((product) => (
                <article className="product-item" key={product.id}>
                  <div className="product-item__top">
                    <div>
                      <span>{product.category ?? "Sem categoria"}</span>
                      <h4>{product.name}</h4>
                    </div>

                    <span className="company-status company-status--active">
                      Ativo
                    </span>
                  </div>

                  <p>
                    {product.description ??
                      "Produto sem descrição cadastrada."}
                  </p>

                  <div className="product-item__details">
                    <span>
                      SKU
                      <strong>{product.sku}</strong>
                    </span>

                    <span>
                      Unidade
                      <strong>{unitLabels[product.unit]}</strong>
                    </span>

                    <span>
                      Empresa
                      <strong>{product.companyName}</strong>
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

export default ProductPanel;