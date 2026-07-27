/**
 * Acceso a datos de perfiles sobre Supabase (reemplaza Firestore users/{uid}).
 *
 * La tabla public.profiles tiene una fila por usuario (id = auth.users.id),
 * creada por el trigger on_auth_user_created. RLS: cada uno ve/edita la suya.
 */
import { supabase } from "@/lib/supabase/client";

/** Fila cruda de la tabla profiles. */
export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "user" | "admin";
  photo_url: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
  onboarding_completed: boolean;
  spending_categories: string[];
  main_goal: string | null;
  onboarding_banks: string[];
  transport_type: string | null;
  allow_location_tracking: boolean;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Forma "app" del perfil, compatible con lo que consumían los componentes que
 * leían el doc de Firestore (profile.onboarding.completed, profile.profile, ...).
 */
export interface UserProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: "user" | "admin";
  onboarding: {
    completed: boolean;
    spendingCategories: string[];
    mainGoal: string;
    banks: string[];
    transportType?: string;
    allowLocationTracking: boolean;
  };
  profile: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    birthDate: string | null;
    gender: string | null;
  };
  preferences: Record<string, unknown>;
}

/** Mapea la fila de Postgres a la forma "app". */
export function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.full_name,
    photoURL: row.photo_url,
    role: row.role,
    onboarding: {
      completed: row.onboarding_completed,
      spendingCategories: row.spending_categories ?? [],
      mainGoal: row.main_goal ?? "",
      banks: row.onboarding_banks ?? [],
      transportType: row.transport_type ?? undefined,
      allowLocationTracking: row.allow_location_tracking,
    },
    profile: {
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      birthDate: row.birth_date,
      gender: row.gender,
    },
    preferences: row.preferences ?? {},
  };
}

/** Trae el perfil de un usuario (o null si no existe / sin permiso). */
export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("Error al obtener el perfil:", error);
    return null;
  }
  return data ? mapProfile(data as ProfileRow) : null;
}

/**
 * Forma reducida de un perfil para el panel de admin (listado de usuarios).
 * Solo accesible para admins (RLS: profiles_select_admin).
 */
export interface AdminProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  role: "user" | "admin";
  createdAt: string; // ISO
}

/** Lista TODOS los perfiles (solo admin; ordenados por alta desc). */
export async function listAllProfiles(): Promise<AdminProfile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    email: (r.email as string | null) ?? null,
    displayName: (r.full_name as string | null) ?? null,
    role: (r.role as "user" | "admin") ?? "user",
    createdAt: r.created_at as string,
  }));
}

/** Cambia el rol de un usuario (solo admin; RLS: profiles_update_admin). */
export async function setUserRole(
  userId: string,
  role: "user" | "admin"
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

/** Lee solo el rol (para checks de admin). */
export async function getRole(userId: string): Promise<"user" | "admin" | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return (data.role as "user" | "admin") ?? null;
}

/** Actualiza campos del perfil (nombre, foto, teléfono, preferencias). */
export async function updateProfileFields(
  userId: string,
  fields: Partial<{
    full_name: string | null;
    photo_url: string | null;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    birth_date: string | null;
    gender: string | null;
    preferences: Record<string, unknown>;
  }>
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

export interface OnboardingAnswers {
  spendingCategories: string[];
  mainGoal: string;
  banks?: string[];
  transportType?: string;
  allowLocationTracking?: boolean;
}

/** Guarda las respuestas del onboarding y lo marca completado. */
export async function saveOnboarding(
  userId: string,
  answers: OnboardingAnswers
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding_completed: true,
      spending_categories: answers.spendingCategories ?? [],
      main_goal: answers.mainGoal ?? "",
      onboarding_banks: answers.banks ?? [],
      transport_type: answers.transportType ?? null,
      allow_location_tracking: answers.allowLocationTracking ?? false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw error;
}

/** Devuelve las respuestas del onboarding, o null si no lo completó. */
export async function getOnboarding(
  userId: string
): Promise<OnboardingAnswers | null> {
  const profile = await getProfile(userId);
  if (!profile || !profile.onboarding.completed) return null;
  const o = profile.onboarding;
  return {
    spendingCategories: o.spendingCategories,
    mainGoal: o.mainGoal,
    banks: o.banks,
    transportType: o.transportType,
    allowLocationTracking: o.allowLocationTracking,
  };
}
