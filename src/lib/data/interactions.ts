/**
 * Favoritos + feedback — ahora sobre Supabase.
 *
 * Se re-exporta la capa `src/lib/supabase/interactions.ts` para no tocar a los
 * consumidores (cardDiscount, CardDiscountCompact, DiscountVote, search).
 *
 * `getFavoritesCountForDiscount` se eliminó: era código muerto (0
 * consumidores). El contador de favoritos, si se necesita, se computa con un
 * COUNT sobre `discount_interactions`.
 */
export type {
  FeedbackValue,
  UserDiscountInteraction,
} from "@/lib/supabase/interactions";
export {
  getUserInteraction,
  toggleFavorite,
  setFeedback,
  getFavoriteDiscountIdsForUser,
} from "@/lib/supabase/interactions";
