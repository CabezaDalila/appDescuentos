/**
 * Rate limiter para controlar llamadas a Gemini API
 * Previene exceso de requests y controla costos
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Límites configurables
const LIMITS = {
  perMinute: 10,      // Máximo 10 requests por minuto
  perHour: 50,        // Máximo 50 requests por hora
  perDay: 200,        // Máximo 200 requests por día
};

const rateLimits = {
  minute: new Map<string, RateLimitEntry>(),
  hour: new Map<string, RateLimitEntry>(),
  day: new Map<string, RateLimitEntry>(),
};

/**
 * Verificar si se puede hacer una request
 */
export function canMakeRequest(userId: string): {
  allowed: boolean;
  reason?: string;
} {
  const now = Date.now();

  // Verificar límite por minuto
  const minuteKey = `${userId}-${Math.floor(now / 60000)}`;
  const minuteLimit = rateLimits.minute.get(minuteKey);
  if (minuteLimit && minuteLimit.count >= LIMITS.perMinute) {
    return {
      allowed: false,
      reason: `Límite por minuto alcanzado (${LIMITS.perMinute} requests/min)`,
    };
  }

  // Verificar límite por hora
  const hourKey = `${userId}-${Math.floor(now / 3600000)}`;
  const hourLimit = rateLimits.hour.get(hourKey);
  if (hourLimit && hourLimit.count >= LIMITS.perHour) {
    return {
      allowed: false,
      reason: `Límite por hora alcanzado (${LIMITS.perHour} requests/hora)`,
    };
  }

  // Verificar límite por día
  const dayKey = `${userId}-${Math.floor(now / 86400000)}`;
  const dayLimit = rateLimits.day.get(dayKey);
  if (dayLimit && dayLimit.count >= LIMITS.perDay) {
    return {
      allowed: false,
      reason: `Límite diario alcanzado (${LIMITS.perDay} requests/día)`,
    };
  }

  return { allowed: true };
}

/**
 * Registrar una request realizada
 */
export function recordRequest(userId: string): void {
  const now = Date.now();

  // Registrar en límite por minuto
  const minuteKey = `${userId}-${Math.floor(now / 60000)}`;
  const minuteLimit = rateLimits.minute.get(minuteKey) || { count: 0, resetTime: now + 60000 };
  minuteLimit.count++;
  rateLimits.minute.set(minuteKey, minuteLimit);

  // Registrar en límite por hora
  const hourKey = `${userId}-${Math.floor(now / 3600000)}`;
  const hourLimit = rateLimits.hour.get(hourKey) || { count: 0, resetTime: now + 3600000 };
  hourLimit.count++;
  rateLimits.hour.set(hourKey, hourLimit);

  // Registrar en límite por día
  const dayKey = `${userId}-${Math.floor(now / 86400000)}`;
  const dayLimit = rateLimits.day.get(dayKey) || { count: 0, resetTime: now + 86400000 };
  dayLimit.count++;
  rateLimits.day.set(dayKey, dayLimit);

  // Limpiar entradas expiradas
  cleanupExpiredEntries();
}

/**
 * Limpiar entradas expiradas
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();

  // Limpiar minutos
  for (const [key, entry] of rateLimits.minute.entries()) {
    if (now > entry.resetTime) {
      rateLimits.minute.delete(key);
    }
  }

  // Limpiar horas
  for (const [key, entry] of rateLimits.hour.entries()) {
    if (now > entry.resetTime) {
      rateLimits.hour.delete(key);
    }
  }

  // Limpiar días
  for (const [key, entry] of rateLimits.day.entries()) {
    if (now > entry.resetTime) {
      rateLimits.day.delete(key);
    }
  }
}

/**
 * Obtener estadísticas de uso
 */
export function getUsageStats(userId: string): {
  minute: number;
  hour: number;
  day: number;
} {
  const now = Date.now();
  const minuteKey = `${userId}-${Math.floor(now / 60000)}`;
  const hourKey = `${userId}-${Math.floor(now / 3600000)}`;
  const dayKey = `${userId}-${Math.floor(now / 86400000)}`;

  return {
    minute: rateLimits.minute.get(minuteKey)?.count || 0,
    hour: rateLimits.hour.get(hourKey)?.count || 0,
    day: rateLimits.day.get(dayKey)?.count || 0,
  };
}
