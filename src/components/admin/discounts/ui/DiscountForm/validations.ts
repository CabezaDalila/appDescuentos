import { getAllCategories } from "@/constants/categories";
import * as yup from "yup";

const CATEGORIES = getAllCategories().map((cat) => cat.name);

// Schema de validación para el formulario de descuentos
export const discountFormSchema = yup.object({
  title: yup
    .string()
    .required("El título es obligatorio")
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(100, "El título no puede tener más de 100 caracteres"),
  origin: yup.string().required("El origen es obligatorio").trim(),
  category: yup
    .string()
    .required("La categoría es obligatoria")
    .oneOf(CATEGORIES, "La categoría seleccionada no es válida"),
  expirationDate: yup
    .string()
    .required("La fecha de expiración es obligatoria")
    .test(
      "future-date",
      "La fecha de expiración debe ser futura",
      function (value) {
        if (!value) return false;
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate >= today;
      }
    ),
  description: yup
    .string()
    .max(500, "La descripción no puede tener más de 500 caracteres"),
  discountPercentage: yup
    .string()
    .test(
      "discount-validation",
      "Debe especificar un porcentaje o monto de descuento",
      function (value) {
        const discountAmount = this.parent.discountAmount;
        return !!(value?.trim() || discountAmount?.trim());
      }
    )
    .test(
      "percentage-range",
      "El porcentaje de descuento debe estar entre 1 y 100",
      function (value) {
        if (!value?.trim()) return true; // Si está vacío, la validación del monto lo cubrirá
        const percentage = parseFloat(value);
        return !isNaN(percentage) && percentage >= 1 && percentage <= 100;
      }
    ),
  discountAmount: yup
    .string()
    .test(
      "amount-positive",
      "El monto de descuento no puede ser negativo",
      function (value) {
        if (!value?.trim()) return true; // Si está vacío, la validación del porcentaje lo cubrirá
        const amount = parseFloat(value);
        return isNaN(amount) || amount >= 0;
      }
    ),
  imageUrl: yup.string().url("La URL de la imagen debe ser válida").optional(),
  url: yup.string().url("La URL del descuento debe ser válida").optional(),
});
