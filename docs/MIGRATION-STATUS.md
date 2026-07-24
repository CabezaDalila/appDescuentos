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
  scraping_scripts + RLS + `is_admin()`), **0003** (funciones de voto).
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

## Pendiente ⏳ (orden sugerido)
1. **Admin** (desbloquea ver/crear discounts):
   - `src/lib/admin.ts` — CRUD de discounts (createManualDiscount,
     createScrapedDiscount, updateManualDiscount, getManualDiscounts) → Supabase
     (reusar el shim `discounts-data.ts`).
   - Scraping scripts (`getScrapingScripts`, etc.) → tabla `scraping_scripts`.
   - `components/admin/dashboard/AdminDashboard.tsx` y
     `components/admin/users/UsersManager.tsx` — leen/escriben `users` en Firestore
     → migrar a `profiles`. **Necesita policy RLS de admin en `profiles`** (hoy un
     admin no puede leer TODOS los perfiles; agregar
     `create policy ... using (public.is_admin())`).
2. **Notificaciones** — `src/lib/notifications.ts` (colección `notifications`) → tabla.
3. **Storage** — `profileService.uploadProfilePhoto` (fotos) → Supabase Storage.
   También revisar `routes.ts` (`users/{uid}/dailyRoutes`, usado por
   `useAIRecommendations`) — feature de tracking, sigue en Firestore.
4. **Cierre (Fase 7)** — eliminar el puente (`bridge.ts`,
   `/api/auth/firebase-bridge`, `firebase/admin-server.ts`), quitar deps de
   Firebase, borrar `firebase.js`/config. Recién ahí **mergear a `main`** y deployar.

## Patrón de la migración (importante)
- Cada dominio: crear/confirmar tabla + RLS → capa `src/lib/supabase/<dominio>.ts`
  → hacer que el módulo viejo re-exporte (para no tocar consumidores) → typecheck
  → boot smoke test → commit.
- **Ojo con escrituras Firestore inline** en páginas/componentes que bypassean los
  libs (ya pasó en `memberships/[id].tsx`). Grep por `doc(db`/`collection(db` por
  dominio antes de dar por cerrado.
