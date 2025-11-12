import { auth } from "@/lib/firebase/firebase";
import { logout, resetPassword } from "@/lib/firebase/firebase-auth";
import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";

interface UseAuthResult {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loggingOut: boolean;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    
    try {
      setLoggingOut(true);
      await logout();
      // No redirigir aquí, dejar que _app.tsx maneje la redirección automáticamente
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setLoggingOut(false);
    }
  };

  return { user, loading, logout: handleLogout, resetPassword, loggingOut };
}
