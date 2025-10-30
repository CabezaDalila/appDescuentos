const STORAGE_KEY = "favoriteDiscountIds";

export function getFavoriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function isFavorite(discountId: string): boolean {
  return getFavoriteIds().includes(discountId);
}

export function toggleFavorite(discountId: string): boolean {
  if (typeof window === "undefined") return false;
  const current = new Set(getFavoriteIds());
  if (current.has(discountId)) {
    current.delete(discountId);
  } else {
    current.add(discountId);
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(current)));
  return current.has(discountId);
}
