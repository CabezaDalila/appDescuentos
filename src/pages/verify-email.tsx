import { Button } from "@/components/Share/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/Share/card";
import { supabase } from "@/lib/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

/**
 * Verificación de email sobre Supabase.
 *
 * El flujo principal de confirmación de registro redirige a /login (ver
 * `register` en supabase/auth.ts), donde la sesión se resuelve sola
 * (detectSessionInUrl). Esta página cubre el caso de un enlace de Supabase con
 * `token_hash` + `type` (verifyOtp) y, como fallback, una sesión ya confirmada.
 */
export default function VerifyEmailPage() {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;
    let active = true;

    const run = async () => {
      const { token_hash, type } = router.query;

      // Caso 1: enlace de Supabase con token_hash + type → verifyOtp.
      if (typeof token_hash === "string" && typeof type === "string") {
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as EmailOtpType,
        });
        if (!active) return;
        if (otpError) {
          setError("El enlace de verificación no es válido o ha expirado.");
        } else {
          setSuccess(true);
          setTimeout(() => router.push("/login"), 3000);
        }
        setIsValidating(false);
        return;
      }

      // Caso 2: Supabase ya estableció sesión desde el hash del enlace.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      if (session?.user?.email_confirmed_at) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
        setIsValidating(false);
        return;
      }

      setError("No se encontró un enlace de verificación válido.");
      setIsValidating(false);
    };

    run();
    return () => {
      active = false;
    };
  }, [router.isReady, router.query, router]);

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <XCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
          <CardTitle className="text-xl text-red-600">Enlace Inválido</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6">
            {error || "El enlace de verificación no es válido o ha expirado."}
          </p>
          <Button onClick={() => router.push("/login")} className="w-full">
            Volver al Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
