/**
 * Helper de cliente: arma el header Authorization con el access token de
 * Supabase del usuario actual, para llamar a las API routes protegidas.
 *
 *   const res = await fetch("/api/...", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json", ...(await authHeader()) },
 *     body: JSON.stringify(payload),
 *   });
 *
 * Si no hay sesión devuelve {} y la API responderá 401.
 */
import { supabase } from "@/lib/supabase/client";

export async function authHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}
