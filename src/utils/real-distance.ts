const OPENROUTE_API_KEY = process.env.NEXT_PUBLIC_OPEN_ROUTE_DISTANCE;

export interface RealDistanceResult {
  distance: number;
  distanceText: string;
}

const CACHE_STORAGE_KEY = "distance_cache";
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

interface CachedDistanceEntry {
  result: RealDistanceResult;
  timestamp: number;
}

function loadCacheFromStorage(): Map<string, RealDistanceResult> {
  const cache = new Map<string, RealDistanceResult>();
  if (typeof window === "undefined") return cache;

  try {
    const stored = localStorage.getItem(CACHE_STORAGE_KEY);
    if (stored) {
      const entries: Record<string, CachedDistanceEntry> = JSON.parse(stored);
      const now = Date.now();
      for (const [key, entry] of Object.entries(entries)) {
        if (now - entry.timestamp < CACHE_MAX_AGE) {
          cache.set(key, entry.result);
        }
      }
    }
  } catch {
    return cache;
  }

  return cache;
}

function saveCacheToStorage(cache: Map<string, RealDistanceResult>) {
  if (typeof window === "undefined") return;

  try {
    const entries: Record<string, CachedDistanceEntry> = {};
    const now = Date.now();
    for (const [key, result] of cache.entries()) {
      entries[key] = { result, timestamp: now };
    }
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(entries));
  } catch {}
}

const cache = loadCacheFromStorage();
const pendingRequests = new Map<string, Promise<RealDistanceResult | null>>();

const MAX_CONCURRENT_REQUESTS = 3;
let activeRequests = 0;
const requestQueue: Array<() => void> = [];

function getCacheKey(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): string {
  const fromLat = Math.round(from.lat * 10000) / 10000;
  const fromLng = Math.round(from.lng * 10000) / 10000;
  const toLat = Math.round(to.lat * 10000) / 10000;
  const toLng = Math.round(to.lng * 10000) / 10000;
  return `${fromLat},${fromLng}-${toLat},${toLng}`;
}

function processNextRequest() {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS || requestQueue.length === 0) {
    return;
  }

  const next = requestQueue.shift();
  if (next) {
    next();
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getRealDistance(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<RealDistanceResult | null> {
  if (!OPENROUTE_API_KEY) {
    return null;
  }

  const cacheKey = getCacheKey(from, to);

  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey)!;
    return cached;
  }

  if (pendingRequests.has(cacheKey)) {
    return await pendingRequests.get(cacheKey)!;
  }

  const requestPromise = (async () => {
    while (activeRequests >= MAX_CONCURRENT_REQUESTS) {
      await new Promise<void>((resolve) => {
        requestQueue.push(resolve);
      });
    }

    try {
      activeRequests++;

      await delay(300);

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
        return null;
      }

      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        return null;
      }

      const route = data.features[0];
      const distance = route.properties.summary.distance;
      const distanceKm = distance / 1000;

      const distanceText =
        distanceKm < 1
          ? `${Math.round(distance)} m`
          : `${distanceKm.toFixed(1)} km`;

      const result = {
        distance,
        distanceText,
      };

      cache.set(cacheKey, result);
      saveCacheToStorage(cache);
      return result;
    } catch {
      return null;
    } finally {
      activeRequests--;
      processNextRequest();
    }
  })();

  pendingRequests.set(cacheKey, requestPromise);

  try {
    const result = await requestPromise;
    return result;
  } finally {
    pendingRequests.delete(cacheKey);
  }
}
