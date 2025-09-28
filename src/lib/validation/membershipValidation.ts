import { Membership } from "@/types/membership";
import * as yup from "yup";

// Constantes para opciones de membresías
export const MEMBERSHIP_CATEGORIES = [
  { value: "banco", label: "Bancos" },
  { value: "club", label: "Clubes de beneficios" },
  { value: "salud", label: "Salud" },
  { value: "educacion", label: "Educación" },
  { value: "seguro", label: "Seguros" },
  { value: "telecomunicacion", label: "Telecomunicaciones" },
] as const;

export const MEMBERSHIP_STATUSES = ["active", "inactive"] as const;

// Esquema de validación para membresías con Yup
export const membershipValidationSchema = yup.object({
  name: yup
    .string()
    .required("El nombre de la membresía es obligatorio")
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres")
    .trim(),

  category: yup
    .string()
    .required("La categoría es obligatoria")
    .oneOf(
      MEMBERSHIP_CATEGORIES.map((c) => c.value),
      "Categoría no válida"
    ),

  color: yup
    .string()
    .required("El color es obligatorio")
    .matches(
      /^#[0-9A-F]{6}$/i,
      "El color debe ser un código hexadecimal válido"
    ),

  status: yup
    .string()
    .oneOf(MEMBERSHIP_STATUSES, "Estado no válido")
    .default("active"),

  logoUrl: yup.string().url("Debe ser una URL válida").optional(),

  gradient: yup.string().optional(),
});

// Función para validar una membresía completa
export const validateMembership = async (membership: Partial<Membership>) => {
  try {
    await membershipValidationSchema.validate(membership, {
      abortEarly: false,
    });
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return {
        isValid: false,
        errors: error.errors,
      };
    }
    return { isValid: false, errors: ["Error de validación desconocido"] };
  }
};

// Función para validar si una membresía es duplicada
export const validateMembershipDuplicate = (
  newMembership: Partial<Membership>,
  existingMemberships: Membership[]
): { isDuplicate: boolean; duplicateMembership?: Membership } => {
  const duplicate = existingMemberships.find(
    (membership) =>
      membership.name.toLowerCase().trim() ===
        newMembership.name?.toLowerCase().trim() &&
      membership.category === newMembership.category
  );

  return {
    isDuplicate: !!duplicate,
    duplicateMembership: duplicate,
  };
};

// Función para obtener errores de validación por campo
export const getMembershipFieldErrors = async (field: string, value: any) => {
  try {
    await membershipValidationSchema.validateAt(field, { [field]: value });
    return [];
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return error.errors;
    }
    return ["Error de validación"];
  }
};

// Función para validar membresía completa incluyendo duplicados
export const validateMembershipWithDuplicates = async (
  membership: Partial<Membership>,
  existingMemberships: Membership[]
) => {
  // Validar estructura de la membresía
  const structureValidation = await validateMembership(membership);
  if (!structureValidation.isValid) {
    return structureValidation;
  }

  // Validar duplicados
  const duplicateValidation = validateMembershipDuplicate(
    membership,
    existingMemberships
  );
  if (duplicateValidation.isDuplicate) {
    return {
      isValid: false,
      errors: [
        `Ya existe una membresía "${duplicateValidation.duplicateMembership?.name}" en la categoría ${duplicateValidation.duplicateMembership?.category}`,
      ],
    };
  }

  return { isValid: true, errors: [] };
};
