// ===== CONVERTIDORES DE DATOS ENTRE FIRESTORE Y TIPOS ESTRICTOS =====

import {
  CardBrand,
  CardLevel,
  CardType,
  Discount,
  DiscountCategory,
  FirestoreDiscount,
  FirestoreMembership,
  FirestoreNotification,
  FirestoreUser,
  Membership,
  MembershipCategory,
  Notification,
  NotificationType,
  User,
} from "@/types/database";
import { Timestamp } from "firebase/firestore";

// ===== CONVERTIDORES DE TIMESTAMP =====

export const convertTimestamp = (
  timestamp: Timestamp | Date | string | null | undefined
): Date | null => {
  if (!timestamp) return null;

  if (timestamp instanceof Date) return timestamp;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  if (typeof timestamp === "string") return new Date(timestamp);

  return null;
};

export const convertToFirestoreTimestamp = (
  date: Date | string | null | undefined
): Timestamp | null => {
  if (!date) return null;

  const dateObj = date instanceof Date ? date : new Date(date);
  return Timestamp.fromDate(dateObj);
};

// ===== CONVERTIDORES DE DESCUENTOS =====

export const convertFirestoreDiscountToDiscount = (
  firestoreData: FirestoreDiscount,
  id: string
): Discount => {
  return {
    id,
    name: firestoreData.name || "",
    title: firestoreData.title || firestoreData.name || "",
    description: firestoreData.description || firestoreData.descripcion || "",
    category: (firestoreData.category as DiscountCategory) || "otro",
    discountPercentage: firestoreData.discountPercentage ?? null,
    discountAmount: firestoreData.discountAmount ?? null,
    validFrom: convertTimestamp(firestoreData.validFrom),
    validUntil: convertTimestamp(firestoreData.validUntil),
    membershipRequired: firestoreData.membershipRequired || [],
    terms: firestoreData.terms ?? null,
    imageUrl: firestoreData.imageUrl ?? firestoreData.image ?? null,
    image: firestoreData.image ?? firestoreData.imageUrl ?? null,
    isVisible: firestoreData.isVisible ?? true,
    createdAt: convertTimestamp(firestoreData.createdAt) || new Date(),
    updatedAt: convertTimestamp(firestoreData.updatedAt) || new Date(),
    status:
      (firestoreData.status as "active" | "inactive" | "expired") || "active",
    approvalStatus:
      (firestoreData.approvalStatus as "pending" | "approved" | "rejected") ||
      "pending",
    reviewedBy: firestoreData.reviewedBy ?? null,
    reviewedAt: convertTimestamp(firestoreData.reviewedAt),
    rejectionReason: firestoreData.rejectionReason ?? null,
    source: (firestoreData.source as "manual" | "scraping") || "manual",
    origin: firestoreData.origin ?? null,
    availableMemberships: firestoreData.availableMemberships || [],
    availableCredentials: (firestoreData.availableCredentials || []) as Array<{
      bank: string;
      type: "Crédito" | "Débito";
      brand:
        | "Visa"
        | "Mastercard"
        | "American Express"
        | "Diners Club"
        | "Otro";
      level: CardLevel;
    }>,
    points: null,
    distance: null,
    expiration: null,
  };
};

export const convertDiscountToFirestore = (
  discount: Partial<Discount>
): Partial<FirestoreDiscount> => {
  return {
    name: discount.name,
    title: discount.title,
    description: discount.description,
    category: discount.category,
    discountPercentage: discount.discountPercentage,
    discountAmount: discount.discountAmount,
    validFrom: convertToFirestoreTimestamp(discount.validFrom as Date),
    validUntil: convertToFirestoreTimestamp(discount.validUntil as Date),
    membershipRequired: discount.membershipRequired,
    terms: discount.terms,
    imageUrl: discount.imageUrl,
    image: discount.image,
    isVisible: discount.isVisible,
    status: discount.status,
    approvalStatus: discount.approvalStatus,
    reviewedBy: discount.reviewedBy,
    reviewedAt: convertToFirestoreTimestamp(discount.reviewedAt as Date),
    rejectionReason: discount.rejectionReason,
    source: discount.source,
    origin: discount.origin,
    availableMemberships: discount.availableMemberships,
    availableCredentials: discount.availableCredentials,
  };
};

// ===== CONVERTIDORES DE MEMBRESÍAS =====

