// Validación para tarjetas de membresía
export interface CardValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateCard = (cardData: {
  name: string;
  number: string;
  expiryDate: string;
  cvv: string;
}): CardValidationResult => {
  const errors: string[] = [];

  // Validar nombre
  if (!cardData.name || cardData.name.trim().length < 2) {
    errors.push("El nombre debe tener al menos 2 caracteres");
  }

  // Validar número de tarjeta (formato básico)
  const cardNumber = cardData.number.replace(/\s/g, "");
  if (!/^\d{13,19}$/.test(cardNumber)) {
    errors.push("El número de tarjeta debe tener entre 13 y 19 dígitos");
  }

  // Validar fecha de expiración
  if (!/^\d{2}\/\d{2}$/.test(cardData.expiryDate)) {
    errors.push("La fecha de expiración debe tener el formato MM/YY");
  } else {
    const [month, year] = cardData.expiryDate.split("/");
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    if (parseInt(month) < 1 || parseInt(month) > 12) {
      errors.push("El mes debe estar entre 01 y 12");
    }

    if (
      parseInt(year) < currentYear ||
      (parseInt(year) === currentYear && parseInt(month) < currentMonth)
    ) {
      errors.push("La tarjeta ha expirado");
    }
  }

  // Validar CVV
  if (!/^\d{3,4}$/.test(cardData.cvv)) {
    errors.push("El CVV debe tener 3 o 4 dígitos");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
