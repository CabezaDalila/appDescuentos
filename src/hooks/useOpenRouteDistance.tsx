import { useCallback, useState } from "react";

export interface OpenRouteDistanceResult {
  distance: number; // en metros
  duration: number; // en segundos
  distanceText: string; // "2.5 km"
  durationText: string; // "15 min"
}

export interface UseOpenRouteDistanceReturn {
  getDistance: (
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ) => Promise<OpenRouteDistanceResult | null>;
  loading: boolean;
  error: string | null;
}

// API Key de OpenRouteService (gratis)
const OPENROUTE_API_KEY = process.env.NEXT_PUBLIC_OPEN_ROUTE_DISTANCE;

export function useOpenRouteDistance(): UseOpenRouteDistanceReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDistance = useCallback(
    async (
      from: { lat: number; lng: number },
      to: { lat: number; lng: number }
    ): Promise<OpenRouteDistanceResult | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${OPENROUTE_API_KEY}&start=${from.lng},${from.lat}&end=${to.lng},${to.lat}`
        );

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.features || data.features.length === 0) {
          throw new Error("No se encontró ruta");
        }

        const route = data.features[0];
        const distance = route.properties.summary.distance; // en metros
        const duration = route.properties.summary.duration; // en segundos

        // Convertir metros a kilómetros
        const distanceKm = distance / 1000;

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

        return {
          distance,
          duration,
          distanceText,
          durationText,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        console.error("Error calculando distancia:", errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    getDistance,
    loading,
    error,
  };
}
