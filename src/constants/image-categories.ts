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
    images: ["/home/default.avif"],
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
    images: ["/beauty/default.webp"],
    defaultImage: "/beauty/default.webp",
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
  general: {
    keywords: [
      "general",
      "varios",
      "otros",
      "promociones",
      "descuentos",
      "oferta",
      "promo",
    ],
    images: ["/imgDefault.svg"],
    defaultImage: "/imgDefault.svg",
  },
};

// Función para obtener imagen por categoría
export const getImageByCategory = (category?: string): string => {
  if (!category) {
    return CATEGORY_IMAGES.general.defaultImage;
  }
  
  const categoryLower = category.toLowerCase();

  // Buscar coincidencia exacta primero
  if (CATEGORY_IMAGES[categoryLower]) {
    return CATEGORY_IMAGES[categoryLower].defaultImage;
  }

  // Buscar por keywords
  for (const [key, config] of Object.entries(CATEGORY_IMAGES)) {
    if (
      config.keywords.some((keyword) =>
        categoryLower.includes(keyword.toLowerCase())
      )
    ) {
      return config.defaultImage;
    }
  }

  // Imagen por defecto si no se encuentra
  return CATEGORY_IMAGES.general.defaultImage;
};
