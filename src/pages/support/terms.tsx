import { PageHeader } from "@/components/Share/page-header";
import { getTermsContent } from "@/lib/firebase/support-content";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function TermsPage() {
  const router = useRouter();
  const [termsContent, setTermsContent] = useState({
    termsOfService: "",
    privacyPolicy: "",
  });
  const [loading, setLoading] = useState(true);

  // Scroll al top cuando se carga la página
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Cargar términos desde Firestore
  useEffect(() => {
    const loadTerms = async () => {
      setLoading(true);
      try {
        const content = await getTermsContent();
        if (content) {
          setTermsContent(content);
        }
      } catch (error) {
        console.error("Error cargando términos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadTerms();
  }, []);

  return (
    <div className="w-full min-h-screen bg-gray-50 with-bottom-nav-pb">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <PageHeader
          title="Términos y Política de Privacidad"
          onBack={() => router.push("/support")}
        />
      </div>

      {/* Contenido */}
      <div className="px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Cargando términos y política...</p>
            </div>
          ) : (
            <>
              {/* Términos de Servicio */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Términos de Servicio
                </h2>
                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {termsContent.termsOfService || (
                    <p className="text-gray-400 italic">
                      Los términos de servicio no están disponibles en este momento.
                    </p>
                  )}
                </div>
              </div>

              {/* Política de Privacidad */}
              <div className="bg-white rounded-lg border border-gray-200 p-5">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Política de Privacidad
                </h2>
                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {termsContent.privacyPolicy || (
                    <p className="text-gray-400 italic">
                      La política de privacidad no está disponible en este momento.
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Información de Contacto */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-2">Contacto</h3>
            <p className="text-sm text-gray-600">
              Si tienes preguntas sobre estos términos o nuestra política de privacidad, 
              puedes contactarnos a través de la sección de Ayuda.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

