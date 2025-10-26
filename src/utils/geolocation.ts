/**
 * Utilidades básicas para geolocalización
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 * @param point1 Primer punto (latitud, longitud)
 * @param point2 Segundo punto (latitud, longitud)
 * @returns Distancia en kilómetros
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) *
      Math.cos(toRadians(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convierte grados a radianes
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Formatea la distancia para mostrar en la UI
 * @param distance Distancia en kilómetros
 * @returns String formateado (ej: "2.5 km", "500 m")
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
}
