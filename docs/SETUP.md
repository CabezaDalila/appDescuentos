# Setup del proyecto — App de Descuentos

Guía para levantar el proyecto desde cero en tu máquina y entender cómo funciona
la autenticación. Si algo no anda, mirá **Troubleshooting** al final.

---

## 1. Requisitos

- **Node.js 20+** y **npm**
- **Vercel CLI**: `npm i -g vercel` (necesaria para bajar las variables de entorno)
- Acceso al proyecto en Vercel (`app-descuentos`) — pedíselo al dueño de la cuenta.

## 2. Clonar e instalar

```bash
git clone https://github.com/CabezaDalila/appDescuentos.git
cd appDescuentos
npm install
```

## 3. Variables de entorno

La mayoría de las variables se **bajan de Vercel**, no se copian a mano.

### 3.1 Bajar de Vercel (trae casi todo)

```bash
vercel login            # una vez
vercel link             # elegí el proyecto "app-descuentos"
vercel env pull .env.local --environment=production
```

Esto crea `.env.local` con Firebase (cliente), Supabase, Postgres, Gemini,
OneSignal, etc. Ver `.env.example` para la lista y de dónde sale cada una.

### 3.2 Agregar el service account de Firebase (MANUAL)

Vercel **no** exporta las claves marcadas como "sensitive", así que estas dos
hay que agregarlas a mano al `.env.local`:

```
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Cómo obtenerlas:
1. [Firebase Console](https://console.firebase.google.com/) → proyecto **app-descuentos-9b546**.
2. ⚙️ **Configuración del proyecto → Cuentas de servicio → SDK de Firebase Admin**.
3. **Generar nueva clave privada** → baja un JSON.
4. Del JSON, copiá `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`, y `private_key`
   (tal cual, con comillas y los `\n`) → `FIREBASE_ADMIN_PRIVATE_KEY`.

> Estas dos son necesarias para el **puente Supabase→Firebase** y para los
> **guards** de las API routes. Sin ellas el login server-side falla.

> ⚠️ El `.env.local` **nunca** se commitea (está en `.gitignore`).

## 4. Correr en local

```bash
npm run dev
```

Levanta en **http://localhost:3007** (puerto fijo — ver nota abajo).
Entrá a http://localhost:3007/login y probá **Continuar con Google**.

> **¿Por qué 3007?** El puerto está fijado en `package.json` (`next dev -p 3007`)
> porque tiene que coincidir con lo configurado en Supabase (Redirect URLs) y
> Google (JS origins). Si lo cambiás, actualizá también esos dos lugares (§6).

---

## 5. Cómo funciona la autenticación (IMPORTANTE)

El login lo maneja **Supabase**, pero los **datos de usuario siguen en Firestore**
(onboarding, membresías, tarjetas, votos…). Como las reglas de Firestore dependen
del login de Firebase, usamos un **puente temporal**:

```
Usuario → login con Supabase (Google/email)
        → POST /api/auth/firebase-bridge  (verifica el token de Supabase)
        → mintea un Firebase custom token con el mismo uid
        → el cliente inicia sesión en Firebase  →  Firestore sigue funcionando
