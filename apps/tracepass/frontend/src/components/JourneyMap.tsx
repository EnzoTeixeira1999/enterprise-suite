import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
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
};

type MapViewportProps = {
  positions: LatLngTuple[];
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

function MapViewport({ positions }: MapViewportProps) {
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
  }, [map, positions]);

  return null;
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

function JourneyMap({ movements }: JourneyMapProps) {
  const mappedMovements = movements
    .filter(
      (
        movement,
      ): movement is JourneyMovement & {
        latitude: number;
        longitude: number;
      } =>
        movement.latitude !== null &&
        movement.longitude !== null &&
        Number.isFinite(movement.latitude) &&
        Number.isFinite(movement.longitude),
    )
    .sort(
      (first, second) =>
        new Date(first.occurredAt).getTime() -
        new Date(second.occurredAt).getTime(),
    );

  const positions: LatLngTuple[] = mappedMovements.map(
    (movement) => [movement.latitude, movement.longitude],
  );

  if (mappedMovements.length === 0) {
    return (
      <section className="journey-map-panel">
        <div className="journey-map-panel__heading">
          <div>
            <span>ROTA GEOGRÁFICA</span>
            <h3>Mapa da jornada</h3>
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
    <section className="journey-map-panel">
      <div className="journey-map-panel__heading">
        <div>
          <span>ROTA GEOGRÁFICA</span>
          <h3>Mapa da jornada</h3>
        </div>

        <strong>{mappedMovements.length} pontos</strong>
      </div>

      <div className="journey-map">
        <MapContainer
          center={positions[0]}
          zoom={13}
          scrollWheelZoom
          className="journey-map__container"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapViewport positions={positions} />

          {positions.length > 1 && (
            <Polyline
              positions={positions}
              pathOptions={{
                color: "#56ddff",
                weight: 4,
                opacity: 0.8,
                dashArray: "10 8",
              }}
            />
          )}

          {mappedMovements.map((movement, index) => {
            const position: LatLngTuple = [
              movement.latitude,
              movement.longitude,
            ];

            return (
              <CircleMarker
                key={movement.id}
                center={position}
                radius={10}
                pathOptions={{
                  color: "#071521",
                  fillColor: "#52f2bf",
                  fillOpacity: 1,
                  weight: 4,
                }}
              >
                <Tooltip
                  permanent
                  direction="top"
                  offset={[0, -8]}
                >
                  {index + 1}
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