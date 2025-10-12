// ===== FUNCIONES DE VALIDACIÓN PARA LA BASE DE DATOS =====

import {
  Card,
  CARD_BRANDS,
  CARD_LEVELS,
  CARD_TYPES,
  CardBrand,
  CardLevel,
  CardType,
  CreateCardData,
  CreateDiscountData,
  CreateMembershipData,
  CreateNotificationData,
  Discount,
  DISCOUNT_CATEGORIES,
  DiscountCategory,
  DiscountValidationResult,
  Membership,
  MEMBERSHIP_CATEGORIES,
  MembershipCategory,
  MembershipValidationResult,
  Notification,
  NOTIFICATION_TYPES,
  NotificationType,
  ValidationResult,
} from "@/types/database";

// ===== VALIDADORES DE TIPOS =====

export const isValidDiscountCategory = (
  category: string
): category is DiscountCategory => {
  return DISCOUNT_CATEGORIES.some((cat) => cat.value === category);
};

export const isValidMembershipCategory = (
  category: string
): category is MembershipCategory => {
  return MEMBERSHIP_CATEGORIES.some((cat) => cat.value === category);
};

export const isValidCardType = (type: string): type is CardType => {
  return CARD_TYPES.some((t) => t.value === type);
};

export const isValidCardBrand = (brand: string): brand is CardBrand => {
  return CARD_BRANDS.some((b) => b.value === brand);
};

export const isValidCardLevel = (level: string): level is CardLevel => {
  return CARD_LEVELS.some((l) => l.value === level);
};

export const isValidNotificationType = (
  type: string
): type is NotificationType => {
  return NOTIFICATION_TYPES.some((t) => t.value === type);
};

// ===== VALIDADORES DE FECHAS =====

export const isValidDate = (date: unknown): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const isValidExpiryDate = (expiry: string): boolean => {
  const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  if (!regex.test(expiry)) return false;

  const [month, year] = expiry.split("/");
  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;

  const cardYear = parseInt(year);
  const cardMonth = parseInt(month);

  if (cardYear < currentYear) return false;
  if (cardYear === currentYear && cardMonth < currentMonth) return false;

  return true;
};

// ===== VALIDADORES DE DESCUENTOS =====

