import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import TraceMapBase from "./TraceMapBase";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";

type JourneyMovement = {
  id: string;
  movementType: string;
  title: string;
  description: string | null;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  responsibleName: string | null;
  occurredAt: string;
};

type JourneyMapProps = {
  movements: JourneyMovement[];
  selectedMovementId?: string;
  onSelectMovement?: (id: string) => void;
  compact?: boolean;
};

type MapViewportProps = {
  positions: LatLngTuple[];
  activePosition?: LatLngTuple;
  fitRevision: number;
};

const movementNames: Record<string, string> = {
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

function MapViewport({ positions, activePosition, fitRevision }: MapViewportProps) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 1) {
      map.setView(positions[0], 13);
      return;
    }

    if (positions.length > 1) {
      map.fitBounds(positions, {
        padding: [50, 50],
        maxZoom: 13,
      });
    }
  }, [map, positions, fitRevision]);

  useEffect(() => {
    if (activePosition) map.panTo(activePosition, { animate: false });
  }, [map, activePosition]);

  return null;
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function JourneyMap({ movements, selectedMovementId, onSelectMovement, compact = false }: JourneyMapProps) {
  const [fitRevision, setFitRevision] = useState(0);
  const mappedMovements = useMemo(() => movements
    .filter(
      (
        movement,
      ): movement is JourneyMovement & {
        latitude: number;
        longitude: number;
      } =>
        movement.latitude !== null &&
        movement.longitude !== null &&
        Number.isFinite(movement.latitude) && Math.abs(movement.latitude) <= 90 &&
        Number.isFinite(movement.longitude) && Math.abs(movement.longitude) <= 180,
    )
    .sort(
      (first, second) =>
        new Date(first.occurredAt).getTime() -
        new Date(second.occurredAt).getTime(),
    ), [movements]);

  const positions = useMemo<LatLngTuple[]>(() => mappedMovements.map(
    (movement) => [movement.latitude, movement.longitude],
  ), [mappedMovements]);

  const selectedIndex = mappedMovements.findIndex((movement) => movement.id === selectedMovementId);
  const selectedMovement = mappedMovements[selectedIndex];

  if (mappedMovements.length === 0) {
    return (
      <section className="journey-map-panel">
        <div className="journey-map-panel__heading">
          <div>
            <span>LOCALIZAÇÕES DO LOTE</span>
            <h3>Trajeto registrado</h3>
          </div>
        </div>

        <div className="journey-map-empty">
          <strong>Nenhuma localização registrada</strong>
          <p>
            Adicione latitude e longitude nas movimentações para
            visualizar a rota do lote.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={compact ? "journey-map-panel journey-map-panel--compact" : "journey-map-panel"}>
      <div className="journey-map-panel__heading">
        <div>
          {!compact && <span>LOCALIZAÇÕES DO LOTE</span>}
          <h3>Trajeto registrado</h3>
        </div>

        {!compact && <strong>{mappedMovements.length} pontos</strong>}
      </div>

      {!compact && <p className="journey-map-caption">Os pontos indicam locais registrados. A linha pontilhada mostra a ordem dos eventos.</p>}
      {onSelectMovement && (
        <div className="journey-map-toolbar">
          <label>Evento no mapa
            <select value={selectedMovementId ?? ""} onChange={(event) => {
              const id = event.target.value;
              onSelectMovement(id);
              if (!id) setFitRevision((current) => current + 1);
            }}>
              <option value="">Todos os pontos</option>
              {mappedMovements.map((movement) => <option key={movement.id} value={movement.id}>{movement.title}</option>)}
            </select>
          </label>
          <button className="route-select" type="button" onClick={() => {
            onSelectMovement("");
            setFitRevision((current) => current + 1);
          }}>Enquadrar rota</button>
        </div>
      )}
      {selectedMovement && (
        <div className="journey-map-selection" aria-live="polite">
          <strong>{selectedMovement.title}</strong>
          <span>{selectedMovement.locationName ?? "Local sem nome"} · {formatDateTime(selectedMovement.occurredAt)}</span>
        </div>
      )}
      <div className="journey-map">
        <MapContainer
          center={positions[0]}
          zoom={13}
          scrollWheelZoom={false}
          zoomControl={!compact}
          preferCanvas
          dragging={!compact}
          doubleClickZoom={!compact}
          touchZoom={!compact}
          className="journey-map__container"
        >
          <TraceMapBase />
          <MapViewport positions={positions} activePosition={positions[selectedIndex]} fitRevision={fitRevision} />

          {positions.length > 1 && (
            <>
            <Polyline positions={positions} interactive={false}
              pathOptions={{ color: "#171419", weight: 7, opacity: .8 }} />
            <Polyline
              positions={positions}
              pathOptions={{
                color: "#e03e62",
                weight: 4,
                opacity: 0.8,
                dashArray: "9 7",
              }}
            />
            </>
          )}

          {mappedMovements.map((movement) => {
            const position: LatLngTuple = [
              movement.latitude,
              movement.longitude,
            ];

            return (
              <CircleMarker
                key={movement.id}
                center={position}
                eventHandlers={onSelectMovement ? { click: () => onSelectMovement(movement.id) } : undefined}
                radius={selectedMovementId === movement.id ? 14 : 8}
                pathOptions={{
                  color: "#171419",
                  fillColor: selectedMovementId === movement.id ? "#f46483" : "#b92148",
                  fillOpacity: 1,
                  weight: 4,
                }}
              >
                <Tooltip
                  permanent
                  direction="top"
                  offset={[0, -8]}
                  className={selectedMovementId === movement.id ? "journey-point-label journey-point-label--selected" : "journey-point-label"}
                >
                  {movements.findIndex((entry) => entry.id === movement.id) + 1}
                </Tooltip>

                <Popup>
                  <div className="journey-map-popup">
                    <span>
                      {movementNames[movement.movementType] ??
                        movement.movementType}
                    </span>

                    <strong>{movement.title}</strong>

                    {movement.locationName && (
                      <p>{movement.locationName}</p>
                    )}

                    <small>
                      {formatDateTime(movement.occurredAt)}
                    </small>

                    {movement.responsibleName && (
                      <small>
                        Responsável: {movement.responsibleName}
                      </small>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </section>
  );
}

export default JourneyMap;
