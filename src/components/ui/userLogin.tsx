import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Mail } from "lucide-react"
import { register, login, loginWithGoogle } from "@/lib/firebase-auth"
import { useRouter } from "next/router"
import { useAuth } from "@/pages/shared/hook/useAuth"
export default function AuthForm() {
  const { user, loading } = useAuth();
  const router = useRouter();
  if (user) {
    router.push("/home")
  }
  const [mode, setMode] = useState<"login" | "register">("login")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptMarketing, setAcceptMarketing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const isValidPhone = (phone: string) => {
    return /^[+]?\d{7,15}$/.test(phone.replace(/\s/g, ""))
  }

  const isValidPassword = (password: string) => {
    return password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
  }

  const clearMessages = () => {
    setError("")
    setSuccess("")
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    clearMessages()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearMessages()
    setIsLoading(true)
    try {
      if (mode === "login") {
        if (!formData.email || !formData.password) {
          setError("Por favor completa todos los campos")
          return
        }
        if (!isValidEmail(formData.email)) {
          setError("Por favor ingresa un correo electrónico válido")
          return
        }
        await login(formData.email, formData.password)
        setSuccess("¡Inicio de sesión exitoso!")
        router.push("/home")
      } else {
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
          setError("Por favor completa todos los campos")
          return
        }
        if (!isValidEmail(formData.email)) {
          setError("Por favor ingresa un correo electrónico válido")
          return
        }
        if (!isValidPhone(formData.phone)) {
          setError("Por favor ingresa un número de teléfono válido")
          return
        }
        if (!isValidPassword(formData.password)) {
          setError("La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número")
          return
        }
        if (formData.password !== formData.confirmPassword) {
          setError("Las contraseñas no coinciden")
          return
        }
        if (!acceptTerms) {
          setError("Debes aceptar los términos y condiciones")
          return
        }
        await register(formData.email, formData.password)
        setSuccess("¡Cuenta creada exitosamente! Bienvenido a la plataforma")
        router.push("/home")
        setFormData({ firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "" })
        setAcceptTerms(false)
        setAcceptMarketing(false)
      }
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Ocurrió un error inesperado")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    clearMessages()
    setIsGoogleLoading(true)
    try {
      await loginWithGoogle()
      setSuccess(mode === "login" ? "¡Inicio de sesión con Google exitoso!" : "¡Cuenta creada con Google exitosamente!")
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Error al registrarse con Google")
      }
    } finally {
      setIsGoogleLoading(false)
    }
  }

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
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      Nombre
                    </Label>
                    <Input
                      id="firstName"
                      placeholder="Tu nombre"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      disabled={isLoading || isGoogleLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Apellido
                    </Label>
                    <Input
                      id="lastName"
                      placeholder="Tu apellido"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      disabled={isLoading || isGoogleLoading}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
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
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
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
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  disabled={isLoading || isGoogleLoading}
                />
                <p className="text-xs text-gray-500">
                  Mínimo 8 caracteres, una mayúscula, una minúscula y un número
                </p>
              </div>
              {mode === "register" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                      Confirmar contraseña
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      disabled={isLoading || isGoogleLoading}
                    />
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="terms"
                        checked={acceptTerms}
                        onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                      />
                      <Label htmlFor="terms" className="text-sm text-gray-600 leading-5">
                        Acepto los <span className="text-primary-600 font-medium">términos y condiciones</span> y la{" "}
                        <span className="text-primary-600 font-medium">política de privacidad</span>
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="marketing"
                        checked={acceptMarketing}
                        onCheckedChange={(checked) => setAcceptMarketing(checked === true)}
                      />
                      <Label htmlFor="marketing" className="text-sm text-gray-600 leading-5">
                        Quiero recibir ofertas y promociones exclusivas por email
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
              {isGoogleLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {!isGoogleLoading && <Mail className="mr-2 h-5 w-5" />}
              {mode === "login" ? "Continuar con Google" : "Registrarse con Google"}
            </Button>
            <div className="text-center pt-4">
              {mode === "login" ? (
                <>
                  <span className="text-sm text-gray-600">¿No tienes cuenta? </span>
                  <Button variant="link" className="p-0 h-auto text-primary-600 font-medium text-sm" onClick={() => setMode("register")}>Crear cuenta</Button>
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-600">¿Ya tienes cuenta? </span>
                  <Button variant="link" className="p-0 h-auto text-primary-600 font-medium text-sm" onClick={() => setMode("login")}>Iniciar sesión</Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
