import { Button } from "@/components/Share/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/Share/card";
import { auth } from "@/lib/firebase/firebase";
import { applyActionCode, checkActionCode } from "firebase/auth";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [oobCode, setOobCode] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState<string>("");

  useEffect(() => {
    // Obtener el código de verificación y el modo de la URL
    const { oobCode: code, mode: urlMode } = router.query;
    if (code && typeof code === "string") {
      setOobCode(code);
      if (urlMode && typeof urlMode === "string") {
        setMode(urlMode);
      }
      validateVerificationCode(code);
    } else {
      setIsValidating(false);
      setError("No se encontró un código de verificación válido");
    }
  }, [router.query]);

  const validateVerificationCode = async (code: string) => {
    try {
      const info = await checkActionCode(auth, code);
      if (info.data.email) {
        setEmail(info.data.email);
      }
      setIsValidating(false);
    } catch (error) {
      console.error("Error validando código de verificación:", error);
      setIsValidating(false);
      if (error && typeof error === "object" && "code" in error) {
        const firebaseError = error as { code: string; message?: string };
        switch (firebaseError.code) {
          case "auth/expired-action-code":
            setError(
              "El enlace de verificación ha expirado. Por favor, solicita un nuevo email de verificación."
            );
            break;
          case "auth/invalid-action-code":
            setError("El enlace de verificación no es válido.");
            break;
          default:
            setError("El enlace de verificación no es válido o ha expirado.");
        }
      } else {
        setError("El enlace de verificación no es válido o ha expirado.");
      }
    }
  };

  const handleVerifyEmail = async () => {
    if (!oobCode) {
      setError("No se encontró un código de verificación válido");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await applyActionCode(auth, oobCode);

      // Cerrar sesión después de verificar para que el usuario tenga que iniciar sesión manualmente
      await auth.signOut();

      setSuccess(true);

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error: unknown) {
      console.error("Error verificando email:", error);
      setIsLoading(false);

      if (error && typeof error === "object" && "code" in error) {
        const firebaseError = error as { code: string; message?: string };
        switch (firebaseError.code) {
          case "auth/expired-action-code":
            setError(
              "El enlace de verificación ha expirado. Por favor, solicita un nuevo email de verificación."
            );
            break;
          case "auth/invalid-action-code":
            setError("El enlace de verificación no es válido.");
            break;
          default:
            setError(
              "Error al verificar el email. Por favor, intenta nuevamente."
            );
        }
      } else {
        setError("Error al verificar el email. Por favor, intenta nuevamente.");
      }
    }
  };

  // Si estamos validando el código
  if (isValidating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600">Validando enlace de verificación...</p>
        </div>
      </div>
    );
  }

  // Si hay error al validar
  if (error && !email && !success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
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

  // Si ya se verificó exitosamente
  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <CardTitle className="text-xl text-green-600">
              ¡Email Verificado!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              Tu dirección de correo electrónico ha sido verificada
              exitosamente. Redirigiendo al login...
            </p>
            <Button onClick={() => router.push("/login")} className="w-full">
              Ir al Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulario de verificación
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md mx-4">
        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Verificar Email
            </CardTitle>
            <p className="text-gray-600">
              Verifica tu dirección de correo electrónico{" "}
              {email && <strong>{email}</strong>}
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Haz clic en el botón de abajo para verificar tu dirección de
                correo electrónico.
              </p>

              <Button
                onClick={handleVerifyEmail}
                disabled={isLoading}
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-base rounded-xl shadow-lg transition-all duration-200"
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {isLoading ? "Verificando..." : "Verificar Email"}
              </Button>

              <div className="text-center mt-6">
                <Button
                  variant="link"
                  onClick={() => router.push("/login")}
                  className="text-gray-500 hover:text-primary-600"
                >
                  ← Volver al Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
