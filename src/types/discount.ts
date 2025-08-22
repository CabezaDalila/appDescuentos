export interface Discount {
  id: string;
  name: string;
  description?: string;
  category:
    | "banco"
    | "club"
    | "salud"
    | "educacion"
    | "seguro"
    | "telecomunicacion"
    | "gastronomia"
    | "otro";
  discountPercentage?: number;
  discountAmount?: number;
  validFrom?: Date;
  validUntil?: Date;
  membershipRequired?: string[];
  terms?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  status: "active" | "inactive" | "expired";
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