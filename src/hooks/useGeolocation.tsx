import { useCallback, useState } from "react";

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export interface UseGeolocationReturn {
  position: GeolocationPosition | null;
  error: GeolocationError | null;
  loading: boolean;
  isPermissionEnabled: boolean;
  getCurrentPosition: () => Promise<GeolocationPosition | null>;
  watchPosition: () => number | null;
  clearWatch: (watchId: number) => void;
}

// Constantes exportadas para uso externo
const LOCATION_CACHE_KEY = "user_location_cache";
const LOCATION_PERMISSION_KEY = "location_permission_enabled";
const LOCATION_CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

/**
 * Verificar si el usuario tiene el permiso de ubicación activado
 */
export function isLocationPermissionEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const savedState = localStorage.getItem(LOCATION_PERMISSION_KEY);
  return savedState !== "false";
}

/**
 * Establecer el estado del permiso de ubicación
 */
export function setLocationPermission(enabled: boolean): void {
  if (typeof window === "undefined") return;
  if (enabled) {
    localStorage.removeItem(LOCATION_PERMISSION_KEY);
  } else {
    localStorage.setItem(LOCATION_PERMISSION_KEY, "false");
    localStorage.removeItem(LOCATION_CACHE_KEY);
  }
}

/**
 * Marcar el permiso como activado (guardar explícitamente)
 */
export function markLocationPermissionEnabled(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCATION_PERMISSION_KEY, "true");
}

interface CachedLocation {
  position: GeolocationPosition;
  timestamp: number;
}

/**
 * Obtener ubicación desde caché si está disponible y válida
 */
function getCachedLocation(): GeolocationPosition | null {
  if (typeof window === "undefined") return null;
  
  // Si el permiso está desactivado, no retornar ubicación
  if (!isLocationPermissionEnabled()) return null;

  try {
    const cached = localStorage.getItem(LOCATION_CACHE_KEY);
    if (cached) {
      const data: CachedLocation = JSON.parse(cached);
      const now = Date.now();
      const age = now - data.timestamp;

      if (age < LOCATION_CACHE_DURATION) {
        // Ubicación válida en caché
        return data.position;
      } else {
        // Caché expirado, eliminar
        localStorage.removeItem(LOCATION_CACHE_KEY);
      }
    }
  } catch (error) {
    console.warn("Error leyendo caché de ubicación:", error);
  }

  return null;
}

/**
 * Guardar ubicación en caché
 */
function saveLocationToCache(position: GeolocationPosition): void {
  if (typeof window === "undefined") return;

  try {
    const cached: CachedLocation = {
      position,
      timestamp: Date.now(),
    };
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    console.warn("Error guardando ubicación en caché:", error);
  }
}

export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<GeolocationPosition | null>(() => {
    // Intentar cargar desde caché al inicializar
    return getCachedLocation();
  });
  const [error, setError] = useState<GeolocationError | null>(null);
  const [loading, setLoading] = useState(false);

  const getCurrentPosition = useCallback(async (): Promise<GeolocationPosition | null> => {
    // Verificar si el usuario desactivó el permiso de ubicación
    if (!isLocationPermissionEnabled()) {
      setPosition(null);
      setError({
        code: 1,
        message: "Ubicación desactivada por el usuario",
      });
      return null;
    }
    
    // Primero verificar si hay caché válido
    const cached = getCachedLocation();
    if (cached) {
      setPosition(cached);
      return cached;
    }

    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: "Geolocalización no es soportada por este navegador",
      });
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
            });
          },
          (error) => {
            reject({
              code: error.code,
              message: error.message,
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: LOCATION_CACHE_DURATION,
          }
        );
      });

      // Guardar en caché local
      saveLocationToCache(pos);
      setPosition(pos);
      return pos;
    } catch (err) {
      const geoError = err as GeolocationError;
      setError(geoError);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const watchPosition = useCallback((): number | null => {
    // Verificar si el usuario desactivó el permiso de ubicación
    if (!isLocationPermissionEnabled()) {
      setError({
        code: 1,
        message: "Ubicación desactivada por el usuario",
      });
      return null;
    }
    
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: "Geolocalización no es soportada por este navegador",
      });
      return null;
    }

    setLoading(true);
    setError(null);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
        setLoading(false);
      },
      (error) => {
        setError({
          code: error.code,
          message: error.message,
        });
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );

    return watchId;
  }, []);

  const clearWatch = useCallback((watchId: number): void => {
    navigator.geolocation.clearWatch(watchId);
  }, []);

  return {
    position,
    error,
    loading,
    isPermissionEnabled: isLocationPermissionEnabled(),
    getCurrentPosition,
    watchPosition,
    clearWatch,
  };
}
