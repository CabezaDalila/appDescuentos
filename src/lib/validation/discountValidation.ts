import * as yup from "yup";

// Esquema de validación para descuentos con Yup
export const discountValidationSchema = yup.object({
  name: yup
    .string()
    .required("El nombre del descuento es obligatorio")
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .trim(),

  title: yup
    .string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(100, "El título no puede exceder 100 caracteres")
    .trim(),

  description: yup
    .string()
    .required("La descripción es obligatoria")
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(500, "La descripción no puede exceder 500 caracteres")
    .trim(),

  category: yup
    .string()
    .required("La categoría es obligatoria")
    .oneOf(
      [
        "banco",
        "club",
        "salud",
        "educacion",
        "seguro",
        "telecomunicacion",
        "gastronomia",
        "fashion",
        "beauty",
        "home",
        "automotive",
        "entertainment",
        "sports",
        "technology",
        "food",
        "health",
        "education",
        "otro",
      ],
      "Categoría no válida"
    ),

  discountPercentage: yup
    .number()
    .when("discountAmount", {
      is: (discountAmount: number) => !discountAmount,
      then: (schema) =>
        schema.required("Debe especificar porcentaje o monto de descuento"),
      otherwise: (schema) => schema.optional(),
    })
    .min(0, "El porcentaje no puede ser negativo")
    .max(100, "El porcentaje no puede exceder 100%"),

  discountAmount: yup
    .number()
    .when("discountPercentage", {
      is: (discountPercentage: number) => !discountPercentage,
      then: (schema) =>
        schema.required("Debe especificar porcentaje o monto de descuento"),
      otherwise: (schema) => schema.optional(),
    })
    .min(0, "El monto no puede ser negativo"),

  validFrom: yup.date().optional(),

  validUntil: yup
    .date()
    .required("La fecha de vencimiento es obligatoria")
    .min(new Date(), "La fecha de vencimiento debe ser futura")
    .when("validFrom", {
      is: (validFrom: Date) => validFrom,
      then: (schema) =>
        schema.min(
          yup.ref("validFrom"),
          "La fecha de vencimiento debe ser posterior a la fecha de inicio"
        ),
    }),

  membershipRequired: yup.array().of(yup.string()).optional(),

  terms: yup
    .string()
    .max(1000, "Los términos no pueden exceder 1000 caracteres")
    .optional(),

  imageUrl: yup.string().url("Debe ser una URL válida").optional(),

  origin: yup
    .string()
    .required("El origen es obligatorio")
    .min(2, "El origen debe tener al menos 2 caracteres")
    .max(50, "El origen no puede exceder 50 caracteres")
    .trim(),

  approvalStatus: yup
    .string()
    .oneOf(
      ["pending", "approved", "rejected"],
      "Estado de aprobación no válido"
    )
    .default("pending"),

  source: yup
    .string()
    .oneOf(["manual", "scraping"], "Origen no válido")
    .default("scraping"),

  rejectionReason: yup
    .string()
    .when("approvalStatus", {
      is: "rejected",
      then: (schema) =>
        schema.required("Debe especificar la razón del rechazo"),
      otherwise: (schema) => schema.optional(),
    })
    .max(500, "La razón del rechazo no puede exceder 500 caracteres"),
});

// Esquema para validación rápida de campos críticos
export const criticalFieldsValidationSchema = yup.object({
  name: yup.string().required().min(3).max(100),
  description: yup.string().required().min(10).max(500),
  category: yup.string().required(),
  validUntil: yup.date().required().min(new Date()),
  origin: yup.string().required().min(2).max(50),
});

// Función para validar un descuento completo
export const validateDiscount = async (discount: any) => {
  try {
    await discountValidationSchema.validate(discount, { abortEarly: false });
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

// Función para validar campos críticos rápidamente
export const validateCriticalFields = async (discount: any) => {
  try {
    await criticalFieldsValidationSchema.validate(discount, {
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

// Función para obtener errores de validación por campo
export const getFieldErrors = async (
  field: string,
  value: any,
  schema = discountValidationSchema
) => {
  try {
    await schema.validateAt(field, { [field]: value });
    return [];
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return error.errors;
    }
    return ["Error de validación"];
  }
};
