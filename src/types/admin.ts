// ===== TIPOS PARA SCRAPING SCRIPTS =====
// Los tipos de scraping se mantienen sin tipado estricto como solicitado

// ===== TIPOS PARA DESCUENTOS MANUALES =====
// Re-exportar tipos desde database.ts
export type {
  CreateDiscountData as CreateManualDiscountData,
  Discount as ManualDiscount,
  UpdateDiscountData as UpdateManualDiscountData,
} from "./database";

// ===== TIPOS PARA USUARIOS ADMIN =====
// Re-exportar tipos desde database.ts
export type { User as AdminUser, UserRole } from "./database";

// ===== TIPOS PARA ESTADOS DE COMPONENTES =====

export interface DiscountFormState {
  title: string;
  origin: string;
  category: string | undefined;
  expirationDate: string;
  description: string;
  discountPercentage: string;
  discountAmount: string;
  imageUrl: string;
  isVisible: boolean;
  availableCredentials: string[];
}

export interface ConfirmationModalState {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
}

// ===== TIPOS PARA OPERACIONES =====

export type DiscountOperation =
  | "create"
  | "update"
  | "delete"
  | "toggle-visibility";

export interface OperationResult {
  success: boolean;
  message: string;
  data?: unknown;
}
