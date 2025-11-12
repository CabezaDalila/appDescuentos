import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { App } from "@capacitor/app";

/**
 * Hook para manejar el botón de retroceso de Android
 * - En /home: cierra la app
 * - En otras rutas: navega a la pantalla anterior
 */
export function useAndroidBackButton() {
  const router = useRouter();
  const routerRef = useRef(router);
  const listenerRef = useRef<any>(null);

  // Mantener referencia actualizada del router
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    // Solo ejecutar en entorno Capacitor (app móvil)
    if (typeof window === "undefined") return;

    // Verificar si estamos en Capacitor
    const isCapacitor = typeof (window as any).Capacitor !== "undefined";
    if (!isCapacitor) return;

    const handleBackButton = async () => {
      const currentPath = routerRef.current.pathname;
      
      // Si estamos en home, cerrar la app
      if (currentPath === "/home") {
        await App.exitApp();
      } else {
        // En cualquier otra ruta, navegar atrás
        // Usar router.back() que maneja automáticamente el historial
        const canGoBack = window.history.length > 1;
        
        if (canGoBack) {
          routerRef.current.back();
        } else {
          // Si no hay historial disponible, redirigir a home como fallback
          routerRef.current.push("/home");
        }
      }
    };

    // Registrar el listener para el botón de retroceso
    App.addListener("backButton", handleBackButton).then((listener) => {
      listenerRef.current = listener;
    }).catch((error) => {
      console.error("Error al registrar listener del botón de retroceso:", error);
    });

    // Limpiar el listener al desmontar
    return () => {
      if (listenerRef.current) {
        listenerRef.current.remove().catch((err: Error) => {
          console.error("Error al remover listener:", err);
        });
        listenerRef.current = null;
      }
    };
  }, []);
}

