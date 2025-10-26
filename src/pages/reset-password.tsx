import { Button } from "@/components/Share/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/Share/card";
import { Input } from "@/components/Share/input";
import { Label } from "@/components/Share/label";
import { auth } from "@/lib/firebase/firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import * as yup from "yup";

// Esquema de validación para la nueva contraseña
const passwordSchema = yup.object({
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [oobCode, setOobCode] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    // Obtener el código de restablecimiento de la URL
    const { oobCode: code } = router.query;
    if (code && typeof code === "string") {
      setOobCode(code);
      validateResetCode(code);
    }
  }, [router.query]);

  const validateResetCode = async (code: string) => {
    try {
      const email = await verifyPasswordResetCode(auth, code);
      setEmail(email);
      setIsValidating(false);
    } catch (error) {
      console.error("Error validando código de restablecimiento:", error);
      setError("El enlace de restablecimiento no es válido o ha expirado");
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setValidationErrors({});
    setIsLoading(true);

    try {
      // Validar con Yup
      await passwordSchema.validate(
        { password, confirmPassword },
        { abortEarly: false }
      );

      // Restablecer la contraseña
      await confirmPasswordReset(auth, oobCode, password);

      setSuccess(
        "¡Contraseña restablecida exitosamente! Redirigiendo al login..."
      );

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: unknown) {
      console.error("Error restableciendo contraseña:", error);

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

      // Manejar errores de Firebase
      if (error && typeof error === "object" && "code" in error) {
        const firebaseError = error as { code: string; message?: string };
        switch (firebaseError.code) {
          case "auth/expired-action-code":
            setError(
              "El enlace de restablecimiento ha expirado. Solicita uno nuevo."
            );
            break;
          case "auth/invalid-action-code":
            setError("El enlace de restablecimiento no es válido.");
            break;
          case "auth/weak-password":
            setError(
              "La contraseña es muy débil. Usa al menos 8 caracteres con mayúsculas, minúsculas y números."
            );
            break;
          default:
            setError("Error al restablecer la contraseña. Intenta nuevamente.");
        }
      } else {
        setError("Error al restablecer la contraseña. Intenta nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">
            Validando enlace de restablecimiento...
          </p>
        </div>
      </div>
    );
  }

  if (error && !email) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-red-600">
              Enlace Inválido
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push("/login")} className="w-full">
              Volver al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md mx-4">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Nueva Contraseña
            </CardTitle>
            <p className="text-gray-600">
              Crea una nueva contraseña para <strong>{email}</strong>
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Nueva contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-base rounded-xl shadow-lg transition-all duration-200"
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {success ? "Redirigiendo..." : "Restablecer Contraseña"}
              </Button>
            </form>

            <div className="text-center mt-6">
              <Button
                variant="link"
                onClick={() => router.push("/login")}
                className="text-gray-500 hover:text-primary-600"
              >
                ← Volver al Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
