/**
 * Cliente de Supabase para el SERVIDOR (API routes).
 *
 * Usa la SERVICE ROLE KEY: bypassa RLS. Es SECRETA y jamás debe llegar al
 * browser. Se usa solo para verificar el token del usuario y leer su rol.
 *
 * Reemplaza a la antigua verificación con firebase-admin. Los guards de
 * src/lib/server/auth.ts consumen estas dos funciones.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Cliente admin (service role si está disponible; si no, anon como fallback en
 * local). Bypassa RLS cuando corre con la service role key. Solo servidor.
 */
export function getAdminClient() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Para VERIFICAR el token del usuario (auth.getUser) alcanza la anon key: la
  // validez la da el JWT, no la apikey. La service role key solo hace falta para
  // operaciones admin que bypassan RLS (p. ej. getUserRole). Usamos service si
  // está, si no la anon key como fallback (así anda en local aunque Vercel no
  // exporte la service role por ser "sensitive").
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase Admin no configurado: faltan NEXT_PUBLIC_SUPABASE_URL / " +
        "(SUPABASE_SERVICE_ROLE_KEY | NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export interface VerifiedUser {
  uid: string;
  email?: string;
}

/**
 * Verifica un access token de Supabase. Devuelve el usuario o null si es
 * inválido/expirado.
 */
export async function verifyAccessToken(
  accessToken: string
): Promise<VerifiedUser | null> {
  const { data, error } = await getAdminClient().auth.getUser(accessToken);
  if (error || !data.user) return null;
  return { uid: data.user.id, email: data.user.email ?? undefined };
}

/** Lee el rol del usuario desde la tabla profiles (profiles.role). */
export async function getUserRole(uid: string): Promise<string | null> {
  const { data, error } = await getAdminClient()
    .from("profiles")
    .select("role")
    .eq("id", uid)
    .single();
  if (error || !data) return null;
  return ((data as { role?: string | null }).role as string | null) ?? null;
}
