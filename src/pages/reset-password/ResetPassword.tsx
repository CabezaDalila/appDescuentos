import { Button } from "@/components/Share/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/Share/card";
import { Input } from "@/components/Share/input";
import { Label } from "@/components/Share/label";
import { supabase } from "@/lib/supabase/client";
import { CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import * as yup from "yup";
import { passwordSchema } from "@/components/pages/reset-password/validations";

export default function ResetPasswordPage() {
  const router = useRouter();
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
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);

  // Validaciones de contraseña en tiempo real (igual que en registro)
  const passwordChecks = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
  };

  const passwordIsValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;

  useEffect(() => {
    let active = true;

    // Supabase procesa el token del enlace (detectSessionInUrl) y deja una
    // sesión de RECUPERACIÓN. Chequeamos si ya existe y además escuchamos el
    // evento PASSWORD_RECOVERY por si llega asincrónicamente.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session?.user) {
        setEmail(session.user.email ?? "");
        setIsValidating(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setEmail(session?.user?.email ?? "");
        setIsValidating(false);
      }
    });

    // Si tras unos segundos no hubo sesión de recuperación, el enlace no sirve.
    const timeout = setTimeout(() => {
      if (!active) return;
      setIsValidating((validating) => {
        if (validating) {
          setError(
            "El enlace de restablecimiento no es válido o ha expirado. Solicitá uno nuevo desde el login."
          );
        }
        return false;
      });
    }, 5000);

    return () => {
      active = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

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

      // La sesión de recuperación (del enlace) autoriza cambiar la contraseña.
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        const msg = updateError.message || "";
        if (/should be different|different from the old/i.test(msg)) {
          setError(
            "La nueva contraseña no puede ser la misma que la anterior. Elegí una diferente."
          );
          setPassword("");
          setConfirmPassword("");
        } else if (/session|expired|invalid|not authenticated|missing/i.test(msg)) {
          setError(
            "El enlace de restablecimiento expiró o no es válido. Solicitá uno nuevo desde el login."
          );
        } else {
          setError("Error al restablecer la contraseña. Intentá nuevamente.");
        }
        return;
      }

      // Éxito: cerramos la sesión de recuperación y mandamos al login.
      await supabase.auth.signOut();
      router.replace("/reset-password", undefined, { shallow: true });
      router.push("/login?passwordReset=true");
    } catch (error: unknown) {
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
      console.error("Error restableciendo contraseña:", error);
      setError("Error al restablecer la contraseña. Intentá nuevamente.");
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
                      : password.length > 0 && passwordIsValid
                      ? "border-green-500"
                      : ""
                  }
                />
                {password.length > 0 &&
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
                    validationErrors.confirmPassword
                      ? "border-red-500"
                      : confirmPassword.length > 0 && passwordsMatch
                      ? "border-green-500"
                      : confirmPassword.length > 0 && !passwordsMatch
                      ? "border-red-500"
                      : ""
                  }
                />
                {confirmPassword.length > 0 && (
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

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-base rounded-xl shadow-lg transition-all duration-200"
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {isLoading ? "Restableciendo..." : "Restablecer Contraseña"}
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
