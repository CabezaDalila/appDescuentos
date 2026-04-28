import type { UserCredential } from "@/types/credentials";

export function normalizeComparable(value: string): string {
  if (value == null || typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "");
}

/** Clave de banco sin prefijo "Banco " (perfil suele guardar "Banco X", admin suele usar "X"). */
export function normalizeBankKey(value: string): string {
  return normalizeComparable(value).replace(/^banco\s+/u, "").trim();
}

type LooseCredential = {
  bank: string;
  type: string;
  brand: string;
  level: string;
};

function isWildcardCredentialValue(value: unknown): boolean {
  const normalized = normalizeComparable(typeof value === "string" ? value : "");
  return (
    normalized.length === 0 ||
    normalized === "otro" ||
    normalized === "otros" ||
    normalized === "todas" ||
    normalized === "todos" ||
    normalized === "cualquiera" ||
    normalized === "any" ||
    normalized === "na" ||
    normalized === "n/a" ||
    normalized === "sin marca" ||
    normalized === "sin nivel"
  );
}

export function credentialMatches(
  user: UserCredential,
  required: LooseCredential
): boolean {
  const userType = normalizeComparable(String(user.type));
  const requiredType = normalizeComparable(String(required.type));
  const userBrand = normalizeComparable(String(user.brand));
  const requiredBrand = normalizeComparable(String(required.brand));
  const userLevel = normalizeComparable(String(user.level));
  const requiredLevel = normalizeComparable(String(required.level));

  const typeMatches =
    isWildcardCredentialValue(required.type) || userType === requiredType;
  const brandMatches =
    isWildcardCredentialValue(required.brand) || userBrand === requiredBrand;
  const levelMatches =
    isWildcardCredentialValue(required.level) || userLevel === requiredLevel;

  return (
    normalizeBankKey(user.bank) === normalizeBankKey(required.bank) &&
    typeMatches &&
    brandMatches &&
    levelMatches
  );
}

export function userMatchesAnyRequiredCredential(
  userCredentials: UserCredential[],
  requiredList: LooseCredential[] | undefined
): boolean {
  if (!requiredList?.length) return false;
  return userCredentials.some((uc) =>
    requiredList.some((rc) => credentialMatches(uc, rc))
  );
}

/** Nombre completo normalizado + clave de banco por cada membresía del usuario. */
export function buildUserMembershipKeys(
  membershipNames: string[]
): Set<string> {
  const set = new Set<string>();
  for (const name of membershipNames) {
    const full = normalizeComparable(name);
    if (full) set.add(full);
    const bankKey = normalizeBankKey(name);
    if (bankKey) set.add(bankKey);
  }
  return set;
}

export function membershipEntityMatches(
  keys: Set<string>,
  entity: string
): boolean {
  const full = normalizeComparable(entity);
  const bankKey = normalizeBankKey(entity);
  if (full && keys.has(full)) return true;
  if (bankKey && keys.has(bankKey)) return true;
  return false;
}

export function legacyBankListMatches(
  keys: Set<string>,
  banks: string[] | undefined
): boolean {
  if (!banks?.length) return false;
  return banks.some((b) => membershipEntityMatches(keys, b));
}

export function availableMembershipsMatch(
  keys: Set<string>,
  list: string[] | undefined
): boolean {
  if (!list?.length) return false;
  return list.some((m) => membershipEntityMatches(keys, m));
}

export interface DiscountRestrictionFields {
  availableCredentials?: UserCredential[];
  availableMemberships?: string[];
  membershipRequired?: string[];
  bancos?: string[];
  banks?: string[];
}

/**
 * Elegible si coincide con al menos un grupo de restricción declarado (OR).
 * Sin restricciones => todos elegibles.
 */
export function isUserEligibleForDiscountRestrictions(
  userMemberships: string[],
  userCredentials: UserCredential[],
  discount: DiscountRestrictionFields,
  options?: {
    requireRestrictions?: boolean;
    strictPriority?: boolean;
    membershipOnly?: boolean;
  }
): boolean {
  const hasC = (discount.availableCredentials?.length || 0) > 0;
  const hasM = (discount.availableMemberships?.length || 0) > 0;
  const hasL =
    (discount.membershipRequired?.length || 0) > 0 ||
    (discount.bancos?.length || 0) > 0 ||
    (discount.banks?.length || 0) > 0;

  if (!hasC && !hasM && !hasL) {
    if (options?.requireRestrictions) {
      return false;
    }
    return true;
  }

  const keys = buildUserMembershipKeys(userMemberships);
  const credentialResult = hasC
    ? userMatchesAnyRequiredCredential(
        userCredentials,
        discount.availableCredentials as LooseCredential[] | undefined
      )
    : false;
  const membershipResult = hasM
    ? availableMembershipsMatch(keys, discount.availableMemberships)
    : false;
  const legacy = [
    ...(discount.membershipRequired || []),
    ...(discount.bancos || []),
    ...(discount.banks || []),
  ];
  const legacyResult = hasL ? legacyBankListMatches(keys, legacy) : false;

  if (options?.membershipOnly) {
    // En modo membershipOnly ignoramos credenciales de tarjeta y
    // validamos solo contra availableMemberships y/o bancos legacy.
    const hasMembershipRestrictions = hasM || hasL;
    if (!hasMembershipRestrictions) {
      return !options?.requireRestrictions;
    }
    return membershipResult || legacyResult;
  }

  if (options?.strictPriority) {
    // Modo estricto para recomendaciones personalizadas:
    // 1) Si hay credenciales requeridas, exigir match de credencial exacta.
    // 2) Si no hay credenciales y hay memberships/banks, alcanza con cualquiera.
    // 3) Si solo hay membresías, exigir membresía.
    // 4) Si solo hay legacy, exigir legacy.
    if (hasC) return credentialResult;
    if (hasM && hasL) return membershipResult || legacyResult;
    if (hasM) return membershipResult;
    if (hasL) return legacyResult;
  }

  // Modo flexible: alcanza con cumplir cualquier grupo de restricciones.
  return credentialResult || membershipResult || legacyResult;
}
