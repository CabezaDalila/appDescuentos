import { useGeolocation } from "@/hooks/useGeolocation";
import { getRealDistance } from "@/utils/real-distance";
import { useEffect, useState } from "react";

interface UseDistanceOptions {
  discountLocation?: {
    latitude: number;
    longitude: number;
  };
  initialDistance?: string;
  enabled?: boolean;
}

interface UseDistanceReturn {
  distance: string;
  loading: boolean;
  error: string | null;
}

export function useDistance({
  discountLocation,
  initialDistance,
  enabled = true,
}: UseDistanceOptions): UseDistanceReturn {
  const [distance, setDistance] = useState<string>(
    initialDistance || "Sin ubicación"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  const { position, getCurrentPosition } = useGeolocation();

  useEffect(() => {
    if (!enabled) return;

    const calculateDistance = async () => {
      // Si ya tenemos una distancia válida, no calcular
      if (
        initialDistance &&
        initialDistance !== "Calculando..." &&
        initialDistance !== "Sin ubicación"
      ) {
        console.log("[useDistance] Usando distancia inicial:", initialDistance);
        setDistance(initialDistance);
        return;
      }

      // Si no hay ubicación del descuento, no calcular
      if (!discountLocation) {
        setDistance("Sin ubicación");
        return;
      }

      // Si ya calculó, no volver a calcular
      if (hasCalculated) {
        return;
      }

      try {
        setLoading(true);
        setDistance("Calculando...");

        // Obtener ubicación del usuario
        await getCurrentPosition();
      } catch (err) {
        console.error("Error obteniendo ubicación:", err);
        setDistance("Sin ubicación");
        setLoading(false);
      }
    };

    calculateDistance();
  }, [
    discountLocation,
    initialDistance,
    getCurrentPosition,
    hasCalculated,
    enabled,
  ]);

  useEffect(() => {
    if (!enabled || !position || !discountLocation || hasCalculated) {
      return;
    }

    const calculateRealDistance = async () => {
      try {
        setLoading(true);

        const result = await getRealDistance(
          { lat: position.latitude, lng: position.longitude },
          { lat: discountLocation.latitude, lng: discountLocation.longitude }
        );

        if (result) {
          console.log("[useDistance] Distancia calculada:", {
            distance: result.distanceText,
            distanceMeters: result.distance,
            from: { lat: position.latitude, lng: position.longitude },
            to: {
              lat: discountLocation.latitude,
              lng: discountLocation.longitude,
            },
          });
          setDistance(result.distanceText);
        } else {
          console.log("[useDistance] No se pudo calcular distancia");
          setDistance("Sin ubicación");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error calculando distancia";
        console.error("Error calculando distancia:", errorMessage);
        setError(errorMessage);
        setDistance("Sin ubicación");
      } finally {
        setLoading(false);
        setHasCalculated(true);
      }
    };

    calculateRealDistance();
  }, [position, discountLocation, hasCalculated, enabled]);

  return { distance, loading, error };
}
