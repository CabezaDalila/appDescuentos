/**
 * Utilidades para mapeo de categorías entre diferentes sistemas
 *
 * Este archivo centraliza la lógica de mapeo entre:
 * - Categorías del ExploreCategoriesSection (food, fashion, etc.)
 * - Categorías de descuentos en la base de datos (gastronomia, moda, etc.)
 * - Variantes y sinónimos de categorías
 */

export interface CategoryMapping {
  [key: string]: string[];
}

/**
 * Mapeo principal de categorías del ExploreCategoriesSection a variantes de descuentos
 */
export const CATEGORY_MAPPING: CategoryMapping = {
  food: [
    "food",
    "gastronomia",
    "alimentos",
    "comida",
    "restaurante",
    "supermercado",
    "gastronomía",
  ],
  fashion: [
    "fashion",
    "moda",
    "ropa",
    "vestimenta",
    "accesorios",
    "zapatos",
    "bolsos",
  ],
  technology: [
    "technology",
    "tecnologia",
    "tecnología",
    "electrónicos",
    "computadoras",
    "celulares",
    "gaming",
  ],
  home: [
    "home",
    "hogar",
    "muebles",
    "decoración",
    "jardín",
    "bricolaje",
    "cocina",
  ],
  sports: [
    "sports",
    "deportes",
    "fitness",
    "outdoor",
    "gimnasio",
    "running",
    "yoga",
  ],
  beauty: [
    "beauty",
    "belleza",
    "cosméticos",
    "maquillaje",
    "skincare",
    "peluquería",
    "perfumes",
  ],
  automotive: [
    "automotive",
    "automóviles",
    "vehículos",
    "transporte",
    "motos",
    "bicicletas",
    "repuestos",
  ],
  entertainment: [
    "entertainment",
    "entretenimiento",
    "cine",
    "música",
    "teatro",
    "libros",
    "juegos",
  ],
  health: [
    "health",
    "salud",
    "farmacia",
    "médico",
    "dentista",
    "óptica",
    "bienestar",
  ],
  education: [
    "education",
    "educacion",
    "educación",
    "cursos",
    "universidad",
    "escuela",
    "idiomas",
    "capacitación",
  ],
};

/**
 * Obtiene las variantes de una categoría
 * @param category - Categoría del ExploreCategoriesSection
 * @returns Array de variantes de la categoría
 */
export const getCategoryVariants = (category: string): string[] => {
  return CATEGORY_MAPPING[category] || [category];
};

/**
 * Verifica si un descuento coincide con una categoría
 * @param discountCategory - Categoría del descuento
 * @param targetCategory - Categoría objetivo del filtro
 * @returns true si el descuento coincide con la categoría
 */
export const matchesCategory = (
  discountCategory: string,
  targetCategory: string
): boolean => {
  if (!discountCategory) return false;

  const categoryVariants = getCategoryVariants(targetCategory);
  const discountCategoryLower = discountCategory.toLowerCase();

  return categoryVariants.some((variant) => {
    const variantLower = variant.toLowerCase();
    return (
      discountCategoryLower === variantLower ||
      discountCategoryLower.includes(variantLower) ||
      variantLower.includes(discountCategoryLower)
    );
  });
};

/**
 * Filtra descuentos por categoría
 * @param discounts - Array de descuentos
 * @param category - Categoría objetivo
 * @returns Array de descuentos filtrados
 */
export const filterDiscountsByCategory = (
  discounts: any[],
  category: string
): any[] => {
  return discounts.filter((discount) =>
    matchesCategory(discount.category, category)
  );
};
