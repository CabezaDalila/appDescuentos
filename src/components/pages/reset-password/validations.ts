import * as yup from "yup";

// Schema de validación para reset de contraseña
export const passwordSchema = yup.object({
  password: yup
    .string()
    .required("La contraseña es obligatoria")
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .matches(
      /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "La contraseña debe tener al menos una mayúscula, una minúscula y un número"
    ),
  confirmPassword: yup
    .string()
    .required("Confirma tu contraseña")
    .oneOf([yup.ref("password")], "Las contraseñas no coinciden"),
});

