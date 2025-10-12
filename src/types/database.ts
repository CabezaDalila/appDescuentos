// ===== TIPOS PRINCIPALES DE LA BASE DE DATOS =====

import { Timestamp } from "firebase/firestore";

// ===== TIPOS BASE =====

export type TimestampField = Timestamp | Date | string;
export type OptionalTimestampField = TimestampField | null | undefined;

// ===== TIPOS DE USUARIO =====

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  providerId: string;
  isActive: boolean;
  createdAt: TimestampField;
  updatedAt: TimestampField;
  lastLoginAt: TimestampField;
  lastLoginIP: string | null;
  loginCount: number;
  role: UserRole;
  preferences: UserPreferences;
  activity: UserActivity;
  profile: UserProfile;
  privacy: UserPrivacy;
  appInfo: AppInfo;
}

export type UserRole = "admin" | "user";

export interface UserPreferences {
  notifications: NotificationPreferences;
  theme: "light" | "dark" | "system";
  language: "es" | "en";
  currency: "ARS" | "USD" | "EUR";
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  discounts: boolean;
  promotions: boolean;
}

export interface UserActivity {
  totalLogins: number;
  lastActivityAt: TimestampField;
  favoriteCategories: string[];
  savedDiscounts: string[];
  sharedDiscounts: number;
}

export interface UserProfile {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  birthDate: string | null; // ISO date string
  gender: "male" | "female" | "other" | null;
  location: UserLocation;
}

export interface UserLocation {
  country: string | null;
  city: string | null;
  timezone: string;
}

export interface UserPrivacy {
  profileVisible: boolean;
  emailVisible: boolean;
  activityVisible: boolean;
}

export interface AppInfo {
  version: string;
  platform: "web" | "mobile";
  userAgent: string | null;
}

// ===== TIPOS DE DESCUENTO =====

export interface Discount {
  id: string;
  name: string;
  title: string;
  description: string;
  category: DiscountCategory;
  discountPercentage: number | null;
  discountAmount: number | null;
  validFrom: OptionalTimestampField;
  validUntil: OptionalTimestampField;
  membershipRequired: string[];
  terms: string | null;
  imageUrl: string | null;
  image: string | null; // Compatibilidad
  isVisible: boolean;
  createdAt: TimestampField;
  updatedAt: TimestampField;
  status: DiscountStatus;
  approvalStatus: ApprovalStatus;
  reviewedBy: string | null;
  reviewedAt: OptionalTimestampField;
  rejectionReason: string | null;
  source: DiscountSource;
  origin: string | null;
  availableMemberships: string[];
  availableCredentials: Credential[];
  // Propiedades adicionales para UI
  points: number | null;
  distance: string | null;
  expiration: string | null;
}

export type DiscountCategory =
  | "banco"
  | "club"
  | "salud"
  | "educacion"
  | "seguro"
  | "telecomunicacion"
  | "gastronomia"
  | "fashion"
  | "beauty"
  | "home"
  | "automotive"
  | "entertainment"
  | "sports"
  | "technology"
  | "otro";

export type DiscountStatus = "active" | "inactive" | "expired";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type DiscountSource = "manual" | "scraping";

export interface Credential {
  bank: string;
  type: "Crédito" | "Débito";
  brand: "Visa" | "Mastercard" | "American Express" | "Diners Club" | "Otro";
  level: CardLevel;
}

// ===== TIPOS DE MEMBRESÍA =====

export interface Membership {
  id: string;
  name: string;
  category: MembershipCategory;
  status: MembershipStatus;
  color: string;
  cards: Card[];
  createdAt: TimestampField;
  updatedAt: TimestampField;
  logoUrl: string | null;
}

export type MembershipCategory =
  | "banco"
  | "club"
  | "salud"
  | "educacion"
  | "seguro"
  | "telecomunicacion";

export type MembershipStatus = "active" | "inactive";

export type CardType = "Crédito" | "Débito";
export type CardBrand =
  | "Visa"
  | "Mastercard"
  | "American Express"
  | "Diners Club"
  | "Otro";

export interface Card {
  id: string;
  type: CardType;
  brand: CardBrand;
  level: CardLevel;
  name: string | null;
  expiryDate: string | null; // Formato MM/YY
}

export type CardLevel =
  | "Classic"
  | "Gold"
  | "Platinum"
  | "Black"
  | "Signature"
  | "Infinite"
  | "Internacional"
  | "Nacional";

