import { db } from "@/lib/firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

interface UserProfile {
  onboarding?: {
    completed?: boolean;
    completedAt?: unknown;
    interests?: string[];
    goals?: string[];
    banks?: string[];
    answers?: {
      interests?: string[];
      goals?: string[];
      banks?: string[];
    };
  };
  preferences?: Record<string, unknown>;
  profile?: Record<string, unknown>;
  [key: string]: unknown;
}

interface UseUserProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
}

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

    setLoading(true);
    const userRef = doc(db, "users", userId);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setProfile(snapshot.data() as UserProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (snapshotError) => {
        console.error("Error al obtener el perfil del usuario:", snapshotError);
        setError(snapshotError as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { profile, loading, error };
}
