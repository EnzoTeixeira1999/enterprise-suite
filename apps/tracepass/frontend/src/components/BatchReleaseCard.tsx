import {
  useState,
  type FormEvent,
} from "react";
import LocationPicker from "./LocationPicker";
import { apiFetch } from "../services/api";

type BatchStatus =
  | "REGISTERED"
  | "IN_STORAGE"
  | "IN_TRANSIT"
  | "BLOCKED"
  | "COMPLETED"
  | "EXPIRED";

type BatchReleaseCardProps = {
  companyId: string;
  productId: string;
  batchId: string;
  batchCode: string;
  batchStatus: BatchStatus;
  unresolvedIncidents: number;
  onReleased: () => void;
};

function BatchReleaseCard({
  companyId,
  productId,
  batchId,
  batchCode,
  batchStatus,
  unresolvedIncidents,
  onReleased,
}: BatchReleaseCardProps) {
  const [releasedBy, setReleasedBy] =
    useState("");

  const [releaseNotes, setReleaseNotes] =
    useState("");

  const [locationName, setLocationName] =
    useState("");

  const [latitude, setLatitude] =
    useState("");

  const [longitude, setLongitude] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<"success" | "error">(
      "success",
    );

  async function handleRelease(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !companyId ||
      !productId ||
      !batchId
    ) {
      setMessageType("error");
      setMessage(
        "Selecione um lote antes de realizar a liberação.",
      );
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const response = await apiFetch(
        `/api/companies/${companyId}/products/${productId}/batches/${batchId}/release`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            releasedBy,
            releaseNotes,
            locationName:
              locationName.trim() || null,
            latitude: latitude
              ? Number(latitude)
              : null,
            longitude: longitude
              ? Number(longitude)
              : null,
          }),
        },
      );

      const responseData = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          responseData?.message ??
            "Não foi possível liberar o lote.",
        );
      }

      setReleasedBy("");
      setReleaseNotes("");
      setLocationName("");
      setLatitude("");
      setLongitude("");

      setMessageType("success");
      setMessage(
        "Lote liberado e evento registrado na linha do tempo.",
      );

      onReleased();
    } catch (requestError) {
      setMessageType("error");
      setMessage(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível liberar o lote.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (batchStatus !== "BLOCKED") {
    return (
      <section className="batch-release-card batch-release-card--normal">
        <span className="batch-release-card__symbol">
          ✓
        </span>

        <div>
          <p>CONTROLE DE LIBERAÇÃO</p>

          <h3>Lote em operação</h3>

          <span>
            O lote {batchCode} não possui uma
            liberação pendente.
          </span>
        </div>

        <strong>Operação normal</strong>
      </section>
    );
  }

  if (unresolvedIncidents > 0) {
    return (
      <section className="batch-release-card batch-release-card--locked">
        <span className="batch-release-card__symbol">
          !
        </span>

        <div>
          <p>LIBERAÇÃO INDISPONÍVEL</p>

          <h3>
            Tratamento de ocorrências pendente
          </h3>

          <span>
            Resolva todas as ocorrências do lote{" "}
            {batchCode} antes de solicitar a
            liberação.
          </span>
        </div>

        <strong>
          {unresolvedIncidents}{" "}
          {unresolvedIncidents === 1
            ? "pendência"
            : "pendências"}
        </strong>
      </section>
    );
  }

  return (
    <section className="batch-release-workspace">
      <div className="batch-release-workspace__heading">
        <div>
          <p>LIBERAÇÃO CONTROLADA</p>

          <h3>
            Autorizar retorno à operação
          </h3>

          <span>
            Todas as ocorrências do lote{" "}
            <strong>{batchCode}</strong> foram
            resolvidas. Registre a autorização
            final.
          </span>
        </div>

        <span>Aguardando autorização</span>
      </div>

      <form
        className="batch-release-form"
        onSubmit={handleRelease}
      >
        <div className="batch-release-form__fields">
          <label>
            Responsável pela liberação

            <input
              type="text"
              value={releasedBy}
              onChange={(event) =>
                setReleasedBy(
                  event.target.value,
                )
              }
              placeholder="Ex.: Equipe de Qualidade"
              maxLength={120}
              required
            />
          </label>

          <label>
            Local da liberação

            <input
              type="text"
              value={locationName}
              onChange={(event) =>
                setLocationName(
                  event.target.value,
                )
              }
              placeholder="Ex.: Centro de distribuição"
              maxLength={160}
            />
          </label>

          <label className="batch-release-form__notes">
            Justificativa e ações realizadas

            <textarea
              value={releaseNotes}
              onChange={(event) =>
                setReleaseNotes(
                  event.target.value,
                )
              }
              placeholder="Descreva a inspeção e as ações que permitiram liberar o lote"
              maxLength={500}
              rows={5}
              required
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Registrando liberação..."
              : "Autorizar liberação do lote"}
          </button>

          {message && (
            <p
              className={`feedback feedback--${messageType}`}
            >
              {message}
            </p>
          )}
        </div>

        <div className="batch-release-form__location">
          <div>
            <p>LOCALIZAÇÃO DO EVENTO</p>

            <span>
              Opcional: marque no mapa onde a
              liberação foi autorizada.
            </span>
          </div>

          <LocationPicker
            latitude={latitude}
            longitude={longitude}
            onSelect={(
              selectedLatitude,
              selectedLongitude,
            ) => {
              setLatitude(
                selectedLatitude,
              );

              setLongitude(
                selectedLongitude,
              );
            }}
          />
        </div>
      </form>
    </section>
  );
}

export default BatchReleaseCard;