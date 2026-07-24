/**
 * Membresías y tarjetas — Supabase (tablas public.memberships + public.cards).
 * Reemplaza a la subcolección Firestore users/{uid}/memberships con tarjetas
 * embebidas. Ahora las tarjetas son una tabla propia (FK membership_id).
 *
 * RLS scopea todo al usuario autenticado; para inserts seteamos user_id.
 */
import { supabase } from "./client";
import type { Card, Membership } from "@/constants/membership";

interface CardRow {
  id: string;
  membership_id: string;
  type: string;
  brand: string;
  level: string | null;
  name: string | null;
  expiry_date: string | null;
  status: string;
}

interface MembershipRow {
  id: string;
  user_id: string;
  name: string;
  category: string;
  status: string;
  color: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
  cards?: CardRow[];
}

async function currentUserId(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Usuario no autenticado");
  return session.user.id;
}

function mapCard(row: CardRow): Card {
  return {
    id: row.id,
    type: row.type as Card["type"],
    brand: row.brand as Card["brand"],
    level: (row.level ?? "Classic") as Card["level"],
    name: row.name ?? undefined,
    expiryDate: row.expiry_date ?? undefined,
    status: row.status as Card["status"],
  };
}

function mapMembership(row: MembershipRow) {
  return {
    id: row.id,
    name: row.name ?? "",
    category: row.category as Membership["category"],
    status: (row.status || "active") as Membership["status"],
    color: row.color || "#6B7280",
    cards: (row.cards ?? []).map(mapCard),
    logoUrl: row.logo_url ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function cardToRow(card: Partial<Card> & { expiry?: string }) {
  return {
    type: card.type,
    brand: card.brand,
    level: card.level ?? null,
    name: card.name ?? null,
    expiry_date: card.expiryDate ?? card.expiry ?? null,
    status: card.status ?? "active",
  };
}

/** Todas las membresías del usuario (con sus tarjetas). */
export const getUserMemberships = async () => {
  const { data, error } = await supabase
    .from("memberships")
    .select("*, cards(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as MembershipRow[]).map(mapMembership);
};

/** Aplana membresías activas: bancos → tarjetas activas como items sueltos. */
function flatten(rows: MembershipRow[], wantStatus: "active" | "inactive") {
  const items: any[] = [];
  for (const row of rows) {
    const m = mapMembership(row);
    if (m.category === "banco" && m.cards.length > 0) {
      for (const card of m.cards) {
        const cardStatus = card.status ?? "active";
        if (cardStatus === wantStatus) {
          items.push({
            id: `${m.id}-${card.id}`,
            membershipId: m.id,
            membershipName: m.name,
            membershipCategory: m.category,
            card,
            isCard: true,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
          });
        }
      }
    } else if (m.status === wantStatus) {
      items.push({
        ...m,
        membershipId: m.id,
        membershipName: m.name,
        membershipCategory: m.category,
        isCard: false,
      });
    }
  }
  return items.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
};

export const getActiveMemberships = async () => {
  const { data, error } = await supabase.from("memberships").select("*, cards(*)");
  if (error) throw error;
  return flatten(data as MembershipRow[], "active");
};

export const getInactiveMemberships = async () => {
  const { data, error } = await supabase.from("memberships").select("*, cards(*)");
  if (error) throw error;
  return flatten(data as MembershipRow[], "inactive");
};

async function fetchMembership(membershipId: string) {
  const { data, error } = await supabase
    .from("memberships")
    .select("*, cards(*)")
    .eq("id", membershipId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Membresía no encontrada");
  return mapMembership(data as MembershipRow);
}

export const getMembership = (membershipId: string) => fetchMembership(membershipId);
export const getMembershipById = (membershipId: string) => fetchMembership(membershipId);

const findMembershipByName = async (name: string) => {
  const { data } = await supabase
    .from("memberships")
    .select("id")
    .eq("name", name)
    .limit(1)
    .maybeSingle();
  return data as { id: string } | null;
};

const addCardsToExistingMembership = async (
  membershipId: string,
  newCards: Card[] = []
) => {
  if (newCards.length > 0) {
    const rows = newCards.map((c) => ({ ...cardToRow(c), membership_id: membershipId }));
    const { error } = await supabase.from("cards").insert(rows);
    if (error) throw error;
  }
  await supabase
    .from("memberships")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", membershipId);
  return await fetchMembership(membershipId);
};

/** Crea una membresía (con tarjetas). Para bancos, fusiona si ya existe por nombre. */
export const createMembership = async (membershipData: any) => {
  const userId = await currentUserId();

  if (membershipData.category === "banco") {
    const existing = await findMembershipByName(membershipData.name);
    if (existing) {
      return await addCardsToExistingMembership(existing.id, membershipData.cards || []);
    }
  }

  const { data: inserted, error } = await supabase
    .from("memberships")
    .insert({
      user_id: userId,
      name: membershipData.name,
      category: membershipData.category,
      status: "active",
      color: membershipData.color ?? null,
      logo_url: membershipData.logoUrl ?? null,
    })
    .select()
    .single();
  if (error) throw error;

  const cards: Card[] = membershipData.cards || [];
  if (cards.length > 0) {
    const rows = cards.map((c) => ({ ...cardToRow(c), membership_id: inserted.id }));
    const { error: cardErr } = await supabase.from("cards").insert(rows);
    if (cardErr) throw cardErr;
  }
  return await fetchMembership(inserted.id);
};

export const updateMembership = async (membershipId: string, updateData: any) => {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updateData.name !== undefined) payload.name = updateData.name;
  if (updateData.category !== undefined) payload.category = updateData.category;
  if (updateData.status !== undefined) payload.status = updateData.status;
  if (updateData.color !== undefined) payload.color = updateData.color;
  if (updateData.logoUrl !== undefined) payload.logo_url = updateData.logoUrl;

  const { error } = await supabase.from("memberships").update(payload).eq("id", membershipId);
  if (error) throw error;
  return { id: membershipId, ...updateData };
};

export const deleteMembership = async (membershipId: string) => {
  const { error } = await supabase.from("memberships").delete().eq("id", membershipId);
  if (error) throw error;
  return { success: true };
};

export const addCardToMembership = async (membershipId: string, cardData: any) => {
  const { data: card, error } = await supabase
    .from("cards")
    .insert({ ...cardToRow(cardData), membership_id: membershipId })
    .select()
    .single();
  if (error) throw error;
  await supabase
    .from("memberships")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", membershipId);
  return mapCard(card as CardRow);
};

export const updateCardInMembership = async (
  membershipId: string,
  cardId: string,
  cardData: any
) => {
  const payload: Record<string, unknown> = {};
  if (cardData.type !== undefined) payload.type = cardData.type;
  if (cardData.brand !== undefined) payload.brand = cardData.brand;
  if (cardData.level !== undefined) payload.level = cardData.level;
  if (cardData.name !== undefined) payload.name = cardData.name;
  if (cardData.expiryDate !== undefined || cardData.expiry !== undefined)
    payload.expiry_date = cardData.expiryDate ?? cardData.expiry;
  if (cardData.status !== undefined) payload.status = cardData.status;

  const { data: card, error } = await supabase
    .from("cards")
    .update(payload)
    .eq("id", cardId)
    .eq("membership_id", membershipId)
    .select()
    .single();
  if (error) throw error;
  await supabase
    .from("memberships")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", membershipId);
  return mapCard(card as CardRow);
};

export const deleteCardFromMembership = async (membershipId: string, cardId: string) => {
  const { error } = await supabase
    .from("cards")
    .delete()
    .eq("id", cardId)
    .eq("membership_id", membershipId);
  if (error) throw error;

  const membership = await fetchMembership(membershipId);
  if (membership.category === "banco" && membership.cards.length === 0) {
    await supabase.from("memberships").delete().eq("id", membershipId);
    return {
      success: true,
      membershipDeleted: true,
      message: "Banco eliminado (no quedaban tarjetas)",
    };
  }
  await supabase
    .from("memberships")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", membershipId);
  return {
    success: true,
    membershipDeleted: false,
    remainingCards: membership.cards.length,
    message: `Tarjeta eliminada. Quedan ${membership.cards.length} tarjeta(s)`,
  };
};

export const checkMembershipExists = async (name: string, category: string) => {
  const { count, error } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("name", name)
    .eq("category", category);
  if (error) throw error;
  return (count ?? 0) > 0;
};

/** Ya no hace falta con data fresca; se deja como no-op para compatibilidad. */
export const consolidateDuplicateMemberships = async () => {
  return {
    success: true,
    consolidated: 0,
    deleted: 0,
    message: "No aplica (datos en Supabase, sin duplicados heredados)",
  };
};
