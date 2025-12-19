/**
 * Sistema de caché para datos de la aplicación
 * Almacena descuentos, membresías y otros datos frecuentemente usados
 * Incluye persistencia en localStorage para datos que deben sobrevivir al cierre de la app
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Tiempo de vida en milisegundos
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos por defecto
const STORAGE_PREFIX = "app_cache_";

/**
 * Keys de caché estáticos
 */
export const CACHE_KEYS = {
  DISCOUNTS_ALL: "discounts:all",
  DISCOUNTS_HOME: "discounts:home",
  DISCOUNTS_PERSONALIZED: "discounts:personalized",
  MEMBERSHIPS_ALL: "memberships:all",
  MEMBERSHIPS_ACTIVE: "memberships:active",
  MEMBERSHIPS_INACTIVE: "memberships:inactive",
  USER_PROFILE: "user:profile",
  CATEGORIES: "categories:all",
  NOTIFICATIONS: "notifications:all",
} as const;

/**
 * TTL personalizados por tipo de dato
 */
export const CACHE_TTL = {
  DISCOUNTS: 10 * 60 * 1000, // 10 minutos
  MEMBERSHIPS: 5 * 60 * 1000, // 5 minutos
  USER_PROFILE: 15 * 60 * 1000, // 15 minutos
  CATEGORIES: 60 * 60 * 1000, // 1 hora
  NOTIFICATIONS: 2 * 60 * 1000, // 2 minutos
} as const;

// Datos que deben persistir entre sesiones
const PERSISTENT_KEYS = new Set([
  CACHE_KEYS.DISCOUNTS_HOME,
  CACHE_KEYS.MEMBERSHIPS_ACTIVE,
  CACHE_KEYS.MEMBERSHIPS_INACTIVE,
]);

class Cache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private memoryCache: Map<string, unknown> = new Map();

  constructor() {
    // Cargar datos persistentes al inicio
    if (typeof window !== "undefined") {
      this.loadPersistentData();
    }
  }

  /**
   * Carga datos persistentes desde localStorage al iniciar
   */
  private loadPersistentData(): void {
    try {
      for (const key of PERSISTENT_KEYS) {
        const stored = localStorage.getItem(STORAGE_PREFIX + key);
        if (stored) {
          const entry: CacheEntry<unknown> = JSON.parse(stored);

          // Verificar expiración
          const now = Date.now();
          const age = now - entry.timestamp;

          if (age < entry.ttl) {
            // Datos válidos, cargar en memoria
            this.cache.set(key, entry);
            this.memoryCache.set(key, entry.data);
          } else {
            // Datos expirados, eliminar
            localStorage.removeItem(STORAGE_PREFIX + key);
          }
        }
      }
    } catch (error) {
      console.error("Error cargando datos persistentes:", error);
      this.clearPersistentData();
    }
  }

  /**
   * Guarda datos persistentes en localStorage
   */
  private savePersistentData(key: string, entry: CacheEntry<unknown>): void {
    if (!PERSISTENT_KEYS.has(key as any)) return;

    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
    } catch (error) {
      // Si no hay espacio, limpiar datos antiguos
      this.cleanupOldPersistentData();
      try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
      } catch (retryError) {}
    }
  }

  /**
   * Limpia datos antiguos de localStorage para hacer espacio
   */
  private cleanupOldPersistentData(): void {
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();

      for (const key of keys) {
        if (key.startsWith(STORAGE_PREFIX)) {
          try {
            const entry: CacheEntry<unknown> = JSON.parse(
              localStorage.getItem(key) || ""
            );
            if (now - entry.timestamp > entry.ttl) {
              localStorage.removeItem(key);
            }
          } catch (e) {
            localStorage.removeItem(key); // Limpiar si está corrupto
          }
        }
      }
    } catch (error) {}
  }

  /**
   * Limpia todos los datos persistentes
   */
  private clearPersistentData(): void {
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {}
  }

  /**
   * Guarda datos en caché
   */
  set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
    const entry: CacheEntry<unknown> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    this.cache.set(key, entry);
    this.memoryCache.set(key, data);

    // Guardar en localStorage si es persistente
    this.savePersistentData(key, entry);
  }

  /**
   * Obtiene datos de caché si no han expirado
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      // Cache expirado, eliminar
      this.cache.delete(key);
      this.memoryCache.delete(key);
      // También eliminar de localStorage si está persistido
      if (PERSISTENT_KEYS.has(key as any)) {
        localStorage.removeItem(STORAGE_PREFIX + key);
      }
      return null;
    }

    return entry.data as T;
  }

  /**
   * Obtiene de memoria solo (más rápido, sin verificar TTL)
   */
  getFast<T>(key: string): T | null {
    return (this.memoryCache.get(key) as T) || null;
  }

  /**
   * Limpia la caché completa
   */
  clear(): void {
    this.cache.clear();
    this.memoryCache.clear();
    this.clearPersistentData();
  }

  /**
   * Elimina una entrada específica
   */
  delete(key: string): void {
    this.cache.delete(key);
    this.memoryCache.delete(key);
    if (PERSISTENT_KEYS.has(key as any)) {
      localStorage.removeItem(STORAGE_PREFIX + key);
    }
  }

  /**
   * Verifica si existe un dato en caché (sin verificar expiración)
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Limpia entradas expiradas
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        this.memoryCache.delete(key);
        if (PERSISTENT_KEYS.has(key as any)) {
          localStorage.removeItem(STORAGE_PREFIX + key);
        }
      }
    }
  }
}

// Exportar instancia singleton
export const cache = new Cache();

// Limpiar caché expirado cada minuto
if (typeof window !== "undefined") {
  setInterval(() => {
    cache.cleanup();
  }, 60000);
}
