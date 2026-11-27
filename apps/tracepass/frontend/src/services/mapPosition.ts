import type { LatLngTuple } from "leaflet";

export function getPosition(
  latitude: string | number | null | undefined,
  longitude: string | number | null | undefined,
): LatLngTuple | null {
  if (
    latitude === null ||
    latitude === undefined ||
    String(latitude).trim() === "" ||
    longitude === null ||
    longitude === undefined ||
    String(longitude).trim() === ""
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
