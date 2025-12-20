import { isLocationPermissionEnabled, useGeolocation } from "@/hooks/useGeolocation";
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
    initialDistance || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  const { position, getCurrentPosition } = useGeolocation();

  useEffect(() => {
    // Si la ubicación no está habilitada, no calcular nada
    if (!enabled || !isLocationPermissionEnabled()) {
      setDistance("");
      return;
    }

    if (
      initialDistance &&
      initialDistance !== "Calculando..." &&
      initialDistance !== "Sin ubicación" &&
      initialDistance !== ""
    ) {
      setDistance(initialDistance);
      setHasCalculated(true);
      return;
    }

    if (!discountLocation) {
      setDistance("");
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
        setDistance("");
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
    // Si la ubicación no está habilitada, no calcular
    if (!isLocationPermissionEnabled()) {
      setDistance("");
      return;
    }

    if (
      !enabled ||
      !position ||
      !discountLocation ||
      hasCalculated ||
      (initialDistance &&
        initialDistance !== "Calculando..." &&
        initialDistance !== "Sin ubicación" &&
        initialDistance !== "")
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
          setDistance("");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error calculando distancia";
        setError(errorMessage);
        setDistance("");
      } finally {
        setLoading(false);
        setHasCalculated(true);
      }
    };

    calculateRealDistance();
  }, [position, discountLocation, hasCalculated, enabled, initialDistance]);

  return { distance, loading, error };
}
