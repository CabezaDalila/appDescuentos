import * as yup from "yup";

// Schema de validación para el formulario de perfil
export const profileFormSchema = yup.object({
  firstName: yup
    .string()
    .required("El nombre es obligatorio")
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede tener más de 50 caracteres"),
  lastName: yup
    .string()
    .required("El apellido es obligatorio")
    .trim()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "El apellido no puede tener más de 50 caracteres"),
  birthDate: yup
    .string()
    .test(
      "valid-date",
      "La fecha de nacimiento debe ser válida",
      function (value) {
        if (!value) return true; // Opcional
        const date = new Date(value);
        return !isNaN(date.getTime());
      }
    )
    .test(
      "past-date",
      "La fecha de nacimiento debe ser en el pasado",
      function (value) {
        if (!value) return true; // Opcional
        const date = new Date(value);
        const today = new Date();
        return date < today;
      }
    )
    .test(
      "reasonable-age",
      "La fecha de nacimiento no puede ser anterior a 1900",
      function (value) {
        if (!value) return true; // Opcional
        const date = new Date(value);
        const minDate = new Date("1900-01-01");
        return date >= minDate;
      }
    ),
  gender: yup
    .string()
    .oneOf(["masculino", "femenino", "otro", ""], "Género no válido")
    .optional(),
});

