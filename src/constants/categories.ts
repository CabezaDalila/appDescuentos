// Importar iconos de Lucide React
import {
  BookOpen,
  Car,
  Dumbbell,
  Heart,
  Home,
  Laptop,
  Music,
  Shirt,
  Sparkles,
  Target,
  Utensils,
} from "lucide-react";

// Categorías predefinidas para descuentos
export interface Category {
  id: string;
  name: string;
  displayName: string;
  keywords: string[];
  color: string;
  icon: string;
}

export const DISCOUNT_CATEGORIES: Category[] = [
  {
    id: "food",
    name: "Alimentos",
    displayName: "🍽️ Alimentos",
    keywords: [
      "supermercado",
      "alimentos",
      "comida",
      "gastronomía",
      "restaurante",
      "café",
    ],
    color: "bg-green-100 text-green-800",
    icon: "🍽️",
  },

  {
    id: "fashion",
    name: "Moda",
    displayName: "👗 Moda",
    keywords: ["ropa", "moda", "vestimenta", "accesorios", "zapatos", "bolsos"],
    color: "bg-pink-100 text-pink-800",
    icon: "👗",
  },

  {
    id: "technology",
    name: "Tecnología",
    displayName: "💻 Tecnología",
    keywords: [
      "tecnología",
      "electrónicos",
      "computadoras",
      "celulares",
      "tablets",
      "gaming",
    ],
    color: "bg-blue-100 text-blue-800",
    icon: "💻",
  },

  {
    id: "home",
    name: "Hogar",
    displayName: "🏠 Hogar",
    keywords: [
      "hogar",
      "decoración",
      "muebles",
      "jardín",
      "bricolaje",
      "cocina",
    ],
    color: "bg-orange-100 text-orange-800",
    icon: "🏠",
  },

  {
    id: "sports",
    name: "Deportes",
    displayName: "⚽ Deportes",
    keywords: ["deportes", "fitness", "outdoor", "gimnasio", "running", "yoga"],
    color: "bg-purple-100 text-purple-800",
    icon: "⚽",
  },

  {
    id: "beauty",
    name: "Belleza",
    displayName: "💄 Belleza",
    keywords: [
      "belleza",
      "cosméticos",
      "perfumes",
      "maquillaje",
      "skincare",
      "peluquería",
    ],
    color: "bg-red-100 text-red-800",
    icon: "💄",
  },

  {
    id: "automotive",
    name: "Automóviles",
    displayName: "🚗 Automóviles",
    keywords: [
      "automóviles",
      "vehículos",
      "transporte",
      "motos",
      "bicicletas",
      "repuestos",
    ],
    color: "bg-gray-100 text-gray-800",
    icon: "🚗",
  },

  {
    id: "entertainment",
    name: "Entretenimiento",
    displayName: "🎭 Entretenimiento",
    keywords: [
      "entretenimiento",
      "cine",
      "teatro",
      "música",
      "libros",
      "juegos",
    ],
    color: "bg-yellow-100 text-yellow-800",
    icon: "🎭",
  },

  {
    id: "health",
    name: "Salud",
    displayName: "🏥 Salud",
    keywords: [
      "salud",
      "farmacia",
      "médico",
      "dentista",
      "óptica",
      "bienestar",
    ],
    color: "bg-teal-100 text-teal-800",
    icon: "🏥",
  },

  {
    id: "education",
    name: "Educación",
    displayName: "📚 Educación",
    keywords: [
      "educación",
      "cursos",
      "universidad",
      "escuela",
      "idiomas",
      "capacitación",
    ],
    color: "bg-indigo-100 text-indigo-800",
    icon: "📚",
  },

  {
    id: "general",
    name: "General",
    displayName: "🎯 General",
    keywords: [
      "general",
      "varios",
      "otros",
      "promociones",
      "descuentos",
      "oferta",
      "promo",
    ],
    color: "bg-gray-100 text-gray-800",
    icon: "🎯",
  },
];

// Función para obtener categoría por ID
export const getCategoryById = (id: string): Category | undefined => {
  return DISCOUNT_CATEGORIES.find((cat) => cat.id === id);
};

// Función para obtener categoría por nombre
export const getCategoryByName = (name: string): Category | undefined => {
  return DISCOUNT_CATEGORIES.find(
    (cat) =>
      cat.name.toLowerCase() === name.toLowerCase() ||
      cat.keywords.some((keyword) => name.toLowerCase().includes(keyword))
  );
};

// Función para obtener todas las categorías
export const getAllCategories = (): Category[] => {
  return DISCOUNT_CATEGORIES;
};

// Función para validar si una categoría es válida
export const isValidCategory = (categoryName: string): boolean => {
  return DISCOUNT_CATEGORIES.some(
    (cat) =>
      cat.id.toLowerCase() === categoryName.toLowerCase() ||
      cat.name.toLowerCase() === categoryName.toLowerCase() ||
      cat.keywords.some((keyword) =>
        categoryName.toLowerCase().includes(keyword)
      )
  );
};

// Función para obtener categoría sugerida basada en texto
export const getSuggestedCategory = (text: string): Category | null => {
  const textLower = text.toLowerCase();

  for (const category of DISCOUNT_CATEGORIES) {
    if (category.keywords.some((keyword) => textLower.includes(keyword))) {
      return category;
    }
  }

  return null;
};

// Categorías para la sección de explorar (con iconos de React)
export interface ExploreCategory {
  id: string;
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const EXPLORE_CATEGORIES: ExploreCategory[] = [
  {
    id: "food",
    label: "Alimentos",
    color: "bg-gradient-to-br from-green-400 to-green-600",
    icon: Utensils,
  },
  {
    id: "fashion",
    label: "Moda",
    color: "bg-gradient-to-br from-pink-400 to-pink-600",
    icon: Shirt,
  },
  {
    id: "technology",
    label: "Tecnología",
    color: "bg-gradient-to-br from-blue-400 to-blue-600",
    icon: Laptop,
  },
  {
    id: "home",
    label: "Hogar",
    color: "bg-gradient-to-br from-orange-400 to-orange-600",
    icon: Home,
  },
  {
    id: "sports",
    label: "Deportes",
    color: "bg-gradient-to-br from-purple-400 to-purple-600",
    icon: Dumbbell,
  },
  {
    id: "beauty",
    label: "Belleza",
    color: "bg-gradient-to-br from-red-400 to-red-600",
    icon: Sparkles,
  },
  {
    id: "automotive",
    label: "Automóviles",
    color: "bg-gradient-to-br from-gray-400 to-gray-600",
    icon: Car,
  },
  {
    id: "entertainment",
    label: "Entretenimiento",
    color: "bg-gradient-to-br from-yellow-400 to-yellow-600",
    icon: Music,
  },
  {
    id: "health",
    label: "Salud",
    color: "bg-gradient-to-br from-teal-400 to-teal-600",
    icon: Heart,
  },
  {
    id: "education",
    label: "Educación",
    color: "bg-gradient-to-br from-indigo-400 to-indigo-600",
    icon: BookOpen,
  },
  {
    id: "general",
    label: "General",
    color: "bg-gradient-to-br from-gray-400 to-gray-600",
    icon: Target,
  },
];
