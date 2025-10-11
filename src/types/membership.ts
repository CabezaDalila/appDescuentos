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
  expiry?: string; // Formato MM/YY
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
    | "telecomunicacion";
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

// Categorías disponibles para el selector
export const MEMBERSHIP_CATEGORIES = [
  { value: "banco", label: "Bancos" },
  { value: "club", label: "Clubes de beneficios" },
  { value: "salud", label: "Salud" },
  { value: "educacion", label: "Educación" },
  { value: "seguro", label: "Seguros" },
  { value: "telecomunicacion", label: "Telecomunicaciones" },
] as const;

// Entidades predefinidas por categoría (esto puede venir de una API o BD)
export const ENTITIES_BY_CATEGORY = {
  banco: [
    "Banco Galicia",
    "Banco Santander",
    "Banco Nación",
    "Banco Provincia",
    "Banco Ciudad",
    "Banco Macro",
    "Banco Itaú",
    "Banco HSBC",
    "Banco BBVA",
    "Banco Supervielle",
  ],
  club: [
    "Club La Nación",
    "Club Clarín",
    "Club Personal",
    "Club Movistar",
    "Club Claro",
    "Club Despegar",
    "Club Mercado Libre",
  ],
  salud: [
    "OSDE",
    "Swiss Medical",
    "Medicus",
    "Galeno",
    "Omint",
    "Accord Salud",
    "SanCor Salud",
  ],
  educacion: [
    "Universidad de Buenos Aires",
    "Universidad Nacional de La Plata",
    "Universidad Nacional de Córdoba",
    "Universidad de Palermo",
    "Universidad de San Andrés",
    "Universidad Católica Argentina",
  ],
  seguro: [
    "La Caja",
    "Federación Patronal",
    "Sancor Seguros",
    "Allianz",
    "Zurich",
    "Mapfre",
    "Provincia Seguros",
  ],
  telecomunicacion: [
    "Personal",
    "Movistar",
    "Claro",
    "Telecom",
    "Fibertel",
    "Cablevisión",
    "DirecTV",
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
