import { supabase } from "@/lib/supabase/client";
import {
  getProfile,
  mapProfile,
  type ProfileRow,
  type UserProfile,
} from "@/lib/data/profiles";
import { useEffect, useState } from "react";

interface UseUserProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Perfil del usuario desde Supabase (public.profiles), con suscripción realtime
 * para reflejar cambios al instante (p. ej. al completar el onboarding), igual
 * que hacía el onSnapshot de Firestore.
 */
export function useUserProfile(userId?: string | null): UseUserProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(!!userId);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    getProfile(userId)
      .then((p) => {
        if (!active) return;
        setProfile(p);
        setLoading(false);
      })
      .catch((e) => {
        if (!active) return;
        console.error("Error al obtener el perfil del usuario:", e);
        setError(e as Error);
        setLoading(false);
      });

    // Nombre único por suscripción: evita reusar un canal ya suscripto (el
    // doble-montaje de StrictMode en dev hacía explotar el .on() posterior).
    const channel = supabase
      .channel(`profile:${userId}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          if (!active) return;
          if (payload.eventType === "DELETE") {
            setProfile(null);
          } else {
            setProfile(mapProfile(payload.new as ProfileRow));
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { profile, loading, error };
}
