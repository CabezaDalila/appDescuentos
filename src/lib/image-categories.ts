// Configuración de imágenes por categoría
export interface CategoryImageConfig {
  keywords: string[];
  images: string[];
  defaultImage: string;
}

// Generar configuración de imágenes basada en categorías predefinidas
export const CATEGORY_IMAGES: Record<string, CategoryImageConfig> = {
  food: {
    keywords: [
      "supermercado",
      "alimentos",
      "comida",
      "gastronomía",
      "restaurante",
      "café",
    ],
    images: ["/food/default.avif"],
    defaultImage: "/food/default.avif",
  },

  fashion: {
    keywords: ["ropa", "moda", "vestimenta", "accesorios", "zapatos", "bolsos"],
    images: ["/fashion/default.avif"],
    defaultImage: "/fashion/default.avif",
  },

  technology: {
    keywords: [
      "tecnología",
      "electrónicos",
      "computadoras",
      "celulares",
      "tablets",
      "gaming",
    ],
    images: ["/technology/default.avif"],
    defaultImage: "/technology/default.avif",
  },

  home: {
    keywords: [
      "hogar",
      "decoración",
      "muebles",
      "jardín",
      "bricolaje",
      "cocina",
    ],
    images: [
      "/home/furniture.jpg",
      "/home/decoration.jpg",
      "/home/kitchen.jpg",
      "/home/garden.jpg",
    ],
    defaultImage: "/home/default.avif",
  },

  sports: {
    keywords: ["deportes", "fitness", "outdoor", "gimnasio", "running", "yoga"],
    images: ["/sports/default.avif"],
    defaultImage: "/sports/default.avif",
  },

  beauty: {
    keywords: [
      "belleza",
      "cosméticos",
      "perfumes",
      "maquillaje",
      "skincare",
      "peluquería",
    ],
    images: ["/beauty/default.avif"],
    defaultImage: "/beauty/default.avif",
  },

  automotive: {
    keywords: [
      "automóviles",
      "vehículos",
      "transporte",
      "motos",
      "bicicletas",
      "repuestos",
    ],
    images: ["/automotive/default.avif"],
    defaultImage: "/automotive/default.avif",
  },

  entertainment: {
    keywords: [
      "entretenimiento",
      "cine",
      "teatro",
      "música",
      "libros",
      "juegos",
    ],
    images: ["/entertainment/default.avif"],
    defaultImage: "/entertainment/default.avif",
  },

  health: {
    keywords: [
      "salud",
      "farmacia",
      "médico",
      "dentista",
      "óptica",
      "bienestar",
    ],
    images: ["/health/default.avif"],
    defaultImage: "/health/default.avif",
  },

  education: {
    keywords: [
      "educación",
      "cursos",
      "universidad",
      "escuela",
      "idiomas",
      "capacitación",
    ],
    images: ["/education/default.avif"],
    defaultImage: "/education/default.avif",
  },
};

// Función para obtener imagen por categoría
export const getImageByCategory = (category?: string): string => {
  if (!category) return "/primary_image.jpg";

  const categoryLower = category.toLowerCase();

  // Buscar la categoría que coincida
  for (const [, config] of Object.entries(CATEGORY_IMAGES)) {
    if (config.keywords.some((keyword) => categoryLower.includes(keyword))) {
      // Si hay múltiples imágenes, elegir una aleatoria
      if (config.images.length > 1) {
        return config.images[Math.floor(Math.random() * config.images.length)];
      }
      return config.images[0];
    }
  }

  // Si no hay coincidencia, usar imagen por defecto
  return "/primary_image.jpg";
};

// Función para obtener todas las categorías disponibles
export const getAvailableCategories = (): string[] => {
  return Object.keys(CATEGORY_IMAGES);
};

// Función para obtener palabras clave de una categoría
export const getCategoryKeywords = (category: string): string[] => {
  return CATEGORY_IMAGES[category]?.keywords || [];
};
