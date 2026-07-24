-- =====================================================================
-- 0009_support_content.sql
-- Contenido de soporte (antes colecciones Firestore `support_faqs` y
-- `support_terms/content`): FAQs y Términos/Privacidad.
-- Lectura pública (las páginas de soporte son públicas); escritura solo admin.
--
-- Aplicar en: Supabase Dashboard > SQL Editor. Requiere 0001 + 0002 (is_admin).
-- =====================================================================

-- ── FAQs ───────────────────────────────────────────────────────────────
create table if not exists public.support_faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,
  "order"    integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists support_faqs_order_idx on public.support_faqs ("order");

-- ── Términos / Privacidad (fila única, id fijo 'content') ───────────────
create table if not exists public.support_terms (
  id                text primary key default 'content',
  terms_of_service  text not null default '',
  privacy_policy    text not null default '',
  updated_at        timestamptz not null default now()
);

alter table public.support_faqs  enable row level security;
alter table public.support_terms enable row level security;

-- Lectura pública (anon + auth).
drop policy if exists "support_faqs_read" on public.support_faqs;
create policy "support_faqs_read"
  on public.support_faqs for select using (true);

drop policy if exists "support_terms_read" on public.support_terms;
create policy "support_terms_read"
  on public.support_terms for select using (true);

-- Escritura solo admin.
drop policy if exists "support_faqs_write_admin" on public.support_faqs;
create policy "support_faqs_write_admin"
  on public.support_faqs for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "support_terms_write_admin" on public.support_terms;
create policy "support_terms_write_admin"
  on public.support_terms for all
  using (public.is_admin()) with check (public.is_admin());
