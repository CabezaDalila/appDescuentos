// Tipos para descuentos
import type { UserCredential } from "@/types/credentials";

// Re-export para compatibilidad: algunos módulos importan UserCredential
// desde @/types/discount. La definición canónica vive en @/types/credentials.
export type { UserCredential };

// Ubicación geográfica de un descuento (comercio físico).
export interface DiscountLocation {
  latitude: number;
  longitude: number;
  address: string;
}

export interface Discount {
  id: string;
  name: string;
  description?: string;
  category?: string;
  discountPercentage?: number;
  discountAmount?: number;
  validFrom?: Date;
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
  location?: DiscountLocation;
}

export interface HomePageDiscount {
  id: string;
  title: string;
  image: string;
  category: string;
  discountPercentage: string;
  discountAmount?: number;
  points: number;
  distance: string;
  expiration: string;
  description: string;
  origin: string;
  status: "active" | "inactive" | "expired";
  isVisible: boolean;
  membershipRequired?: string[];
  bancos?: string[];
  availableMemberships?: string[];
  availableCredentials?: UserCredential[];
  location?: DiscountLocation;
}
