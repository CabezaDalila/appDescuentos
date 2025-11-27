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

    if (
      initialDistance &&
      initialDistance !== "Calculando..." &&
      initialDistance !== "Sin ubicación"
    ) {
      setDistance(initialDistance);
      setHasCalculated(true);
      return;
    }

    if (!discountLocation) {
      setDistance("Sin ubicación");
      return;
    }

    if (hasCalculated) {
      return;
    }

    const calculateDistance = async () => {
      try {
        setLoading(true);
        setDistance("Calculando...");
        await getCurrentPosition();
      } catch {
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
    if (
      !enabled ||
      !position ||
      !discountLocation ||
      hasCalculated ||
      (initialDistance &&
        initialDistance !== "Calculando..." &&
        initialDistance !== "Sin ubicación")
    ) {
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
          setDistance(result.distanceText);
        } else {
          setDistance("Sin ubicación");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error calculando distancia";
        setError(errorMessage);
        setDistance("Sin ubicación");
      } finally {
        setLoading(false);
        setHasCalculated(true);
      }
    };

    calculateRealDistance();
  }, [position, discountLocation, hasCalculated, enabled, initialDistance]);

  return { distance, loading, error };
}
