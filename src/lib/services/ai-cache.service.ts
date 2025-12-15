/**
 * Sistema de caché para recomendaciones de IA
 * Evita llamadas innecesarias a Gemini y reduce costos
 */

interface CacheEntry {
  recommendations: any;
  timestamp: number;
  userHash: string; // Hash de preferencias del usuario
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas
const cache = new Map<string, CacheEntry>();

/**
 * Generar hash de las preferencias del usuario
 */
function generateUserHash(
  userId: string,
  interests: string[],
  banks: string[]
): string {
  const data = `${userId}-${interests.sort().join(',')}-${banks.sort().join(',')}`;
  return btoa(data); // Simple hash base64
}

/**
 * Verificar si hay recomendación en caché válida
 */
export function getCachedRecommendation(
  userId: string,
  interests: string[],
  banks: string[]
): any | null {
  const hash = generateUserHash(userId, interests, banks);
  const cached = cache.get(userId);

  if (!cached) {
    return null;
  }

  const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
  const hasChanged = cached.userHash !== hash;

  if (isExpired) {
    cache.delete(userId);
    return null;
  }

  if (hasChanged) {
    cache.delete(userId);
    return null;
  }

  return cached.recommendations;
}

/**
 * Guardar recomendación en caché
 */
export function setCachedRecommendation(
  userId: string,
  interests: string[],
  banks: string[],
  recommendations: any
): void {
  const hash = generateUserHash(userId, interests, banks);
  cache.set(userId, {
    recommendations,
    timestamp: Date.now(),
    userHash: hash,
  });
}

/**
 * Limpiar caché de un usuario
 */
export function clearUserCache(userId: string): void {
  cache.delete(userId);
}

/**
 * Limpiar toda la caché
 */
export function clearAllCache(): void {
  cache.clear();
}
