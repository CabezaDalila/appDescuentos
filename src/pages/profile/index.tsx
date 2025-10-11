import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileSection, {
  createProfileSections,
} from "@/components/profile/ProfileSection";
import UserSettingsModal from "@/components/settings/UserSettingsModal";
import { Button } from "@/components/Share/button";
<<<<<<< Updated upstream
import { Card, CardContent } from "@/components/Share/card";
import { Membership } from "@/constants/membership";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { checkAdminRole } from "@/lib/admin";
import { getActiveMemberships } from "@/lib/firebase/memberships";
import { User } from "firebase/auth";
import { Pencil, Shield } from "lucide-react";
import Image from "next/image";
=======
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { checkAdminRole } from "@/lib/admin";
import { Shield } from "lucide-react";
>>>>>>> Stashed changes
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Profile() {
  const { user, logout, loading } = useAuth();
  const isMobile = useIsMobile();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      if (user && !loading) {
        try {
          const adminStatus = await checkAdminRole(user.uid);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error("Error verificando rol de admin:", error);
          setIsAdmin(false);
        }
      }
    };

    checkAdmin();
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-600">
        Cargando usuario...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-600">
        Usuario no autenticado
      </div>
    );
  }

  const sections = createProfileSections(router, logout, () =>
    setSettingsOpen(true)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header del perfil */}
        <ProfileHeader
          user={user}
          onSettingsClick={() => setSettingsOpen(true)}
          onEditPhoto={() => setSettingsOpen(true)}
        />

<<<<<<< Updated upstream
            {/* Sección de Notificaciones */}
            <div className="pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-base text-gray-900">
                    Notificaciones
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Mantente al día con las mejores ofertas y descuentos
                  </p>
                </div>
              </div>
              <NotificationButton
                variant="outline"
                size="default"
                className="w-full"
              />
            </div>
=======
        {/* Botón de Administración para Admins (solo en desktop) */}
        {isAdmin && !isMobile && (
          <div className="mb-6">
            <Button
              onClick={() => router.push("/admin")}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              <Shield className="w-4 h-4 mr-2" />
              Panel de Administración
            </Button>
          </div>
        )}
>>>>>>> Stashed changes

        {/* Secciones del perfil */}
        <ProfileSection
          title={sections.miCuenta.title}
          items={sections.miCuenta.items}
        />
        <ProfileSection
          title={sections.configuracion.title}
          items={sections.configuracion.items}
        />
        <ProfileSection
          title={sections.soporte.title}
          items={sections.soporte.items}
        />
        <ProfileSection
          title={sections.cerrarSesion.title}
          items={sections.cerrarSesion.items}
        />
      </main>

      {/* Modal de configuración de usuario */}
      <UserSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialValues={undefined}
      />
    </div>
  );
}
