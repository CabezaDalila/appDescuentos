import { useEffect, useState } from "react";
import { cache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";
import { getHomePageDiscounts } from "@/lib/discounts";
import { getActiveMemberships, getInactiveMemberships } from "@/lib/firebase/memberships";
import { useAuth } from "./useAuth";

interface PreloadStatus {
  discounts: boolean;
  memberships: boolean;
  complete: boolean;
}

/**
 * Hook para precargar datos críticos de la aplicación
 * Se ejecuta en segundo plano después del login
 */
export function usePreload() {
  const { user } = useAuth();
  const [status, setStatus] = useState<PreloadStatus>({
    discounts: false,
    memberships: false,
    complete: false,
  });

  const preloadDiscounts = async () => {
    try {
      // Verificar si ya está en caché
      const cached = cache.get(CACHE_KEYS.DISCOUNTS_HOME);
      if (cached) {
        return true;
      }

      const discounts = await getHomePageDiscounts();
      cache.set(CACHE_KEYS.DISCOUNTS_HOME, discounts, CACHE_TTL.DISCOUNTS);
      return true;
    } catch (error) {
      console.error("[Preload] Error cargando descuentos:", error);
      return false;
    }
  };

  const preloadMemberships = async () => {
    if (!user) return false;

    try {
      // Verificar si ya está en caché
      const cached = cache.get(CACHE_KEYS.MEMBERSHIPS_ACTIVE);
      if (cached) {
        return true;
      }

      const [active, inactive] = await Promise.all([
        getActiveMemberships(),
        getInactiveMemberships(),
      ]);

      cache.set(CACHE_KEYS.MEMBERSHIPS_ACTIVE, active, CACHE_TTL.MEMBERSHIPS);
      cache.set(CACHE_KEYS.MEMBERSHIPS_INACTIVE, inactive, CACHE_TTL.MEMBERSHIPS);
      return true;
    } catch (error) {
      console.error("[Preload] Error cargando membresías:", error);
      return false;
    }
  };

  const preloadAll = async () => {
    if (status.complete) return;

    const [discountsLoaded, membershipsLoaded] = await Promise.all([
      preloadDiscounts(),
      preloadMemberships(),
    ]);

    setStatus({
      discounts: discountsLoaded,
      memberships: membershipsLoaded,
      complete: discountsLoaded && membershipsLoaded,
    });
  };

  useEffect(() => {
    // Precargar después de un pequeño delay para no bloquear la UI inicial
    const timer = setTimeout(() => {
      preloadAll();
    }, 1000); // 1 segundo después del login

    return () => clearTimeout(timer);
  }, [user]);

  return {
    status,
    preloadAll,
    preloadDiscounts,
    preloadMemberships,
  };
}