export const convertFirestoreMembershipToMembership = (
  firestoreData: FirestoreMembership,
  id: string
): Membership => {
  return {
    id,
    name: firestoreData.name || "",
    category: (firestoreData.category as MembershipCategory) || "otro",
    status: (firestoreData.status as "active" | "inactive") || "active",
    color: firestoreData.color || "#000000",
    cards:
      firestoreData.cards?.map((card) => ({
        id: card.id || "",
        type: (card.type as CardType) || "Crédito",
        brand: (card.brand as CardBrand) || "Visa",
        level: (card.level as CardLevel) || "Classic",
        name: card.name || null,
        expiryDate: card.expiryDate || null,
      })) || [],
    createdAt: convertTimestamp(firestoreData.createdAt) || new Date(),
    updatedAt: convertTimestamp(firestoreData.updatedAt) || new Date(),
    logoUrl: firestoreData.logoUrl || null,
  };
};

export const convertMembershipToFirestore = (
  membership: Partial<Membership>
): Partial<FirestoreMembership> => {
  return {
    name: membership.name,
    category: membership.category,
    status: membership.status,
    color: membership.color,
    cards: membership.cards?.map((card) => ({
      id: card.id,
      type: card.type,
      brand: card.brand,
      level: card.level,
      name: card.name,
      expiryDate: card.expiryDate,
    })),
    logoUrl: membership.logoUrl,
  };
};

// ===== CONVERTIDORES DE USUARIOS =====

export const convertFirestoreUserToUser = (
  firestoreData: FirestoreUser,
  uid: string
): User => {
  return {
    uid,
    email: firestoreData.email || "",
    displayName: firestoreData.displayName || null,
    photoURL: firestoreData.photoURL || null,
    emailVerified: firestoreData.emailVerified || false,
    providerId: firestoreData.providerId || "google.com",
    isActive: firestoreData.isActive ?? true,
    createdAt: convertTimestamp(firestoreData.createdAt) || new Date(),
    updatedAt: convertTimestamp(firestoreData.updatedAt) || new Date(),
    lastLoginAt: convertTimestamp(firestoreData.lastLoginAt) || new Date(),
    lastLoginIP: firestoreData.lastLoginIP || null,
    loginCount: firestoreData.loginCount || 0,
    role: (firestoreData.role as "admin" | "user") || "user",
    preferences: {
      notifications: {
        email: firestoreData.preferences?.notifications?.email ?? true,
        push: firestoreData.preferences?.notifications?.push ?? true,
        discounts: firestoreData.preferences?.notifications?.discounts ?? true,
        promotions:
          firestoreData.preferences?.notifications?.promotions ?? true,
      },
      theme:
        (firestoreData.preferences?.theme as "light" | "dark" | "system") ||
        "light",
      language: (firestoreData.preferences?.language as "es" | "en") || "es",
      currency:
        (firestoreData.preferences?.currency as "ARS" | "USD" | "EUR") || "ARS",
    },
    activity: {
      totalLogins: firestoreData.activity?.totalLogins || 0,
      lastActivityAt:
        convertTimestamp(firestoreData.activity?.lastActivityAt) || new Date(),
      favoriteCategories: firestoreData.activity?.favoriteCategories || [],
      savedDiscounts: firestoreData.activity?.savedDiscounts || [],
      sharedDiscounts: firestoreData.activity?.sharedDiscounts || 0,
    },
    profile: {
      firstName: firestoreData.profile?.firstName || null,
      lastName: firestoreData.profile?.lastName || null,
      phone: firestoreData.profile?.phone || null,
      birthDate: firestoreData.profile?.birthDate || null,
      gender:
        (firestoreData.profile?.gender as "male" | "female" | "other") || null,
      location: {
        country: firestoreData.profile?.location?.country || null,
        city: firestoreData.profile?.location?.city || null,
        timezone:
          firestoreData.profile?.location?.timezone ||
          Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    },
    privacy: {
      profileVisible: firestoreData.privacy?.profileVisible ?? true,
      emailVisible: firestoreData.privacy?.emailVisible ?? false,
      activityVisible: firestoreData.privacy?.activityVisible ?? true,
    },
    appInfo: {
      version: firestoreData.appInfo?.version || "1.0.0",
      platform: (firestoreData.appInfo?.platform as "web" | "mobile") || "web",
      userAgent: firestoreData.appInfo?.userAgent || null,
    },
  };
};

export const convertUserToFirestore = (
  user: Partial<User>
): Partial<FirestoreUser> => {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    providerId: user.providerId,
    isActive: user.isActive,
    role: user.role,
    preferences: user.preferences,
    activity: user.activity
      ? {
          totalLogins: user.activity.totalLogins,
          lastActivityAt: user.activity.lastActivityAt as Timestamp | null,
          favoriteCategories: user.activity.favoriteCategories,
          savedDiscounts: user.activity.savedDiscounts,
          sharedDiscounts: user.activity.sharedDiscounts,
        }
      : undefined,
    profile: user.profile,
    privacy: user.privacy,
    appInfo: user.appInfo,
  };
};

