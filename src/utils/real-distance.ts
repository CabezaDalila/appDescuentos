/**
 * Utilidades para cálculo de distancias reales por carretera
 * Usa el proxy de Next.js (/api/distance) para evitar problemas de CORS
 */

// API Key de OpenRouteService (gratis)
// Obtén tu API key gratuita en: https://openrouteservice.org/
const OPENROUTE_API_KEY = process.env.NEXT_PUBLIC_OPEN_ROUTE_DISTANCE;

export interface RealDistanceResult {
  distance: number; // en metros
  duration: number; // en segundos
  distanceText: string; // "2.5 km"
  durationText: string; // "15 min"
}

// Sistema de caché y gestión de requests
const cache = new Map<string, RealDistanceResult>();
const pendingRequests = new Map<string, Promise<RealDistanceResult>>();

// Configuración para limitar requests
const MAX_CONCURRENT_REQUESTS = 3;
let activeRequests = 0;
const requestQueue: Array<() => void> = [];

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

/**
 * Retorna resultado usando distancia Haversine (línea recta)
 */
function getHaversineResult(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): RealDistanceResult {
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
 * CON caché y limitación de requests concurrentes
 */
export async function getRealDistance(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<RealDistanceResult | null> {
  const cacheKey = getCacheKey(from, to);

  // 1. Verificar caché primero
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  // 2. Si ya hay una request pendiente para estas coordenadas, esperar esa
  if (pendingRequests.has(cacheKey)) {
    // No loguear - esto es esperado cuando múltiples componentes piden la misma distancia
    return await pendingRequests.get(cacheKey)!;
  }

  // 3. Si no hay API key, usar Haversine directamente
  if (!OPENROUTE_API_KEY) {
    console.log("⚠️ No hay API key configurada, usando Haversine");
    const result = getHaversineResult(from, to);
    cache.set(cacheKey, result);
    return result;
  }

  // 4. Crear nueva request con control de concurrencia
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

      // Calcular distancia Haversine para comparar
      const haversineDistance = calculateHaversineDistance(from, to);

      // Llamar directamente a OpenRouteService API
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
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        console.error("No se encontró ruta en OpenRouteService");
        const fallbackResult = getHaversineResult(from, to);
        cache.set(cacheKey, fallbackResult);
        return fallbackResult;
      }

      const route = data.features[0];
      const distance = route.properties.summary.distance; // en metros - DISTANCIA POR CARRETERA
      const duration = route.properties.summary.duration; // en segundos

      const distanceKm = distance / 1000;
      const durationMin = Math.round(duration / 60);

      console.log(
        `✅ Distancia: ${distanceKm.toFixed(
          1
        )} km | Duración: ${durationMin} min`
      );

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

      const result = {
        distance,
        duration,
        distanceText,
        durationText,
      };

      // Guardar en caché
      cache.set(cacheKey, result);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      console.error("Error calculando distancia real:", errorMessage);

      // Fallback a Haversine si falla la API

      const fallbackResult = getHaversineResult(from, to);
      cache.set(cacheKey, fallbackResult);
      return fallbackResult;
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
