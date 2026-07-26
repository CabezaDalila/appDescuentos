-- =====================================================================
-- 0007_ai_recommendations.sql
-- Cache por usuario de la última recomendación de IA (antes en Firestore
-- users/{uid}/aiRecommendations/latest). Un blob jsonb por usuario, con TTL
-- de 24h que aplica el cliente (getLatestAIRecommendation).
--
-- Nota: dailyRoutes / routesSummary de firebase/routes.ts eran código muerto
-- (0 consumidores) y se eliminan sin tabla equivalente.
--
-- Aplicar en: Supabase Dashboard > SQL Editor. Requiere 0001.
-- =====================================================================

create table if not exists public.ai_recommendations (
  user_id    uuid primary key references public.profiles (id) on delete cascade,
  data       jsonb not null,
  saved_at   timestamptz not null default now()
);

alter table public.ai_recommendations enable row level security;

-- Dueño: lee/escribe/borra solo lo suyo.
drop policy if exists "ai_recommendations_own" on public.ai_recommendations;
create policy "ai_recommendations_own"
  on public.ai_recommendations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
