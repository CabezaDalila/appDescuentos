/**
 * Cache por usuario de la última recomendación de IA sobre Supabase
 * (public.ai_recommendations). Reemplaza el doc Firestore
 * users/{uid}/aiRecommendations/latest. TTL de 24h aplicado en lectura.
 */
import { supabase } from "@/lib/supabase/client";
import type { HomePageDiscount } from "@/types/discount";
import type {
  AIRecommendation,
  AIRecommendationWithDiscounts,
} from "@/types/recommendations";

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

/** Quita claves `undefined` (no válidas en JSON) recursivamente. */
function removeUndefinedFields<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj
      .map((item) => removeUndefinedFields(item))
      .filter((item) => item !== undefined) as unknown as T;
  }
  if (typeof obj === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) cleaned[key] = removeUndefinedFields(value);
    }
    return cleaned as T;
  }
  return obj;
}

/** Guarda (upsert) la última recomendación de IA con sus descuentos completos. */
export async function saveAIRecommendation(
  userId: string,
  recommendation: AIRecommendation,
  fullDiscounts: HomePageDiscount[]
): Promise<void> {
  const payload: AIRecommendationWithDiscounts = {
    ...recommendation,
    fullDiscounts,
    savedAt: Date.now(),
  };

  const { error } = await supabase.from("ai_recommendations").upsert({
    user_id: userId,
    data: removeUndefinedFields(payload),
    saved_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/**
 * Última recomendación de IA. Si pasaron más de 24h, borra la fila y devuelve
 * null (mismo comportamiento que en Firestore).
 */
export async function getLatestAIRecommendation(
  userId: string
): Promise<AIRecommendationWithDiscounts | null> {
  const { data, error } = await supabase
    .from("ai_recommendations")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const rec = data.data as AIRecommendationWithDiscounts;
  const age = Date.now() - (rec.savedAt || 0);
  if (age > CACHE_DURATION_MS) {
    await supabase.from("ai_recommendations").delete().eq("user_id", userId);
    return null;
  }
  return rec;
}
