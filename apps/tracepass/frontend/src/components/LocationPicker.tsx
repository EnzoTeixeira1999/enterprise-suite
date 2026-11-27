import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import TraceMapBase from "./TraceMapBase";
import { getPosition } from "../services/mapPosition";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";

type OriginPoint = {
  latitude: number | null;
  longitude: number | null;
  title: string;
  locationName: string | null;
};

type LocationPickerProps = {
  latitude: string;
  longitude: string;
  origin?: OriginPoint | null;
  onSelect: (latitude: string, longitude: string) => void;
};

type MapClickHandlerProps = {
  onSelect: (latitude: string, longitude: string) => void;
};

type PickerViewportProps = {
  origin: LatLngTuple | null;
  selected: LatLngTuple | null;
};

const defaultCenter: LatLngTuple = [
  0,
  0,
];

function MapClickHandler({
  onSelect,
}: MapClickHandlerProps) {
  useMapEvents({
    click(event) {
      onSelect(
        event.latlng.lat.toFixed(6),
        event.latlng.lng.toFixed(6),
      );
    },
  });

  return null;
}

function PickerViewport({
  origin,
  selected,
}: PickerViewportProps) {
  const map = useMap();

  useEffect(() => {
    const points = [origin, selected].filter(
      (position): position is LatLngTuple =>
        position !== null,
    );

    if (points.length === 1) {
      map.setView(points[0], 13);
    }

    if (points.length > 1) {
      map.fitBounds(points, {
        padding: [45, 45],
        maxZoom: 14,
      });
    }
  }, [map, origin, selected]);

  return null;
}

function LocationPicker({
  latitude,
  longitude,
  origin = null,
  onSelect,
}: LocationPickerProps) {
  const originLatitude = origin?.latitude;
  const originLongitude = origin?.longitude;
  const originPosition = useMemo(
    () => getPosition(originLatitude, originLongitude),
    [originLatitude, originLongitude],
  );
  const selectedPosition = useMemo(
    () => getPosition(latitude, longitude),
    [latitude, longitude],
  );

  return (
    <div className="location-picker">
      <div className="location-picker__heading">
        <div>
          <strong>Local deste evento</strong>
          <span>
            Arraste para navegar e use + ou − para ajustar o zoom. Clique
            para marcar o local do evento. Pode escolher um ponto em outro país.
          </span>
        </div>

        {selectedPosition && (
          <small>Local escolhido</small>
        )}
      </div>

      <details className="location-picker__manual">
        <summary>Inserir coordenadas manualmente</summary>
        <p>Preencha os dois campos em graus decimais. Use o sinal − para sul e oeste.</p>
        <div className="location-picker__coordinates">
          <label>
            Latitude (−90 a 90)
            <input inputMode="decimal" value={latitude} placeholder="-23.9608"
              onChange={(event) => onSelect(event.target.value.replace(",", "."), longitude)} />
          </label>
          <label>
            Longitude (−180 a 180)
            <input inputMode="decimal" value={longitude} placeholder="-46.3336"
              onChange={(event) => onSelect(latitude, event.target.value.replace(",", "."))} />
          </label>
        </div>
        {(latitude || longitude) && !selectedPosition && (
          <p role="status">Informe uma latitude e uma longitude válidas.</p>
        )}
        {(latitude || longitude) && <button type="button" className="secondary-button"
          onClick={() => onSelect("", "")}>Limpar coordenadas</button>}
      </details>

      <div className="location-picker__map">
        <MapContainer
          center={
            selectedPosition ??
            originPosition ??
            defaultCenter
          }
          zoom={selectedPosition || originPosition ? 13 : 2}
          scrollWheelZoom={false}
          className="location-picker__container"
        >
          <TraceMapBase />

          <MapClickHandler onSelect={onSelect} />

          <PickerViewport
            origin={originPosition}
            selected={selectedPosition}
          />

          {originPosition && selectedPosition && (
            <Polyline
              positions={[
                originPosition,
                selectedPosition,
              ]}
              pathOptions={{
                color: "#e03e62",
                weight: 4,
                opacity: 0.85,
                dashArray: "9 7",
              }}
            />
          )}

          {originPosition && (
            <CircleMarker
              center={originPosition}
              radius={9}
              pathOptions={{
                color: "#061521",
                fillColor: "#52f2bf",
                fillOpacity: 1,
                weight: 4,
              }}
            >
              <Tooltip direction="top">
                Evento anterior:{" "}
                {origin?.locationName ?? origin?.title}
              </Tooltip>
            </CircleMarker>
          )}

          {selectedPosition && (
            <CircleMarker
              center={selectedPosition}
              radius={9}
              pathOptions={{
                color: "#061521",
                fillColor: "#ffcc66",
                fillOpacity: 1,
                weight: 4,
              }}
            >
              <Tooltip direction="top">
                Local do novo evento
              </Tooltip>
            </CircleMarker>
          )}
        </MapContainer>
      </div>

      <div className="location-picker__legend">
        {originPosition && (
          <span>
            <i className="location-picker__dot location-picker__dot--origin" />
            Último evento
          </span>
        )}

        {selectedPosition && (
          <span>
            <i className="location-picker__dot location-picker__dot--selected" />
            Novo evento
          </span>
        )}

        {!selectedPosition && (
          <p>Clique no mapa para selecionar o próximo ponto.</p>
        )}
      </div>
    </div>
  );
}

export default LocationPicker;
