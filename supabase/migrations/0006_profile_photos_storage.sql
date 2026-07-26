-- =====================================================================
-- 0006_profile_photos_storage.sql
-- Bucket de Supabase Storage para fotos de perfil (reemplaza Firebase
-- Storage). Los objetos se guardan como `{userId}/{timestamp}.ext`, así que
-- la primera carpeta del path === auth.uid() habilita el scoping por dueño.
--
-- Aplicar en: Supabase Dashboard > SQL Editor (corre como postgres, que puede
-- gestionar policies de storage.objects).
-- =====================================================================

-- Bucket público (las fotos se sirven por URL pública; la escritura la
-- gobiernan las policies de abajo).
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do update set public = excluded.public;

-- Lectura pública de los objetos del bucket (además, al ser público, la URL
-- pública se sirve sin auth).
drop policy if exists "profile_photos_read" on storage.objects;
create policy "profile_photos_read"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

-- Alta: un usuario autenticado solo puede subir a SU carpeta (`{uid}/...`).
drop policy if exists "profile_photos_insert_own" on storage.objects;
create policy "profile_photos_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update (upsert / reemplazo) solo sobre lo propio.
drop policy if exists "profile_photos_update_own" on storage.objects;
create policy "profile_photos_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Borrado solo sobre lo propio.
drop policy if exists "profile_photos_delete_own" on storage.objects;
create policy "profile_photos_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
