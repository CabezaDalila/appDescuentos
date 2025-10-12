// Re-exportar tipos desde database.ts para mantener compatibilidad
export type {
  AppInfo,
  CARD_BRANDS,
  CARD_LEVELS,
  CARD_TYPES,
  Card,
  CardLevel,
  CreateCardData,
  CreateMembershipData,
  MEMBERSHIP_CATEGORIES,
  Membership,
  MembershipCategory,
  MembershipStatus,
  NotificationPreferences,
  UpdateCardData,
  UpdateMembershipData,
  User,
  UserActivity,
  UserLocation,
  UserPreferences,
  UserPrivacy,
  UserProfile,
  UserRole,
} from "./database";

// Mantener compatibilidad con tipos existentes
export type Language = "es" | "en";
