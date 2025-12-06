import {
  Bike,
  Bus,
  Car,
  Compass,
  Fuel,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Laptop,
  Music,
  PiggyBank,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Target,
  UtensilsCrossed,
  Wallet
} from "lucide-react";

export const ONBOARDING_TOTAL_STEPS = 6;

// Paso 2: Categorías de gasto
export const SPENDING_CATEGORIES = [
  { 
    id: "supermercado", 
    label: "Supermercado y almacén", 
    icon: ShoppingCart,
    color: "from-green-500 to-emerald-500"
  },
  { 
    id: "combustible", 
    label: "Combustible y transporte", 
    icon: Fuel,
    color: "from-orange-500 to-red-500"
  },
  { 
    id: "restaurantes", 
    label: "Restaurantes y delivery", 
    icon: UtensilsCrossed,
    color: "from-pink-500 to-rose-500"
  },
  { 
    id: "hogar", 
    label: "Hogar y servicios", 
    icon: Home,
    color: "from-blue-500 to-indigo-500"
  },
  { 
    id: "ropa", 
    label: "Ropa y accesorios", 
    icon: ShoppingBag,
    color: "from-purple-500 to-fuchsia-500"
  },
  { 
    id: "salud", 
    label: "Salud y farmacia", 
    icon: Heart,
    color: "from-red-500 to-pink-500"
  },
  { 
    id: "tecnologia", 
    label: "Tecnología y electrónica", 
    icon: Laptop,
    color: "from-blue-500 to-cyan-500"
  },
  { 
    id: "entretenimiento", 
    label: "Entretenimiento", 
    icon: Music,
    color: "from-indigo-500 to-purple-500"
  },
  { 
    id: "educacion", 
    label: "Educación", 
    icon: GraduationCap,
    color: "from-yellow-500 to-orange-500"
  },
  { 
    id: "regalos", 
    label: "Regalos y ocasiones especiales", 
    icon: Gift,
    color: "from-pink-500 to-purple-500"
  },
];

// Paso 3: Objetivo principal
export const MAIN_GOALS = [
  {
    id: "reducir-gastos",
    label: "Reducir mis gastos mensuales fijos",
    icon: Wallet,
    color: "from-green-500 to-emerald-500",
    description: "Quiero ahorrar en mis compras habituales",
  },
  {
    id: "compras-planificadas",
    label: "Aprovechar ofertas en compras planificadas",
    icon: Target,
    color: "from-blue-500 to-indigo-500",
    description: "Busco descuentos cuando necesito comprar algo específico",
  },
  {
    id: "experiencias",
    label: "Disfrutar más experiencias por menos dinero",
    icon: Sparkles,
    color: "from-purple-500 to-fuchsia-500",
    description: "Quiero salir más, ir a restaurantes y eventos",
  },
  {
    id: "ahorrar-objetivo",
    label: "Ahorrar para un objetivo específico",
    icon: PiggyBank,
    color: "from-orange-500 to-amber-500",
    description: "Estoy juntando dinero para algo importante",
  },
  {
    id: "descubrir",
    label: "Descubrir nuevas ofertas y lugares",
    icon: Compass,
    color: "from-cyan-500 to-blue-500",
    description: "Me gusta explorar y probar cosas nuevas",
  },
];

// Paso 4: Bancos disponibles
export const BANK_OPTIONS: string[] = [
  "Galicia",
  "Santander",
  "Nación",
  "Provincia",
  "Ciudad",
  "Macro",
  "Itaú",
  "HSBC",
  "BBVA",
  "Supervielle",
  "Brubank",
  "Mercado Pago",
  "Ualá",
  "Naranja X",
];

// Paso 5: Tipo de transporte
export const TRANSPORT_TYPES = [
  { id: "auto-nafta", label: "Auto a nafta", icon: Car },
  { id: "auto-diesel", label: "Auto a diesel", icon: Car },
  { id: "moto", label: "Moto", icon: Bike },
  { id: "transporte-publico", label: "Transporte público", icon: Bus },
  { id: "bicicleta", label: "Bicicleta / A pie", icon: Bike },
  { id: "taxi-uber", label: "Taxi / Uber / Cabify", icon: Car },
];
