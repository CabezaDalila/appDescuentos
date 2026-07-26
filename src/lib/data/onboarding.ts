/**
 * Onboarding — ahora persistido en Supabase (public.profiles), no en Firestore.
 * Se mantiene la ruta y las firmas para no tocar los consumidores.
 */
import {
  getOnboarding,
  saveOnboarding,
} from "@/lib/supabase/profiles";

export interface OnboardingAnswers {
  spendingCategories: string[]; // Reemplaza interests
  mainGoal: string; // Reemplaza goals (selección única)
  banks?: string[];
  transportType?: string; // Reemplaza vehicleType
  allowLocationTracking?: boolean;
  estimatedMonthlyKm?: number; // Reservado para futuro (no se persiste aún)
}

/** Guarda las respuestas del onboarding y lo marca completado. */
export async function saveOnboardingAnswers(
  userId: string,
  answers: OnboardingAnswers
): Promise<void> {
  await saveOnboarding(userId, {
    spendingCategories: answers.spendingCategories || [],
    mainGoal: answers.mainGoal || "",
    banks: answers.banks || [],
    transportType: answers.transportType,
    allowLocationTracking: answers.allowLocationTracking || false,
  });
}

/** Obtiene las respuestas del onboarding, o null si no lo completó. */
export async function getOnboardingAnswers(
  userId: string
): Promise<OnboardingAnswers | null> {
  const o = await getOnboarding(userId);
  if (!o) return null;
  return {
    spendingCategories: o.spendingCategories,
    mainGoal: o.mainGoal,
    banks: o.banks ?? [],
    transportType: o.transportType,
    allowLocationTracking: o.allowLocationTracking ?? false,
  };
}
