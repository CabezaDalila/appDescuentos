import {
  adaptUser,
  resetPassword as supabaseResetPassword,
  type AppUser,
} from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";
import { cache } from "@/lib/cache";
import { useEffect, useState } from "react";

interface UseAuthResult {
  user: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loggingOut: boolean;
}

/**
 * Fuente de verdad de la sesión: Supabase.
 * Devuelve un usuario adaptado con la misma forma que usaba el resto de la app
 * (uid, email, displayName, photoURL, emailVerified).
 */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Sesión inicial.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUser(adaptUser(session?.user ?? null));
      setLoading(false);
    });

    // Cambios de sesión (login, logout, refresh, retorno de OAuth web).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(adaptUser(session?.user ?? null));
      setLoading(false);
      if (!session) {
        // Cubre logout por expiración de sesión (no solo el botón).
        cache.clear();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      await supabase.auth.signOut();
      // Limpiar cache persistente (membresías, tarjetas, descuentos) para que el
      // próximo usuario en este dispositivo no vea datos del anterior.
      cache.clear();
      // La redirección la maneja _app.tsx al detectar user = null.
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  return {
    user,
    loading,
    logout: handleLogout,
    resetPassword: supabaseResetPassword,
    loggingOut,
  };
}
