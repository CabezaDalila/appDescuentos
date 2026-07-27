import { FormField } from "@/components/auth/AuthForm/FormField";
import { Button } from "@/components/Share/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Share/card";
import { Loader2, Mail } from "lucide-react";

interface ResetPasswordModalProps {
  resetEmail: string;
  onEmailChange: (value: string) => void;
  isResetting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

/**
 * Modal de restablecimiento de contraseña. Presentacional: el estado y la
 * lógica de envío viven en AuthForm.
 */
export function ResetPasswordModal({
  resetEmail,
  onEmailChange,
  isResetting,
  onSubmit,
  onCancel,
}: ResetPasswordModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Restablecer contraseña
          </CardTitle>
          <CardDescription className="text-gray-600">
            Ingresa tu email y te enviaremos un enlace para restablecer tu
            contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            id="resetEmail"
            label="Correo electrónico"
            type="email"
            placeholder="tu@ejemplo.com"
            value={resetEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            disabled={isResetting}
            icon={Mail}
          />
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isResetting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={onSubmit}
              disabled={isResetting || !resetEmail}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
