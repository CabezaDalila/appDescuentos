import { Card, CardContent } from "@/components/Share/card";
import { User } from "firebase/auth";
import { Pencil } from "lucide-react";
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

export default function ProfileHeader({
  user,
  onSettingsClick,
  onEditPhoto,
}: ProfileHeaderProps) {
  return (
    <div className="mb-6">
      {/* Header con título */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
      </div>

      {/* Tarjeta de perfil principal */}
      <Card className="bg-gradient-to-br from-purple-500 via-blue-500 to-purple-600 text-white border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 flex-shrink-0">
              {typeof user.photoURL === "string" &&
              user.photoURL.trim().length > 0 ? (
                <Image
                  src={user.photoURL}
                  alt="Foto de perfil"
                  width={64}
                  height={64}
                  className="rounded-full object-cover border-2 border-white/20"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold select-none">
                  {getInitial(user)}
                </div>
              )}
              <button
                onClick={onEditPhoto}
                className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-md hover:bg-gray-50 transition-colors"
                title="Editar foto de perfil"
              >
                <Pencil className="w-3 h-3 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white truncate">
                {user.displayName || "Usuario"}
              </h2>
              <p className="text-white/80 text-sm truncate">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-medium">
                  Nivel Gold
                </span>
                {getMemberSince(user) && (
                  <span className="text-white/80 text-xs">
                    Miembro desde Enero {getMemberSince(user)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
