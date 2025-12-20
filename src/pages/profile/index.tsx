import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileSection, {
    createProfileSections,
} from "@/components/profile/ProfileSection";
import UserSettingsModal from "@/components/settings/UserSettingsModal";
import { Button } from "@/components/Share/button";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getUserMemberships } from "@/lib/firebase/memberships";
import { Shield } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Profile() {
  const { user, logout, loading, loggingOut } = useAuth();
  const { isAdmin } = useAdmin();
  const isMobile = useIsMobile();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [membershipsCount, setMembershipsCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const loadMembershipsCount = async () => {
      if (user && !loading) {
        try {
          // Usar getUserMemberships para obtener todas las membresías únicas
          const allMemberships = await getUserMemberships();
          setMembershipsCount(allMemberships.length);
        } catch (error) {
          console.error("Error al cargar membresías:", error);
        }
      }
    };
    loadMembershipsCount();
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

  const sections = createProfileSections(
    router,
    logout,
    () => setSettingsOpen(true),
    membershipsCount,
    loggingOut
  );

  return (
    <div className="min-h-screen bg-gray-50 with-bottom-nav-pb">
      <main className="px-4 py-5">
        {/* Header del perfil */}
        <ProfileHeader
          user={user}
          onSettingsClick={() => setSettingsOpen(true)}
          onEditPhoto={() => setSettingsOpen(true)}
        />

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
