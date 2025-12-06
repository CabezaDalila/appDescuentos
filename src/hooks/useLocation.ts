/**
 * Hook para manejar permisos y obtención de ubicación
 * Detecta automáticamente si está en web o móvil
 */

import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { useState } from "react";

export function useLocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNative = Capacitor.isNativePlatform();

  /**
   * Solicitar permisos de ubicación
   */
  const requestPermissions = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      if (isNative) {
        // En móvil: usar Capacitor
        const permission = await Geolocation.requestPermissions();
        return permission.location === "granted";
      } else {
        // En web: usar navigator.geolocation
        return new Promise((resolve) => {
          if (!navigator.geolocation) {
            setError("Geolocalización no soportada");
            resolve(false);
            return;
          }

          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            (err) => {
              setError(err.message);
              resolve(false);
            }
          );
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error solicitando permisos";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Verificar permisos de ubicación
   */
  const checkPermissions = async (): Promise<boolean> => {
    try {
      if (isNative) {
        const permission = await Geolocation.checkPermissions();
        return permission.location === "granted";
      } else {
        // En web, asumir que está disponible si existe navigator.geolocation
        return !!navigator.geolocation;
      }
    } catch {
      return false;
    }
  };

  /**
   * Obtener ubicación actual
   */
  const getLocation = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isNative) {
        // En móvil: usar Capacitor
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });

        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp,
        };
      } else {
        // En web: usar navigator.geolocation
        return new Promise<{ latitude: number; longitude: number; timestamp: number } | null>(
          (resolve) => {
            if (!navigator.geolocation) {
              setError("Geolocalización no soportada");
              resolve(null);
              return;
            }

            navigator.geolocation.getCurrentPosition(
              (position) => {
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  timestamp: position.timestamp,
                });
              },
              (err) => {
                setError(err.message);
                resolve(null);
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
              }
            );
          }
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error obteniendo ubicación";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    requestPermissions,
    checkPermissions,
    getLocation,
    loading,
    error,
    isNative,
  };
}
