import type { Card, CardLevel } from "@/constants/membership";

// Representa una credencial de tarjeta del usuario y también
// el formato usado en availableCredentials de los descuentos.
export interface UserCredential {
  bank: string; // Debe provenir del selector (e.g., "Banco Galicia")
  type: Card["type"]; // "Crédito" | "Débito"
  brand: Card["brand"]; // "Visa" | "Mastercard" | ...
  level: CardLevel; // "Gold" | "Platinum" | ...
}
