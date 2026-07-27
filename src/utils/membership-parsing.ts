import {
  Card,
  CARD_BRANDS,
  CARD_LEVELS,
  CARD_TYPES,
} from "@/constants/membership";
import type { UserCredential } from "@/types/credentials";

/**
 * Item "normalizado" tal como lo devuelve getActiveMemberships:
 * - Para bancos con tarjetas: un item por tarjeta (isCard=true) con `card`.
 * - Para otras membresías: un item por membresía (isCard=false).
 */
interface NormalizedMembershipItem {
  name?: string;
  membershipName?: string;
  membershipCategory?: string;
  isCard?: boolean;
  card?: { type?: string; brand?: string; level?: string };
  cards?: Card[];
}

const validTypes = CARD_TYPES.map((t) => t.value) as ReadonlyArray<
  Card["type"]
>;
const validBrands = CARD_BRANDS.map((b) => b.value) as ReadonlyArray<
  Card["brand"]
>;
const validLevels = CARD_LEVELS.map((l) => l.value) as ReadonlyArray<
  (typeof CARD_LEVELS)[number]["value"]
>;

const isValidType = (v: unknown): v is Card["type"] =>
  typeof v === "string" && (validTypes as readonly string[]).includes(v);
const isValidBrand = (v: unknown): v is Card["brand"] =>
  typeof v === "string" && (validBrands as readonly string[]).includes(v);
const isValidLevel = (
  v: unknown
): v is (typeof CARD_LEVELS)[number]["value"] =>
  typeof v === "string" && (validLevels as readonly string[]).includes(v);

export interface ParsedMemberships {
  memberships: string[];
  credentials: UserCredential[];
}

/**
 * Deriva los nombres de membresías y las credenciales de tarjeta válidas a
 * partir de la lista normalizada de membresías activas del usuario.
 * Función pura: sin efectos ni dependencias de React.
 */
export function parseMembershipsToCredentials(
  memberships: readonly unknown[]
): ParsedMemberships {
  const membershipNames: string[] = [];
  const credentials: UserCredential[] = [];

  memberships.forEach((m) => {
    const item = m as NormalizedMembershipItem;
    const name = item.name || item.membershipName;
    if (typeof name === "string" && name.trim().length > 0) {
      membershipNames.push(name);
    }

    // Solo hay credenciales cuando es banco con tarjeta.
    if (item.isCard && item.membershipCategory === "banco" && item.card) {
      const bank = typeof name === "string" ? name : "";
      const type = isValidType(item.card.type) ? item.card.type : undefined;
      const brand = isValidBrand(item.card.brand) ? item.card.brand : undefined;
      const level = isValidLevel(item.card.level) ? item.card.level : undefined;
      if (bank && type && brand && level) {
        credentials.push({ bank, type, brand, level });
      }
    } else if (Array.isArray(item.cards) && item.cards.length > 0) {
      item.cards.forEach((card) => {
        const bank = typeof name === "string" ? name : "";
        const type = isValidType(card.type) ? card.type : undefined;
        const brand = isValidBrand(card.brand) ? card.brand : undefined;
        const level = isValidLevel(card.level) ? card.level : undefined;
        if (bank && type && brand && level) {
          credentials.push({ bank, type, brand, level });
        }
      });
    }
  });

  return {
    memberships: Array.from(
      new Set(
        membershipNames.filter(
          (n) => typeof n === "string" && n.trim().length > 0
        )
      )
    ),
    credentials: credentials.filter(
      (c) => c.bank && c.type && c.brand && c.level
    ),
  };
}
