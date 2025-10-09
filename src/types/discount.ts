export interface Discount {
  id: string;
  name: string;
  title?: string; // Agregado para compatibilidad
  description?: string;
  category: string; // Cambiado a string para permitir todas las categorías
  discountPercentage?: number;
  discountAmount?: number;
  validFrom?: Date;
  validUntil?: Date;
  membershipRequired?: string[];
  terms?: string;
  imageUrl?: string;
  image?: string; // Agregado para compatibilidad
  isVisible?: boolean; // Campo para controlar visibilidad
  createdAt: Date;
  updatedAt: Date;
  status: "active" | "inactive" | "expired";
  approvalStatus: "pending" | "approved" | "rejected"; // Nuevo campo para gestión de aprobación
  reviewedBy?: string; // ID del admin que revisó
  reviewedAt?: Date; // Fecha de revisión
  rejectionReason?: string; // Razón del rechazo
  source: "manual" | "scraping"; // Origen del descuento
  origin?: string; // Origen del descuento (empresa/sitio)
}

export interface CreateDiscountData {
  name: string;
  description?: string;
  category: Discount["category"];
  discountPercentage?: number;
  discountAmount?: number;
  validFrom?: Date;
  validUntil?: Date;
  membershipRequired?: string[];
  terms?: string;
  imageUrl?: string;
}

export const DISCOUNT_CATEGORIES = [
  { value: "banco", label: "Banco" },
  { value: "club", label: "Club" },
  { value: "salud", label: "Salud" },
  { value: "educacion", label: "Educación" },
  { value: "seguro", label: "Seguro" },
  { value: "telecomunicacion", label: "Telecomunicación" },
  { value: "gastronomia", label: "Gastronomía" },
  { value: "otro", label: "Otro" },
] as const;
