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
  getCurrentPosition: () => Promise<void>;
  watchPosition: () => number | null;
  clearWatch: (watchId: number) => void;
}

export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [loading, setLoading] = useState(false);

  const getCurrentPosition = async (): Promise<void> => {
    if (!navigator.geolocation) {
      setError({
        code: 0,
        message: "Geolocalización no es soportada por este navegador",
      });
      return;
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
            maximumAge: 0,
          }
        );
      });

      setPosition(pos);
    } catch (err) {
      setError(err as GeolocationError);
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
