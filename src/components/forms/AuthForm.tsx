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
import {
  login,
  loginWithGoogle,
  loginWithGoogleNative,
  register,
} from "@/lib/firebase-auth";
import { Loader2, Mail } from "lucide-react";
import { useRouter } from "next/router";
import type React from "react";
import { useEffect, useState } from "react";

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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Si el usuario está logueado y es admin, mostrar selector de modo (solo en desktop)
  useEffect(() => {
    console.log("AuthForm useEffect:", {
      user: !!user,
      loading,
      adminLoading,
      isAdmin,
      loginSuccess,
      isMobile,
      pathname: router.pathname,
    });

    if (
      user &&
      !loading &&
      !adminLoading &&
      isAdmin &&
      loginSuccess &&
      !isMobile
    ) {
      console.log("Mostrando selector de modo para admin (desktop)");
      setShowModeSelector(true);
    } else if (
      user &&
      !loading &&
      !adminLoading &&
      isAdmin &&
      loginSuccess &&
      isMobile
    ) {
      console.log("Admin en mobile, redirigiendo directamente a home");
      router.push("/home");
    }
  }, [user, loading, adminLoading, isAdmin, loginSuccess, isMobile, router]);

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

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhone = (phone: string) => {
    return /^[+]?\d{7,15}$/.test(phone.replace(/\s/g, ""));
  };

  const isValidPassword = (password: string) => {
    return (
      password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
    );
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearMessages();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setIsLoading(true);
    try {
      if (mode === "login") {
        if (!formData.email || !formData.password) {
          setError("Por favor completa todos los campos");
          return;
        }
        if (!isValidEmail(formData.email)) {
          setError("Por favor ingresa un correo electrónico válido");
          return;
        }
        await login(formData.email, formData.password);
        setSuccess("¡Inicio de sesión exitoso!");
        setLoginSuccess(true);
      } else {
        if (
          !formData.firstName ||
          !formData.lastName ||
          !formData.email ||
          !formData.phone ||
          !formData.password ||
          !formData.confirmPassword
        ) {
          setError("Por favor completa todos los campos");
          return;
        }
        if (!isValidEmail(formData.email)) {
          setError("Por favor ingresa un correo electrónico válido");
          return;
        }
        if (!isValidPhone(formData.phone)) {
          setError("Por favor ingresa un número de teléfono válido");
          return;
        }
        if (!isValidPassword(formData.password)) {
          setError(
            "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número"
          );
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError("Las contraseñas no coinciden");
          return;
        }
        if (!acceptTerms) {
          setError("Debes aceptar los términos y condiciones");
          return;
        }
        await register(formData.email, formData.password);
        setSuccess("¡Cuenta creada exitosamente! Bienvenido a la plataforma");
        router.push("/home");
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
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Ocurrió un error inesperado");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    clearMessages();
    setIsGoogleLoading(true);
    try {
      // Detectar si estamos en una plataforma nativa (Capacitor)
      const isNative = typeof window !== "undefined" && "Capacitor" in window;

      if (isNative) {
        // Usar login nativo para Android/iOS
        await loginWithGoogleNative();
      } else {
        // Usar login web para navegador
        await loginWithGoogle();
      }

      setSuccess(
        mode === "login"
          ? "¡Inicio de sesión con Google exitoso!"
          : "¡Cuenta creada con Google exitosamente!"
      );
      if (mode === "login") {
        setLoginSuccess(true);
      } else {
        router.push("/home");
      }
    } catch (error) {
      console.error("Error en login de Google:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Error al registrarse con Google");
      }
    } finally {
      setIsGoogleLoading(false);
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
                      disabled={isLoading || isGoogleLoading}
                    />
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
                      disabled={isLoading || isGoogleLoading}
                    />
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
                  disabled={isLoading || isGoogleLoading}
                />
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
                    disabled={isLoading || isGoogleLoading}
                  />
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
                  disabled={isLoading || isGoogleLoading}
                />
                <p className="text-xs text-gray-500">
                  Mínimo 8 caracteres, una mayúscula, una minúscula y un número
                </p>
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
                      disabled={isLoading || isGoogleLoading}
                    />
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
                disabled={isLoading || isGoogleLoading}
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
    </div>
  );
}
