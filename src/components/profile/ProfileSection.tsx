import { ChevronRight, Pencil, CreditCard, Bell, Shield, MapPin, HelpCircle, LogOut } from "lucide-react";
import { useRouter } from "next/router";

interface ProfileSectionProps {
  title: string;
  items: ProfileItem[];
}

interface ProfileItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
  variant?: "default" | "danger";
}

export default function ProfileSection({ title, items }: ProfileSectionProps) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${
              item.variant === "danger" ? "text-red-600 hover:bg-red-50" : ""
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              item.variant === "danger" ? "bg-red-100" : "bg-gray-100"
            }`}>
              <div className={item.variant === "danger" ? "text-red-600" : "text-gray-600"}>
                {item.icon}
              </div>
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${item.variant === "danger" ? "text-red-600" : "text-gray-900"}`}>
                  {item.title}
                </span>
                {item.badge && (
                  <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className={`text-sm ${item.variant === "danger" ? "text-red-500" : "text-gray-600"}`}>
                {item.description}
              </p>
            </div>
            {item.variant !== "danger" && (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Función helper para crear las secciones del perfil
export function createProfileSections(router: any, onLogout: () => void, onSettings: () => void, membershipsCount: number = 0) {
  const miCuentaItems: ProfileItem[] = [
    {
      icon: <Pencil className="h-5 w-5" />,
      title: "Editar perfil",
      description: "Actualiza tu información personal",
      onClick: () => router.push("/profile/edit"),
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: "Mis membresías",
      description: "Gestiona tus tarjetas y membresías",
      badge: membershipsCount > 0 ? membershipsCount.toString() : undefined,
      onClick: () => router.push("/memberships"),
    },
  ];

  const configuracionItems: ProfileItem[] = [
    {
      icon: <Bell className="h-5 w-5" />,
      title: "Notificaciones",
      description: "Configura tus alertas",
      onClick: () => router.push("/notifications"),
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Privacidad y seguridad",
      description: "Controla tu privacidad",
      onClick: () => router.push("/privacy"),
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: "Ubicación",
      description: "Gestiona tu ubicación",
      onClick: () => router.push("/location"),
    },
  ];

  const soporteItems: ProfileItem[] = [
    {
      icon: <HelpCircle className="h-5 w-5" />,
      title: "Ayuda y soporte",
      description: "¿Necesitas ayuda?",
      onClick: () => router.push("/support"),
    },
  ];

  const cerrarSesionItem: ProfileItem[] = [
    {
      icon: <LogOut className="h-5 w-5" />,
      title: "Cerrar sesión",
      description: "",
      onClick: onLogout,
      variant: "danger",
    },
  ];

  return {
    miCuenta: { title: "Mi cuenta", items: miCuentaItems },
    configuracion: { title: "Configuración", items: configuracionItems },
    soporte: { title: "Soporte", items: soporteItems },
    cerrarSesion: { title: "", items: cerrarSesionItem },
  };
}
