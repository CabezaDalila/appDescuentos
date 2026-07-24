-- =====================================================================
-- 0008_discount_interactions.sql
-- Favoritos + feedback por usuario (antes colección Firestore
-- `user_discount_interactions`, doc id `${userId}_${discountId}`).
-- Un registro por par (usuario, descuento).
--
-- El contador denormalizado que Firestore mantenía en el doc del descuento
-- NO se replica: se computa en vivo cuando hace falta (y de todos modos RLS
-- no deja a un usuario común escribir en `discounts`).
--
-- Aplicar en: Supabase Dashboard > SQL Editor. Requiere 0001 + 0002.
-- =====================================================================

create table if not exists public.discount_interactions (
  user_id     uuid not null references public.profiles (id)  on delete cascade,
  discount_id uuid not null references public.discounts (id) on delete cascade,
  favorite    boolean  not null default false,
  feedback    smallint not null default 0 check (feedback in (-1, 0, 1)),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, discount_id)
);

-- Para listar los favoritos de un usuario y contar favoritos de un descuento.
create index if not exists discount_interactions_user_fav_idx
  on public.discount_interactions (user_id) where favorite;
create index if not exists discount_interactions_discount_fav_idx
  on public.discount_interactions (discount_id) where favorite;

alter table public.discount_interactions enable row level security;

-- Dueño: lee/escribe/borra solo lo suyo.
drop policy if exists "discount_interactions_own" on public.discount_interactions;
create policy "discount_interactions_own"
  on public.discount_interactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
