import { isOneSignalEnabled } from "@/lib/onesignal-config";
import { Capacitor } from "@capacitor/core";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "./Share/button";

interface NotificationButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  showIcon?: boolean;
  showText?: boolean;
  className?: string;
}

export default function NotificationButton({
  variant = "outline",
  size = "default",
  showIcon = true,
  showText = true,
  className = "",
}: NotificationButtonProps) {
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Para móvil
        const isEnabled = await isOneSignalEnabled();
        setIsSubscribed(isEnabled);
      } else {
        // Para web
        if (typeof window === "undefined" || !window.OneSignal) {
          return;
        }

        const isEnabled = await window.OneSignal.isPushNotificationsEnabled();
        setIsSubscribed(isEnabled);
      }
    } catch (error) {
      console.error("❌ Error verificando estado:", error);
      setIsSubscribed(false);
    }
  };

  const handleToggleNotifications = async () => {
    setIsLoading(true);

    try {
      if (isSubscribed) {
        toast.success("Ya estás suscrito a las notificaciones");
        setIsLoading(false);
        return;
      }

      if (Capacitor.isNativePlatform()) {
        // Para móvil - OneSignal se configura automáticamente
        try {
          // Verificar si ya está suscrito
          const isEnabled = await isOneSignalEnabled();
          if (isEnabled) {
            toast.success("¡Notificaciones activadas en móvil!");
            setIsSubscribed(true);
          } else {
            toast.success(
              "Notificaciones configuradas. Revisa la configuración del dispositivo."
            );
            setIsSubscribed(true);
          }
        } catch (error) {
          console.error("Error configurando notificaciones móviles:", error);
          toast.error("Error configurando notificaciones");
        }

        setIsLoading(false);
      } else {
        // Para web
        if (typeof window === "undefined" || !window.OneSignal) {
          toast.error("OneSignal no está disponible");
          setIsLoading(false);
          return;
        }

        // Verificar si está en modo incógnito
        const isIncognito = await detectIncognitoMode();
        if (isIncognito) {
          toast.error(
            "Las notificaciones no funcionan en modo incógnito. Usa un navegador normal."
          );
          setIsLoading(false);
          return;
        }

        // Solicitar permisos de notificación
        await window.OneSignal.showNativePrompt();

        // Verificar el estado después de un momento
        setTimeout(async () => {
          try {
            if (window.OneSignal) {
              const newState =
                await window.OneSignal.isPushNotificationsEnabled();
              setIsSubscribed(newState);

              if (newState) {
                toast.success("¡Notificaciones activadas en web!");
              } else {
                toast.error(
                  "Permisos denegados. Verifica la configuración del navegador."
                );
              }
            }
          } catch (error) {
            console.error("❌ Error verificando estado:", error);
          }
          setIsLoading(false);
        }, 1000);
      }
    } catch (error) {
      console.error("❌ Error:", error);
      toast.error("Error al configurar notificaciones");
      setIsLoading(false);
    }
  };

  // Función para detectar modo incógnito
  const detectIncognitoMode = async (): Promise<boolean> => {
    try {
      // Verificar si Notification API está disponible
      if (!("Notification" in window)) {
        return true;
      }

      // Verificar si el navegador soporta service workers
      if (!("serviceWorker" in navigator)) {
        return true;
      }

      // Verificar si localStorage está disponible (limitado en incógnito)
      try {
        localStorage.setItem("test", "test");
        localStorage.removeItem("test");
      } catch {
        return true;
      }

      return false;
    } catch {
      return true;
    }
  };

  // Verificar si OneSignal está disponible
  if (typeof window === "undefined" || !window.OneSignal) {
    return (
      <div className="w-full p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3">
          <BellOff className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-700">
              OneSignal no está disponible
            </p>
            <p className="text-xs text-gray-500">
              Esperando que OneSignal se cargue...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getButtonText = () => {
    if (isLoading) return "Configurando...";
    if (isSubscribed) return "Notificaciones activas";
    return "Activar notificaciones";
  };

  const getButtonIcon = () => {
    if (isLoading) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (isSubscribed) return <Bell className="w-4 h-4" />;
    return <BellOff className="w-4 h-4" />;
  };

  return (
    <div className="w-full">
      <Button
        variant={variant}
        size={size}
        onClick={handleToggleNotifications}
        disabled={isLoading}
        className={`flex items-center gap-2 ${className}`}
      >
        {showIcon && getButtonIcon()}
        {showText && (
          <span className="text-sm font-medium">{getButtonText()}</span>
        )}
      </Button>

      {/* Debug info */}
      <div className="mt-2 text-xs text-gray-400">
        Estado: {isSubscribed ? "Suscrito" : "No suscrito"} | OneSignal:{" "}
        {typeof window !== "undefined" && window.OneSignal
          ? "Disponible"
          : "No disponible"}
      </div>
    </div>
  );
}
