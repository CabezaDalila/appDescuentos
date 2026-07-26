/**
 * Capa de autenticación sobre Supabase (fuente de verdad del LOGIN).
 * Mantiene firmas compatibles con las que usaba el AuthForm para minimizar
 * cambios en la UI.
 */
import { supabase } from "./client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

function origin(): string {
  return typeof window !== "undefined" ? window.location.origin : "";
}

/** Objeto de usuario tipo-Firebase que consume el resto de la app. */
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providerId: string;
  /** ISO string de creación de la cuenta (equivale a metadata.creationTime). */
  createdAt: string | null;
}

/** Adapta un usuario de Supabase a la forma que espera la app. */
export function adaptUser(user: SupabaseUser | null): AppUser | null {
  if (!user) return null;
  const meta = user.user_metadata ?? {};
  return {
    uid: user.id,
    email: user.email ?? null,
    displayName: (meta.full_name as string) ?? (meta.name as string) ?? null,
    photoURL: (meta.avatar_url as string) ?? (meta.picture as string) ?? null,
    emailVerified: Boolean(user.email_confirmed_at),
    providerId: (user.app_metadata?.provider as string) ?? "supabase",
    createdAt: user.created_at ?? null,
  };
}

/** Login con email/password. Lanza "EMAIL_NOT_VERIFIED" si falta confirmar. */
export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    if (/email not confirmed/i.test(error.message)) {
      throw new Error("EMAIL_NOT_VERIFIED");
    }
    throw error;
  }
  return { user: adaptUser(data.user) };
}

/** Registro. Supabase envía el email de confirmación; no crea sesión aún. */
export async function register(
  email: string,
  password: string,
  displayName?: string,
  profile?: { firstName?: string; lastName?: string; phone?: string }
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin()}/login`,
      data: {
        full_name: displayName,
        first_name: profile?.firstName,
        last_name: profile?.lastName,
        phone: profile?.phone,
      },
    },
  });
  if (error) throw error;
  return { user: data.user ? { uid: data.user.id } : null };
}

/** Login con Google en WEB (redirige; el puente ocurre al volver). */
export async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin()}/login` },
  });
  if (error) throw error;
  // Redirige fuera de la página; devolvemos algo truthy para la UI.
  return { user: { redirecting: true } };
}

/** Login con Google NATIVO (Capacitor): idToken -> Supabase -> puente. */
export async function loginWithGoogleNative() {
  const { GoogleAuth } = await import(
    "@codetrix-studio/capacitor-google-auth"
  );
  const googleUser = await GoogleAuth.signIn();
  const idToken = googleUser.authentication.idToken;
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });
  if (error) throw error;
  return { user: adaptUser(data.user) };
}

/** Reenvía el email de confirmación de registro. */
export async function resendEmailVerification(email: string) {
  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) throw error;
}

/** Envía el email de reseteo de contraseña. */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin()}/reset-password`,
  });
  if (error) throw error;
}

/**
 * Compat: con Firebase se verificaba el email con un oobCode de la URL. En
 * Supabase la confirmación se resuelve sola (detectSessionInUrl). Se deja como
 * no-op para no romper imports; el flujo viejo de la URL ya no se dispara.
 */
export async function verifyEmail(_oobCode: string): Promise<void> {
  return;
}
