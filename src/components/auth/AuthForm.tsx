import { Alert, AlertDescription } from "@/components/Share/alert";
import { Button } from "@/components/Share/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Share/card";
import { Checkbox } from "@/components/Share/checkbox";
import { Input } from "@/components/Share/input";
import { Label } from "@/components/Share/label";
import { Separator } from "@/components/Share/separator";
import { auth, db } from "@/lib/firebase/firebase";
import {
  login,
  loginWithGoogle,
  loginWithGoogleNative,
  register,
  resendEmailVerification,
  resetPassword,
  verifyEmail,
} from "@/lib/firebase/firebase-auth";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Loader2, Mail } from "lucide-react";
import { useRouter } from "next/router";
import type React from "react";
import { useEffect, useState } from "react";
import * as yup from "yup";

// Esquemas de validación con Yup
const loginSchema = yup.object({
  email: yup
    .string()
    .required("El email es obligatorio")
    .email("Por favor ingresa un correo electrónico válido"),
  password: yup
    .string()
    .required("La contraseña es obligatoria")
    .min(8, "La contraseña debe tener al menos 8 caracteres"),
});

const registerSchema = yup.object({
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
    .email("Por favor ingresa un correo electrónico válido"),
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
  confirmPassword: yup
    .string()
    .required("Confirma tu contraseña")
    .oneOf([yup.ref("password")], "Las contraseñas no coinciden"),
});

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [countryCode, setCountryCode] = useState("+54"); // Argentina por defecto
  const [areaCode, setAreaCode] = useState(""); // Código de área
  const [phoneNumber, setPhoneNumber] = useState(""); // Número de teléfono
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Validaciones de contraseña en tiempo real
  const passwordChecks = {
    minLength: formData.password.length >= 8,
    hasUpperCase: /[A-Z]/.test(formData.password),
    hasLowerCase: /[a-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
  };

  const passwordIsValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch =
    formData.password === formData.confirmPassword &&
    formData.confirmPassword.length > 0;
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<
    string | null
  >(null);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [showEmailVerificationMessage, setShowEmailVerificationMessage] =
    useState(false);

  const clearMessages = () => {
    setError("");
    setSuccess("");
    setValidationErrors({});
    // NO limpiar showEmailVerificationMessage aquí - debe permanecer visible
  };

  // Manejar verificación de email desde el enlace
  useEffect(() => {
    const handleEmailVerification = async () => {
      const { mode: urlMode, oobCode } = router.query;

      // Firebase puede usar "verifyEmail" o "action" como mode
      if (
        (urlMode === "verifyEmail" || urlMode === "action") &&
        oobCode &&
        typeof oobCode === "string"
      ) {
        setIsVerifyingEmail(true);
        clearMessages();

        try {
          await verifyEmail(oobCode);

          // Cerrar sesión después de verificar para que el usuario tenga que iniciar sesión manualmente
          await signOut(auth);

          setSuccess(
            "¡Email verificado exitosamente! Ahora puedes iniciar sesión con tu cuenta."
          );
          // Cambiar al modo login para que el usuario pueda iniciar sesión
          setMode("login");
          // Limpiar la URL
          router.replace("/login", undefined, { shallow: true });
        } catch (error: unknown) {
          console.error("Error verificando email:", error);

          if (error && typeof error === "object" && "code" in error) {
            const firebaseError = error as { code: string; message?: string };
            switch (firebaseError.code) {
              case "auth/expired-action-code":
                setError(
                  "El enlace de verificación ha expirado. Solicita uno nuevo."
                );
                break;
              case "auth/invalid-action-code":
                setError("El enlace de verificación no es válido.");
                break;
              default:
                setError("Error al verificar el email. Intenta nuevamente.");
            }
          } else {
            setError("Error al verificar el email. Intenta nuevamente.");
          }
        } finally {
          setIsVerifyingEmail(false);
        }
      }
    };

    handleEmailVerification();
  }, [router.query]);

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setError("Por favor ingresa tu email");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setError("Por favor ingresa un email válido");
      return;
    }

    setIsResetting(true);
    clearMessages();

    try {
      await resetPassword(resetEmail);
      setSuccess(
        "¡Email de restablecimiento enviado! Revisa tu bandeja de entrada."
      );
      setShowResetPassword(false);
      setResetEmail("");
    } catch (error: unknown) {
      console.error("Error enviando email de restablecimiento:", error);

      if (error && typeof error === "object" && "code" in error) {
        const firebaseError = error as { code: string; message?: string };
        switch (firebaseError.code) {
          case "auth/user-not-found":
            setError("No encontramos una cuenta con este email");
            break;
          case "auth/invalid-email":
            setError("El formato del email no es válido");
            break;
          case "auth/too-many-requests":
            setError(
              "Demasiados intentos. Espera unos minutos antes de intentar nuevamente"
            );
            break;
          default:
            setError("Error al enviar el email de restablecimiento");
        }
      } else {
        setError("Error al enviar el email de restablecimiento");
      }
    } finally {
      setIsResetting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // Filtrar solo letras y espacios para nombre y apellido
    if (field === "firstName" || field === "lastName") {
      // Solo permitir letras, espacios y caracteres especiales comunes en nombres (á, é, í, ó, ú, ñ, etc.)
      value = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "");
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
    clearMessages();
    // Limpiar el email pendiente de verificación si el usuario cambia el email
    if (field === "email") {
      setPendingVerificationEmail(null);
    }
  };

  // Obtener el número completo con código de país para guardar
  const getFullPhoneNumber = () => {
    if (countryCode === "+54") {
      const areaDigits = areaCode.replace(/\D/g, "");
      const phoneDigits = phoneNumber.replace(/\D/g, "");
      return `${countryCode}${areaDigits}${phoneDigits}`;
    }
    const phoneDigits = formData.phone.replace(/\D/g, "");
    return `${countryCode}${phoneDigits}`;
  };

  // Resetear campos de teléfono cuando cambia el país
  useEffect(() => {
    if (countryCode !== "+54") {
      setAreaCode("");
      setPhoneNumber("");
      handleInputChange("phone", "");
    }
  }, [countryCode]);

  const handleResendVerification = async () => {
    if (!pendingVerificationEmail || !formData.password) {
      setError(
        "Por favor, ingresa tu contraseña para reenviar el email de verificación."
      );
      return;
    }

    setIsResendingVerification(true);
    clearMessages();

    try {
      // Intentar iniciar sesión temporalmente para obtener el usuario
      // Firebase permite login aunque el email no esté verificado, pero luego verificamos
      const result = await signInWithEmailAndPassword(
        auth,
        pendingVerificationEmail,
        formData.password
      );
      const user = result.user;

      // Verificar si el email ya está verificado
      if (user.emailVerified) {
        // Si el email ya está verificado, simplemente cerrar sesión
        await auth.signOut();
        setSuccess("Tu email ya está verificado. Puedes iniciar sesión ahora.");
        setPendingVerificationEmail(null);
        return;
      }

      // Si el email no está verificado, reenviar el email
      try {
        await resendEmailVerification(user);
        // Cerrar sesión después de enviar el email
        await auth.signOut();
        setSuccess(
          "¡Email de verificación reenviado! Revisa tu bandeja de entrada."
        );
        setPendingVerificationEmail(null);
      } catch (resendError: unknown) {
        // Cerrar sesión incluso si falla el reenvío
        await auth.signOut();

        if (
          resendError &&
          typeof resendError === "object" &&
          "code" in resendError
        ) {
          const firebaseError = resendError as {
            code: string;
            message?: string;
          };
          if (firebaseError.code === "auth/too-many-requests") {
            setError(
              "Demasiados intentos. Espera unos minutos antes de solicitar otro email de verificación."
            );
          } else {
            setError(
              "Error al reenviar el email. Por favor, intenta nuevamente más tarde."
            );
          }
        } else {
          setError(
            "Error al reenviar el email de verificación. Intenta nuevamente."
          );
        }
      }
    } catch (err: unknown) {
      // Si falla el login, mostrar error apropiado
      if (err && typeof err === "object" && "code" in err) {
        const firebaseError = err as { code: string; message?: string };
        switch (firebaseError.code) {
          case "auth/user-not-found":
            setError(
              "No encontramos una cuenta con este email. Verifica que el email sea correcto."
            );
            break;
          case "auth/wrong-password":
            setError(
              "La contraseña es incorrecta. Verifica tu contraseña e intenta nuevamente."
            );
            break;
          case "auth/invalid-email":
            setError("El formato del email no es válido.");
            break;
          case "auth/too-many-requests":
            setError(
              "Demasiados intentos. Espera unos minutos antes de intentar nuevamente."
            );
            break;
          default:
            setError(
              "Error al reenviar el email. Verifica tus credenciales e intenta nuevamente."
            );
        }
      } else {
        setError(
          "Error al reenviar el email de verificación. Intenta nuevamente."
        );
      }
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleGoogleSignUp = async () => {
    clearMessages();
    setIsGoogleLoading(true);

    try {
      // Detectar si es plataforma nativa (iOS/Android)
      interface CapacitorWindow extends Window {
        Capacitor?: {
          isNativePlatform?: () => boolean;
        };
      }

      const capWindow = window as CapacitorWindow;
      const isNativePlatform =
        typeof window !== "undefined" &&
        capWindow.Capacitor?.isNativePlatform?.() === true;

      const result = isNativePlatform
        ? await loginWithGoogleNative()
        : await loginWithGoogle();

      if (result?.user) {
        setSuccess("¡Inicio de sesión exitoso!");
      } else {
        setError("Error al autenticar con Google");
      }
    } catch (error: unknown) {
      console.error("Error en login con Google:", error);

      if (error && typeof error === "object" && "code" in error) {
        const firebaseError = error as { code: string; message?: string };
        switch (firebaseError.code) {
          case "auth/popup-closed-by-user":
            setError("Cerraste la ventana de Google. Intenta nuevamente.");
            break;
          case "auth/popup-blocked":
            setError(
              "El navegador bloqueó la ventana. Permite popups e intenta nuevamente."
            );
            break;
          case "auth/cancelled-popup-request":
            setError(
              "Solo se puede abrir una ventana a la vez. Espera un momento."
            );
            break;
          default:
            setError(
              `Error al autenticar con Google: ${
                firebaseError.message || "Error desconocido"
              }`
            );
        }
      } else if (error instanceof Error) {
        setError(`Error al autenticar con Google: ${error.message}`);
      } else {
        setError("Error al autenticar con Google. Intenta nuevamente.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);

    try {
      // Validar con Yup según el modo
      const schema = mode === "login" ? loginSchema : registerSchema;

      // Validar datos del formulario
      await schema.validate(formData, { abortEarly: false });

      // Validación adicional para registro
      if (mode === "register" && !acceptTerms) {
        setError("Debes aceptar los términos y condiciones");
        return;
      }

      if (mode === "login") {
        try {
          await login(formData.email, formData.password);
          setSuccess("¡Inicio de sesión exitoso!");
        } catch (loginError: unknown) {
          // Si el error es que el email no está verificado, lanzar error específico
          if (
            loginError instanceof Error &&
            loginError.message === "EMAIL_NOT_VERIFIED"
          ) {
            setPendingVerificationEmail(formData.email);
            setError(
              "No has confirmado tu correo electrónico. Por favor, revisa tu bandeja de entrada y haz clic en el enlace de verificación que te enviamos para activar tu cuenta."
            );
            // Mantener el mensaje de verificación visible
            setShowEmailVerificationMessage(true);
            return;
          }
          throw loginError; // Re-lanzar otros errores para que se manejen en el catch general
        }
      } else {
        const result = await register(formData.email, formData.password);

        // Guardar solo el perfil, NO el onboarding hasta que el email esté verificado
        // El onboarding se guardará cuando el usuario inicie sesión después de verificar
        if (result?.user?.uid) {
          await setDoc(
            doc(db, "users", result.user.uid),
            {
              profile: {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: getFullPhoneNumber(),
              },
              // NO guardar onboarding aquí - se guardará después de verificar el email
            },
            { merge: true }
          );
        }

        // Limpiar el formulario
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
        });
        setCountryCode("+54"); // Resetear código de país
        setAreaCode(""); // Resetear código de área
        setPhoneNumber(""); // Resetear número
        setAcceptTerms(false);
        setAcceptMarketing(false);

        // Limpiar mensajes de error/éxito
        setError("");
        setSuccess("");

        // Activar el mensaje de verificación de email ANTES de cambiar al modo login
        setShowEmailVerificationMessage(true);

        // Cambiar al modo login para que el usuario pueda iniciar sesión después de verificar
        // Esto debe hacerse después de que la sesión se haya cerrado (ya se cerró en register)
        setMode("login");
      }
    } catch (error: unknown) {
      console.error("Error en autenticación:", error);

      // Si es un error de validación de Yup
      if (error instanceof yup.ValidationError) {
        const errors: Record<string, string> = {};
        error.inner.forEach((err) => {
          if (err.path) {
            errors[err.path] = err.message;
          }
        });
        setValidationErrors(errors);
        return;
      }

      // Manejar errores específicos de Firebase Auth
      if (error && typeof error === "object" && "code" in error) {
        const firebaseError = error as { code: string; message?: string };
        switch (firebaseError.code) {
          case "auth/user-not-found":
            setError(
              "No encontramos una cuenta con este email. ¿Estás seguro de que te registraste?"
            );
            break;
          case "auth/wrong-password":
            setError(
              "La contraseña es incorrecta. ¿Podrías intentar nuevamente?"
            );
            break;
          case "auth/invalid-email":
            setError(
              "El formato del email no es válido. Por favor, verifica que esté bien escrito."
            );
            break;
          case "auth/user-disabled":
            setError(
              "Esta cuenta ha sido deshabilitada. Contacta al soporte para más información."
            );
            break;
          case "auth/too-many-requests":
            setError(
              "Demasiados intentos fallidos. Espera unos minutos antes de intentar nuevamente."
            );
            break;
          case "auth/email-already-in-use":
            setError(
              "Ya existe una cuenta con este email. ¿Quieres iniciar sesión en su lugar?"
            );
            break;
          case "auth/weak-password":
            setError(
              "La contraseña es muy débil. Usa al menos 8 caracteres con mayúsculas, minúsculas y números."
            );
            break;
          case "auth/network-request-failed":
            setError(
              "Error de conexión. Verifica tu internet e intenta nuevamente."
            );
            break;
          default:
            setError(
              `${firebaseError.message || "Ocurrió un error inesperado"}`
            );
        }
      } else if (error instanceof Error) {
        setError(`${error.message}`);
      } else {
        setError("Ocurrió un error inesperado. Por favor, intenta nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="px-4 py-6">
        <Card className="w-full max-w-md mx-auto border-0 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {mode === "login" ? "¡Bienvenido!" : "¡Únete a nosotros!"}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {mode === "login"
                ? "Ingresa tus credenciales para acceder"
                : "Crea tu cuenta y descubre ofertas exclusivas"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
                {pendingVerificationEmail && (
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResendVerification}
                      disabled={isResendingVerification}
                      className="w-full"
                    >
                      {isResendingVerification && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Reenviar email de verificación
                    </Button>
                  </div>
                )}
              </Alert>
            )}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}
            {mode === "login" && showEmailVerificationMessage && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800">
                  <div className="flex items-start gap-2">
                    <Mail className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium mb-1">
                        Se te ha enviado un correo para verificar tu cuenta
                      </p>
                      <p className="text-sm">
                        Revisa tu bandeja de entrada y haz clic en el enlace de
                        verificación para activar tu cuenta. Una vez activada,
                        podrás iniciar sesión.
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="text-sm font-medium text-gray-700"
                    >
                      Nombre
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="Tu nombre"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      disabled={isLoading}
                      className={
                        validationErrors.firstName ? "border-red-500" : ""
                      }
                    />
                    {validationErrors.firstName && (
                      <p className="text-sm text-red-500">
                        {validationErrors.firstName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="text-sm font-medium text-gray-700"
                    >
                      Apellido
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Tu apellido"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      disabled={isLoading}
                      className={
                        validationErrors.lastName ? "border-red-500" : ""
                      }
                    />
                    {validationErrors.lastName && (
                      <p className="text-sm text-red-500">
                        {validationErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Correo electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={isLoading}
                  className={validationErrors.email ? "border-red-500" : ""}
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-500">
                    {validationErrors.email}
                  </p>
                )}
              </div>
              {mode === "register" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="text-sm font-medium text-gray-700"
                  >
                    Teléfono
                  </Label>
                  <div className="flex gap-2 items-stretch">
                    <div className="flex items-center justify-center px-3 border border-gray-300 rounded-md bg-gray-50 text-gray-700 font-medium text-sm h-9">
                      +54
                    </div>
                    <Input
                      id="areaCode"
                      type="tel"
                      placeholder="11"
                      value={areaCode}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 4);
                        setAreaCode(value);
                        const fullPhone =
                          value && phoneNumber
                            ? `${value} ${phoneNumber}`
                            : value || phoneNumber;
                        handleInputChange("phone", fullPhone);
                      }}
                      disabled={isLoading}
                      className={`w-[80px] h-9 ${
                        validationErrors.phone ? "border-red-500" : ""
                      }`}
                      maxLength={4}
                    />
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="1234-5678"
                      value={phoneNumber}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (countryCode === "+54" && value.length > 4) {
                          value = `${value.slice(0, 4)}-${value.slice(4, 8)}`;
                        }
                        setPhoneNumber(value);
                        const fullPhone =
                          areaCode && value
                            ? `${areaCode} ${value}`
                            : areaCode || value;
                        handleInputChange("phone", fullPhone);
                      }}
                      disabled={isLoading}
                      className={`flex-1 h-9 ${
                        validationErrors.phone ? "border-red-500" : ""
                      }`}
                      maxLength={9}
                    />
                  </div>
                  {validationErrors.phone ? (
                    <p className="text-sm text-red-500">
                      {validationErrors.phone}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-600">
                      Ejemplo: 11 1234-5678
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  onFocus={() => setShowPasswordRequirements(true)}
                  onBlur={() => {
                    // Ocultar solo si la contraseña es válida
                    if (passwordIsValid) {
                      setShowPasswordRequirements(false);
                    }
                  }}
                  disabled={isLoading}
                  className={
                    validationErrors.password
                      ? "border-red-500"
                      : formData.password.length > 0 && passwordIsValid
                      ? "border-green-500"
                      : ""
                  }
                />
                {mode === "register" &&
                  formData.password.length > 0 &&
                  (showPasswordRequirements || !passwordIsValid) && (
                    <div className="mt-2 space-y-1.5 rounded-md bg-gray-50 p-3 text-xs">
                      <p className="mb-2 font-medium text-gray-700">
                        Requisitos de contraseña:
                      </p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {passwordChecks.minLength ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-400">○</span>
                          )}
                          <span
                            className={
                              passwordChecks.minLength
                                ? "text-green-600"
                                : "text-gray-600"
                            }
                          >
                            Mínimo 8 caracteres
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordChecks.hasUpperCase ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-400">○</span>
                          )}
                          <span
                            className={
                              passwordChecks.hasUpperCase
                                ? "text-green-600"
                                : "text-gray-600"
                            }
                          >
                            Una letra mayúscula
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordChecks.hasLowerCase ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-400">○</span>
                          )}
                          <span
                            className={
                              passwordChecks.hasLowerCase
                                ? "text-green-600"
                                : "text-gray-600"
                            }
                          >
                            Una letra minúscula
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passwordChecks.hasNumber ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-400">○</span>
                          )}
                          <span
                            className={
                              passwordChecks.hasNumber
                                ? "text-green-600"
                                : "text-gray-600"
                            }
                          >
                            Un número
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                {validationErrors.password && (
                  <p className="text-sm text-red-500">
                    {validationErrors.password}
                  </p>
                )}
                {mode === "login" && !validationErrors.password && (
                  <p className="text-xs text-gray-600">Ingresa tu contraseña</p>
                )}
              </div>
              {mode === "register" && (
                <>
                  <div className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-gray-700"
                    >
                      Confirmar contraseña
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      disabled={isLoading}
                      className={
                        validationErrors.confirmPassword
                          ? "border-red-500"
                          : formData.confirmPassword.length > 0 &&
                            passwordsMatch
                          ? "border-green-500"
                          : formData.confirmPassword.length > 0 &&
                            !passwordsMatch
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {formData.confirmPassword.length > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        {passwordsMatch ? (
                          <>
                            <span className="text-green-600">✓</span>
                            <span className="text-green-600">
                              Las contraseñas coinciden
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-red-500">✗</span>
                            <span className="text-red-500">
                              Las contraseñas no coinciden
                            </span>
                          </>
                        )}
                      </div>
                    )}
                    {validationErrors.confirmPassword && (
                      <p className="text-sm text-red-500">
                        {validationErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="terms"
                        checked={acceptTerms}
                        onCheckedChange={(checked) =>
                          setAcceptTerms(checked === true)
                        }
                      />
                      <Label
                        htmlFor="terms"
                        className="text-sm text-gray-600 leading-5"
                      >
                        Acepto los{" "}
                        <span className="text-primary-600 font-medium">
                          términos y condiciones
                        </span>{" "}
                        y la{" "}
                        <span className="text-primary-600 font-medium">
                          política de privacidad
                        </span>
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="marketing"
                        checked={acceptMarketing}
                        onCheckedChange={(checked) =>
                          setAcceptMarketing(checked === true)
                        }
                      />
                      <Label
                        htmlFor="marketing"
                        className="text-sm text-gray-600 leading-5"
                      >
                        Quiero recibir ofertas y promociones exclusivas por
                        email
                      </Label>
                    </div>
                  </div>
                </>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-base rounded-xl shadow-lg transition-all duration-200"
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </Button>
            </form>
            <Separator className="my-6" />
            <Button
              variant="outline"
              onClick={handleGoogleSignUp}
              disabled={isLoading || isGoogleLoading}
              className="w-full h-12 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-base rounded-xl transition-all duration-200"
            >
              {isGoogleLoading && (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              )}
              {!isGoogleLoading && <Mail className="mr-2 h-5 w-5" />}
              {mode === "login"
                ? "Continuar con Google"
                : "Registrarse con Google"}
            </Button>
            <div className="text-center pt-4">
              {mode === "login" ? (
                <>
                  <div className="mb-3">
                    <Button
                      variant="link"
                      className="p-0 h-auto text-gray-500 font-medium text-sm hover:text-primary-600"
                      onClick={() => setShowResetPassword(true)}
                    >
                      ¿Olvidaste tu contraseña?
                    </Button>
                  </div>
                  <span className="text-sm text-gray-600">
                    ¿No tienes cuenta?{" "}
                  </span>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary-600 font-medium text-sm"
                    onClick={() => {
                      setMode("register");
                      setShowEmailVerificationMessage(false);
                      setError("");
                      setSuccess("");
                    }}
                  >
                    Crear cuenta
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-600">
                    ¿Ya tienes cuenta?{" "}
                  </span>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary-600 font-medium text-sm"
                    onClick={() => setMode("login")}
                  >
                    Iniciar sesión
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de restablecimiento de contraseña */}
      {showResetPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Restablecer contraseña
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Ingresa tu email y te enviaremos un enlace para restablecer tu
              contraseña.
            </p>
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="resetEmail"
                  className="text-sm font-medium text-gray-700"
                >
                  Correo electrónico
                </Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="tu@ejemplo.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={isResetting}
                  className="mt-1"
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowResetPassword(false);
                    setResetEmail("");
                    clearMessages();
                  }}
                  disabled={isResetting}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={isResetting || !resetEmail}
                  className="flex-1"
                >
                  {isResetting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
