import { CARD_BRANDS, CARD_LEVELS, CARD_TYPES } from "@/constants/membership";
import * as yup from "yup";

// Obtener valores válidos de las constantes
const validCardTypes = CARD_TYPES.map((type) => type.value);
const validCardBrands = CARD_BRANDS.map((brand) => brand.value);
const validCardLevels = CARD_LEVELS.map((level) => level.value);

// Schema de validación para formulario de tarjeta en MembershipDetailModal
export const cardFormSchema = yup.object({
  type: yup
    .string()
    .required("El tipo de tarjeta es obligatorio")
    .oneOf(validCardTypes, "Tipo de tarjeta no válido"),
  brand: yup
    .string()
    .required("La marca es obligatoria")
    .oneOf(validCardBrands, "Marca no válida"),
  level: yup
    .string()
    .required("El nivel es obligatorio")
    .oneOf(validCardLevels, "Nivel no válido"),
  expiryDate: yup
    .string()
    .test(
      "expiry-format",
      "La fecha de vencimiento debe tener formato MM/YY",
      function (value) {
        if (!value) return true; // Opcional
        return /^(0[1-9]|1[0-2])\/\d{2}$/.test(value);
      }
    )
    .test(
      "future-date",
      "La fecha de vencimiento no puede ser pasada",
      function (value) {
        if (!value) return true; // Opcional
        const [month, year] = value.split("/");
        const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
        const today = new Date();
        return expiryDate >= today;
      }
    )
    .optional(),
});
