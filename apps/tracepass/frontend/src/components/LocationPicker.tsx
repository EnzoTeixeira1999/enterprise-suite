import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
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
  -27.59487,
  -48.54822,
];

function getPosition(
  latitude: string | number | null | undefined,
  longitude: string | number | null | undefined,
): LatLngTuple | null {
  if (
    latitude === null ||
    latitude === undefined ||
    latitude === "" ||
    longitude === null ||
    longitude === undefined ||
    longitude === ""
  ) {
    return null;
  }

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  if (
    !Number.isFinite(parsedLatitude) ||
    !Number.isFinite(parsedLongitude) ||
    parsedLatitude < -90 ||
    parsedLatitude > 90 ||
    parsedLongitude < -180 ||
    parsedLongitude > 180
  ) {
    return null;
  }

  return [parsedLatitude, parsedLongitude];
}

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
  const originPosition = getPosition(
    origin?.latitude,
    origin?.longitude,
  );

  const selectedPosition = getPosition(
    latitude,
    longitude,
  );

  return (
    <div className="location-picker">
      <div className="location-picker__heading">
        <div>
          <strong>Local deste evento</strong>
          <span>
            O ponto verde é o evento anterior. Clique no mapa
            para marcar onde o novo evento aconteceu.
          </span>
        </div>

        {selectedPosition && (
          <small>Local escolhido</small>
        )}
      </div>

      <div className="location-picker__map">
        <MapContainer
          center={
            selectedPosition ??
            originPosition ??
            defaultCenter
          }
          zoom={13}
          scrollWheelZoom
          className="location-picker__container"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

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
                color: "#56ddff",
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