export type CardLevel =
  | "Classic"
  | "Gold"
  | "Platinum"
  | "Black"
  | "Signature"
  | "Infinite"
  | "Internacional"
  | "Nacional";

export interface Card {
  id: string;
  type: "Crédito" | "Débito";
  brand: "Visa" | "Mastercard" | "American Express" | "Diners Club" | "Otro";
  level: CardLevel;
  name?: string;
  expiryDate?: string; // Formato MM/YY - Fecha de vencimiento de la tarjeta
  status?: "active" | "inactive"; // Estado individual de la tarjeta
}

export interface Membership {
  id: string;
  name: string;
  category:
    | "banco"
    | "club"
    | "salud"
    | "educacion"
    | "seguro"
    | "telecomunicacion"
    | "billeteras"
    | "streaming"
    | "gym";
  status: "active" | "inactive";
  color: string;
  cards: Card[];
  createdAt: Date;
  updatedAt: Date;
  logoUrl?: string;
}

export interface CreateMembershipData {
  name: string;
  category: Membership["category"];
  color: string;
}

export interface UpdateMembershipData {
  name?: string;
  category?: Membership["category"];
  status?: Membership["status"];
  color?: string;
}

export interface CreateCardData {
  type: Card["type"];
  brand: Card["brand"];
  level: CardLevel;
  name?: string;
  expiry?: string; // Formato MM/YY
}

export interface UpdateCardData {
  type?: Card["type"];
  brand?: Card["brand"];
  level?: CardLevel;
  name?: string;
  expiry?: string; // Formato MM/YY
}

// Categorías disponibles para el selector (usuario)
export const MEMBERSHIP_CATEGORIES = [
  { value: "banco", label: "Bancos", icon: "🏦" },
  { value: "seguro", label: "Seguros", icon: "🛡️" },
  { value: "telecomunicacion", label: "Telecomunicaciones", icon: "📱" },
  { value: "club", label: "Clubes de beneficios", icon: "🏆" },
  { value: "salud", label: "Salud", icon: "❤️" },
  { value: "educacion", label: "Educación", icon: "🎓" },
  { value: "billeteras", label: "Billeteras digitales", icon: "💳" },
  { value: "streaming", label: "Streaming", icon: "📺" },
  { value: "gym", label: "Gimnasio", icon: "💪" },
] as const;

// Bancos disponibles (para tarjetas)
export const BANKS = [
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
] as const;

// Entidades predefinidas por categoría (SIN bancos - los bancos se seleccionan con tarjetas)
// Usado tanto en el perfil del usuario como en el admin para descuentos
export const ENTITIES_BY_CATEGORY = {
  seguro: [
    "La Caja",
    "Federación Patronal",
    "Sancor Seguros",
    "Allianz",
    "Zurich",
    "Mapfre",
    "Provincia Seguros",
    "San Cristóbal",
    "Rivadavia Seguros",
    "La Segunda",
  ],
  telecomunicacion: [
    "Personal",
    "Movistar",
    "Claro",
    "Telecom",
    "Fibertel",
    "Cablevisión",
    "DirecTV",
    "Tuenti",
    "Flow",
    "Telecentro",
  ],
  club: [
    "Club La Nación",
    "Club Clarín",
    "Club Personal",
    "Club Movistar",
    "Club Claro",
    "Club La Razón",
    "Club Perfil",
    "Club de Lectores",
  ],
  salud: [
    "OSDE",
    "Swiss Medical",
    "Medicus",
    "Galeno",
    "Omint",
    "Hospital Italiano",
    "CEMIC",
    "Avalian",
    "SanCor Salud",
  ],
  educacion: [
    "UBA",
    "UTN",
    "UADE",
    "UCEMA",
    "Di Tella",
    "Austral",
    "San Andrés",
    "ITBA",
    "ORT",
  ],
  streaming: [
    "Netflix",
    "Spotify",
    "Disney+",
    "Amazon Prime",
    "HBO Max",
    "Apple TV+",
    "YouTube Premium",
    "Paramount+",
    "Crunchyroll",
  ],
  gym: [
    "Megatlon",
    "SportClub",
    "Smart Fit",
    "CrossFit",
    "Pilates",
    "Yoga",
    "Spinning",
    "Functional",
  ],
  billeteras: [
    "MercadoPago",
    "PersonalPay",
    "Ualá",
    "Naranja X",
    "Brubank",
    "Rebanking",
    "Modo",
    "Cuenta DNI",
    "Bimo",
  ],
} as const;

export const CARD_TYPES: { value: Card["type"]; label: string }[] = [
  { value: "Crédito", label: "Crédito" },
  { value: "Débito", label: "Débito" },
];

export const CARD_BRANDS: { value: Card["brand"]; label: string }[] = [
  { value: "Visa", label: "Visa" },
  { value: "Mastercard", label: "Mastercard" },
  { value: "American Express", label: "American Express" },
  { value: "Diners Club", label: "Diners Club" },
  { value: "Otro", label: "Otro" },
];

export const CARD_LEVELS: { value: CardLevel; label: string }[] = [
  { value: "Classic", label: "Classic" },
  { value: "Gold", label: "Gold" },
  { value: "Platinum", label: "Platinum" },
  { value: "Black", label: "Black" },
  { value: "Signature", label: "Signature" },
  { value: "Infinite", label: "Infinite" },
  { value: "Internacional", label: "Internacional" },
  { value: "Nacional", label: "Nacional" },
];
