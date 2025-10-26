// ===== TIPOS PARA SCRAPING SCRIPTS =====

export interface ScrapingScript {
  id: string;
  siteName: string;
  script: string;
  frequency: ScrapingFrequency;
  isActive: boolean;
  lastExecuted?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ScrapingFrequency = "manual" | "hourly" | "daily" | "weekly";

// ===== TIPOS PARA DESCUENTOS MANUALES =====

export interface ManualDiscount {
  id?: string;
  title: string;
  origin: string;
  category: string;
  expirationDate: Date;
  description: string;
  discountPercentage?: number;
  discountAmount?: number;
  imageUrl?: string;
  url?: string;
  isVisible: boolean;
  availableCredentials?: Array<{
    brand: string;
    level: string;
    type: string;
    bank: string;
  }>;
  availableMemberships?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  validUntil?: Date;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

export interface CreateManualDiscountData {
  title: string;
  origin: string;
  category: string;
  expirationDate: Date;
  description: string;
  discountPercentage?: number;
  discountAmount?: number;
  imageUrl?: string;
  url?: string;
  isVisible: boolean;
  availableCredentials?: Array<{
    brand: string;
    level: string;
    type: string;
    bank: string;
  }>;
  availableMemberships?: string[];
}

export interface UpdateManualDiscountData {
  title?: string;
  origin?: string;
  category?: string;
  expirationDate?: Date;
  description?: string;
  discountPercentage?: number;
  discountAmount?: number;
  imageUrl?: string;
  url?: string;
  isVisible?: boolean;
  availableCredentials?: Array<{
    brand: string;
    level: string;
    type: string;
    bank: string;
  }>;
  availableMemberships?: string[];
}

// ===== TIPOS PARA USUARIOS ADMIN =====

export interface AdminUser {
  uid: string;
  email: string;
  role: UserRole;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = "admin" | "user";

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
