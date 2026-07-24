-- =====================================================================
-- 0005_notifications_delete_realtime.sql
-- Cierra dos huecos del dominio notifications (creado en 0002) para que
-- el hook useNotifications (antes onSnapshot de Firestore) ande igual:
--   1) DELETE: el usuario podía borrar sus notificaciones en Firestore,
--      pero 0002 no creó policy de delete → hoy RLS lo bloquea.
--   2) Realtime: onSnapshot era en vivo; Supabase necesita la tabla en la
--      publicación supabase_realtime para emitir postgres_changes.
--
-- Aplicar en: Supabase Dashboard > SQL Editor. Requiere 0002.
-- =====================================================================

-- El dueño puede borrar sus propias notificaciones.
drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- El dueño puede crear notificaciones PARA SÍ MISMO (el listener de OneSignal
-- en el browser persiste la push recibida como notificación in-app). El
-- broadcast a otros usuarios lo sigue haciendo el servidor con service role.
drop policy if exists "notifications_insert_own" on public.notifications;
create policy "notifications_insert_own"
  on public.notifications for insert
  with check (auth.uid() = user_id);

-- Habilita realtime (postgres_changes) para la tabla. Idempotente.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
