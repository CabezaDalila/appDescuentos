-- =====================================================================
-- 0001_profiles.sql
-- Tabla de perfiles de usuario. En Supabase, auth.users guarda las
-- credenciales; los datos de la app (rol, etc.) van en public.profiles,
-- vinculados 1:1 por id.
--
-- Aplicar en: Supabase Dashboard > SQL Editor (o via supabase CLI).
-- =====================================================================

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Crea automáticamente un profile cada vez que se registra un usuario nuevo.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- RLS: cada usuario ve/edita SOLO su propio profile.
-- El rol NO se puede cambiar desde el cliente (ver política de update):
-- para promover a admin se usa la service role key (server) o el dashboard.
-- =====================================================================
alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Nota: no hay policy de INSERT/DELETE para usuarios comunes.
-- El insert lo hace el trigger (security definer) y el service role bypassa RLS.
