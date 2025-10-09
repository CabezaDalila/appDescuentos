import { Button } from "@/components/Share/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Share/card";
import { ArrowRight, Shield, User } from "lucide-react";

interface AdminModeSelectorProps {
  onModeSelect: (mode: "admin" | "user") => void;
  userName?: string;
}

export default function AdminModeSelector({
  onModeSelect,
  userName,
}: AdminModeSelectorProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="px-4 py-6">
        <Card className="w-full max-w-2xl mx-auto border-0 shadow-lg">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              ¡Bienvenido{userName ? `, ${userName}` : ""}!
            </CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Detectamos que tienes permisos de administrador. ¿Cómo te gustaría
              acceder?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Modo Usuario */}
              <Card
                className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/20 border-2 hover:scale-[1.02]"
                onClick={() => onModeSelect("user")}
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">
                    Modo Usuario
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Accede como usuario para ver descuentos y ofertas
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-sm text-gray-600 space-y-2 mb-4">
                    <li className="flex items-center">
                      <ArrowRight className="h-4 w-4 text-primary mr-2" />
                      Ver descuentos disponibles
                    </li>
                    <li className="flex items-center">
                      <ArrowRight className="h-4 w-4 text-primary mr-2" />
                      Gestionar membresías
                    </li>
                    <li className="flex items-center">
                      <ArrowRight className="h-4 w-4 text-primary mr-2" />
                      Configurar perfil
                    </li>
                  </ul>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => onModeSelect("user")}
                  >
                    Continuar como Usuario
                  </Button>
                </CardContent>
              </Card>

              {/* Modo Administrador */}
              <Card
                className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/20 border-2 hover:scale-[1.02]"
                onClick={() => onModeSelect("admin")}
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">
                    Modo Administrador
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Accede al panel de administración para gestionar la
                    plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="text-sm text-gray-600 space-y-2 mb-4">
                    <li className="flex items-center">
                      <ArrowRight className="h-4 w-4 text-primary mr-2" />
                      Gestionar descuentos
                    </li>
                    <li className="flex items-center">
                      <ArrowRight className="h-4 w-4 text-primary mr-2" />
                      Configurar scripts de scraping
                    </li>
                    <li className="flex items-center">
                      <ArrowRight className="h-4 w-4 text-primary mr-2" />
                      Supervisar la plataforma
                    </li>
                  </ul>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => onModeSelect("admin")}
                  >
                    Acceder al Panel Admin
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                Podrás cambiar de modo en cualquier momento desde tu perfil
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
