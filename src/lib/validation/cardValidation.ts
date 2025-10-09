import { Card, CardLevel } from "@/types/membership";
import * as yup from "yup";

// Constantes para opciones de tarjetas
export const CARD_TYPES = ["Crédito", "Débito"] as const;
export const CARD_BRANDS = [
  "Visa",
  "Mastercard",
  "American Express",
  "Diners Club",
  "Otro",
] as const;

export const CARD_LEVELS: { value: CardLevel; label: string }[] = [
  { value: "Classic", label: "Classic" },
  { value: "Gold", label: "Gold" },
  { value: "Platinum", label: "Platinum" },
  { value: "Black", label: "Black" },
  { value: "Infinite", label: "Infinite" },
];

// Esquema de validación para tarjetas con Yup
export const cardValidationSchema = yup.object({
  type: yup
    .string()
    .required("El tipo de tarjeta es obligatorio")
    .oneOf(CARD_TYPES, "Tipo de tarjeta no válido"),

  brand: yup
    .string()
    .required("La marca de tarjeta es obligatoria")
    .oneOf(CARD_BRANDS, "Marca de tarjeta no válida"),

  level: yup
    .string()
    .required("El nivel de tarjeta es obligatorio")
    .oneOf(
      CARD_LEVELS.map((l) => l.value),
      "Nivel de tarjeta no válido"
    ),

  name: yup
    .string()
    .optional()
    .max(50, "El nombre no puede exceder 50 caracteres")
    .trim(),
});

// Función para validar una tarjeta completa
export const validateCard = async (card: Partial<Card>) => {
  try {
    await cardValidationSchema.validate(card, { abortEarly: false });
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

// Función para validar si una tarjeta es duplicada
export const validateCardDuplicate = (
  newCard: Partial<Card>,
  existingCards: Card[]
): { isDuplicate: boolean; duplicateCard?: Card } => {
  const duplicate = existingCards.find(
    (card) =>
      card.type === newCard.type &&
      card.brand === newCard.brand &&
      card.level === newCard.level
  );

  return {
    isDuplicate: !!duplicate,
    duplicateCard: duplicate,
  };
};

// Función para obtener errores de validación por campo
export const getCardFieldErrors = async (field: string, value: any) => {
  try {
    await cardValidationSchema.validateAt(field, { [field]: value });
    return [];
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return error.errors;
    }
    return ["Error de validación"];
  }
};

// Función para validar tarjeta completa incluyendo duplicados
export const validateCardWithDuplicates = async (
  card: Partial<Card>,
  existingCards: Card[]
) => {
  // Validar estructura de la tarjeta
  const structureValidation = await validateCard(card);
  if (!structureValidation.isValid) {
    return structureValidation;
  }

  // Validar duplicados
  const duplicateValidation = validateCardDuplicate(card, existingCards);
  if (duplicateValidation.isDuplicate) {
    return {
      isValid: false,
      errors: [
        `Ya existe una tarjeta ${duplicateValidation.duplicateCard?.type} ${duplicateValidation.duplicateCard?.brand} ${duplicateValidation.duplicateCard?.level}`,
      ],
    };
  }

  return { isValid: true, errors: [] };
};
