import { useEffect, useState } from "react";
import JourneyMap from "./JourneyMap";
import PassportQrCode from "./PassportQrCode";
import PassportSafetyPanel, {
  type PassportSafety,
} from "./PassportSafetyPanel";

type BatchStatus =
  | "REGISTERED"
  | "IN_STORAGE"
  | "IN_TRANSIT"
  | "BLOCKED"
  | "COMPLETED"
  | "EXPIRED";

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

type PassportBatch = {
  id: string;
  companyId: string;
  companyName: string;
  productId: string;
  productName: string;
  productSku: string;
  productUnit: string;

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

type PassportMovement = {
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

type PassportData = {
  passportId: string;
  verificationStatus: string;
  batch: PassportBatch;
  movements: PassportMovement[];
  safety: PassportSafety;
  generatedAt: string;
};

type PublicPassportProps = {
  passportId: string;
};

const batchStatusLabels: Record<
  BatchStatus,
  string
> = {
  REGISTERED: "Registrado",
  IN_STORAGE: "Armazenado",
  IN_TRANSIT: "Em trânsito",
  BLOCKED: "Bloqueado",
  COMPLETED: "Concluído",
  EXPIRED: "Vencido",
};

const movementLabels: Record<
  MovementType,
  string
> = {
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

function formatDate(date: string | null) {
  if (!date) {
    return "Não informada";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
  }).format(new Date(`${date}T12:00:00`));
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function formatQuantity(quantity: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 3,
  }).format(quantity);
}

function getSupplierLocation(
  batch: PassportBatch,
) {
  const location = [
    batch.supplierCity,
    batch.supplierState,
    batch.supplierCountry,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    location || "Localização não informada"
  );
}

function PublicPassport({
  passportId,
}: PublicPassportProps) {
  const [passport, setPassport] =
    useState<PassportData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] = useState("");

  const [copied, setCopied] =
    useState(false);

  useEffect(() => {
    async function loadPassport() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/public/passports/${passportId}`,
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Passaporte não encontrado."
              : "Não foi possível consultar o passaporte.",
          );
        }

        const data: PassportData =
          await response.json();

        setPassport(data);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível consultar o passaporte.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadPassport();
  }, [passportId]);

  async function copyPublicLink() {
    try {
      await navigator.clipboard.writeText(
        window.location.href,
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  if (loading) {
    return (
      <main className="public-passport public-passport--state">
        <div className="passport-state-card">
          <div className="passport-loading" />

          <h1>Consultando passaporte</h1>

          <p>
            Verificando os registros do lote...
          </p>
        </div>
      </main>
    );
  }

  if (error || !passport) {
    return (
      <main className="public-passport public-passport--state">
        <div className="passport-state-card">
          <span className="passport-state-card__symbol">
            !
          </span>

          <h1>Passaporte indisponível</h1>

          <p>
            {error ||
              "Documento não encontrado."}
          </p>

          <a href="/">Voltar ao TracePass</a>
        </div>
      </main>
    );
  }

  const { batch, movements } = passport;

  const lastMovement =
    movements.length > 0
      ? movements[movements.length - 1]
      : null;

  const supplierInitial =
    batch.supplierName
      ?.charAt(0)
      .toUpperCase() ?? "?";

  return (
    <main className="public-passport">
      <header className="passport-header">
        <a className="passport-brand" href="/">
          <span>TP</span>

          <div>
            <strong>TracePass</strong>

            <small>
              Passaporte digital de produto
            </small>
          </div>
        </a>

        <div className="passport-header__actions">
          <button
            type="button"
            onClick={() =>
              void copyPublicLink()
            }
          >
            {copied
              ? "Link copiado"
              : "Copiar link"}
          </button>

          <span className="passport-verified">
            <i />
            Documento verificado
          </span>
        </div>
      </header>

      <section className="passport-hero">
        <div className="passport-hero__content">
          <p>
            PASSAPORTE DIGITAL VERIFICADO
          </p>

          <h1>{batch.productName}</h1>

          <span>
            Histórico público e rastreável da
            origem ao destino.
          </span>

          <div className="passport-hero__identifiers">
            <div>
              <small>LOTE</small>
              <strong>
                {batch.batchCode}
              </strong>
            </div>

            <div>
              <small>SKU</small>
              <strong>
                {batch.productSku}
              </strong>
            </div>

            <div>
              <small>EMPRESA</small>
              <strong>
                {batch.companyName}
              </strong>
            </div>
          </div>
        </div>

        <div className="passport-seal">
          <div className="passport-seal__circle">
            <span>✓</span>
          </div>

          <strong>
            Autenticidade confirmada
          </strong>

          <small>
            Registros íntegros no TracePass
          </small>
        </div>
      </section>

      <section className="passport-summary">
        <article>
          <span>Status atual</span>

          <strong
            className={`passport-status passport-status--${batch.status.toLowerCase()}`}
          >
            {batchStatusLabels[batch.status]}
          </strong>
        </article>

        <article>
          <span>Fabricação</span>

          <strong>
            {formatDate(
              batch.manufactureDate,
            )}
          </strong>
        </article>

        <article>
          <span>Validade</span>

          <strong>
            {formatDate(
              batch.expirationDate,
            )}
          </strong>
        </article>

        <article>
          <span>Quantidade</span>

          <strong>
            {formatQuantity(
              batch.currentQuantity,
            )}{" "}
            {batch.productUnit === "UNIT"
              ? "unidades"
              : batch.productUnit}
          </strong>
        </article>
      </section>

      <section
        className={`passport-origin ${
          batch.supplierId
            ? ""
            : "passport-origin--missing"
        }`}
      >
        <div className="passport-origin__introduction">
          <p>PROCEDÊNCIA EMPRESARIAL</p>

          <h2>
            Origem registrada do produto
          </h2>

          <span>
            Consulte a empresa fornecedora
            associada à produção deste lote.
          </span>
        </div>

        {batch.supplierId ? (
          <div className="passport-origin__card">
            <div className="passport-origin__identity">
              <span className="passport-origin__symbol">
                {supplierInitial}
              </span>

              <div>
                <small>
                  FORNECEDOR DE ORIGEM
                </small>

                <strong>
                  {batch.supplierName}
                </strong>

                <span>
                  Empresa associada ao lote{" "}
                  {batch.batchCode}
                </span>
              </div>
            </div>

            <div className="passport-origin__details">
              <div>
                <small>DOCUMENTO</small>

                <strong>
                  {batch.supplierTaxId ??
                    "Não informado"}
                </strong>
              </div>

              <div>
                <small>LOCALIZAÇÃO</small>

                <strong>
                  {getSupplierLocation(batch)}
                </strong>
              </div>
            </div>

            <div className="passport-origin__verification">
              <span>✓</span>

              <div>
                <strong>
                  Vínculo de origem confirmado
                </strong>

                <small>
                  Fornecedor associado aos
                  registros deste lote no
                  TracePass
                </small>
              </div>
            </div>
          </div>
        ) : (
          <div className="passport-origin__empty">
            <span>!</span>

            <div>
              <strong>
                Fornecedor não informado
              </strong>

              <small>
                Este lote ainda não possui uma
                empresa fornecedora associada.
              </small>
            </div>
          </div>
        )}
      </section>
      
      <PassportSafetyPanel
        safety={passport.safety}
        batchCode={batch.batchCode}
      />

      <section className="passport-current-location">
        <div>
          <p>ÚLTIMA ATUALIZAÇÃO</p>

          <h2>
            {lastMovement?.locationName ??
              "Localização não informada"}
          </h2>

          {lastMovement && (
            <span>
              {
                movementLabels[
                  lastMovement.movementType
                ]
              }{" "}
              em{" "}
              {formatDateTime(
                lastMovement.occurredAt,
              )}
            </span>
          )}
        </div>

        <strong>
          {movements.length} eventos verificados
        </strong>
      </section>

      <section className="passport-journey">
        <div className="passport-section-heading">
          <div>
            <p>HISTÓRICO DO PRODUTO</p>
            <h2>Jornada verificada</h2>
          </div>

          <span>
            Os registros são apresentados em
            ordem cronológica.
          </span>
        </div>

        <div className="passport-timeline">
          {movements.map(
            (movement, index) => (
              <article
                className="passport-event"
                key={movement.id}
              >
                <div className="passport-event__marker">
                  <span>{index + 1}</span>
                </div>

                <div className="passport-event__content">
                  <div className="passport-event__top">
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

                  <h3>{movement.title}</h3>

                  {movement.description && (
                    <p>
                      {movement.description}
                    </p>
                  )}

                  <div className="passport-event__metadata">
                    {movement.locationName && (
                      <span>
                        Local

                        <strong>
                          {
                            movement.locationName
                          }
                        </strong>
                      </span>
                    )}

                    {movement.responsibleName && (
                      <span>
                        Responsável

                        <strong>
                          {
                            movement.responsibleName
                          }
                        </strong>
                      </span>
                    )}

                    {movement.quantity !==
                      null && (
                      <span>
                        Quantidade

                        <strong>
                          {formatQuantity(
                            movement.quantity,
                          )}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ),
          )}
        </div>
      </section>

      <JourneyMap movements={movements} />

      <PassportQrCode
        passportId={passport.passportId}
        productName={batch.productName}
        batchCode={batch.batchCode}
      />

      <footer className="passport-footer">
        <div>
          <strong>TracePass</strong>

          <p>
            Documento público gerado a partir
            de registros rastreáveis.
          </p>
        </div>

        <div>
          <span>ID DO PASSAPORTE</span>

          <code>
            {passport.passportId}
          </code>
        </div>

        <small>
          Consultado em{" "}
          {formatDateTime(
            passport.generatedAt,
          )}
        </small>
      </footer>
    </main>
  );
}

export default PublicPassport;