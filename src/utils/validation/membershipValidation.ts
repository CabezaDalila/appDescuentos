// Validación para membresías
export interface MembershipValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateMembership = (membershipData: {
  name: string;
  description?: string;
  category: string;
  level: string;
}): MembershipValidationResult => {
  const errors: string[] = [];

  // Validar nombre
  if (!membershipData.name || membershipData.name.trim().length < 2) {
    errors.push("El nombre debe tener al menos 2 caracteres");
  }

  if (membershipData.name && membershipData.name.trim().length > 50) {
    errors.push("El nombre no puede tener más de 50 caracteres");
  }

  // Validar descripción
  if (
    membershipData.description &&
    membershipData.description.trim().length > 200
  ) {
    errors.push("La descripción no puede tener más de 200 caracteres");
  }

  // Validar categoría
  if (!membershipData.category || membershipData.category.trim().length === 0) {
    errors.push("La categoría es obligatoria");
  }

  // Validar nivel
  if (!membershipData.level || membershipData.level.trim().length === 0) {
    errors.push("El nivel es obligatorio");
  }

  const validLevels = ["Classic", "Gold", "Platinum", "Premium"];
  if (membershipData.level && !validLevels.includes(membershipData.level)) {
    errors.push(`El nivel debe ser uno de: ${validLevels.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
