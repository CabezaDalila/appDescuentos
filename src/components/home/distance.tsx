import { useOpenRouteDistance } from "@/hooks/useOpenRouteDistance";
import { Clock, Navigation } from "lucide-react";
import { useEffect, useState } from "react";

interface distanceProps {
  userLocation: { latitude: number; longitude: number };
  discountLocation: { latitude: number; longitude: number };
}

export function RealDistanceDisplay({
  userLocation,
  discountLocation,
}: distanceProps) {
  const { calculateDistance, loading, error } = useOpenRouteDistance();
  const [distance, setDistance] = useState<{
    distance: number;
    duration: number;
    distanceText: string;
    durationText: string;
  } | null>(null);

  useEffect(() => {
    const getDistance = async () => {
      try {
        const result = await calculateDistance(
          { lat: userLocation.latitude, lng: userLocation.longitude },
          { lat: discountLocation.latitude, lng: discountLocation.longitude }
        );

        if (result) {
          setDistance(result);
        }
      } catch (err) {
        console.error("Error calculando distancia:", err);
      }
    };

    getDistance();
  }, [userLocation, discountLocation, calculateDistance]);

  if (loading) {
    return (
      <div className="flex items-center gap-1 text-gray-500">
        <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
        <span className="text-xs">Calculando ruta...</span>
      </div>
    );
  }

  if (error || !distance) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 text-gray-600">
      <Navigation className="w-3 h-3" />
      <div className="flex flex-col">
        <span className="text-xs font-medium">{distance.distanceText}</span>
        <div className="flex items-center gap-1">
          <Clock className="w-2 h-2" />
          <span className="text-xs text-gray-500">{distance.durationText}</span>
        </div>
      </div>
    </div>
  );
}
