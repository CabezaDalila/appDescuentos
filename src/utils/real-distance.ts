/**
 * Utilidades para cálculo de distancias reales por carretera
 * Usa el proxy de Next.js (/api/distance) para evitar problemas de CORS
 */

// API Key de OpenRouteService (gratis)
// Obtén tu API key gratuita en: https://openrouteservice.org/
const OPENROUTE_API_KEY = process.env.NEXT_PUBLIC_OPEN_ROUTE_DISTANCE;

/**
 * Calcula la distancia Haversine entre dos puntos (línea recta)
 */
function calculateHaversineDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = toRadians(point2.lat - point1.lat);
  const dLng = toRadians(point2.lng - point1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.lat)) *
      Math.cos(toRadians(point2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export interface RealDistanceResult {
  distance: number; // en metros
  duration: number; // en segundos
  distanceText: string; // "2.5 km"
  durationText: string; // "15 min"
}

/**
 * Calcula la distancia real por carretera entre dos puntos usando OpenRouteService
 */
export async function getRealDistance(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<RealDistanceResult | null> {
  try {
    // Calcular distancia Haversine para comparar
    const haversineDistance = calculateHaversineDistance(from, to);

    console.log("🗺️ Calculando distancia real:", {
      desde: { lat: from.lat, lng: from.lng },
      hasta: { lat: to.lat, lng: to.lng },
      haversine: `${haversineDistance.toFixed(2)} km (línea recta)`,
    });

    // Usar proxy de Next.js para evitar CORS
    const proxyUrl = `/api/distance?start=${from.lng},${from.lat}&end=${to.lng},${to.lat}`;
    console.log("🌐 Usando proxy:", proxyUrl);

    const response = await fetch(proxyUrl);

    if (!response.ok) {
      console.error(
        `Error OpenRouteService ${response.status}: ${response.statusText}`
      );
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      console.error("No se encontró ruta en OpenRouteService");
      return null;
    }

    const route = data.features[0];
    const distance = route.properties.summary.distance; // en metros
    const duration = route.properties.summary.duration; // en segundos

    console.log("📊 Resultado OpenRouteService:", {
      haversine: `${haversineDistance.toFixed(2)} km (línea recta)`,
      carretera: `${(distance / 1000).toFixed(2)} km (por carretera)`,
      diferencia: `${(distance / 1000 - haversineDistance).toFixed(2)} km más`,
      duracion: `${Math.round(duration / 60)} min`,
      instrucciones: route.properties.segments?.[0]?.steps?.length || 0,
    });

    // Convertir metros a kilómetros
    const distanceKm = distance / 1000;

    // Formatear distancia
    const distanceText =
      distanceKm < 1
        ? `${Math.round(distance)} m`
        : `${distanceKm.toFixed(1)} km`;

    // Formatear duración
    const durationMinutes = Math.round(duration / 60);
    const durationText =
      durationMinutes < 60
        ? `${durationMinutes} min`
        : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}min`;

    return {
      distance,
      duration,
      distanceText,
      durationText,
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Error desconocido";
    console.error("Error calculando distancia real:", errorMessage);

    // Fallback a Haversine si falla la API
    console.log("🔄 Usando fallback Haversine...");
    const haversineDistance = calculateHaversineDistance(from, to);
    const distanceText =
      haversineDistance < 1
        ? `${Math.round(haversineDistance * 1000)} m`
        : `${haversineDistance.toFixed(1)} km`;

    return {
      distance: haversineDistance * 1000, // convertir a metros
      duration: 0, // no disponible con Haversine
      distanceText,
      durationText: "N/A",
    };
  }
}
