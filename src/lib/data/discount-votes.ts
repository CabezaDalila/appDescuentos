/**
 * Votos de descuentos — Supabase. El voto y la actualización de contadores se
 * hacen en una función Postgres SECURITY DEFINER (ver 0003_vote_functions.sql)
 * para atomicidad y para sortear la RLS solo-admin de discounts.
 * Se mantiene la ruta para no tocar los consumidores.
 */
import { supabase } from "@/lib/supabase/client";

export type VoteType = "up" | "down";

export interface DiscountVote {
  userId: string;
  discountId: string;
  vote: VoteType;
  createdAt: unknown;
}

/** Vota por un descuento (up/down). El userId se toma de la sesión. */
export async function voteDiscount(
  _userId: string,
  discountId: string,
  vote: VoteType
): Promise<void> {
  const { error } = await supabase.rpc("vote_discount", {
    p_discount_id: discountId,
    p_vote: vote,
  });
  if (error) {
    console.error("Error al votar por el descuento:", error);
    throw error;
  }
}

/** Devuelve el voto del usuario para un descuento, o null. */
export async function getUserVote(
  _userId: string,
  discountId: string
): Promise<VoteType | null> {
  const { data, error } = await supabase
    .from("discount_votes")
    .select("vote")
    .eq("discount_id", discountId)
    .maybeSingle();
  if (error) {
    console.error("Error al obtener el voto del usuario:", error);
    return null;
  }
  return (data?.vote as VoteType) ?? null;
}

/** Elimina el voto del usuario. */
export async function removeVote(
  _userId: string,
  discountId: string
): Promise<void> {
  const { error } = await supabase.rpc("remove_vote", {
    p_discount_id: discountId,
  });
  if (error) {
    console.error("Error al eliminar el voto:", error);
    throw error;
  }
}
