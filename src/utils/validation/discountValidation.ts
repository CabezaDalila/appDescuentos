// Validación para descuentos
export interface DiscountValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateDiscount = (discountData: {
  title: string;
  description?: string;
  category: string;
  discountPercentage?: number;
  discountAmount?: number;
  validUntil?: Date;
}): DiscountValidationResult => {
  const errors: string[] = [];

  // Validar título
  if (!discountData.title || discountData.title.trim().length < 3) {
    errors.push("El título debe tener al menos 3 caracteres");
  }

  if (discountData.title && discountData.title.trim().length > 100) {
    errors.push("El título no puede tener más de 100 caracteres");
  }

  // Validar descripción
  if (
    discountData.description &&
    discountData.description.trim().length > 500
  ) {
    errors.push("La descripción no puede tener más de 500 caracteres");
  }

  // Validar categoría
  if (!discountData.category || discountData.category.trim().length === 0) {
    errors.push("La categoría es obligatoria");
  }

  // Validar descuento
  if (!discountData.discountPercentage && !discountData.discountAmount) {
    errors.push("Debe especificar un porcentaje o monto de descuento");
  }

  if (
    discountData.discountPercentage &&
    (discountData.discountPercentage < 1 ||
      discountData.discountPercentage > 100)
  ) {
    errors.push("El porcentaje de descuento debe estar entre 1 y 100");
  }

  if (discountData.discountAmount && discountData.discountAmount < 0) {
    errors.push("El monto de descuento no puede ser negativo");
  }

  // Validar fecha de expiración
  if (discountData.validUntil) {
    const now = new Date();
    if (discountData.validUntil <= now) {
      errors.push("La fecha de expiración debe ser futura");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
