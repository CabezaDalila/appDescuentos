/**
 * Preferencias de usuario — ahora sobre Supabase (public.profiles.preferences).
 * Reemplaza el doc Firestore users/{uid}. Se mantiene el path de import
 * (@/lib/data/user) para no tocar a los consumidores.
 */
import { getProfile, updateProfileFields } from "@/lib/supabase/profiles";

/**
 * Actualiza las preferencias del usuario en profiles.preferences.
 * @param {string} userId
 * @param {{ language: 'es' | 'en', region: string, useLocation: boolean }} preferences
 */
export async function updateUserPreferences(userId, preferences) {
  if (!userId) throw new Error("userId es requerido");
  await updateProfileFields(userId, { preferences });
}

/**
 * Obtiene las preferencias del usuario desde profiles.preferences.
 * @param {string} userId
 * @returns {Promise<{ language: 'es' | 'en', region: string, useLocation: boolean } | null>}
 */
export async function getUserPreferences(userId) {
  if (!userId) throw new Error("userId es requerido");
  const profile = await getProfile(userId);
  const prefs = profile?.preferences;
  return prefs && Object.keys(prefs).length > 0 ? prefs : null;
}
