/**
 * PUENTE Supabase -> Firebase.
 *
 * El cliente, tras loguearse con Supabase, llama a este endpoint con su access
 * token de Supabase. Verificamos ese token y devolvemos un Firebase custom
 * token con el MISMO uid, para que el cliente inicie sesión en Firebase y las
 * reglas de Firestore (que dependen del auth de Firebase) sigan funcionando.
 *
 * Temporal: se elimina cuando los datos migren de Firestore a Postgres.
 */
import { createFirebaseCustomToken } from "@/lib/firebase/admin-server";
import { verifyAccessToken } from "@/lib/supabase/admin-server";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const header = req.headers.authorization;
  const accessToken =
    header && header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!accessToken) {
    return res.status(401).json({ error: "Falta el token de Supabase" });
  }

  const user = await verifyAccessToken(accessToken);
  if (!user) {
    return res.status(401).json({ error: "Token de Supabase inválido" });
  }

  try {
    const firebaseToken = await createFirebaseCustomToken(user.uid, {
      email: user.email,
    });
    return res.status(200).json({ firebaseToken });
  } catch (error) {
    console.error("Error minteando Firebase custom token:", error);
    return res
      .status(500)
      .json({ error: "No se pudo generar el token de Firebase" });
  }
}
