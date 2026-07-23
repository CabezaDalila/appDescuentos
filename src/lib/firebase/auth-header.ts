/**
 * Helper de cliente: arma el header Authorization con el ID token de Firebase
 * del usuario actual, para llamar a las API routes protegidas.
 *
 *   const res = await fetch("/api/...", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json", ...(await authHeader()) },
 *     body: JSON.stringify(payload),
 *   });
 *
 * Si no hay usuario logueado devuelve {} y la API responderá 401.
 */
import { auth } from "./firebase";

export async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}
