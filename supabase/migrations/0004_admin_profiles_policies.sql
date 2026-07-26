-- =====================================================================
-- 0004_admin_profiles_policies.sql
-- Políticas RLS de admin sobre public.profiles.
--
-- Hasta acá, profiles solo permitía a cada usuario ver/editar SU fila
-- (0001). El panel de admin (UsersManager, AdminDashboard) necesita:
--   - LEER todos los perfiles (listado de usuarios + métricas).
--   - CAMBIAR el rol de otros usuarios (hacer/quitar admin).
-- Ambas cosas se habilitan solo para admins vía public.is_admin()
-- (definida en 0002, SECURITY DEFINER: no recursiona con RLS de profiles).
--
-- Aplicar en: Supabase Dashboard > SQL Editor. Requiere 0001 + 0002.
-- =====================================================================

-- Un admin puede leer TODOS los perfiles (además de su propia fila,
-- cubierta por profiles_select_own).
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_admin());

-- Un admin puede actualizar cualquier perfil (ej. promover/degradar rol).
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());
