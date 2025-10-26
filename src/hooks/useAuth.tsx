import { auth } from "@/lib/firebase/firebase";
import { logout, resetPassword } from "@/lib/firebase/firebase-auth";
import { onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface UseAuthResult {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return { user, loading, logout: handleLogout, resetPassword };
}
