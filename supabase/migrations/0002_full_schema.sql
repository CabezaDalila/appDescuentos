-- =====================================================================
-- 0002_full_schema.sql
-- Schema completo para reemplazar Firestore. Dominios:
--   profiles (extendido), memberships, cards, discounts, discount_votes,
--   scraping_scripts, notifications.
-- Aplicar en: Supabase Dashboard > SQL Editor. Requiere 0001_profiles.sql.
-- =====================================================================

-- ── helper: ¿el usuario actual es admin? (para políticas RLS) ──────────
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ── profiles: columnas extra (perfil + onboarding) ─────────────────────
alter table public.profiles
  add column if not exists photo_url            text,
  add column if not exists first_name           text,
  add column if not exists last_name            text,
  add column if not exists phone                text,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists spending_categories  text[]  not null default '{}',
  add column if not exists main_goal            text,
  add column if not exists onboarding_banks     text[]  not null default '{}',
  add column if not exists transport_type       text,
  add column if not exists allow_location_tracking boolean not null default false,
  add column if not exists preferences          jsonb   not null default '{}';

-- ── memberships (antes users/{uid}/memberships) ────────────────────────
create table if not exists public.memberships (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  name       text not null,
  category   text not null,
  status     text not null default 'active' check (status in ('active','inactive')),
  color      text,
  logo_url   text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists memberships_user_id_idx on public.memberships (user_id);

-- ── cards (antes membership.cards[]) ───────────────────────────────────
create table if not exists public.cards (
  id            uuid primary key default gen_random_uuid(),
  membership_id uuid not null references public.memberships (id) on delete cascade,
  type          text not null check (type in ('Crédito','Débito')),
  brand         text not null,
  level         text,
  name          text,
  expiry_date   text,
  status        text not null default 'active' check (status in ('active','inactive')),
  created_at    timestamptz not null default now()
);
create index if not exists cards_membership_id_idx on public.cards (membership_id);

-- ── discounts (público; escritura solo admin) ──────────────────────────
create table if not exists public.discounts (
  id                    uuid primary key default gen_random_uuid(),
  name                  text,
  title                 text,
  description           text,
  category              text,
  discount_percentage   numeric,
  discount_amount       numeric,
  valid_from            timestamptz,
  expiration_date       timestamptz,
  terms                 text,
  image_url             text,
  origin                text,
  type                  text,
  status                text default 'active' check (status in ('active','inactive','expired')),
  source                text check (source in ('manual','scraping')),
  approval_status       text default 'pending' check (approval_status in ('pending','approved','rejected')),
  reviewed_by           uuid references public.profiles (id),
  reviewed_at           timestamptz,
  rejection_reason      text,
  is_visible            boolean not null default true,
  bancos                text[]  not null default '{}',
  available_memberships text[]  not null default '{}',
  membership_required   text[]  not null default '{}',
  available_credentials jsonb   not null default '[]',
  location              jsonb,
  upvotes               integer not null default 0,
  downvotes             integer not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index if not exists discounts_status_idx on public.discounts (status, is_visible, approval_status);
create index if not exists discounts_category_idx on public.discounts (category);

-- ── discount_votes ─────────────────────────────────────────────────────
create table if not exists public.discount_votes (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  discount_id uuid not null references public.discounts (id) on delete cascade,
  vote        text not null check (vote in ('up','down')),
  created_at  timestamptz not null default now(),
  primary key (user_id, discount_id)
);

-- ── scraping_scripts (admin) ───────────────────────────────────────────
create table if not exists public.scraping_scripts (
  id            uuid primary key default gen_random_uuid(),
  site_name     text not null,
  script        text,
  frequency     text not null default 'manual' check (frequency in ('manual','hourly','daily','weekly')),
  is_active     boolean not null default true,
  last_executed timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── notifications (por usuario) ────────────────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  title      text not null,
  body       text,
  type       text,
  data       jsonb,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_id_idx on public.notifications (user_id, read);

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.memberships     enable row level security;
alter table public.cards           enable row level security;
alter table public.discounts       enable row level security;
alter table public.discount_votes  enable row level security;
alter table public.scraping_scripts enable row level security;
alter table public.notifications   enable row level security;

-- memberships: dueño
create policy "memberships_own" on public.memberships
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- cards: vía membership del dueño
create policy "cards_own" on public.cards
  for all using (
    exists (select 1 from public.memberships m
            where m.id = cards.membership_id and m.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.memberships m
            where m.id = cards.membership_id and m.user_id = auth.uid())
  );

-- discounts: lectura pública de aprobados/visibles; cualquier auth ve todo lo suyo
--            escritura solo admin.
create policy "discounts_read_public" on public.discounts
  for select using (
    (approval_status = 'approved' and is_visible = true) or public.is_admin()
  );
create policy "discounts_write_admin" on public.discounts
  for all using (public.is_admin()) with check (public.is_admin());

-- discount_votes: dueño
create policy "votes_own" on public.discount_votes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- scraping_scripts: solo admin
create policy "scripts_admin" on public.scraping_scripts
  for all using (public.is_admin()) with check (public.is_admin());

-- notifications: el dueño lee/actualiza (marcar leídas). El insert lo hace el
-- servidor con service role (bypassa RLS).
create policy "notifications_read_own" on public.notifications
  for select using (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
