/**
 * Firebase Admin SDK (SERVIDOR).
 *
 * Se usa SOLO en API routes para verificar el ID token del usuario y su rol.
 * Nunca importar esto desde código de cliente: requiere la clave privada de la
 * cuenta de servicio, que jamás debe llegar al browser.
 *
 * Configuración por variables de entorno (recomendado para Vercel):
 *   FIREBASE_ADMIN_CLIENT_EMAIL   -> client_email de la cuenta de servicio
 *   FIREBASE_ADMIN_PRIVATE_KEY    -> private_key (con \n escapados o reales)
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID -> se reutiliza como project_id
 *
 * Si faltan credenciales, las funciones fallan de forma CERRADA (lanzan error),
 * de modo que un endpoint protegido nunca queda abierto por mala configuración.
 */
import {
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let cachedApp: App | null = null;

function getAdminApp(): App {
  if (cachedApp) return cachedApp;

  const existing = getApps();
  if (existing.length > 0) {
    cachedApp = existing[0];
    return cachedApp;
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  // La private key suele venir con "\n" literales al copiarla a un .env.
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin no configurado: faltan FIREBASE_ADMIN_CLIENT_EMAIL / " +
        "FIREBASE_ADMIN_PRIVATE_KEY / NEXT_PUBLIC_FIREBASE_PROJECT_ID."
    );
  }

  cachedApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return cachedApp;
}

/** Verifica un ID token de Firebase. Lanza si es inválido/expirado. */
export async function verifyIdToken(idToken: string): Promise<DecodedIdToken> {
  return getAuth(getAdminApp()).verifyIdToken(idToken);
}

/**
 * Mintea un Firebase custom token para un uid dado.
 * Se usa en el PUENTE: tras loguear con Supabase, generamos este token con el
 * mismo id para que el cliente inicie sesión en Firebase y Firestore (cuyas
 * reglas dependen del auth de Firebase) siga funcionando sin cambios.
 */
export async function createFirebaseCustomToken(
  uid: string,
  claims?: Record<string, unknown>
): Promise<string> {
  return getAuth(getAdminApp()).createCustomToken(uid, claims);
}

/** Lee el rol del usuario desde Firestore (users/{uid}.role). */
export async function getUserRole(uid: string): Promise<string | null> {
  const snap = await getFirestore(getAdminApp()).doc(`users/${uid}`).get();
  if (!snap.exists) return null;
  return (snap.data()?.role as string | undefined) ?? null;
}
