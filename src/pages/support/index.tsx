import { PageHeader } from "@/components/Share/page-header";
import {
  ChevronRight,
  FileText,
  HelpCircle,
  Info,
  MessageCircle,
} from "lucide-react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function SupportPage() {
  const router = useRouter();

  // Scroll al top cuando se carga la página o cambia la ruta
  useEffect(() => {
    // Función para hacer scroll al top en todos los contenedores posibles
    const scrollToTop = () => {
      // Scroll del window
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });

      // Buscar y hacer scroll en contenedores con overflow
      const scrollContainers = document.querySelectorAll(
        '[class*="overflow-y-auto"], [class*="overflow-auto"], .flex-1[class*="overflow"]'
      );
      scrollContainers.forEach((container) => {
        if (container instanceof HTMLElement) {
          container.scrollTop = 0;
        }
      });

      // Buscar específicamente el contenedor del layout que tiene el scroll
      const layoutContainer = document.querySelector(
        ".flex-1.overflow-y-auto"
      ) as HTMLElement;
      if (layoutContainer) {
        layoutContainer.scrollTop = 0;
      }
    };

    // Ejecutar múltiples veces para asegurar que funcione
    scrollToTop();
    const timeoutId = setTimeout(scrollToTop, 0);
    const timeoutId2 = setTimeout(scrollToTop, 50);
    const timeoutId3 = setTimeout(scrollToTop, 100);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
    };
  }, [router.pathname]);

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
          {/* Versión */}
          <div className="w-full flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Info className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Versión</h3>
              <p className="text-sm text-gray-600">1.0.0</p>
            </div>
          </div>

          {/* Preguntas frecuentes */}
          <button
            onClick={() => router.push("/support/faq")}
            className="w-full flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900">
                Preguntas frecuentes
              </h3>
              <p className="text-sm text-gray-600">
                Encuentra respuestas a las preguntas más comunes
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
          </button>

          {/* Términos y Política de Privacidad */}
          <button
            onClick={() => router.push("/support/terms")}
            className="w-full flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900">
                Términos y Política de Privacidad
              </h3>
              <p className="text-sm text-gray-600">
                Consulta nuestros términos de servicio y política de privacidad
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
          </button>

          {/* Ayuda */}
          <button
            onClick={() => router.push("/support/help")}
            className="w-full flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-semibold text-gray-900">Ayuda</h3>
              <p className="text-sm text-gray-600">
                Contacta con nuestro equipo de soporte
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