// ===== TIPOS DE NOTIFICACIÓN =====

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: TimestampField;
  read: boolean;
  type: NotificationType;
}

export type NotificationType =
  | "vencimiento_tarjeta"
  | "promocion"
  | "recordatorio"
  | "sistema"
  | "info"
  | "warning"
  | "success"
  | "error";

// ===== TIPOS DE FIRESTORE (INTERNOS) =====

export interface FirestoreDiscount {
  name: string;
  description?: string;
  category?: string;
  discountPercentage?: number | null;
  discountAmount?: number | null;
  validFrom?: Timestamp | null;
  validUntil?: Timestamp | null;
  membershipRequired?: string[];
  terms?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  status?: "active" | "inactive" | "expired";
  title?: string | null;
  origin?: string | null;
  type?: string;
  expirationDate?: Timestamp;
  descripcion?: string | null; // Compatibilidad
  approvalStatus?: "pending" | "approved" | "rejected";
  reviewedBy?: string | null;
  reviewedAt?: Timestamp | null;
  rejectionReason?: string | null;
  source?: "manual" | "scraping";
  isVisible?: boolean;
  bancos?: string[];
  availableMemberships?: string[];
  availableCredentials?: Array<{
    bank: string;
    type: string;
    brand: string;
    level: string;
  }>;
}

export interface FirestoreUser {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  emailVerified?: boolean;
  providerId?: string;
  isActive?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  lastLoginAt?: Timestamp;
  lastLoginIP?: string | null;
  loginCount?: number;
  role?: "admin" | "user";
  preferences?: {
    notifications?: {
      email?: boolean;
      push?: boolean;
      discounts?: boolean;
      promotions?: boolean;
    };
    theme?: "light" | "dark" | "system";
    language?: "es" | "en";
    currency?: "ARS" | "USD" | "EUR";
  };
  activity?: {
    totalLogins?: number;
    lastActivityAt?: Timestamp | null;
    favoriteCategories?: string[];
    savedDiscounts?: string[];
    sharedDiscounts?: number;
  };
  profile?: {
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    birthDate?: string | null;
    gender?: "male" | "female" | "other" | null;
    location?: {
      country?: string | null;
      city?: string | null;
      timezone?: string;
    };
  };
  privacy?: {
    profileVisible?: boolean;
    emailVisible?: boolean;
    activityVisible?: boolean;
  };
  appInfo?: {
    version?: string;
    platform?: "web" | "mobile";
    userAgent?: string | null;
  };
}

export interface FirestoreMembership {
  name: string;
  category: string;
  status: "active" | "inactive";
  color: string;
  cards?: Array<{
    id: string;
    type: string;
    brand: string;
    level: string;
    name?: string | null;
    expiryDate?: string | null;
  }>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  logoUrl?: string | null;
}

export interface FirestoreNotification {
  userId: string;
  title: string;
  message: string;
  timestamp: Timestamp;
  read?: boolean;
  type: string;
}

// ===== TIPOS DE CREACIÓN =====

export interface CreateDiscountData {
  name: string;
  title: string;
  description: string;
  category: DiscountCategory;
  discountPercentage?: number;
  discountAmount?: number;
  validFrom?: Date;
  validUntil?: Date;
  membershipRequired?: string[];
  terms?: string;
  imageUrl?: string;
  isVisible?: boolean;
  source: DiscountSource;
  origin?: string;
  availableMemberships?: string[];
  availableCredentials?: Credential[];
}

export interface CreateMembershipData {
  name: string;
  category: MembershipCategory;
  color: string;
  cards?: CreateCardData[];
}

export interface CreateCardData {
  type: "Crédito" | "Débito";
  brand: "Visa" | "Mastercard" | "American Express" | "Diners Club" | "Otro";
  level: CardLevel;
  name?: string;
  expiryDate?: string; // MM/YY
}

export interface CreateNotificationData {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read?: boolean;
}

// ===== TIPOS DE ACTUALIZACIÓN =====

export interface UpdateDiscountData {
  name?: string;
  title?: string;
  description?: string;
  category?: DiscountCategory;
  discountPercentage?: number;
  discountAmount?: number;
  validFrom?: Date;
  validUntil?: Date;
  membershipRequired?: string[];
  terms?: string;
  imageUrl?: string;
  isVisible?: boolean;
  status?: DiscountStatus;
  approvalStatus?: ApprovalStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  origin?: string;
  availableMemberships?: string[];
  availableCredentials?: Credential[];
}

