import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getActiveMemberships } from "@/lib/data/memberships";
import type { UserCredential } from "@/types/credentials";
import { parseMembershipsToCredentials } from "@/utils/membership-parsing";

export interface UseUserCredentialsResult {
  userMemberships: string[];
  userCredentials: UserCredential[];
  loading: boolean;
}

/**
 * Carga las membresías activas del usuario autenticado y deriva sus nombres
 * de membresía y credenciales de tarjeta válidas. Compartido por la home y el
 * buscador (antes duplicado en ambos).
 */
export function useUserCredentials(): UseUserCredentialsResult {
  const { user } = useAuth();
  const [userMemberships, setUserMemberships] = useState<string[]>([]);
  const [userCredentials, setUserCredentials] = useState<UserCredential[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!user) {
        setUserMemberships([]);
        setUserCredentials([]);
        setLoading(false);
        return;
      }
      try {
        const memberships = await getActiveMemberships();
        const { memberships: names, credentials } =
          parseMembershipsToCredentials(memberships);
        if (cancelled) return;
        setUserMemberships(names);
        setUserCredentials(credentials);
      } catch (error) {
        console.error("Error cargando membresías del usuario:", error);
        if (cancelled) return;
        setUserMemberships([]);
        setUserCredentials([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    setLoading(true);
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return { userMemberships, userCredentials, loading };
}
