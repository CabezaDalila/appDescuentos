// Tipos para descuentos
import type { Card, CardLevel } from "@/constants/membership";

export interface Discount {
  id: string;
  name: string;
  description?: string;
  category?: string;
  discountPercentage?: number;
  discountAmount?: number;
  validFrom?: Date;
  validUntil?: Date;
  membershipRequired?: string[];
  terms?: string;
  imageUrl?: string;
  image?: string;
  createdAt?: Date;
  updatedAt?: Date;
  status?: "active" | "inactive" | "expired";
  title?: string;
  origin?: string;
  type?: string;
  expirationDate?: Date;
  descripcion?: string;
  approvalStatus?: "pending" | "approved" | "rejected";
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  source?: "manual" | "scraping";
  isVisible?: boolean;
  bancos?: string[];
  availableMemberships?: string[];
  availableCredentials?: UserCredential[];
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

// Tipo específico para los descuentos de la página de inicio
export interface HomePageDiscount {
  id: string;
  title: string;
  image: string;
  category: string;
  discountPercentage: string;
  points: number;
  distance: string;
  expiration: string;
  description: string;
  origin: string;
  status: "active" | "inactive" | "expired";
  isVisible: boolean;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

// Representa una credencial de tarjeta del usuario y también
// el formato usado en availableCredentials de los descuentos.
export interface UserCredential {
  bank: string; // Debe provenir del selector (e.g., "Banco Galicia")
  type: Card["type"]; // "Crédito" | "Débito"
  brand: Card["brand"]; // "Visa" | "Mastercard" | ...
  level: CardLevel; // "Gold" | "Platinum" | ...
}