export interface UpdateMembershipData {
  name?: string;
  category?: MembershipCategory;
  status?: MembershipStatus;
  color?: string;
  cards?: Card[];
  logoUrl?: string;
}

export interface UpdateCardData {
  type?: "Crédito" | "Débito";
  brand?: "Visa" | "Mastercard" | "American Express" | "Diners Club" | "Otro";
  level?: CardLevel;
  name?: string;
  expiryDate?: string;
}

// ===== TIPOS DE VALIDACIÓN =====

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface DiscountValidationResult extends ValidationResult {
  data?: Partial<Discount>;
}

export interface MembershipValidationResult extends ValidationResult {
  data?: Partial<Membership>;
}

// ===== TIPOS DE RESPUESTA DE API =====

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===== TIPOS DE FILTROS =====

export interface DiscountFilters {
  category?: DiscountCategory;
  status?: DiscountStatus;
  approvalStatus?: ApprovalStatus;
  source?: DiscountSource;
  isVisible?: boolean;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface MembershipFilters {
  category?: MembershipCategory;
  status?: MembershipStatus;
  search?: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  read?: boolean;
  userId?: string;
}

// ===== TIPOS DE ESTADÍSTICAS =====

export interface DiscountStats {
  total: number;
  active: number;
  inactive: number;
  expired: number;
  pending: number;
  approved: number;
  rejected: number;
  byCategory: Record<DiscountCategory, number>;
  bySource: Record<DiscountSource, number>;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<UserRole, number>;
  newThisMonth: number;
}

export interface MembershipStats {
  total: number;
  active: number;
  inactive: number;
  byCategory: Record<MembershipCategory, number>;
  totalCards: number;
}

// ===== CONSTANTES DE TIPOS =====

export const DISCOUNT_CATEGORIES = [
  { value: "banco", label: "Banco" },
  { value: "club", label: "Club" },
  { value: "salud", label: "Salud" },
  { value: "educacion", label: "Educación" },
  { value: "seguro", label: "Seguro" },
  { value: "telecomunicacion", label: "Telecomunicación" },
  { value: "gastronomia", label: "Gastronomía" },
  { value: "fashion", label: "Moda" },
  { value: "beauty", label: "Belleza" },
  { value: "home", label: "Hogar" },
  { value: "automotive", label: "Automotriz" },
  { value: "entertainment", label: "Entretenimiento" },
  { value: "sports", label: "Deportes" },
  { value: "technology", label: "Tecnología" },
  { value: "otro", label: "Otro" },
] as const;

export const MEMBERSHIP_CATEGORIES = [
  { value: "banco", label: "Bancos" },
  { value: "club", label: "Clubes de beneficios" },
  { value: "salud", label: "Salud" },
  { value: "educacion", label: "Educación" },
  { value: "seguro", label: "Seguros" },
  { value: "telecomunicacion", label: "Telecomunicaciones" },
] as const;

export const CARD_TYPES = [
  { value: "Crédito", label: "Crédito" },
  { value: "Débito", label: "Débito" },
] as const;

export const CARD_BRANDS = [
  { value: "Visa", label: "Visa" },
  { value: "Mastercard", label: "Mastercard" },
  { value: "American Express", label: "American Express" },
  { value: "Diners Club", label: "Diners Club" },
  { value: "Otro", label: "Otro" },
] as const;

export const CARD_LEVELS = [
  { value: "Classic", label: "Classic" },
  { value: "Gold", label: "Gold" },
  { value: "Platinum", label: "Platinum" },
  { value: "Black", label: "Black" },
  { value: "Signature", label: "Signature" },
  { value: "Infinite", label: "Infinite" },
  { value: "Internacional", label: "Internacional" },
  { value: "Nacional", label: "Nacional" },
] as const;

export const NOTIFICATION_TYPES = [
  { value: "vencimiento_tarjeta", label: "Vencimiento de Tarjeta" },
  { value: "promocion", label: "Promoción" },
  { value: "recordatorio", label: "Recordatorio" },
  { value: "sistema", label: "Sistema" },
  { value: "info", label: "Información" },
  { value: "warning", label: "Advertencia" },
  { value: "success", label: "Éxito" },
  { value: "error", label: "Error" },
] as const;
