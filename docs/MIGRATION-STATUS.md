# Estado de la migración Firebase → Supabase (handoff)

> Rama de trabajo: **`feat/full-supabase-migration`** (NO mergeada a `main`).
> No mergear a `main` hasta terminar la Fase 7 (si no, prod queda a medias:
> discounts vacíos + crear-descuento del admin roto).

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
  `supabase_realtime`).
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

## Pendiente ⏳ (orden sugerido)
1. **Storage** — `profileService.uploadProfilePhoto` (fotos) → Supabase Storage.
   También revisar `routes.ts` (`users/{uid}/dailyRoutes`, usado por
   `useAIRecommendations`) — feature de tracking, sigue en Firestore.
2. **Cierre (Fase 7)** — eliminar el puente (`bridge.ts`,
   `/api/auth/firebase-bridge`, `firebase/admin-server.ts`), quitar deps de
   Firebase, borrar `firebase.js`/config. Recién ahí **mergear a `main`** y deployar.

## Patrón de la migración (importante)
- Cada dominio: crear/confirmar tabla + RLS → capa `src/lib/supabase/<dominio>.ts`
  → hacer que el módulo viejo re-exporte (para no tocar consumidores) → typecheck
  → boot smoke test → commit.
- **Ojo con escrituras Firestore inline** en páginas/componentes que bypassean los
  libs (ya pasó en `memberships/[id].tsx`). Grep por `doc(db`/`collection(db` por
  dominio antes de dar por cerrado.
