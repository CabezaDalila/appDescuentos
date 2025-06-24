import { useAuth } from "@/pages/shared/hook/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import UserSettingsModal from "@/components/settings/UserSettingsModal";
import { ProfileAppBar } from "@/components/ui/profile-app-bar";

export default function Profile() {
  const { user, logout } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileAppBar
        onSettings={() => setSettingsOpen(true)}
        onLogout={logout}
      />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Mi Perfil</CardTitle>
            <CardDescription>
              Gestiona tu información de cuenta y configuración
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Información del usuario */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Usuario</h3>
                  <p className="text-gray-600">{user?.email}</p>
                  <Badge variant="secondary" className="mt-1">
                    {user?.emailVerified ? "Verificado" : "No verificado"}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Información adicional */}
            <div className="space-y-3">
              <h4 className="font-medium">Información de la cuenta</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">ID de usuario:</span>
                  <p className="font-mono text-xs break-all">{user?.uid}</p>
                </div>
                <div>
                  <span className="text-gray-500">Proveedor:</span>
                  <p>{user?.providerData[0]?.providerId || "Email/Password"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Modal de configuración de usuario */}
        <UserSettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          initialValues={undefined}
        />
      </main>
    </div>
  );
}