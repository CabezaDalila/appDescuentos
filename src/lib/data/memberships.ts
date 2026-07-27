/**
 * Membresías — migradas a Supabase. Este archivo se mantiene solo como
 * re-export para no tocar los imports de los consumidores
 * (`@/lib/data/memberships`). La implementación vive en
 * `@/lib/supabase/memberships`.
 */
export {
  getUserMemberships,
  getActiveMemberships,
  getInactiveMemberships,
  getMembership,
  getMembershipById,
  createMembership,
  updateMembership,
  deleteMembership,
  addCardToMembership,
  updateCardInMembership,
  deleteCardFromMembership,
  checkMembershipExists,
  consolidateDuplicateMemberships,
} from "@/lib/supabase/memberships";
