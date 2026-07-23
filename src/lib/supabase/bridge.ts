/**
 * Puente de sesión Supabase -> Firebase (lado cliente).
 *
 * Tras loguear con Supabase, llamamos a /api/auth/firebase-bridge para obtener
 * un Firebase custom token y así iniciar sesión también en Firebase. Esto
 * mantiene Firestore (cuyas reglas dependen del auth de Firebase) funcionando
 * sin tocar el resto de la app.
 */
import { auth as firebaseAuth } from "@/lib/firebase/firebase";
import { saveUserToFirestore } from "@/lib/firebase/firebase-auth";
import { signInWithCustomToken, signOut } from "firebase/auth";
import { supabase } from "./client";

/**
 * Garantiza que exista una sesión de Firebase espejo de la de Supabase.
 * Idempotente: si ya hay un usuario de Firebase logueado, no hace nada.
 */
export async function ensureFirebaseSession(): Promise<void> {
  if (firebaseAuth.currentUser) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  const res = await fetch("/api/auth/firebase-bridge", {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) {
    throw new Error("No se pudo puentear la sesión con Firebase");
  }

  const { firebaseToken } = (await res.json()) as { firebaseToken: string };
  await signInWithCustomToken(firebaseAuth, firebaseToken);

  // El usuario de Firebase por custom token no trae email/nombre; tomamos esos
  // datos del usuario de Supabase para poblar Firestore (rol, onboarding, etc.).
  const {
    data: { user: sbUser },
  } = await supabase.auth.getUser();
  if (sbUser) {
    const meta = sbUser.user_metadata ?? {};
    await saveUserToFirestore({
      uid: sbUser.id,
      email: sbUser.email ?? null,
      displayName:
        (meta.full_name as string) ?? (meta.name as string) ?? null,
      photoURL:
        (meta.avatar_url as string) ?? (meta.picture as string) ?? null,
      emailVerified: Boolean(sbUser.email_confirmed_at),
      providerId: (sbUser.app_metadata?.provider as string) ?? "supabase",
    });
  }
}

/** Cierra la sesión espejo de Firebase (al hacer logout de Supabase). */
export async function clearFirebaseSession(): Promise<void> {
  if (firebaseAuth.currentUser) {
    await signOut(firebaseAuth);
  }
}
