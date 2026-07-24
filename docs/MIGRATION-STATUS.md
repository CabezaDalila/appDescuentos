# Estado de la migración Firebase → Supabase (handoff)

> Rama de trabajo: **`feat/full-supabase-migration`** (NO mergeada a `main`).
> ✅ **Firebase ELIMINADO por completo** (datos + auth + deps). Antes de mergear
> a `main`: **probar en vivo los flujos de auth** (ver "Fase 7" abajo) — no se
> pudieron probar en el entorno de dev sin credenciales/mails reales.

## Objetivo
Sacar Firebase por completo, migrando todos los datos a Supabase/Postgres.
**No se preservan datos** (eran de test) — las tablas arrancan limpias.
Auth ya estaba en Supabase (con puente a Firebase para que Firestore siguiera
funcionando); esta migración va sacando dominio por dominio y al final elimina
el puente + Firebase.

## Setup para retomar
- Conexión a Postgres (para aplicar migraciones) en `.env.local`:
  `POSTGRES_URL_NON_POOLING` (Session pooler IPv4:
  `aws-1-us-west-2.pooler.supabase.com:5432`, user `postgres.jhkkvldybkohejhpsbuc`).
- Aplicar migración: leer la password de esa URL y
  `PGPASSWORD=... psql "host=... user=... dbname=postgres" -f supabase/migrations/000X.sql`
- Migraciones aplicadas: **0001** (profiles + trigger + RLS), **0002** (schema
  completo: memberships, cards, discounts, discount_votes, notifications,
  scraping_scripts + RLS + `is_admin()`), **0003** (funciones de voto),
  **0004** (policies de admin en `profiles`: select/update con `is_admin()`),
  **0005** (notifications: policies insert/delete-own + tabla en la publicación
  `supabase_realtime`), **0006** (bucket `profile-photos` + policies de
  `storage.objects`: read público, insert/update/delete scoped a `{uid}/`),
  **0007** (tabla `ai_recommendations`: cache por usuario, RLS owner-only),
  **0008** (tabla `discount_interactions`: favoritos+feedback, RLS owner-only),
  **0009** (tablas `support_faqs` + `support_terms`: read público, write admin).
- Dev server: `npm run dev` → **puerto fijo 3007** (coincide con Supabase/Google OAuth).
- Admin: el rol vive en `public.profiles.role`. `dalilacabeza@gmail.com` ya es admin.
  (El `useAdmin` cachea en memoria: si cambia el rol, hard-reload.)

## Hecho ✅
- **Fase 1** — profiles, onboarding, rol, guards de API, auth-header → Supabase.
  - `src/lib/supabase/profiles.ts`, `useUserProfile` (realtime), `onboarding.ts`,
    `profileService.js`, `checkAdminRole`, `src/lib/server/auth.ts`.
- **Fase 2** — memberships + cards → Supabase.
  - `src/lib/supabase/memberships.ts`; `firebase/memberships.js` re-exporta.
  - Tarjetas normalizadas (tabla `cards` con FK), RLS por dueño.
- **Fase 3** — discounts + votos → Supabase.
  - `src/lib/supabase/discounts-data.ts` = **shim doc-like** (`.id`/`.data()`/`.toDate()`)
    que deja `src/lib/discounts.ts` reusar su lógica (distancia/trending/matching).
  - Votos: RPC Postgres `vote_discount` / `remove_vote` (SECURITY DEFINER),
    `firebase/discount-votes.ts` reescrito.
- Fix seguridad: `cache.clear()` en logout (no filtrar datos entre usuarios).
- **Fase 4 (Admin)** — CRUD de discounts + scraping + dashboard + users → Supabase.
  - `src/lib/admin.ts`: scraping scripts (`getScrapingScripts`/create/update/
    delete/execute) → tabla `scraping_scripts`; discounts (createManual/
    createScraped/updateManual/getManual) → shim `discounts-data.ts`. Sin Firebase.
  - Shim `discounts-data.ts`: + `deleteDiscountRow` / `deleteDiscountRows`.
  - `discount-utils.ts` (delete simple + múltiple) → shim.
  - Escrituras inline migradas: `ActiveDiscountsManager` y
    `DiscountApprovalManager` (`updateDoc` → `updateDiscountRow`).
  - `profiles.ts`: + `listAllProfiles` / `setUserRole` (admin).
  - `AdminDashboard.tsx` y `UsersManager.tsx` → `profiles` (0004 habilita RLS admin).
  - **Ojo**: el campo `url` de un discount NO tiene columna en Postgres (el shim
    lo ignora en insert/update, decisión de Fase 3). Si se quiere conservar,
    agregar columna `url` a `discounts` + al `WRITE_MAP`/`rowToData` del shim.

- **Fase 5 (Notificaciones)** — colección `notifications` → tabla Postgres.
  - `notifications.ts` (SERVIDOR, service role): `saveNotification` +
    `saveNotificationForAllUsers` (insert masivo). Consumido por
    `api/notifications/send.ts` (ya no toca Firestore para users/notifs).
  - `supabase/notifications-client.ts` (BROWSER): `saveOwnNotification`
    (insert de la propia, RLS `notifications_insert_own`) — lo usa
    `onesignal-config.ts` al recibir/abrir una push.
  - `useNotifications.tsx` → Supabase: carga + realtime (canal
    `postgres_changes` filtrado por `user_id`) + markAsRead/markAllAsRead/
    delete, con update optimista.
  - `admin-server.ts`: se exporta `getAdminClient()` (service role) para el
    insert server-side.
  - **Ojo prod**: el insert server-side (broadcast / notificar a OTRO usuario)
    necesita `SUPABASE_SERVICE_ROLE_KEY` en el server. Sin ella cae al anon y
    RLS bloquea insertar filas de otros. Las propias (browser) y las lecturas
    andan igual. Verificar la env en Vercel.

