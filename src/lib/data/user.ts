/**
 * Preferencias de usuario — ahora sobre Supabase (public.profiles.preferences).
 * Reemplaza el doc Firestore users/{uid}. Se mantiene el path de import
 * (@/lib/data/user) para no tocar a los consumidores.
 */
import type { UserPreferences } from "@/lib/data/types/profile.types";
import { getProfile, updateProfileFields } from "@/lib/data/profiles";

/**
 * Actualiza las preferencias del usuario en profiles.preferences.
 */
export async function updateUserPreferences(
  userId: string,
  preferences: UserPreferences
): Promise<void> {
  if (!userId) throw new Error("userId es requerido");
  await updateProfileFields(userId, {
    preferences: { ...preferences },
  });
}

/**
 * Obtiene las preferencias del usuario desde profiles.preferences.
 */
export async function getUserPreferences(
  userId: string
): Promise<UserPreferences | null> {
  if (!userId) throw new Error("userId es requerido");
  const profile = await getProfile(userId);
  const prefs = profile?.preferences;
  return prefs && Object.keys(prefs).length > 0
    ? (prefs as unknown as UserPreferences)
    : null;
}
