import { useEffect, useState } from "react";
import { GeoJSON, Pane, TileLayer } from "react-leaflet";
import type { FeatureCollection } from "geojson";
import world from "../assets/world-countries.json";
import boundaries from "../assets/grande-florianopolis.json";
import roadsUrl from "../assets/grande-florianopolis-roads.json?url";

const customTileUrl = import.meta.env.VITE_MAP_TILE_URL?.trim();
const customAttribution = import.meta.env.VITE_MAP_TILE_ATTRIBUTION?.trim();
const tileProvider = customTileUrl && customAttribution
  ? { url: customTileUrl, attribution: customAttribution }
  : {
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    };

export default function TraceMapBase() {
  const [tilesFailed, setTilesFailed] = useState(false);
  const [roads, setRoads] = useState<FeatureCollection>();
  const useTiles = window.location.protocol !== "file:" && !tilesFailed;

  useEffect(() => {
    if (useTiles) return;
    const controller = new AbortController();
    fetch(roadsUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Malha viária indisponível");
        return response.json() as Promise<FeatureCollection>;
      })
      .then((data) => { if (!controller.signal.aborted) setRoads(data); })
      .catch(() => {
        // Os limites municipais e os pontos continuam disponíveis.
      });
    return () => controller.abort();
  }, [useTiles]);

  if (useTiles) {
    return <TileLayer url={tileProvider.url} attribution={tileProvider.attribution} maxNativeZoom={19} maxZoom={19}
      eventHandlers={{ tileerror: () => setTilesFailed(true) }} />;
  }

  return (
    <Pane name="tracepass-regional-base" style={{ zIndex: 350, pointerEvents: "none" }}>
      <GeoJSON data={world as FeatureCollection} interactive={false}
        attribution='<a href="https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/">Natural Earth</a>'
        style={{ color: "#756b78", weight: 1, fillColor: "#2e2933", fillOpacity: 0.9 }} />
      <GeoJSON data={boundaries as FeatureCollection} interactive={false}
        attribution="Grande Florianópolis · IBGE"
        style={{ color: "#68616c", weight: 1, fillColor: "#302b35", fillOpacity: 1 }} />
      {roads && <GeoJSON data={roads} interactive={false}
        attribution={'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}
        style={(feature) => {
          const mainRoad = ["motorway", "trunk", "primary"].includes(feature?.properties?.highway);
          return { color: mainRoad ? "#978d98" : "#68606b", weight: mainRoad ? 1.5 : 1, opacity: .8 };
        }} />}
    </Pane>
  );
}
