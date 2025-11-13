import AdminModeSelector from "@/components/auth/AdminModeSelector";
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
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { db } from "@/lib/firebase/firebase";
import {
  login,
  loginWithGoogle,
  loginWithGoogleNative,
  register,
  resetPassword,
} from "@/lib/firebase/firebase-auth";
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
    .matches(
      /^[+]?\d{7,15}$/,
      "Por favor ingresa un número de teléfono válido"
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
  const { user, loading } = useAuth();
  const { isAdmin, adminLoading } = useAdmin();
  const isMobile = useIsMobile();
  const router = useRouter();
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
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

  // Si el usuario está logueado y es admin, mostrar selector de modo si esta en desktop
  useEffect(() => {
    if (
      user &&
      !loading &&
      !adminLoading &&
      isAdmin &&
      loginSuccess &&
      !isMobile
    ) {
      setShowModeSelector(true);
    } else if (
      user &&
      !loading &&
      !adminLoading &&
      isAdmin &&
      loginSuccess &&
      isMobile
    ) {
      router.push("/home");
    }
  }, [
    user,
    loading,
    adminLoading,
    isAdmin,
    loginSuccess,
    isMobile,
    router,
    showModeSelector,
  ]);

  useEffect(() => {
    if (
      user &&
      !loading &&
      !adminLoading &&
      isAdmin &&
      !isMobile &&
      !loginSuccess
    ) {
      setShowModeSelector(true);
    }
  }, [
    user,
    loading,
    adminLoading,
    isAdmin,
    isMobile,
    loginSuccess,
    showModeSelector,
  ]);

  // Si está mostrando el selector de modo, renderizarlo
  if (showModeSelector) {
    return (
      <AdminModeSelector
        onModeSelect={(mode) => {
          if (mode === "admin") {
            router.push("/admin");
          } else {
            router.push("/home");
          }
        }}
        userName={user?.displayName || user?.email?.split("@")[0]}
      />
    );
  }

  const clearMessages = () => {
    setError("");
    setSuccess("");
    setValidationErrors({});
  };

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
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearMessages();
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
        setLoginSuccess(true);
        router.push("/home");
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
        await login(formData.email, formData.password);
        setSuccess("¡Inicio de sesión exitoso!");
        setLoginSuccess(true);
      } else {
        const result = await register(formData.email, formData.password);

        if (result?.user?.uid) {
          await setDoc(
            doc(db, "users", result.user.uid),
            {
              profile: {
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone,
              },
              onboarding: {
                completed: false,
                answers: {
                  interests: [],
                  goals: [],
                },
              },
            },
            { merge: true }
          );
        }

        setSuccess("¡Cuenta creada exitosamente! Continuemos con tu perfil");
        router.push("/onboarding");
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
        });
        setAcceptTerms(false);
        setAcceptMarketing(false);
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
              "❌ No encontramos una cuenta con este email. ¿Estás seguro de que te registraste?"
            );
            break;
          case "auth/wrong-password":
            setError(
              "❌ La contraseña es incorrecta. ¿Podrías intentar nuevamente?"
            );
            break;
          case "auth/invalid-email":
            setError(
              "❌ El formato del email no es válido. Por favor, verifica que esté bien escrito."
            );
            break;
          case "auth/user-disabled":
            setError(
              "❌ Esta cuenta ha sido deshabilitada. Contacta al soporte para más información."
            );
            break;
          case "auth/too-many-requests":
            setError(
              "❌ Demasiados intentos fallidos. Espera unos minutos antes de intentar nuevamente."
            );
            break;
          case "auth/email-already-in-use":
            setError(
              "❌ Ya existe una cuenta con este email. ¿Quieres iniciar sesión en su lugar?"
            );
            break;
          case "auth/weak-password":
            setError(
              "❌ La contraseña es muy débil. Usa al menos 8 caracteres con mayúsculas, minúsculas y números."
            );
            break;
          case "auth/network-request-failed":
            setError(
              "❌ Error de conexión. Verifica tu internet e intenta nuevamente."
            );
            break;
          default:
            setError(
              `❌ ${firebaseError.message || "Ocurrió un error inesperado"}`
            );
        }
      } else if (error instanceof Error) {
        setError(`❌ ${error.message}`);
      } else {
        setError(
          "❌ Ocurrió un error inesperado. Por favor, intenta nuevamente."
        );
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
              </Alert>
            )}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  {success}
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
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+54 9 11 1234-5678"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    disabled={isLoading}
                    className={validationErrors.phone ? "border-red-500" : ""}
                  />
                  {validationErrors.phone && (
                    <p className="text-sm text-red-500">
                      {validationErrors.phone}
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
                  disabled={isLoading}
                  className={validationErrors.password ? "border-red-500" : ""}
                />
                {validationErrors.password ? (
                  <p className="text-sm text-red-500">
                    {validationErrors.password}
                  </p>
                ) : (
                  <p className="text-xs text-gray-600">
                    Mínimo 8 caracteres, una mayúscula, una minúscula y un
                    número
                  </p>
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
                        validationErrors.confirmPassword ? "border-red-500" : ""
                      }
                    />
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
                    onClick={() => setMode("register")}
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
