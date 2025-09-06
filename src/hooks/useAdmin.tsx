import { checkAdminRole } from "@/lib/firebase/admin";
import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";

export function useAdmin() {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user && !loading) {
        try {
          const adminStatus = await checkAdminRole(user.uid);
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
