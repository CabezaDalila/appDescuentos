import { checkAdminRole } from "@/lib/admin";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuth";

const adminCache = new Map<string, boolean>();

export function useAdmin() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      // Si cambió el usuario, limpiar caché del usuario anterior
      if (
        previousUserIdRef.current &&
        previousUserIdRef.current !== user?.uid
      ) {
        adminCache.delete(previousUserIdRef.current);
      }
      previousUserIdRef.current = user?.uid || null;

      if (user && !loading) {
        // Verificar caché primero
        const cached = adminCache.get(user.uid);
        if (cached !== undefined) {
          setIsAdmin(cached);
          setAdminLoading(false);
          return;
        }

        try {
          const adminStatus = await checkAdminRole(user.uid);
          adminCache.set(user.uid, adminStatus);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error("Error verificando rol de admin:", error);
          setIsAdmin(false);
        } finally {
          setAdminLoading(false);
        }
      } else if (!loading) {
        setIsAdmin(false);
        setAdminLoading(false);
      }
    };

    checkAdmin();
  }, [user, loading]);

  return {
    isAdmin,
    adminLoading,
    user,
  };
}
