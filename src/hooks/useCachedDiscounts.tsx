import { cache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";
import { getHomePageDiscounts } from "@/lib/discounts";
import type { HomePageDiscount } from "@/types/discount";
import { useEffect, useState } from "react";

export function useCachedDiscounts() {
  const [discounts, setDiscounts] = useState<HomePageDiscount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDiscounts = async () => {
      try {
        // Primero intentar obtener de caché
        const cached = cache.get<HomePageDiscount[]>(CACHE_KEYS.DISCOUNTS_HOME);

        if (cached && cached.length > 0) {
          setDiscounts(cached);
          setLoading(false);

          // Cargar en segundo plano para actualizar
          getHomePageDiscounts()
            .then((fresh) => {
              cache.set(CACHE_KEYS.DISCOUNTS_HOME, fresh, CACHE_TTL.DISCOUNTS);
              setDiscounts(fresh);
            })
            .catch((error) => {
              console.error("[Cache] Error actualizando descuentos:", error);
            });

          return;
        }

        // Si no hay caché, cargar normalmente
        setLoading(true);
        const data = await getHomePageDiscounts();
        cache.set(CACHE_KEYS.DISCOUNTS_HOME, data, CACHE_TTL.DISCOUNTS);
        setDiscounts(data);
      } catch (error) {
        console.error("Error cargando descuentos:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDiscounts();
  }, []);

  return { discounts, loading };
}
