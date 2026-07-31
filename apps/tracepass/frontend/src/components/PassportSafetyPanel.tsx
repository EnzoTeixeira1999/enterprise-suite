type SafetyStatus =
  | "CLEAR"
  | "ATTENTION"
  | "BLOCKED";

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

type PublicIncident = {
  id: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  automaticBlock: boolean;
  occurredAt: string;
  resolvedAt: string | null;
};

export type PassportSafety = {
  status: SafetyStatus;
  totalIncidents: number;
  activeIncidents: number;
  resolvedIncidents: number;
  criticalActiveIncidents: number;
  hasAutomaticBlocks: boolean;
  incidents: PublicIncident[];
};

type PassportSafetyPanelProps = {
  safety: PassportSafety;
  batchCode: string;
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

const incidentStatusLabels: Record<
  IncidentStatus,
  string
> = {
  OPEN: "Aberta",
  INVESTIGATING: "Em análise",
  RESOLVED: "Resolvida",
};

const safetyContent: Record<
  SafetyStatus,
  {
    label: string;
    title: string;
    description: string;
    symbol: string;
  }
> = {
  CLEAR: {
    label: "SITUAÇÃO SEGURA",
    title: "Lote aprovado e sem alertas ativos",
    description:
      "Todas as ocorrências registradas foram tratadas e o lote está autorizado a operar.",
    symbol: "✓",
  },
  ATTENTION: {
    label: "ATENÇÃO NECESSÁRIA",
    title: "Ocorrências em análise",
    description:
      "Existem registros que ainda estão sendo investigados pela equipe responsável.",
    symbol: "!",
  },
  BLOCKED: {
    label: "OPERAÇÃO BLOQUEADA",
    title: "Lote temporariamente bloqueado",
    description:
      "O lote está impedido de continuar a operação até a conclusão das verificações.",
    symbol: "!",
  },
};

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function PassportSafetyPanel({
  safety,
  batchCode,
}: PassportSafetyPanelProps) {
  const content =
    safetyContent[safety.status];

  return (
    <section
      className={`passport-safety passport-safety--${safety.status.toLowerCase()}`}
    >
      <div className="passport-safety__heading">
        <div>
          <p>SEGURANÇA E CONFORMIDADE</p>

          <h2>{content.title}</h2>

          <span>
            {content.description}
          </span>
        </div>

        <div className="passport-safety__state">
          <span>{content.symbol}</span>

          <div>
            <small>{content.label}</small>

            <strong>
              Lote {batchCode}
            </strong>
          </div>
        </div>
      </div>

      <div className="passport-safety__metrics">
        <article>
          <span>Total de ocorrências</span>

          <strong>
            {safety.totalIncidents}
          </strong>

          <small>
            Histórico preservado
          </small>
        </article>

        <article>
          <span>Ocorrências ativas</span>

          <strong>
            {safety.activeIncidents}
          </strong>

          <small>
            Exigem acompanhamento
          </small>
        </article>

        <article>
          <span>Ocorrências resolvidas</span>

          <strong>
            {safety.resolvedIncidents}
          </strong>

          <small>
            Tratamentos concluídos
          </small>
        </article>

        <article>
          <span>Riscos críticos ativos</span>

          <strong>
            {safety.criticalActiveIncidents}
          </strong>

          <small>
            Impactam a operação
          </small>
        </article>
      </div>

      <div className="passport-safety__history">
        <div className="passport-safety__history-heading">
          <div>
            <p>HISTÓRICO DE SEGURANÇA</p>

            <h3>
              Ocorrências públicas
            </h3>
          </div>

          {safety.hasAutomaticBlocks && (
            <span>
              Proteção automática utilizada
            </span>
          )}
        </div>

        {safety.incidents.length === 0 ? (
          <div className="passport-safety__empty">
            <span>✓</span>

            <div>
              <strong>
                Nenhuma ocorrência registrada
              </strong>

              <small>
                O lote não possui alertas no
                histórico de rastreabilidade.
              </small>
            </div>
          </div>
        ) : (
          <div className="passport-safety__list">
            {safety.incidents.map(
              (incident) => (
                <article
                  className={`passport-safety-incident passport-safety-incident--${incident.status.toLowerCase()}`}
                  key={incident.id}
                >
                  <div className="passport-safety-incident__top">
                    <div>
                      <span>
                        {
                          incidentTypeLabels[
                            incident.incidentType
                          ]
                        }
                      </span>

                      <h4>
                        {incident.title}
                      </h4>
                    </div>

                    <div className="passport-safety-incident__badges">
                      <span
                        className={`passport-safety-severity passport-safety-severity--${incident.severity.toLowerCase()}`}
                      >
                        {
                          severityLabels[
                            incident.severity
                          ]
                        }
                      </span>

                      <span
                        className={`passport-safety-status passport-safety-status--${incident.status
                          .toLowerCase()
                          .replaceAll("_", "-")}`}
                      >
                        {
                          incidentStatusLabels[
                            incident.status
                          ]
                        }
                      </span>
                    </div>
                  </div>

                  <div className="passport-safety-incident__dates">
                    <span>
                      Registrada

                      <strong>
                        {formatDateTime(
                          incident.occurredAt,
                        )}
                      </strong>
                    </span>

                    <span>
                      Finalização

                      <strong>
                        {incident.resolvedAt
                          ? formatDateTime(
                              incident.resolvedAt,
                            )
                          : "Em andamento"}
                      </strong>
                    </span>
                  </div>

                  {incident.automaticBlock && (
                    <div className="passport-safety-incident__automation">
                      <span>!</span>

                      <div>
                        <strong>
                          Bloqueio preventivo aplicado
                        </strong>

                        <small>
                          A operação foi interrompida
                          automaticamente para
                          tratamento da ocorrência.
                        </small>
                      </div>
                    </div>
                  )}
                </article>
              ),
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default PassportSafetyPanel;