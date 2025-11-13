import { useEffect, useState } from "react";
import { cache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";
import { getActiveMemberships, getInactiveMemberships } from "@/lib/firebase/memberships";
import type { MembershipItem } from "@/types/membership";
import { useAuth } from "./useAuth";

export function useCachedMemberships() {
  const { user, loading: authLoading } = useAuth();
  const [activeMemberships, setActiveMemberships] = useState<MembershipItem[]>([]);
  const [inactiveMemberships, setInactiveMemberships] = useState<MembershipItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshMemberships = async () => {
    if (!user) return;

    try {
      // Invalidar caché
      cache.delete(CACHE_KEYS.MEMBERSHIPS_ACTIVE);
      cache.delete(CACHE_KEYS.MEMBERSHIPS_INACTIVE);

      // Recargar
      const [active, inactive] = await Promise.all([
        getActiveMemberships(),
        getInactiveMemberships(),
      ]);

      cache.set(CACHE_KEYS.MEMBERSHIPS_ACTIVE, active, CACHE_TTL.MEMBERSHIPS);
      cache.set(CACHE_KEYS.MEMBERSHIPS_INACTIVE, inactive, CACHE_TTL.MEMBERSHIPS);
      setActiveMemberships(active);
      setInactiveMemberships(inactive);
    } catch (error) {
      console.error("Error refrescando membresías:", error);
      throw error;
    }
  };

  useEffect(() => {
    const loadMemberships = async () => {
      if (!user || authLoading) {
        setActiveMemberships([]);
        setInactiveMemberships([]);
        setLoading(false);
        return;
      }

      try {
        // Intentar obtener de caché primero
        const cachedActive = cache.get<MembershipItem[]>(CACHE_KEYS.MEMBERSHIPS_ACTIVE);
        const cachedInactive = cache.get<MembershipItem[]>(CACHE_KEYS.MEMBERSHIPS_INACTIVE);

        if (cachedActive && cachedInactive) {
          setActiveMemberships(cachedActive);
          setInactiveMemberships(cachedInactive);
          setLoading(false);

          // Cargar en segundo plano para actualizar
          Promise.all([getActiveMemberships(), getInactiveMemberships()])
            .then(([active, inactive]) => {
              cache.set(CACHE_KEYS.MEMBERSHIPS_ACTIVE, active, CACHE_TTL.MEMBERSHIPS);
              cache.set(CACHE_KEYS.MEMBERSHIPS_INACTIVE, inactive, CACHE_TTL.MEMBERSHIPS);
              setActiveMemberships(active);
              setInactiveMemberships(inactive);
            })
            .catch((error) => {
              console.error("[Cache] Error actualizando membresías:", error);
            });

          return;
        }

        // Si no hay caché, cargar normalmente
        setLoading(true);
        const [active, inactive] = await Promise.all([
          getActiveMemberships(),
          getInactiveMemberships(),
        ]);

        cache.set(CACHE_KEYS.MEMBERSHIPS_ACTIVE, active, CACHE_TTL.MEMBERSHIPS);
        cache.set(CACHE_KEYS.MEMBERSHIPS_INACTIVE, inactive, CACHE_TTL.MEMBERSHIPS);
        setActiveMemberships(active);
        setInactiveMemberships(inactive);
      } catch (error) {
        console.error("Error cargando membresías:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMemberships();
  }, [user, authLoading]);

  return { activeMemberships, inactiveMemberships, loading, refreshMemberships };
}

