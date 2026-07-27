import type { Card, CardLevel } from "@/constants/membership";

// Representa una credencial de tarjeta del usuario y también
// el formato usado en availableCredentials de los descuentos.
// Fuente única de verdad: re-exportado por @/types/discount para
// compatibilidad con imports existentes.
export interface UserCredential {
  bank: string; // Debe provenir del selector (e.g., "Banco Galicia")
  type: Card["type"]; // "Crédito" | "Débito"
  brand: Card["brand"]; // "Visa" | "Mastercard" | ...
  level: CardLevel; // "Gold" | "Platinum" | ...
}

// Versión laxa (todos string) usada por los descuentos manuales/admin,
// donde los valores pueden provenir de scraping sin validar contra los enums.
export interface CredentialCombo {
  bank: string;
  type: string;
  brand: string;
  level: string;
}
