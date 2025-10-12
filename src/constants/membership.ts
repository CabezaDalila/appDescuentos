// Re-exportar tipos desde database.ts para mantener compatibilidad
export type {
  Card,
  CardBrand,
  CardLevel,
  CardType,
  CreateCardData,
  CreateMembershipData,
  Membership,
  MembershipCategory,
  MembershipStatus,
  UpdateCardData,
  UpdateMembershipData,
} from "../types/database";

// Re-exportar constantes desde database.ts
export { MEMBERSHIP_CATEGORIES } from "../types/database";

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

// Re-exportar constantes desde database.ts
export { CARD_BRANDS, CARD_LEVELS, CARD_TYPES } from "../types/database";
