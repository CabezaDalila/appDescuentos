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

export interface ScrapedDiscountInput {
  title: string;
  name?: string;
  origin: string;
  category: string;
  description: string;
  discountPercentage?: number;
  discountAmount?: number;
  installments?: number;
  terms?: string;
  imageUrl?: string;
  linkUrl?: string;
  membershipRequired?: string[];
  credentialHints?: string[];
  cardTypeHint?: "Crédito" | "Débito";
  cardBrandHint?:
    | "Visa"
    | "Mastercard"
    | "American Express"
    | "Diners Club"
    | "Cabal"
    | "Otro";
  cardLevelHint?:
    | "Classic"
    | "Gold"
    | "Platinum"
    | "Black"
    | "Signature"
    | "Infinite"
    | "Internacional"
    | "Nacional";
  credentialCombos?: Array<{
    bank: string;
    type: "Crédito" | "Débito";
    brand: "Visa" | "Mastercard" | "American Express" | "Diners Club" | "Cabal" | "Otro";
    level?:
      | "Classic"
      | "Gold"
      | "Platinum"
      | "Black"
      | "Signature"
      | "Infinite"
      | "Internacional"
      | "Nacional";
  }>;
  expirationDate?: string;
}

export interface ScrapingStats {
  totalDetected: number;
  totalValid: number;
  totalSaved?: number;
  totalFailed?: number;
  totalDiscardedNoCredential?: number;
}

export interface ScrapingExecutionResult {
  source: string;
  stats: ScrapingStats;
  items: ScrapedDiscountInput[];
  warnings: string[];
  errors?: string[];
}

// ===== TIPOS PARA DESCUENTOS MANUALES =====

export interface ManualDiscount {
  id?: string;
  title: string;
  origin: string;
  category: string;
  /** Ausente si el documento no tiene expirationDate/validUntil (ej. scraping incompleto). */
  expirationDate?: Date;
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
  membershipRequired?: string[];
  bancos?: string[];
  terms?: string;
  installments?: number;
  createdAt?: Date;
  updatedAt?: Date;
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