// ===== CONVERTIDORES DE NOTIFICACIONES =====

export const convertFirestoreNotificationToNotification = (
  firestoreData: FirestoreNotification,
  id: string
): Notification => {
  return {
    id,
    userId: firestoreData.userId || "",
    title: firestoreData.title || "",
    message: firestoreData.message || "",
    timestamp: convertTimestamp(firestoreData.timestamp) || new Date(),
    read: firestoreData.read ?? false,
    type: (firestoreData.type as NotificationType) || "info",
  };
};

export const convertNotificationToFirestore = (
  notification: Partial<Notification>
): Partial<FirestoreNotification> => {
  return {
    userId: notification.userId,
    title: notification.title,
    message: notification.message,
    timestamp:
      convertToFirestoreTimestamp(notification.timestamp as Date) ?? undefined,
    read: notification.read,
    type: notification.type,
  };
};

// ===== FUNCIONES DE VALIDACIÓN Y CONVERSIÓN SEGURA =====

export const safeConvertDiscount = (
  data: unknown,
  id: string
): Discount | null => {
  try {
    if (!data || typeof data !== "object") return null;

    return convertFirestoreDiscountToDiscount(data as FirestoreDiscount, id);
  } catch (error) {
    console.error("Error convirtiendo descuento:", error);
    return null;
  }
};

export const safeConvertMembership = (
  data: unknown,
  id: string
): Membership | null => {
  try {
    if (!data || typeof data !== "object") return null;

    return convertFirestoreMembershipToMembership(
      data as FirestoreMembership,
      id
    );
  } catch (error) {
    console.error("Error convirtiendo membresía:", error);
    return null;
  }
};

export const safeConvertUser = (data: unknown, uid: string): User | null => {
  try {
    if (!data || typeof data !== "object") return null;

    return convertFirestoreUserToUser(data as FirestoreUser, uid);
  } catch (error) {
    console.error("Error convirtiendo usuario:", error);
    return null;
  }
};

export const safeConvertNotification = (
  data: unknown,
  id: string
): Notification | null => {
  try {
    if (!data || typeof data !== "object") return null;

    return convertFirestoreNotificationToNotification(
      data as FirestoreNotification,
      id
    );
  } catch (error) {
    console.error("Error convirtiendo notificación:", error);
    return null;
  }
};

// ===== FUNCIONES DE CONVERSIÓN MASIVA =====

export const convertDiscountsArray = (
  firestoreDocs: Array<{ data: () => unknown; id: string }>
): Discount[] => {
  return firestoreDocs
    .map((doc) => safeConvertDiscount(doc.data(), doc.id))
    .filter((discount): discount is Discount => discount !== null);
};

export const convertMembershipsArray = (
  firestoreDocs: Array<{ data: () => unknown; id: string }>
): Membership[] => {
  return firestoreDocs
    .map((doc) => safeConvertMembership(doc.data(), doc.id))
    .filter((membership): membership is Membership => membership !== null);
};

export const convertUsersArray = (
  firestoreDocs: Array<{ data: () => unknown; id: string }>
): User[] => {
  return firestoreDocs
    .map((doc) => safeConvertUser(doc.data(), doc.id))
    .filter((user): user is User => user !== null);
};

export const convertNotificationsArray = (
  firestoreDocs: Array<{ data: () => unknown; id: string }>
): Notification[] => {
  return firestoreDocs
    .map((doc) => safeConvertNotification(doc.data(), doc.id))
    .filter(
      (notification): notification is Notification => notification !== null
    );
};
