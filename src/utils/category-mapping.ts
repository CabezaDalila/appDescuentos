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
  discountCategory: string | undefined,
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
  discounts: { category: string }[],
  category: string
): { category: string }[] => {
  return discounts.filter((discount) =>
    matchesCategory(discount.category, category)
  );
};

/**
 * Función para obtener la imagen por defecto de una categoría
 * @param category - Nombre de la categoría
 * @returns Ruta de la imagen por defecto para la categoría
 */
export const getImageByCategory = (category?: string): string => {
  if (!category) {
    return "/imgDefault.svg";
  }

  const categoryLower = category.toLowerCase();

  // Mapeo de categorías a sus imágenes por defecto
  const categoryImageMap: { [key: string]: string } = {
    // Alimentos
    alimentos: "/food/default.avif",
    food: "/food/default.avif",
    comida: "/food/default.avif",
    restaurante: "/food/default.avif",
    supermercado: "/food/default.avif",
    gastronomía: "/food/default.avif",
    gastronomia: "/food/default.avif",
    café: "/food/default.avif",

    // Moda
    moda: "/fashion/default.avif",
    fashion: "/fashion/default.avif",
    ropa: "/fashion/default.avif",
    vestimenta: "/fashion/default.avif",
    accesorios: "/fashion/default.avif",
    zapatos: "/fashion/default.avif",
    bolsos: "/fashion/default.avif",

    // Tecnología
    tecnología: "/technology/default.avif",
    tecnologia: "/technology/default.avif",
    technology: "/technology/default.avif",
    electrónicos: "/technology/default.avif",
    computadoras: "/technology/default.avif",
    celulares: "/technology/default.avif",
    tablets: "/technology/default.avif",
    gaming: "/technology/default.avif",

    // Hogar
    hogar: "/home/default.avif",
    home: "/home/default.avif",
    decoración: "/home/default.avif",
    muebles: "/home/default.avif",
    jardín: "/home/default.avif",
    bricolaje: "/home/default.avif",
    cocina: "/home/default.avif",

    // Deportes
    deportes: "/sports/default.avif",
    sports: "/sports/default.avif",
    fitness: "/sports/default.avif",
    outdoor: "/sports/default.avif",
    gimnasio: "/sports/default.avif",
    running: "/sports/default.avif",
    yoga: "/sports/default.avif",

    // Belleza
    belleza: "/beauty/default.webp",
    beauty: "/beauty/default.webp",
    cosméticos: "/beauty/default.webp",
    perfumes: "/beauty/default.webp",
    maquillaje: "/beauty/default.webp",
    skincare: "/beauty/default.webp",
    peluquería: "/beauty/default.webp",

    // Automóviles
    automóviles: "/automotive/default.avif",
    automotive: "/automotive/default.avif",
    vehículos: "/automotive/default.avif",
    transporte: "/automotive/default.avif",
    motos: "/automotive/default.avif",
    bicicletas: "/automotive/default.avif",
    repuestos: "/automotive/default.avif",

    // Entretenimiento
    entretenimiento: "/entertainment/default.avif",
    entertainment: "/entertainment/default.avif",
    cine: "/entertainment/default.avif",
    teatro: "/entertainment/default.avif",
    música: "/entertainment/default.avif",
    libros: "/entertainment/default.avif",
    juegos: "/entertainment/default.avif",

    // Salud
    salud: "/health/default.avif",
    health: "/health/default.avif",
    farmacia: "/health/default.avif",
    médico: "/health/default.avif",
    dentista: "/health/default.avif",
    óptica: "/health/default.avif",
    bienestar: "/health/default.avif",

    // Educación
    educación: "/education/default.avif",
    educacion: "/education/default.avif",
    education: "/education/default.avif",
    cursos: "/education/default.avif",
    universidad: "/education/default.avif",
    escuela: "/education/default.avif",
    idiomas: "/education/default.avif",
    capacitación: "/education/default.avif",

    // General (por defecto)
    general: "/imgDefault.svg",
    varios: "/imgDefault.svg",
    otros: "/imgDefault.svg",
    promociones: "/imgDefault.svg",
    descuentos: "/imgDefault.svg",
    oferta: "/imgDefault.svg",
    promo: "/imgDefault.svg",
  };

  // Buscar coincidencia exacta
  if (categoryImageMap[categoryLower]) {
    return categoryImageMap[categoryLower];
  }

  // Buscar coincidencia parcial en las claves
  for (const [key, imagePath] of Object.entries(categoryImageMap)) {
    if (categoryLower.includes(key) || key.includes(categoryLower)) {
      return imagePath;
    }
  }

  // Si no se encuentra coincidencia, devolver imagen por defecto
  return "/imgDefault.svg";
};