export const validateDiscount = (
  discount: Partial<Discount>
): DiscountValidationResult => {
  const errors: string[] = [];

  // Validar campos requeridos
  if (
    !discount.name ||
    typeof discount.name !== "string" ||
    discount.name.trim().length === 0
  ) {
    errors.push("El nombre del descuento es requerido");
  }

  if (
    !discount.title ||
    typeof discount.title !== "string" ||
    discount.title.trim().length === 0
  ) {
    errors.push("El título del descuento es requerido");
  }

  if (
    !discount.description ||
    typeof discount.description !== "string" ||
    discount.description.trim().length === 0
  ) {
    errors.push("La descripción del descuento es requerida");
  }

  if (!discount.category || !isValidDiscountCategory(discount.category)) {
    errors.push("La categoría del descuento es inválida");
  }

  // Validar descuento (porcentaje o monto)
  if (
    discount.discountPercentage !== null &&
    discount.discountPercentage !== undefined
  ) {
    if (
      typeof discount.discountPercentage !== "number" ||
      discount.discountPercentage < 0 ||
      discount.discountPercentage > 100
    ) {
      errors.push(
        "El porcentaje de descuento debe ser un número entre 0 y 100"
      );
    }
  }

  if (
    discount.discountAmount !== null &&
    discount.discountAmount !== undefined
  ) {
    if (
      typeof discount.discountAmount !== "number" ||
      discount.discountAmount < 0
    ) {
      errors.push("El monto de descuento debe ser un número positivo");
    }
  }

  // Validar que al menos uno de los dos tipos de descuento esté presente
  if (
    (!discount.discountPercentage || discount.discountPercentage === 0) &&
    (!discount.discountAmount || discount.discountAmount === 0)
  ) {
    errors.push("Debe especificar un porcentaje o monto de descuento");
  }

  // Validar fechas
  if (discount.validFrom && !isValidDate(discount.validFrom)) {
    errors.push("La fecha de inicio no es válida");
  }

  if (discount.validUntil && !isValidDate(discount.validUntil)) {
    errors.push("La fecha de vencimiento no es válida");
  }

  if (
    discount.validFrom &&
    discount.validUntil &&
    discount.validFrom instanceof Date &&
    discount.validUntil instanceof Date &&
    discount.validFrom >= discount.validUntil
  ) {
    errors.push(
      "La fecha de inicio debe ser anterior a la fecha de vencimiento"
    );
  }

  // Validar credenciales
  if (
    discount.availableCredentials &&
    Array.isArray(discount.availableCredentials)
  ) {
    discount.availableCredentials.forEach((cred, index) => {
      if (!cred.bank || typeof cred.bank !== "string") {
        errors.push(`La credencial ${index + 1} debe tener un banco válido`);
      }
      if (!cred.type || !isValidCardType(cred.type)) {
        errors.push(
          `La credencial ${index + 1} debe tener un tipo de tarjeta válido`
        );
      }
      if (!cred.brand || !isValidCardBrand(cred.brand)) {
        errors.push(
          `La credencial ${index + 1} debe tener una marca de tarjeta válida`
        );
      }
      if (!cred.level || !isValidCardLevel(cred.level)) {
        errors.push(
          `La credencial ${index + 1} debe tener un nivel de tarjeta válido`
        );
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? (discount as Partial<Discount>) : undefined,
  };
};

export const validateCreateDiscountData = (
  data: Partial<CreateDiscountData>
): DiscountValidationResult => {
  const errors: string[] = [];

  // Validar campos requeridos
  if (
    !data.name ||
    typeof data.name !== "string" ||
    data.name.trim().length === 0
  ) {
    errors.push("El nombre del descuento es requerido");
  }

  if (
    !data.title ||
    typeof data.title !== "string" ||
    data.title.trim().length === 0
  ) {
    errors.push("El título del descuento es requerido");
  }

  if (
    !data.description ||
    typeof data.description !== "string" ||
    data.description.trim().length === 0
  ) {
    errors.push("La descripción del descuento es requerida");
  }

  if (!data.category || !isValidDiscountCategory(data.category)) {
    errors.push("La categoría del descuento es inválida");
  }

  if (!data.source) {
    errors.push("El origen del descuento es requerido");
  }

  // Validar descuento
  if (data.discountPercentage !== undefined) {
    if (
      typeof data.discountPercentage !== "number" ||
      data.discountPercentage < 0 ||
      data.discountPercentage > 100
    ) {
      errors.push(
        "El porcentaje de descuento debe ser un número entre 0 y 100"
      );
    }
  }

  if (data.discountAmount !== undefined) {
    if (typeof data.discountAmount !== "number" || data.discountAmount < 0) {
      errors.push("El monto de descuento debe ser un número positivo");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    data:
      errors.length === 0 ? (data as Partial<CreateDiscountData>) : undefined,
  };
};

// ===== VALIDADORES DE MEMBRESÍAS =====

export const validateMembership = (
  membership: Partial<Membership>
): MembershipValidationResult => {
  const errors: string[] = [];

  // Validar campos requeridos
  if (
    !membership.name ||
    typeof membership.name !== "string" ||
    membership.name.trim().length === 0
  ) {
    errors.push("El nombre de la membresía es requerido");
  }

  if (!membership.category || !isValidMembershipCategory(membership.category)) {
    errors.push("La categoría de la membresía es inválida");
  }

  if (
    !membership.color ||
    typeof membership.color !== "string" ||
    membership.color.trim().length === 0
  ) {
    errors.push("El color de la membresía es requerido");
  }

  // Validar tarjetas
  if (membership.cards && Array.isArray(membership.cards)) {
    membership.cards.forEach((card, index) => {
      if (!card.id || typeof card.id !== "string") {
        errors.push(`La tarjeta ${index + 1} debe tener un ID válido`);
      }
      if (!card.type || !isValidCardType(card.type)) {
        errors.push(`La tarjeta ${index + 1} debe tener un tipo válido`);
      }
      if (!card.brand || !isValidCardBrand(card.brand)) {
        errors.push(`La tarjeta ${index + 1} debe tener una marca válida`);
      }
      if (!card.level || !isValidCardLevel(card.level)) {
        errors.push(`La tarjeta ${index + 1} debe tener un nivel válido`);
      }
      if (card.expiryDate && !isValidExpiryDate(card.expiryDate)) {
        errors.push(
          `La tarjeta ${index + 1} tiene una fecha de vencimiento inválida`
        );
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? (membership as Partial<Membership>) : undefined,
  };
};

export const validateCreateMembershipData = (
  data: Partial<CreateMembershipData>
): ValidationResult => {
  const errors: string[] = [];

  if (
    !data.name ||
    typeof data.name !== "string" ||
    data.name.trim().length === 0
  ) {
    errors.push("El nombre de la membresía es requerido");
  }

  if (!data.category || !isValidMembershipCategory(data.category)) {
    errors.push("La categoría de la membresía es inválida");
  }

  if (
    !data.color ||
    typeof data.color !== "string" ||
    data.color.trim().length === 0
  ) {
    errors.push("El color de la membresía es requerido");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ===== VALIDADORES DE TARJETAS =====

export const validateCard = (card: Partial<Card>): ValidationResult => {
  const errors: string[] = [];

  if (!card.id || typeof card.id !== "string") {
    errors.push("El ID de la tarjeta es requerido");
  }

  if (!card.type || !isValidCardType(card.type)) {
    errors.push("El tipo de tarjeta es inválido");
  }

  if (!card.brand || !isValidCardBrand(card.brand)) {
    errors.push("La marca de la tarjeta es inválida");
  }

  if (!card.level || !isValidCardLevel(card.level)) {
    errors.push("El nivel de la tarjeta es inválido");
  }

  if (card.expiryDate && !isValidExpiryDate(card.expiryDate)) {
    errors.push("La fecha de vencimiento es inválida");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateCreateCardData = (
  data: Partial<CreateCardData>
): ValidationResult => {
  const errors: string[] = [];

  if (!data.type || !isValidCardType(data.type)) {
    errors.push("El tipo de tarjeta es requerido");
  }

  if (!data.brand || !isValidCardBrand(data.brand)) {
    errors.push("La marca de la tarjeta es requerida");
  }

  if (!data.level || !isValidCardLevel(data.level)) {
    errors.push("El nivel de la tarjeta es requerido");
  }

  if (data.expiryDate && !isValidExpiryDate(data.expiryDate)) {
    errors.push("La fecha de vencimiento es inválida");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ===== VALIDADORES DE NOTIFICACIONES =====

export const validateNotification = (
  notification: Partial<Notification>
): ValidationResult => {
  const errors: string[] = [];

  if (!notification.userId || typeof notification.userId !== "string") {
    errors.push("El ID del usuario es requerido");
  }

  if (
    !notification.title ||
    typeof notification.title !== "string" ||
    notification.title.trim().length === 0
  ) {
    errors.push("El título de la notificación es requerido");
  }

  if (
    !notification.message ||
    typeof notification.message !== "string" ||
    notification.message.trim().length === 0
  ) {
    errors.push("El mensaje de la notificación es requerido");
  }

  if (!notification.type || !isValidNotificationType(notification.type)) {
    errors.push("El tipo de notificación es inválido");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateCreateNotificationData = (
  data: Partial<CreateNotificationData>
): ValidationResult => {
  const errors: string[] = [];

  if (!data.userId || typeof data.userId !== "string") {
    errors.push("El ID del usuario es requerido");
  }

  if (
    !data.title ||
    typeof data.title !== "string" ||
    data.title.trim().length === 0
  ) {
    errors.push("El título de la notificación es requerido");
  }

  if (
    !data.message ||
    typeof data.message !== "string" ||
    data.message.trim().length === 0
  ) {
    errors.push("El mensaje de la notificación es requerido");
  }

  if (!data.type || !isValidNotificationType(data.type)) {
    errors.push("El tipo de notificación es inválido");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ===== FUNCIONES DE SANITIZACIÓN =====

export const sanitizeDiscountData = (data: unknown): Partial<Discount> => {
  const obj = data as Record<string, unknown>;
  return {
    name: typeof obj.name === "string" ? obj.name.trim() : "",
    title: typeof obj.title === "string" ? obj.title.trim() : "",
    description:
      typeof obj.description === "string" ? obj.description.trim() : "",
    category: isValidDiscountCategory(obj.category as string)
      ? (obj.category as DiscountCategory)
      : "otro",
    discountPercentage:
      typeof obj.discountPercentage === "number"
        ? obj.discountPercentage
        : null,
    discountAmount:
      typeof obj.discountAmount === "number" ? obj.discountAmount : null,
    validFrom: isValidDate(obj.validFrom) ? obj.validFrom : undefined,
    validUntil: isValidDate(obj.validUntil) ? obj.validUntil : undefined,
    membershipRequired: Array.isArray(obj.membershipRequired)
      ? obj.membershipRequired
      : [],
    terms: typeof obj.terms === "string" ? obj.terms.trim() : null,
    imageUrl: typeof obj.imageUrl === "string" ? obj.imageUrl.trim() : null,
    image: typeof obj.image === "string" ? obj.image.trim() : null,
    isVisible: typeof obj.isVisible === "boolean" ? obj.isVisible : true,
    status: ["active", "inactive", "expired"].includes(obj.status as string)
      ? (obj.status as "active" | "inactive" | "expired")
      : "active",
    approvalStatus: ["pending", "approved", "rejected"].includes(
      obj.approvalStatus as string
    )
      ? (obj.approvalStatus as "pending" | "approved" | "rejected")
      : "pending",
    source: ["manual", "scraping"].includes(obj.source as string)
      ? (obj.source as "manual" | "scraping")
      : "manual",
    origin: typeof obj.origin === "string" ? obj.origin.trim() : null,
    availableMemberships: Array.isArray(obj.availableMemberships)
      ? obj.availableMemberships
      : [],
    availableCredentials: Array.isArray(obj.availableCredentials)
      ? obj.availableCredentials
      : [],
  };
};

export const sanitizeMembershipData = (data: unknown): Partial<Membership> => {
  const obj = data as Record<string, unknown>;
  return {
    name: typeof obj.name === "string" ? obj.name.trim() : "",
    category: isValidMembershipCategory(obj.category as string)
      ? (obj.category as MembershipCategory)
      : "banco",
    status: ["active", "inactive"].includes(obj.status as string)
      ? (obj.status as "active" | "inactive")
      : "active",
    color: typeof obj.color === "string" ? obj.color.trim() : "#000000",
    cards: Array.isArray(obj.cards) ? obj.cards : [],
    logoUrl: typeof obj.logoUrl === "string" ? obj.logoUrl.trim() : null,
  };
};

// ===== FUNCIONES DE CONVERSIÓN =====

export const convertFirestoreDiscount = (
  firestoreData: unknown
): Partial<Discount> => {
  const data = firestoreData as Record<string, unknown>;
  return {
    name: (data.name as string) || "",
    title: (data.title as string) || (data.name as string) || "",
    description:
      (data.description as string) || (data.descripcion as string) || "",
    category: isValidDiscountCategory(data.category as string)
      ? (data.category as DiscountCategory)
      : "otro",
    discountPercentage:
      typeof data.discountPercentage === "number"
        ? data.discountPercentage
        : null,
    discountAmount:
      typeof data.discountAmount === "number" ? data.discountAmount : null,
    validFrom: (data.validFrom as { toDate?: () => Date })?.toDate
      ? (data.validFrom as { toDate: () => Date }).toDate()
      : undefined,
    validUntil: (data.validUntil as { toDate?: () => Date })?.toDate
      ? (data.validUntil as { toDate: () => Date }).toDate()
      : undefined,
    membershipRequired: Array.isArray(data.membershipRequired)
      ? (data.membershipRequired as string[])
      : [],
    terms: (data.terms as string) || null,
    imageUrl: (data.imageUrl as string) || (data.image as string) || null,
    image: (data.image as string) || (data.imageUrl as string) || null,
    isVisible: typeof data.isVisible === "boolean" ? data.isVisible : true,
    status: ["active", "inactive", "expired"].includes(data.status as string)
      ? (data.status as "active" | "inactive" | "expired")
      : "active",
    approvalStatus: ["pending", "approved", "rejected"].includes(
      data.approvalStatus as string
    )
      ? (data.approvalStatus as "pending" | "approved" | "rejected")
      : "pending",
    source: ["manual", "scraping"].includes(data.source as string)
      ? (data.source as "manual" | "scraping")
      : "manual",
    origin: (data.origin as string) || null,
    availableMemberships: Array.isArray(data.availableMemberships)
      ? (data.availableMemberships as string[])
      : [],
    availableCredentials: Array.isArray(data.availableCredentials)
      ? (data.availableCredentials as Array<{
          bank: string;
          type: "Crédito" | "Débito";
          brand:
            | "Visa"
            | "Mastercard"
            | "American Express"
            | "Diners Club"
            | "Otro";
          level: CardLevel;
        }>)
      : [],
  };
};
