import * as yup from "yup";

// Constantes y regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Schema de validación para login
export const loginSchema = yup.object({
  email: yup
    .string()
    .required("El email es obligatorio")
    .email("Por favor ingresa un correo electrónico válido")
    .matches(EMAIL_REGEX, "Por favor ingresa un correo electrónico válido"),
  password: yup
    .string()
    .required("La contraseña es obligatoria")
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
});

// Schema de validación para registro
export const registerSchema = yup.object({
  firstName: yup
    .string()
    .required("El nombre es obligatorio")
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: yup
    .string()
    .required("El apellido es obligatorio")
    .min(2, "El apellido debe tener al menos 2 caracteres"),
  email: yup
    .string()
    .required("El email es obligatorio")
    .email("Por favor ingresa un correo electrónico válido")
    .matches(EMAIL_REGEX, "Por favor ingresa un correo electrónico válido"),
  phone: yup
    .string()
    .required("El teléfono es obligatorio")
    .test(
      "phone-format",
      "Por favor ingresa un número de teléfono válido",
      function (value) {
        if (!value) return false;
        // Remover espacios y guiones para validar solo dígitos
        const digits = value.replace(/\D/g, "");
        // Validar que tenga entre 8 y 15 dígitos (sin incluir código de país)
        return digits.length >= 8 && digits.length <= 15;
      }
    ),
  password: yup
    .string()
    .required("La contraseña es obligatoria")
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .matches(
      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "La contraseña debe tener al menos una mayúscula, una minúscula y un número"
    ),
});
