/**
 * Capa de datos de descuentos sobre Supabase, con forma "doc-like"
 * (`.id` / `.exists()` / `.data()`) para que la lógica existente de
 * `src/lib/discounts.ts` (filtros, distancia, trending, matching de
 * credenciales) funcione sin reescribirse. Los timestamps se exponen como
 * `{ toDate() }` igual que Firestore.
 *
 * RLS: lectura pública de aprobados+visibles (admin ve todo); writes solo admin.
 */
import { supabase } from "./client";

type Row = Record<string, any>;

const ts = (v: string | null | undefined) =>
  v ? { toDate: () => new Date(v) } : undefined;

/** Fila de Postgres -> objeto camelCase tipo FirestoreDiscount. */
function rowToData(row: Row) {
  return {
    name: row.name,
    title: row.title,
    description: row.description,
    category: row.category,
    discountPercentage: row.discount_percentage ?? undefined,
    discountAmount: row.discount_amount ?? undefined,
    validFrom: ts(row.valid_from),
    expirationDate: ts(row.expiration_date),
    membershipRequired: row.membership_required ?? undefined,
    terms: row.terms ?? undefined,
    imageUrl: row.image_url ?? undefined,
    createdAt: ts(row.created_at),
    updatedAt: ts(row.updated_at),
    status: row.status ?? undefined,
    origin: row.origin ?? undefined,
    type: row.type ?? undefined,
    approvalStatus: row.approval_status ?? undefined,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: ts(row.reviewed_at),
    rejectionReason: row.rejection_reason ?? undefined,
    source: row.source ?? undefined,
    isVisible: row.is_visible,
    bancos: row.bancos ?? undefined,
    banks: row.bancos ?? undefined,
    availableMemberships: row.available_memberships ?? undefined,
    availableCredentials: row.available_credentials ?? undefined,
    location: row.location ?? undefined,
    points: 0,
    favoritesCount: row.downvotes ?? 0,
    upVotes: row.upvotes ?? 0,
  };
}

function rowToDoc(row: Row) {
  return { id: row.id, exists: () => true, data: () => rowToData(row) };
}

/** Equivale a getDocs(collection(db,"discounts")) — RLS filtra por rol. */
export async function fetchAllDiscountDocs() {
  const { data, error } = await supabase.from("discounts").select("*");
  if (error) throw error;
  return { docs: (data ?? []).map(rowToDoc) };
}

/** Equivale a getDoc(doc(db,"discounts",id)). */
export async function fetchDiscountDoc(id: string) {
  const { data, error } = await supabase
    .from("discounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { id, exists: () => false, data: () => ({}) };
  return rowToDoc(data);
}

// ── Escrituras (camelCase -> snake_case) ────────────────────────────────
const WRITE_MAP: Record<string, string> = {
  name: "name",
  title: "title",
  description: "description",
  descripcion: "description",
  category: "category",
  discountPercentage: "discount_percentage",
  discountAmount: "discount_amount",
  validFrom: "valid_from",
  expirationDate: "expiration_date",
  terms: "terms",
  imageUrl: "image_url",
  image: "image_url",
  origin: "origin",
  type: "type",
  status: "status",
  source: "source",
  approvalStatus: "approval_status",
  reviewedBy: "reviewed_by",
  reviewedAt: "reviewed_at",
  rejectionReason: "rejection_reason",
  isVisible: "is_visible",
  bancos: "bancos",
  banks: "bancos",
  availableMemberships: "available_memberships",
  membershipRequired: "membership_required",
  availableCredentials: "available_credentials",
  location: "location",
  createdAt: "created_at",
  updatedAt: "updated_at",
};

const DATE_COLS = new Set([
  "valid_from",
  "expiration_date",
  "reviewed_at",
  "created_at",
  "updated_at",
]);

function toIso(v: any) {
  if (v == null) return v;
  if (typeof v === "object" && typeof v.toDate === "function")
    return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return v; // string ISO/fecha
}

function mapWrite(camel: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(camel)) {
    const col = WRITE_MAP[k];
    if (!col) continue; // ignora id, points, favoritesCount, upVotes, etc.
    out[col] = DATE_COLS.has(col) ? toIso(v) : v;
  }
  return out;
}

/** Inserta un descuento; devuelve el id. */
export async function insertDiscount(
  camel: Record<string, any>
): Promise<string> {
  const { data, error } = await supabase
    .from("discounts")
    .insert(mapWrite(camel))
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

/** Actualiza un descuento por id. */
export async function updateDiscountRow(
  id: string,
  camel: Record<string, any>
) {
  const { error } = await supabase
    .from("discounts")
    .update(mapWrite(camel))
    .eq("id", id);
  if (error) throw error;
}

/** Borra un descuento por id. */
export async function deleteDiscountRow(id: string) {
  const { error } = await supabase.from("discounts").delete().eq("id", id);
  if (error) throw error;
}

/** Borra varios descuentos por id (equivale al writeBatch de Firestore). */
export async function deleteDiscountRows(ids: string[]) {
  if (ids.length === 0) return;
  const { error } = await supabase.from("discounts").delete().in("id", ids);
  if (error) throw error;
}
