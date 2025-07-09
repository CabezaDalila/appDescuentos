import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import UserSettingsModal from "@/components/settings/UserSettingsModal";
import { ProfileAppBar } from "@/components/ui/profile-app-bar";
import { Pencil } from "lucide-react";
import MembershipCard from "@/components/memberships/MembershipCard";
import { getActiveMemberships } from "@/lib/firebase/memberships";
import { useRouter } from "next/router";
import { Membership } from "@/types/membership";

function getInitial(user: any) {
  // Usar displayName si existe y no es vacío
  if (user?.displayName && typeof user.displayName === 'string' && user.displayName.trim() !== '') {
    const firstName = user.displayName.trim().split(' ')[0];
    return firstName.charAt(0).toUpperCase();
  }
  // Si no, usar email
  if (user?.email && typeof user.email === 'string' && user.email.trim() !== '') {
    return user.email.charAt(0).toUpperCase();
  }
  return "U";
}

function getMemberSince(user: any) {
  if (user?.metadata?.creationTime) {
    const year = new Date(user.metadata.creationTime).getFullYear();
    return year;
  }
  return "";
}

export default function Profile() {
  const { user, logout, loading } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loadingMemberships, setLoadingMemberships] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user || loading) return;
    setLoadingMemberships(true);
    getActiveMemberships()
      .then(setMemberships)
      .finally(() => setLoadingMemberships(false));
  }, [user, loading]);

  if (loading) {
    return <div className="flex justify-center items-center h-40 text-gray-500">Cargando usuario...</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center h-40 text-gray-500">Usuario no autenticado</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfileAppBar
        onSettings={() => setSettingsOpen(true)}
        onLogout={logout}
      />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            {/* Título y descripción eliminados para respetar el diseño */}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Información del usuario - DISEÑO FINAL (alineado a la izquierda) */}
            <div className="flex items-center gap-4 pb-2">
              <div className="relative w-20 h-20 flex-shrink-0">
                {/* Foto o inicial */}
                {typeof user.photoURL === 'string' && user.photoURL.trim().length > 0 ? (
                  <img
                    src={user.photoURL}
                    alt=" "
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold select-none">
                    {getInitial(user)}
                  </div>
                )}
                {/* Ícono de editar */}
                <span className="absolute bottom-1 left-1 bg-white rounded-full p-1 shadow border cursor-pointer" title="Editar foto de perfil">
                  <Pencil className="w-5 h-5 text-gray-500" />
                </span>
              </div>
              <div className="flex flex-col items-start justify-center">
                <span className="text-xl font-bold leading-tight">{user.displayName || "Usuario"}</span>
                <span className="text-gray-600 text-sm leading-tight">{user.email}</span>
                {getMemberSince(user) && (
                  <span className="mt-2 px-3 py-1 rounded-full bg-white border text-gray-700 text-xs font-medium shadow-sm inline-block">
                    Miembro desde {getMemberSince(user)}
                  </span>
                )}
              </div>
            </div>
            {/* Carrousel de membresías activas */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-base">Membresías activas</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/memberships")}
                  className="ml-2"
                >
                  + Gestionar
                </Button>
              </div>
              {loadingMemberships ? (
                <div className="text-gray-400 text-sm py-6">Cargando membresías...</div>
              ) : memberships.length === 0 ? (
                <div className="text-gray-400 text-sm py-6">No tienes membresías activas</div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                  {memberships.slice(0, 12).map((membership) => (
                    <div key={membership.id} className="flex-shrink-0">
                      <MembershipCard membership={membership} variant="carousel" />
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