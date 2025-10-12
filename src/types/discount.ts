// Re-exportar tipos desde database.ts para mantener compatibilidad
export type {
  ApprovalStatus,
  CreateDiscountData,
  Credential,
  DISCOUNT_CATEGORIES,
  Discount,
  DiscountCategory,
  DiscountFilters,
  DiscountSource,
  DiscountStats,
  DiscountStatus,
  UpdateDiscountData,
} from "./database";

// Mantener solo las re-exportaciones para compatibilidad
