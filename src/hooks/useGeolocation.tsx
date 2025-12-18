import { useState } from "react";

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
  getCurrentPosition: () => Promise<GeolocationPosition | null>;
  watchPosition: () => number | null;
  clearWatch: (watchId: number) => void;
}

const LOCATION_CACHE_KEY = "user_location_cache";
const LOCATION_CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

interface CachedLocation {
  position: GeolocationPosition;
  timestamp: number;
}

/**
 * Obtener ubicación desde caché si está disponible y válida
 */
function getCachedLocation(): GeolocationPosition | null {
  if (typeof window === "undefined") return null;

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

  const getCurrentPosition = async (): Promise<GeolocationPosition | null> => {
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
            maximumAge: LOCATION_CACHE_DURATION, // Usar caché del navegador si está disponible
          }
        );
      });

      // Guardar en caché local
      saveLocationToCache(pos);
      setPosition(pos);
      return pos;
    } catch (err) {
      const error = err as GeolocationError;
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const watchPosition = (): number | null => {
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
        maximumAge: 300000, // 5 minutos
      }
    );

    return watchId;
  };

  const clearWatch = (watchId: number): void => {
    navigator.geolocation.clearWatch(watchId);
  };

  return {
    position,
    error,
    loading,
    getCurrentPosition,
    watchPosition,
    clearWatch,
  };
}