- **Fase 6 (Storage)** — foto de perfil → Supabase Storage.
  - `profileService.uploadProfilePhoto` sube a `profile-photos/{uid}/{ts}.ext`
    y devuelve la URL pública. Sin `firebase/storage`. Chequea sesión con
    `supabase.auth.getSession()`. Migración 0006 (bucket + RLS), aplicada.
  - Único `firebase/storage` que queda: `firebase.js` (init/export `storage`),
    se borra en Fase 7.

- **Fase 6.5 (IA/rutas)** — `aiRecommendations` (cache) → tabla
  `ai_recommendations` (upsert + TTL 24h en `supabase/recommendations.ts`).
  `firebase/routes.ts` ahora solo re-exporta. Las funciones de tracking
  (`dailyRoutes`/`routesSummary`/`hasLocationTrackingEnabled`) eran **código
  muerto (0 consumidores)** → eliminadas sin tabla.

- **Fase 6.6 (rápidos)** — HECHO:
  - Preferencias: `firebase/user.js` → `profiles.preferences`
    (`updateProfileFields`/`getProfile`). Consumidor UserSettingsModal intacto.
  - Writes/reads inline de discounts: `DiscountVote.tsx` y
    `pages/discount/[id].tsx` usan `fetchDiscountDoc` del shim (ya no
    `doc(db,"discounts")`). Nota: `points` no existe en Postgres (el shim lo
    expone como 0); estos reads quedan en 0, igual que ya pasaba en el híbrido.
  - `firebase/admin.ts` borrado (era código muerto, 0 consumidores).

- **Fase 6.7 (favoritos + soporte)** — HECHO. Ya NO queda Firestore de datos:
  - Favoritos/feedback → `supabase/interactions.ts` sobre
    `discount_interactions` (upsert por dueño). `firebase/interactions.ts`
    re-exporta. `getFavoritesCountForDiscount` se eliminó (era dead code).
  - FAQ/Términos → `supabase/support-content.ts` sobre `support_faqs` +
    `support_terms`. `firebase/support-content.ts` re-exporta.

- **Fase 7 (CIERRE — Firebase eliminado)** — HECHO en código:
  - Puente borrado: `supabase/bridge.ts`, `/api/auth/firebase-bridge.ts`,
    `firebase/firebase-auth.js`, `firebase/firebase.js`, `firebase/admin-server.ts`.
  - `useAuth` y `supabase/auth.ts` ya no llaman al puente.
  - **Auth migrado a Supabase nativo**:
    - `AuthForm`: `signOut` de Firebase → `supabase.auth.signOut()`.
    - `ResetPassword`: usa la sesión de RECUPERACIÓN de Supabase
      (`onAuthStateChange`/`PASSWORD_RECOVERY` + `updateUser({password})`) en vez
      del `oobCode`/`confirmPasswordReset` de Firebase.
    - `verify-email`: `verifyOtp({token_hash,type})` + fallback de sesión, en vez
      de `applyActionCode`.
  - `firebase` y `firebase-admin` sacados del `package.json` (`npm install`
    removió 168 paquetes). Ningún import de `firebase*` queda en `src`.
  - Typecheck OK. Smoke: /login /reset-password /verify-email /home /admin 200,
    build sin firebase en node_modules.

## Pendiente ⏳ — PROBAR EN VIVO antes de mergear a `main`
No se pudo probar auth de punta a punta en dev (sin mails/credenciales reales).
Verificar en un entorno con la config de Supabase Auth real:
1. **Login** email/password (incluye el caso "email no confirmado").
2. **Registro** → llega el mail de confirmación (Supabase) → el link confirma y
   cae en `/login`. Confirmar que el template/redirect de Supabase apunta bien.
3. **Reset password**: pedir reset → mail → link a `/reset-password` → setear
   nueva clave. Confirmar redirect URL permitida en Supabase (Auth → URL config).
4. **Verify-email** con `token_hash` (si el template usa esa variante).
5. **Google OAuth** (web y nativo Capacitor).

### Limpieza cosmética (opcional, no bloquea)
- La carpeta `src/lib/firebase/` quedó con módulos que YA son Supabase
  (`auth-header.ts`, `interactions.ts`, `support-content.ts`, `routes.ts`,
  `user.js`, `memberships.js`, `profileService.js`, `onboarding.ts`,
  `discount-votes.ts`). Renombrarla a `src/lib/` o `src/lib/data/` es puro
  cosmético (toca muchos imports); no afecta funcionalidad.
- Envs `NEXT_PUBLIC_FIREBASE_*` ya no se usan: se pueden borrar de Vercel/.env.

## Patrón de la migración (importante)
- Cada dominio: crear/confirmar tabla + RLS → capa `src/lib/supabase/<dominio>.ts`
  → hacer que el módulo viejo re-exporte (para no tocar consumidores) → typecheck
  → boot smoke test → commit.
- **Ojo con escrituras Firestore inline** en páginas/componentes que bypassean los
  libs (ya pasó en `memberships/[id].tsx`). Grep por `doc(db`/`collection(db` por
  dominio antes de dar por cerrado.
