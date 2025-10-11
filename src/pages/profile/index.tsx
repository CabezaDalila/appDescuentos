import { ProfileAppBar } from "@/components/home/profile-app-bar";
import MembershipCard from "@/components/memberships/MembershipCard";
import NotificationButton from "@/components/NotificationButton";
import UserSettingsModal from "@/components/settings/UserSettingsModal";
import { Button } from "@/components/Share/button";
import { Card, CardContent } from "@/components/Share/card";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { checkAdminRole } from "@/lib/firebase/admin";
import { getActiveMemberships } from "@/lib/firebase/memberships";
import { Membership } from "@/types/membership";
import { User } from "firebase/auth";
import { Pencil, Shield } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

function getInitial(user: User) {
  // Usar displayName si existe y no es vacío
  if (
    user?.displayName &&
    typeof user.displayName === "string" &&
    user.displayName.trim() !== ""
  ) {
    const firstName = user.displayName.trim().split(" ")[0];
    return firstName.charAt(0).toUpperCase();
  }
  // Si no, usar email
  if (
    user?.email &&
    typeof user.email === "string" &&
    user.email.trim() !== ""
  ) {
    return user.email.charAt(0).toUpperCase();
  }
  return "U";
}

function getMemberSince(user: User) {
  if (user?.metadata?.creationTime) {
    const year = new Date(user.metadata.creationTime).getFullYear();
    return year;
  }
  return "";
}

export default function Profile() {
  const { user, logout, loading } = useAuth();
  const isMobile = useIsMobile();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loadingMemberships, setLoadingMemberships] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!user || loading) return;
    setLoadingMemberships(true);
    getActiveMemberships()
      .then(setMemberships)
      .finally(() => setLoadingMemberships(false));
  }, [user, loading]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileAppBar
        onSettings={() => setSettingsOpen(true)}
        onLogout={logout}
      />
      <main className="container mx-auto px-4 py-8 max-w-2xl overflow-hidden">
        <Card>
          <CardContent className="space-y-6 mt-4">
            <div className="flex items-center gap-4 pb-2">
              <div className="relative w-20 h-20 flex-shrink-0">
                {typeof user.photoURL === "string" &&
                user.photoURL.trim().length > 0 ? (
                  <Image
                    src={user.photoURL}
                    alt="Foto de perfil"
                    width={80}
                    height={80}
                    className="rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold select-none">
                    {getInitial(user)}
                  </div>
                )}
                <span
                  className="absolute bottom-1 left-1 bg-white rounded-full p-1 shadow border cursor-pointer"
                  title="Editar foto de perfil"
                >
                  <Pencil className="w-5 h-5 text-gray-600" />
                </span>
              </div>
              <div className="flex flex-col items-start justify-center">
                <span className="text-xl font-bold leading-tight">
                  {user.displayName || "Usuario"}
                </span>
                <span className="text-gray-600 text-sm leading-tight">
                  {user.email}
                </span>
                {getMemberSince(user) && (
                  <span className="mt-2 px-3 py-1 rounded-full bg-white border text-gray-700 text-xs font-medium shadow-sm inline-block">
                    Miembro desde {getMemberSince(user)}
                  </span>
                )}
              </div>
            </div>
            {/* Botón de Administración para Admins (solo en desktop) */}
            {isAdmin && !isMobile && (
              <div className="pb-4 border-b border-gray-200">
                <Button
                  onClick={() => router.push("/admin")}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Panel de Administración
                </Button>
              </div>
            )}

            {/* Sección de Notificaciones */}
            <div className="pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-base text-gray-900">Notificaciones</h3>
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

            {/* Carrousel de membresías activas */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-base">
                  Membresías activas
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/memberships")}
                  className="ml-2 text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400"
                >
                  + Gestionar
                </Button>
              </div>
              {loadingMemberships ? (
                <div className="text-gray-600 text-sm py-6">
                  Cargando membresías...
                </div>
              ) : memberships.length === 0 ? (
                <div className="text-gray-600 text-sm py-6">
                  No tienes membresías activas
                </div>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent px-0 -mx-4">
                  {memberships.slice(0, 12).map((membership) => (
                    <div key={membership.id} className="flex-shrink-0">
                      <MembershipCard
                        membership={membership}
                        variant="carousel"
                      />
                    </div>
                  ))}
                </div>
              )}
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
