import { PageHeader } from "@/components/Share/page-header";
import {
  HelpCircle,
  Info,
  FileText,
  MessageCircle,
  ChevronRight,
  Mail,
  Phone,
} from "lucide-react";
import { useRouter } from "next/router";

interface SupportItem {
  icon: React.ReactNode;
  title: string;
  description?: string;
  onClick?: () => void;
  variant?: "default" | "info" | "contact";
}

export default function SupportPage() {
  const router = useRouter();

  const supportItems: SupportItem[] = [
    {
      icon: <Info className="h-5 w-5" />,
      title: "Versión",
      description: "1.0.0",
      variant: "info",
    },
    {
      icon: <HelpCircle className="h-5 w-5" />,
      title: "Preguntas frecuentes",
      description: "Encuentra respuestas a las preguntas más comunes",
      onClick: () => {
        // Aquí puedes agregar navegación a FAQ o abrir un modal
        console.log("Abrir FAQ");
      },
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Términos y Política de Privacidad",
      description: "Consulta nuestros términos de servicio y política de privacidad",
      onClick: () => {
        // Aquí puedes agregar navegación a términos y privacidad
        console.log("Abrir términos y privacidad");
      },
    },
    {
      icon: <MessageCircle className="h-5 w-5" />,
      title: "Ayuda",
      description: "Contacta con nuestro equipo de soporte",
      onClick: () => {
        // Aquí puedes agregar navegación a ayuda o abrir un formulario
        console.log("Abrir ayuda");
      },
    },
  ];

  const getIconBg = (variant?: string) => {
    switch (variant) {
      case "info":
        return "bg-gradient-to-br from-purple-500 to-blue-500 text-white";
      case "contact":
        return "bg-green-100 text-green-600";
      default:
        return "bg-purple-100 text-purple-600";
    }
  };

  const getCardBg = (variant?: string) => {
    switch (variant) {
      case "info":
        return "bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 hover:border-purple-300";
      case "contact":
        return "bg-green-50 border-2 border-green-200 hover:border-green-300";
      default:
        return "bg-white border border-gray-200 hover:border-purple-300 hover:shadow-md";
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 with-bottom-nav-pb">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <PageHeader
          title="Acerca de y asistencia"
          onBack={() => router.push("/profile")}
        />
      </div>

      {/* Contenido */}
      <div className="px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-3">
          {supportItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              disabled={!item.onClick}
              className={`w-full flex items-center gap-4 p-4 sm:p-5 rounded-xl transition-all ${
                getCardBg(item.variant)
              } ${!item.onClick ? "cursor-default" : "cursor-pointer active:scale-[0.98]"}`}
            >
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                  getIconBg(item.variant)
                }`}
              >
                {item.icon}
              </div>
              <div className="flex-1 text-left min-w-0">
                <h3
                  className={`font-semibold mb-1 ${
                    item.variant === "info"
                      ? "text-purple-900 text-lg sm:text-xl"
                      : "text-gray-900 text-base sm:text-lg"
                  }`}
                >
                  {item.title}
                </h3>
                {item.description && (
                  <p
                    className={`text-sm sm:text-base ${
                      item.variant === "info"
                        ? "text-purple-700"
                        : "text-gray-600"
                    }`}
                  >
                    {item.description}
                  </p>
                )}
              </div>
              {item.onClick && (
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Información de contacto */}
        <div className="max-w-2xl mx-auto mt-6 p-4 sm:p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Mail className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">¿Necesitas más ayuda?</h4>
              <p className="text-sm text-gray-600">
                Estamos aquí para ayudarte
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              // Aquí puedes agregar navegación a contacto o abrir formulario
              console.log("Contactar soporte");
            }}
            className="w-full mt-3 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle className="h-5 w-5" />
            Contáctanos
          </button>
        </div>
      </div>
    </div>
  );
}

