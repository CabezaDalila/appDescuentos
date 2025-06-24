import { db, doc, getDoc, setDoc, updateDoc } from "@/lib/firebase";

/**
 * Actualiza las preferencias del usuario en Firestore
 * @param {string} userId
 * @param {{ language: 'es' | 'en', region: string, useLocation: boolean }} preferences
 */
export async function updateUserPreferences(userId, preferences) {
  if (!userId) throw new Error("userId es requerido");
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, { preferences }, { merge: true });
}

/**
 * Obtiene las preferencias del usuario desde Firestore
 * @param {string} userId
 * @returns {Promise<{ language: 'es' | 'en', region: string, useLocation: boolean } | null>}
 */
export async function getUserPreferences(userId) {
  if (!userId) throw new Error("userId es requerido");
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return null;
  return userSnap.data().preferences || null;
} 