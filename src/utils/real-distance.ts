/**
 * Utilidades para cálculo de distancias reales por carretera
 * Usa OpenRouteService API para calcular distancia y tiempo de viaje
 */

// API Key de OpenRouteService (gratis)
// Obtén tu API key gratuita en: https://openrouteservice.org/
const OPENROUTE_API_KEY = process.env.NEXT_PUBLIC_OPEN_ROUTE_DISTANCE;

export interface RealDistanceResult {
  distance: number; // en metros
  distanceText: string; // "2.5 km"
}

// Sistema de caché y gestión de requests
const cache = new Map<string, RealDistanceResult>();
const pendingRequests = new Map<string, Promise<RealDistanceResult | null>>();

// Configuración para limitar requests
const MAX_CONCURRENT_REQUESTS = 3;
let activeRequests = 0;
const requestQueue: Array<() => void> = [];

/**
 * Genera una clave única para el caché
 */
function getCacheKey(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): string {
  // Redondear coordenadas a 4 decimales (~11 metros de precisión)
  const fromLat = Math.round(from.lat * 10000) / 10000;
  const fromLng = Math.round(from.lng * 10000) / 10000;
  const toLat = Math.round(to.lat * 10000) / 10000;
  const toLng = Math.round(to.lng * 10000) / 10000;
  return `${fromLat},${fromLng}-${toLat},${toLng}`;
}

/**
 * Procesa la siguiente solicitud en la cola
 */
function processNextRequest() {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS || requestQueue.length === 0) {
    return;
  }

  const next = requestQueue.shift();
  if (next) {
    next();
  }
}

/**
 * Delay entre requests para no saturar la API (500ms)
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calcula la distancia real por carretera entre dos puntos usando OpenRouteService
 * Retorna null si no hay API key o si falla la petición
 */
export async function getRealDistance(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<RealDistanceResult | null> {
  // Si no hay API key, retornar null directamente
  if (!OPENROUTE_API_KEY) {
    return null;
  }

  const cacheKey = getCacheKey(from, to);

  // Verificar caché primero
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  // Si ya hay una request pendiente para estas coordenadas, esperar esa
  if (pendingRequests.has(cacheKey)) {
    return await pendingRequests.get(cacheKey)!;
  }

  // Crear nueva request con control de concurrencia
  const requestPromise = (async () => {
    // Esperar en la cola si hay demasiadas requests activas
    while (activeRequests >= MAX_CONCURRENT_REQUESTS) {
      await new Promise<void>((resolve) => {
        requestQueue.push(resolve);
      });
    }

    try {
      activeRequests++;

      // Pequeño delay para no saturar la API
      await delay(300);

      // Llamar a OpenRouteService API
      const url = new URL(
        "https://api.openrouteservice.org/v2/directions/driving-car"
      );
      url.searchParams.set("api_key", OPENROUTE_API_KEY);
      url.searchParams.set("start", `${from.lng},${from.lat}`);
      url.searchParams.set("end", `${to.lng},${to.lat}`);
      url.searchParams.set("preference", "fastest");
      url.searchParams.set("units", "m");

      const response = await fetch(url.toString());

      if (!response.ok) {
        console.error(
          `Error OpenRouteService ${response.status}: ${response.statusText}`
        );
        return null;
      }

      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        console.error("No se encontró ruta en OpenRouteService");
        return null;
      }

      const route = data.features[0];
      const distance = route.properties.summary.distance;
      const distanceKm = distance / 1000;

      // Formatear distancia
      const distanceText =
        distanceKm < 1
          ? `${Math.round(distance)} m`
          : `${distanceKm.toFixed(1)} km`;

      const result = {
        distance,
        distanceText,
      };

      // Guardar en caché
      cache.set(cacheKey, result);
      return result;
    } catch (err) {
      console.error("Error calculando distancia real:", err);
      return null;
    } finally {
      activeRequests--;
      processNextRequest();
    }
  })();

  // Guardar la promise pendiente para que otros puedan esperarla
  pendingRequests.set(cacheKey, requestPromise);

  try {
    const result = await requestPromise;
    return result;
  } finally {
    // Limpiar la request pendiente
    pendingRequests.delete(cacheKey);
  }
}
