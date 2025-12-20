import { Button } from "@/components/Share/button";
import { PageHeader } from "@/components/Share/page-header";
import {
    isLocationPermissionEnabled,
    markLocationPermissionEnabled,
    setLocationPermission,
    useGeolocation,
} from "@/hooks/useGeolocation";
import { CheckCircle, MapPin, XCircle } from "lucide-react";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";

export default function LocationPermissionPage() {
  const router = useRouter();
  const { position, error, loading, getCurrentPosition } = useGeolocation();
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Obtener ubicación al cargar, respetando el estado guardado
  const fetchLocation = useCallback(async () => {
    setIsLoading(true);
    
    // Verificar si el usuario desactivó manualmente la ubicación
    if (!isLocationPermissionEnabled()) {
      setIsEnabled(false);
      setIsLoading(false);
      return;
    }
    
    const pos = await getCurrentPosition();
    if (pos) {
      setIsEnabled(true);
      markLocationPermissionEnabled();
    } else {
      setIsEnabled(false);
    }
    setIsLoading(false);
  }, [getCurrentPosition]);

  useEffect(() => {
    fetchLocation();
  }, []);

  useEffect(() => {
    // Solo actualizar si el usuario no desactivó manualmente
    if (!isLocationPermissionEnabled()) return;
    
    if (position) {
      setIsEnabled(true);
      setIsLoading(false);
    } else if (error) {
      setIsEnabled(false);
      setIsLoading(false);
    }
  }, [position, error]);

  const handleToggleLocation = async () => {
    if (isEnabled) {
      // Desactivar usando la función centralizada
      setLocationPermission(false);
      setIsEnabled(false);
    } else {
      // Activar: limpiar estado y obtener ubicación
      setIsLoading(true);
      setLocationPermission(true);
      const pos = await getCurrentPosition();
      if (pos) {
        setIsEnabled(true);
        markLocationPermissionEnabled();
      }
      setIsLoading(false);
    }
  };

  // URL para OpenStreetMap embed con la ubicación real (zoom cercano)
  const mapUrl = position
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${position.longitude - 0.003},${position.latitude - 0.002},${position.longitude + 0.003},${position.latitude + 0.002}&layer=mapnik&marker=${position.latitude},${position.longitude}`
    : null;

  return (
    <div className="h-screen h-[100dvh] bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white shadow-sm">
        <PageHeader
          title="Permiso de ubicación"
          onBack={() => router.push("/privacy")}
        />
      </div>

      {/* Mapa - ocupa todo el espacio disponible y está bloqueado */}
      <div className="relative flex-1 bg-gray-100 overflow-hidden">
        {isLoading || loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-3"></div>
            <p className="text-gray-600 text-sm">Obteniendo ubicación...</p>
          </div>
        ) : position ? (
          <>
            <iframe
              src={mapUrl || ""}
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute -top-12 -left-12 -right-12 -bottom-10 w-[calc(100%+96px)] h-[calc(100%+88px)]"
            />
            {/* Overlay para bloquear interacción con el mapa */}
            <div className="absolute inset-0 z-10" />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 px-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-3">
              <MapPin className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-base font-medium text-center">Ubicación no disponible</p>
            <p className="text-xs text-center mt-1">Activa el permiso para ver tu ubicación</p>
          </div>
        )}
      </div>

      {/* Panel inferior - responsive */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-5 safe-area-bottom">
        {/* Estado */}
        <div className="flex items-center gap-3 mb-2">
          {isEnabled ? (
            <>
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
              <span className="text-green-600 font-semibold text-lg">Activado</span>
            </>
          ) : (
            <>
              <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
              <span className="text-red-600 font-semibold text-lg">Desactivado</span>
            </>
          )}
        </div>

        {/* Descripción */}
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          {isEnabled 
            ? "Tu ubicación nos permite mostrarte los mejores descuentos cerca de ti."
            : "Activa tu ubicación para descubrir descuentos exclusivos en comercios cercanos."}
        </p>

        {/* Botón centrado */}
        <div className="flex justify-center">
          <Button
            onClick={handleToggleLocation}
            disabled={isLoading || loading}
            className={`px-8 py-2 text-sm font-medium ${
              isEnabled
                ? "bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
            variant={isEnabled ? "outline" : "default"}
          >
            {isLoading || loading ? "..." : isEnabled ? "Desactivar" : "Activar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
