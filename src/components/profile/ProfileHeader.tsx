import { useUserProfile } from "@/hooks/useUserProfile";
import { User } from "firebase/auth";
import Image from "next/image";

interface ProfileHeaderProps {
  user: User;
  onSettingsClick: () => void;
  onEditPhoto: () => void;
}

function getInitial(user: User) {
  if (
    user?.displayName &&
    typeof user.displayName === "string" &&
    user.displayName.trim() !== ""
  ) {
    const firstName = user.displayName.trim().split(" ")[0];
    return firstName.charAt(0).toUpperCase();
  }
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

function getMemberSinceDate(user: User) {
  if (user?.metadata?.creationTime) {
    const date = new Date(user.metadata.creationTime);
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${year}`;
  }
  return "";
}

export default function ProfileHeader({
  user,
  onSettingsClick,
  onEditPhoto,
}: ProfileHeaderProps) {
  const { profile } = useUserProfile(user?.uid);

  // Obtener nombre completo del perfil o del displayName
  const getFullName = () => {
    if (profile?.profile?.firstName && profile?.profile?.lastName) {
      return `${profile.profile.firstName} ${profile.profile.lastName}`.trim();
    }
    if (user.displayName) {
      return user.displayName;
    }
    return "Usuario";
  };

  return (
    <div className="mb-6">
      {/* Header con título */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
      </div>

      {/* Tarjeta de perfil principal */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-4">
            {/* Imagen de perfil */}
            <div className="w-16 h-16 flex-shrink-0">
            {typeof user.photoURL === "string" &&
              user.photoURL.trim().length > 0 ? (
                <Image
                  src={user.photoURL}
                  alt="Foto de perfil"
                  width={64}
                  height={64}
                  className="rounded-full object-cover border-2 border-gray-200 w-16 h-16"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold select-none">
                  {getInitial(user)}
                </div>
              )}
            </div>

            {/* Información del usuario */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 mb-0.5">
                {getFullName()}
              </h2>
              <p className="text-gray-600 text-sm mb-1">{user.email}</p>
              {getMemberSinceDate(user) && (
                <span className="text-gray-500 text-xs">
                  Miembro desde {getMemberSinceDate(user)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