```

Archivos clave:
| Archivo | Rol |
|---------|-----|
| `src/lib/supabase/auth.ts` | login / register / Google (web + nativo) sobre Supabase |
| `src/lib/supabase/bridge.ts` | `ensureFirebaseSession()` — llama al puente tras loguear |
| `src/pages/api/auth/firebase-bridge.ts` | endpoint que mintea el Firebase custom token |
| `src/lib/firebase/admin-server.ts` | firebase-admin server (custom token + verify) |
| `src/hooks/useAuth.tsx` | fuente de verdad de la sesión; devuelve un usuario adaptado |
| `src/lib/server/auth.ts` | `requireUser` / `requireAdmin` para proteger API routes |

> **Es andamio temporal.** Cuando se migren los datos de Firestore a Postgres, se
> elimina el puente y Firebase por completo. Hasta entonces, no lo saques.

El `useAuth().user` tiene forma tipo-Firebase (`uid`, `email`, `displayName`,
`photoURL`, `emailVerified`) para que el resto de la app no haya tenido que
cambiar. Se construye desde el usuario de Supabase (ver `adaptUser` en
`src/lib/supabase/auth.ts`).

## 5.1 Hacer admin a un usuario

El rol vive en **Firestore** (`users/{uid}.role`), no en Supabase. Para hacer admin
a alguien, después de que se logueó al menos una vez (para que exista su doc):

- Firebase Console → **Firestore** → colección `users` → doc del usuario → campo
  `role` = `admin`.

Los guards (`requireAdmin`) y el `useAdmin()` del cliente leen ese campo.

## 6. Config externa del login con Google (referencia)

Si hay que tocar el OAuth de Google, estos son los 3 lugares que deben coincidir:

1. **Supabase → Authentication → Providers → Google**
   - Client ID: `531405194203-shv95d1bsnjphhvmtrr95g1ssafna0go.apps.googleusercontent.com`
   - Client Secret: el del mismo cliente en Google Cloud.
2. **Supabase → Authentication → URL Configuration**
   - Site URL: `http://localhost:3007` (en prod: la URL de Vercel)
   - Redirect URLs: `http://localhost:3007/**` (+ la de prod)
3. **Google Cloud Console** (proyecto `app-descuentos-9b546`, cliente Web `531405194203-shv95...`)
   - Orígenes JS autorizados: `http://localhost:3007`
   - URIs de redireccionamiento: `https://jhkkvldybkohejhpsbuc.supabase.co/auth/v1/callback`

### Login nativo en la APK (Capacitor)

El flujo web usa `signInWithOAuth` (redirect). En la APK, el plugin
`@codetrix-studio/capacitor-google-auth` devuelve un **idToken** de Google que se
le pasa a Supabase con `signInWithIdToken` (ver `loginWithGoogleNative` en
`src/lib/supabase/auth.ts`). Para que Supabase lo acepte:

- En **Supabase → Auth → Providers → Google → "Client IDs"** tiene que estar el
  **Web Client ID** (ya está: `531405194203-shv95...`).
- El `serverClientId` que usa el plugin debe ser ese **Web Client ID** (no el de
  Android).
- El **Android client** (`com.tesis.descuentos.test`) debe existir en el mismo
  proyecto de Google Cloud con el SHA-1 del keystore de la app.

> ⚠️ El login nativo **todavía no fue probado end-to-end en un dispositivo/APK** —
> solo el flujo web. Validar antes de publicar la app.

## 7. Deploy a producción (Vercel)

Antes de que ande en prod, verificá que en Vercel estén cargadas:
- `FIREBASE_ADMIN_CLIENT_EMAIL` y `FIREBASE_ADMIN_PRIVATE_KEY` (NO se sincronizan solas).
- El dominio de prod agregado a las Redirect URLs de Supabase y a Google (§6).

---

## Troubleshooting

- **`Error 400: redirect_uri_mismatch` (pantalla de Google)**
  Falta registrar el callback de Supabase en Google Cloud → agregá
  `https://jhkkvldybkohejhpsbuc.supabase.co/auth/v1/callback` en "URIs de
  redireccionamiento autorizados" del cliente Web. Puede tardar 1-2 min.

- **`Unable to exchange external code` (vuelve a /login con error)**
  El **Client Secret** en Supabase no coincide con el Client ID. Generá un secret
  nuevo en Google Cloud (cliente Web) y pegalo en Supabase → Google → Save.

- **La app arranca en otro puerto (3000/3001)**
  El 3007 estaba ocupado. Cerrá lo que lo use, o si querés otro puerto, cambialo
  en `package.json` **y** en Supabase/Google (§6).

- **Firestore tira permission-denied después de loguear**
  El puente no completó (falta el service account de Firebase, §3.2) o falló
  `/api/auth/firebase-bridge`. Revisá la consola del server.
