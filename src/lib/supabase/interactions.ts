/**
 * Favoritos + feedback por usuario sobre Supabase (public.discount_interactions).
 * Reemplaza la colección Firestore `user_discount_interactions`.
 * RLS: cada usuario ve/escribe solo lo suyo.
 */
import { supabase } from "./client";

const TABLE = "discount_interactions";

export type FeedbackValue = -1 | 0 | 1;

export interface UserDiscountInteraction {
  userId: string;
  discountId: string;
  favorite?: boolean;
  feedback?: FeedbackValue;
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface InteractionRow {
  user_id: string;
  discount_id: string;
  favorite: boolean;
  feedback: number;
  created_at: string;
  updated_at: string;
}

function requireIds(userId: string, discountId: string) {
  if (!userId || !discountId) {
    throw new Error("userId y discountId son requeridos");
  }
}

/** Interacción de un usuario con un descuento (favorito / feedback). */
export async function getUserInteraction(
  userId: string,
  discountId: string
): Promise<UserDiscountInteraction | null> {
  try {
    requireIds(userId, discountId);
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("user_id", userId)
      .eq("discount_id", discountId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const row = data as InteractionRow;
    return {
      userId: row.user_id,
      discountId: row.discount_id,
      favorite: !!row.favorite,
      feedback: (typeof row.feedback === "number"
        ? row.feedback
        : 0) as FeedbackValue,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    console.error("Error obteniendo interacción de descuento:", error);
    return null;
  }
}

/**
 * Alterna el estado de favorito para un par (usuario, descuento).
 * El upsert solo toca `favorite`/`updated_at`; conserva el `feedback` previo.
 * Devuelve el nuevo estado.
 */
export async function toggleFavorite(
  userId: string,
  discountId: string
): Promise<boolean> {
  requireIds(userId, discountId);

  const { data: existing, error: readError } = await supabase
    .from(TABLE)
    .select("favorite")
    .eq("user_id", userId)
    .eq("discount_id", discountId)
    .maybeSingle();
  if (readError) throw readError;

  const newFavorite = !(existing?.favorite ?? false);

  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: userId,
      discount_id: discountId,
      favorite: newFavorite,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,discount_id" }
  );
  if (error) throw error;

  return newFavorite;
}

/**
 * Guarda el feedback explícito del usuario sobre un descuento.
 * value: -1 (no le gustó), 0 (sin feedback), 1 (le gustó).
 */
export async function setFeedback(
  userId: string,
  discountId: string,
  value: FeedbackValue
): Promise<FeedbackValue> {
  requireIds(userId, discountId);

  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: userId,
      discount_id: discountId,
      feedback: value,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,discount_id" }
  );
  if (error) throw error;

  return value;
}

/** IDs de descuentos marcados como favoritos por un usuario. */
export async function getFavoriteDiscountIdsForUser(
  userId: string
): Promise<string[]> {
  if (!userId) return [];
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("discount_id")
      .eq("user_id", userId)
      .eq("favorite", true);
    if (error) throw error;
    return (data ?? []).map((r) => r.discount_id as string);
  } catch (error) {
    console.error("Error obteniendo favoritos del usuario:", error);
    return [];
  }
}
