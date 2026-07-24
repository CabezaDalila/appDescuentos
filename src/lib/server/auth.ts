/**
 * Guards de autenticación para API routes (Pages Router).
 *
 * Uso típico en un handler:
 *   const auth = await requireUser(req, res);
 *   if (!auth) return;            // requireUser ya respondió 401
 *   // ...usar auth.uid / auth.role
 *
 * o para endpoints solo-admin:
 *   const admin = await requireAdmin(req, res);
 *   if (!admin) return;           // ya respondió 401/403
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { getUserRole, verifyAccessToken } from "@/lib/supabase/admin-server";

export interface AuthContext {
  uid: string;
  email?: string;
  role: string | null;
  isAdmin: boolean;
}

function extractBearer(req: NextApiRequest): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

/**
 * Verifica el ID token y devuelve el contexto de auth, o null.
 * No responde por sí sola: úsala cuando quieras decidir vos el flujo.
 */
export async function getAuthContext(
  req: NextApiRequest
): Promise<AuthContext | null> {
  const token = extractBearer(req);
  if (!token) return null;

  const user = await verifyAccessToken(token);
  if (!user) return null;
  const role = await getUserRole(user.uid);
  return {
    uid: user.uid,
    email: user.email,
    role,
    isAdmin: role === "admin",
  };
}

/** Requiere un usuario autenticado. Responde 401 y devuelve null si falla. */
export async function requireUser(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthContext | null> {
  const ctx = await getAuthContext(req);
  if (!ctx) {
    res.status(401).json({ error: "No autenticado" });
    return null;
  }
  return ctx;
}

/** Requiere rol admin. Responde 401/403 y devuelve null si falla. */
export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthContext | null> {
  const ctx = await getAuthContext(req);
  if (!ctx) {
    res.status(401).json({ error: "No autenticado" });
    return null;
  }
  if (!ctx.isAdmin) {
    res.status(403).json({ error: "Requiere permisos de administrador" });
    return null;
  }
  return ctx;
}
