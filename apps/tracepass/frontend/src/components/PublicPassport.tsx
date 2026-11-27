import { useEffect, useState } from "react";
import { demoPath } from "../demoPassport";
import JourneyMap from "./JourneyMap";
import PassportQrCode from "./PassportQrCode";
import { getPassportShareUrl } from "../services/passportShare";
import { demoWorkspacePath } from "../services/demoWorkspace";
import PassportSafetyPanel, {
  type PassportSafety,
} from "./PassportSafetyPanel";
import { apiFetch } from "../services/api";

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
  archivedAt?: string | null;
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

export type PassportData = {
  passportId: string;
  verificationStatus: string;
  batch: PassportBatch;
  movements: PassportMovement[];
  archivedMovements?: number;
  safety: PassportSafety;
  generatedAt: string;
};

type PublicPassportProps = {
  passportId: string;
  example?: PassportData;
  featured?: boolean;
  workspace?: boolean;
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
  example,
  featured = false,
  workspace = false,
}: PublicPassportProps) {
  const [passport, setPassport] =
    useState<PassportData | null>(example ?? null);

  const [loading, setLoading] =
    useState(!example);
  const [attempt, setAttempt] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<string>();

  const [error, setError] = useState("");

  const [showShareLink, setShowShareLink] = useState(false);
  const [copied, setCopied] =
    useState(false);

  useEffect(() => {
    if (example) return;
    const controller = new AbortController();
    const timeout = AbortSignal.timeout(30_000);
    async function loadPassport() {
      setLoading(true);
      setError("");

      try {
        const response = await apiFetch(
          `/api/public/passports/${passportId}`,
          { signal: AbortSignal.any([controller.signal, timeout]) },
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
        if (controller.signal.aborted) return;
        setError(
          timeout.aborted ? "O servidor ainda está iniciando." : requestError instanceof Error
            ? requestError.message
            : "Não foi possível consultar o passaporte.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadPassport();
    return () => controller.abort();
  }, [passportId, example, attempt]);

  async function copyPublicLink() {
    try {
      await navigator.clipboard.writeText(
        getPassportShareUrl(passport?.passportId),
      );

      setShowShareLink(false);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setShowShareLink(true);
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
            Buscando os registros. O servidor pode levar alguns segundos para responder.
          </p>
          <a href={demoPath}>Ver exemplo enquanto isso</a>
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

          <div className="passport-recovery">
            <button className="secondary-button" type="button" onClick={() => {
              setError("");
              setLoading(true);
              setAttempt((current) => current + 1);
            }}>Tentar novamente</button>
            <a href={demoPath}>Ver exemplo</a>
          </div>
        </div>
      </main>
    );
  }

  const { batch, movements, archivedMovements = 0 } = passport;
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  const expired = batch.status === "EXPIRED"
    || (batch.expirationDate !== null && batch.expirationDate < today);

  const lastMovement =
    movements.length > 0
      ? movements[movements.length - 1]
      : null;

  const supplierInitial =
    batch.supplierName
      ?.charAt(0)
      .toUpperCase() ?? "?";

  return (
    <main className="public-passport passport-redesign">
      <header className="passport-header">
        <a className="passport-brand" href={workspace ? demoWorkspacePath : "/"}>
          <span aria-hidden="true">TP</span>

          <div>
            <strong>TracePass</strong>

            <small>
              Passaporte digital de produto
            </small>
          </div>
        </a>

        <div className="passport-header__actions">
          {(featured || example || workspace) && (
            <a className="passport-test-link" href={demoWorkspacePath}>← Voltar ao teste</a>
          )}
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
            {workspace ? "Dados neste navegador" : (featured || example) ? "Dados de exemplo" : "Registro público"}
          </span>
        </div>
      </header>

      {showShareLink && (
        <div className="passport-share-fallback">
          <label htmlFor="passport-public-url">Copie o endereço do passaporte</label>
          <input id="passport-public-url" readOnly value={getPassportShareUrl(passport?.passportId)}
            onFocus={(event) => event.currentTarget.select()} />
          <button className="secondary-button" type="button" onClick={() => setShowShareLink(false)}>Fechar</button>
        </div>
      )}
      <section className="passport-overview" aria-labelledby="passport-title">
        <div className="passport-overview__identity">
          <p className="passport-overview__eyebrow">Passaporte digital do produto</p>
          <h1 id="passport-title">{batch.productName}</h1>
          <dl className="passport-overview__identifiers">
            <div><dt>Lote</dt><dd><code>{batch.batchCode}</code></dd></div>
            <div><dt>SKU</dt><dd><code>{batch.productSku}</code></dd></div>
            <div><dt>Empresa</dt><dd>{batch.companyName}</dd></div>
          </dl>
        </div>
        <aside className="passport-overview__status" aria-label="Situação do lote">
          <span>Status operacional</span>
          <strong className={"passport-status passport-status--" + batch.status.toLowerCase()}>
            {batchStatusLabels[batch.status]}
          </strong>
          <div>
            <span>Último local registrado</span>
            <strong>{lastMovement?.locationName ?? "Localização não informada"}</strong>
            {lastMovement && <time dateTime={lastMovement.occurredAt}>{formatDateTime(lastMovement.occurredAt)}</time>}
          </div>
        </aside>
        <dl className="passport-overview__facts">
          <div><dt>Origem</dt><dd>{batch.supplierName ?? "Não informada"}</dd></div>
          <div><dt>Fabricação</dt><dd>{formatDate(batch.manufactureDate)}</dd></div>
          <div><dt>Validade</dt><dd>{formatDate(batch.expirationDate)} {expired && <span className="passport-expired">Vencido</span>}</dd></div>
          <div><dt>Quantidade atual</dt><dd>{formatQuantity(batch.currentQuantity)} {batch.productUnit === "UNIT" ? "unidades" : batch.productUnit}</dd></div>
        </dl>
      </section>

      {batch.archivedAt && <aside className="passport-demo-note">
        <div><strong>Lote arquivado</strong><p>Este passaporte continua disponível para consulta histórica.</p></div>
      </aside>}

      {example && (
        <aside className="passport-demo-note">
          <span aria-hidden="true">↳</span>
          <div><strong>O que aconteceu com este lote?</strong>
            <p>Uma avaria na embalagem acionou um bloqueio preventivo. Veja na jornada como o lote foi inspecionado e liberado.</p>
          </div>
          <a href="#ocorrencias">Ver ocorrência <span aria-hidden="true">→</span></a>
        </aside>
      )}

      <nav className="passport-section-nav" aria-label="Seções do passaporte">
        <a href="#jornada">Jornada <span>{movements.length}</span></a>
        <a href="#origem">Procedência</a>
        <a href="#ocorrencias">Ocorrências <span>{passport.safety.totalIncidents}</span></a>
        <a href="#compartilhar">Compartilhar</a>
      </nav>

      <div className="passport-route-layout" id="jornada">
      <section className="passport-journey">
        <div className="passport-section-heading">
          <div>
            <h2>Jornada do lote</h2>
          </div>

          <span>
            Use os números para comparar os registros com os pontos do mapa. Abra os detalhes para ver as informações de cada evento.
          </span>
        </div>

        {archivedMovements > 0 && <p>Movimentações arquivadas pela operação: {archivedMovements}.</p>}
        {movements.length === 0 && <p>Nenhuma movimentação registrada.</p>}
        <div className="passport-timeline">
          {movements.map(
            (movement, index) => (
              <article
                className={"passport-event" + (selectedEvent === movement.id ? " passport-event--selected" : "")}
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

                    <time dateTime={movement.occurredAt}>
                      {formatDateTime(
                        movement.occurredAt,
                      )}
                    </time>
                  </div>

                  <h3>{movement.title}</h3>
                  {movement.latitude !== null && movement.longitude !== null
                    && Math.abs(movement.latitude) <= 90 && Math.abs(movement.longitude) <= 180 && (
                    <button className="route-select" type="button" aria-controls="mapa-da-jornada" aria-pressed={selectedEvent === movement.id}
                      onClick={() => {
                        setSelectedEvent(movement.id);
                        requestAnimationFrame(() => {
                          const map = document.getElementById("mapa-da-jornada");
                          const bounds = map?.getBoundingClientRect();
                          if (bounds && (bounds.top < 0 || bounds.bottom > window.innerHeight - 12)) {
                            map?.scrollIntoView({ block: "start" });
                          }
                        });
                      }}>Destacar no mapa</button>
                  )}

                  <details className="passport-event__details">
                    <summary>Detalhes do evento</summary>
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
                  </details>
                </div>
              </article>
            ),
          )}
        </div>
      </section>

      <div id="mapa-da-jornada">
        <JourneyMap movements={movements} selectedMovementId={selectedEvent} onSelectMovement={setSelectedEvent} />
      </div>
      </div>

      <section id="origem"
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
            Veja o fornecedor associado ao lote e a localização que consta no registro.
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
                <strong>Fornecedor vinculado ao lote</strong>

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
      
      <div id="ocorrencias">
        <PassportSafetyPanel safety={passport.safety} batchCode={batch.batchCode} />
      </div>



      <div id="compartilhar">
        <PassportQrCode passportId={passport.passportId} productName={batch.productName}
          batchCode={batch.batchCode} example={featured || Boolean(example)} workspace={workspace} />
      </div>

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
          {example ? "Cenário preparado em " : "Consultado em "}
          {formatDateTime(
            passport.generatedAt,
          )}
        </small>
      </footer>
    </main>
  );
}

export default PublicPassport;
