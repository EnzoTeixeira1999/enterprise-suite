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

type SupplierStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "SUSPENDED";

type Supplier = {
  id: string;
  companyId: string;
  companyName: string;
  legalName: string;
  tradeName: string;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
};

type SupplierForm = {
  legalName: string;
  tradeName: string;
  taxId: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
};

type SupplierPanelProps = {
  companies: CompanyOption[];
};

const initialSupplierForm: SupplierForm = {
  legalName: "",
  tradeName: "",
  taxId: "",
  email: "",
  phone: "",
  city: "",
  state: "",
  country: "Brasil",
};

const supplierStatusLabels: Record<
  SupplierStatus,
  string
> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  SUSPENDED: "Suspenso",
};

function SupplierPanel({
  companies,
}: SupplierPanelProps) {
  const [selectedCompanyId, setSelectedCompanyId] =
    useState("");
  const [suppliers, setSuppliers] =
    useState<Supplier[]>([]);
  const [form, setForm] =
    useState<SupplierForm>(
      initialSupplierForm,
    );
  const [loading, setLoading] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  useEffect(() => {
    if (companies.length === 0) {
      setSelectedCompanyId("");
      setSuppliers([]);
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

  const loadSuppliers = useCallback(
    async () => {
      if (!selectedCompanyId) {
        setSuppliers([]);
        return;
      }

      setLoading(true);
      setMessage("");

      try {
        const response = await fetch(
          `/api/companies/${selectedCompanyId}/suppliers`,
        );

        if (!response.ok) {
          throw new Error();
        }

        const data: Supplier[] =
          await response.json();

        setSuppliers(data);
      } catch {
        setSuppliers([]);
        setMessageType("error");
        setMessage(
          "Não foi possível carregar os fornecedores.",
        );
      } finally {
        setLoading(false);
      }
    },
    [selectedCompanyId],
  );

  useEffect(() => {
    void loadSuppliers();
  }, [loadSuppliers]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedCompanyId) {
      setMessageType("error");
      setMessage(
        "Selecione uma empresa.",
      );
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/companies/${selectedCompanyId}/suppliers`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            legalName: form.legalName,
            tradeName: form.tradeName,
            taxId: form.taxId || null,
            email: form.email || null,
            phone: form.phone || null,
            city: form.city || null,
            state: form.state || null,
            country:
              form.country || "Brasil",
          }),
        },
      );

      const responseData = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.message ??
            "Não foi possível cadastrar o fornecedor.",
        );
      }

      setSuppliers((currentSuppliers) =>
        [...currentSuppliers, responseData as Supplier]
          .sort((first, second) =>
            first.tradeName.localeCompare(
              second.tradeName,
              "pt-BR",
            ),
          ),
      );

      setForm(initialSupplierForm);
      setMessageType("success");
      setMessage(
        "Fornecedor cadastrado com sucesso.",
      );
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o fornecedor.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function updateForm(
    field: keyof SupplierForm,
    value: string,
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  const activeSuppliers = suppliers.filter(
    (supplier) =>
      supplier.status === "ACTIVE",
  ).length;

  const supplierLocations = new Set(
    suppliers
      .filter(
        (supplier) =>
          supplier.city && supplier.state,
      )
      .map(
        (supplier) =>
          `${supplier.city}-${supplier.state}`,
      ),
  ).size;

  return (
    <section className="supplier-module">
      <div className="supplier-module__heading">
        <div>
          <p>REDE DE PROCEDÊNCIA</p>
          <h2>Fornecedores conectados</h2>
          <span>
            Registre a origem dos lotes e
            mantenha os parceiros centralizados.
          </span>
        </div>

        <label>
          Empresa
          <select
            value={selectedCompanyId}
            onChange={(event) => {
              setSelectedCompanyId(
                event.target.value,
              );
              setSuppliers([]);
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
      </div>

      <section className="supplier-metrics">
        <article>
          <span>Total de fornecedores</span>
          <strong>{suppliers.length}</strong>
          <p>Parceiros cadastrados</p>
        </article>

        <article>
          <span>Fornecedores ativos</span>
          <strong>{activeSuppliers}</strong>
          <p>Disponíveis para novos lotes</p>
        </article>

        <article>
          <span>Regiões de origem</span>
          <strong>{supplierLocations}</strong>
          <p>Localizações registradas</p>
        </article>
      </section>

      <div className="supplier-workspace">
        <article className="panel supplier-form-panel">
          <div className="panel__header">
            <div>
              <span>NOVO PARCEIRO</span>
              <h3>Cadastrar fornecedor</h3>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <label>
              Razão social
              <input
                value={form.legalName}
                onChange={(event) =>
                  updateForm(
                    "legalName",
                    event.target.value,
                  )
                }
                placeholder="Ex.: Componentes Industriais Ltda"
                maxLength={160}
                required
              />
            </label>

            <label>
              Nome fantasia
              <input
                value={form.tradeName}
                onChange={(event) =>
                  updateForm(
                    "tradeName",
                    event.target.value,
                  )
                }
                placeholder="Ex.: Componentes Tech"
                maxLength={120}
                required
              />
            </label>

            <label>
              Documento
              <input
                value={form.taxId}
                onChange={(event) =>
                  updateForm(
                    "taxId",
                    event.target.value,
                  )
                }
                placeholder="Ex.: 00.000.000/0001-00"
                maxLength={32}
              />
            </label>

            <div className="supplier-form__row">
              <label>
                E-mail
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateForm(
                      "email",
                      event.target.value,
                    )
                  }
                  placeholder="contato@empresa.com"
                  maxLength={160}
                />
              </label>

              <label>
                Telefone
                <input
                  value={form.phone}
                  onChange={(event) =>
                    updateForm(
                      "phone",
                      event.target.value,
                    )
                  }
                  placeholder="(00) 0000-0000"
                  maxLength={32}
                />
              </label>
            </div>

            <div className="supplier-form__row">
              <label>
                Cidade
                <input
                  value={form.city}
                  onChange={(event) =>
                    updateForm(
                      "city",
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: Joinville"
                  maxLength={120}
                />
              </label>

              <label>
                Estado
                <input
                  value={form.state}
                  onChange={(event) =>
                    updateForm(
                      "state",
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: Santa Catarina"
                  maxLength={80}
                />
              </label>
            </div>

            <label>
              País
              <input
                value={form.country}
                onChange={(event) =>
                  updateForm(
                    "country",
                    event.target.value,
                  )
                }
                placeholder="Ex.: Brasil"
                maxLength={80}
              />
            </label>

            <button
              className="primary-button"
              type="submit"
              disabled={
                submitting ||
                !selectedCompanyId
              }
            >
              {submitting
                ? "Cadastrando..."
                : "Cadastrar fornecedor"}
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

        <article className="panel supplier-list-panel">
          <div className="panel__header">
            <div>
              <span>BASE DE ORIGEM</span>
              <h3>Parceiros cadastrados</h3>
            </div>

            <strong>{suppliers.length}</strong>
          </div>

          {loading && (
            <p className="empty-message">
              Carregando fornecedores...
            </p>
          )}

          {!loading &&
            suppliers.length === 0 && (
              <p className="empty-message">
                Nenhum fornecedor cadastrado
                nesta empresa.
              </p>
            )}

          {!loading && (
            <div className="supplier-list">
              {suppliers.map((supplier) => (
                <article
                  className="supplier-item"
                  key={supplier.id}
                >
                  <div className="supplier-item__top">
                    <div className="supplier-item__symbol">
                      {supplier.tradeName
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="supplier-item__identity">
                      <h4>{supplier.tradeName}</h4>
                      <p>{supplier.legalName}</p>
                    </div>

                    <span
                      className={`supplier-status supplier-status--${supplier.status.toLowerCase()}`}
                    >
                      {
                        supplierStatusLabels[
                          supplier.status
                        ]
                      }
                    </span>
                  </div>

                  <div className="supplier-item__details">
                    <span>
                      Documento
                      <strong>
                        {supplier.taxId ??
                          "Não informado"}
                      </strong>
                    </span>

                    <span>
                      Localização
                      <strong>
                        {supplier.city &&
                        supplier.state
                          ? `${supplier.city}, ${supplier.state}`
                          : supplier.country}
                      </strong>
                    </span>

                    <span>
                      Contato
                      <strong>
                        {supplier.email ??
                          supplier.phone ??
                          "Não informado"}
                      </strong>
                    </span>
                  </div>

                  <div className="supplier-item__footer">
                    <span>
                      ORIGEM EMPRESARIAL VERIFICADA
                    </span>

                    <small>
                      Disponível para associação
                      aos lotes
                    </small>
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

export default SupplierPanel;