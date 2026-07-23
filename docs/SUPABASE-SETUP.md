# Setup de Supabase — auth (migración desde Firebase)

Pasos que hago **yo** (código) vs los que hacés **vos** (dashboard/cuenta).
Marcá cada uno; cuando termines los tuyos, hacemos el cutover del login y probamos.

---

## 1. Crear el proyecto  · lo hacés vos

- [ ] Entrá a https://supabase.com → **New project**.
- [ ] Región: **South America (São Paulo)** — la más cercana a Argentina.
- [ ] Guardá la **database password** en un lugar seguro.

## 2. Credenciales → `.env.local`  · lo hacés vos

En **Project Settings → API**, copiá a tu `.env.local` (ver `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>   ← SECRETA, nunca al browser ni al repo
```

> No me tenés que pasar estas claves por el chat. El código las lee de env;
> alcanza con que estén en tu `.env.local` (y luego en Vercel).

## 3. Crear la tabla de perfiles  · lo hacés vos (1 clic)

- [ ] Dashboard → **SQL Editor** → New query → pegá el contenido de
      [`supabase/migrations/0001_profiles.sql`](../supabase/migrations/0001_profiles.sql) → **Run**.
- Crea `public.profiles` (con `role`), el trigger que la puebla al registrarse, y RLS.

## 4. Habilitar login con Google  · lo hacés vos (la parte fina)

Necesitás un **OAuth 2.0 Web client** en Google Cloud (podés reusar tu proyecto Google actual).

- [ ] **Google Cloud Console** → APIs y servicios → Credenciales → crear/usar un
      **ID de cliente OAuth → Aplicación web**. Anotá el **Client ID** y **Client secret**.
- [ ] En ese Web client, agregá en **URIs de redirección autorizados**:
      ```
      https://<ref>.supabase.co/auth/v1/callback
      ```
- [ ] **Supabase Dashboard → Authentication → Providers → Google** → activá y pegá
      el **Client ID** + **Client secret** del Web client. Guardá.

### Para el login nativo en la APK (Capacitor)
El plugin `@codetrix-studio/capacitor-google-auth` (ya instalado) devuelve un
**idToken** de Google que le pasamos a Supabase (`signInWithIdToken`). Para que
Supabase lo acepte:

- [ ] En **Authentication → Providers → Google → "Authorized Client IDs"** agregá
      **el mismo Web Client ID** del paso anterior.
- [ ] El `serverClientId` del plugin (en `capacitor.config.ts` / config de la app)
      debe ser ese **Web Client ID** (no el de Android). Esto lo ajusto yo en el código.

## 5. Cutover del login  · lo hago yo (código), lo probamos juntos

Una vez que tengas 1–4 listos, en una sola pasada:
- Reescribo `useAuth`, el `AuthForm` y el flujo de Google (web + nativo) sobre Supabase.
- Conecto los guards de las API (`requireUser`/`requireAdmin`) al token de Supabase
  (reemplazando la capa de firebase-admin, que queda sin uso).
- Levantamos el dev server con tus `.env.local` y probamos login web end-to-end.

## 6. Hacerte admin  · lo hacés vos (después del primer login)

Tras loguearte una vez (para que exista tu fila en `profiles`):

- [ ] SQL Editor → `update public.profiles set role = 'admin' where email = 'TU_EMAIL';`

---

### Estado actual del código (ya hecho, inerte hasta el cutover)
- `src/lib/supabase/client.ts` — cliente browser (anon key)
- `src/lib/supabase/admin-server.ts` — cliente server (service role): verifica token + lee rol
- `supabase/migrations/0001_profiles.sql` — tabla profiles + trigger + RLS
- `.env.example` — variables documentadas
