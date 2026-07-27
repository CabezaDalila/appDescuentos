import { matchesCategory } from "@/utils/category-mapping";

/** Descuento mínimo filtrable por categoría/favoritos. */
interface FilterableDiscount {
  id: string;
  category?: string;
}

/**
 * Filtra descuentos por un conjunto de categorías (y opcionalmente el
 * pseudo-filtro "favoritos"). Función pura, sin dependencias de React.
 *
 * - Sin categorías: devuelve la lista tal cual.
 * - "favoritos" incluido: incluye los descuentos cuyo id está en favoriteIdSet.
 * - Si solo se pide "favoritos" (sin otras categorías): filtra únicamente por
 *   favoritos.
 */
export function filterDiscountsByCategories<T extends FilterableDiscount>(
  discounts: T[],
  categoryIds: string[],
  favoriteIdSet: Set<string>
): T[] {
  if (!categoryIds || categoryIds.length === 0) return discounts;
  if (discounts.length === 0) return discounts;

  const includeFavorites = categoryIds.includes("favoritos");
  const categoryIdsOnly = categoryIds.filter((id) => id !== "favoritos");

  return discounts.filter((item) => {
    const isFavorite = includeFavorites ? favoriteIdSet.has(item.id) : false;
    const matchesCat =
      categoryIdsOnly.length === 0
        ? false
        : categoryIdsOnly.some((categoryId) =>
            matchesCategory(item.category || "", categoryId)
          );
    return (
      isFavorite ||
      matchesCat ||
      (!includeFavorites && categoryIdsOnly.length === 0)
    );
  });
}
