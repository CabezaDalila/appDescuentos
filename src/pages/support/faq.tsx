import { PageHeader } from "@/components/Share/page-header";
import { getFAQs, type FAQItem } from "@/lib/firebase/support-content";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function FAQPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Scroll al top cuando se carga la página
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Cargar FAQs desde Firestore
  useEffect(() => {
    const loadFAQs = async () => {
      setLoading(true);
      try {
        const faqsData = await getFAQs();
        setFaqs(faqsData);
      } catch (error) {
        console.error("Error cargando FAQs:", error);
      } finally {
        setLoading(false);
      }
    };
    loadFAQs();
  }, []);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 with-bottom-nav-pb">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <PageHeader
          title="Preguntas frecuentes"
          onBack={() => router.push("/support")}
        />
      </div>

      {/* Contenido */}
      <div className="px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Cargando preguntas frecuentes...</p>
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No hay preguntas frecuentes disponibles.</p>
            </div>
          ) : (
            faqs.map((faq, index) => (
            <div
              key={faq.id || index}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 pr-4">
                  {faq.question}
                </span>
                {openIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

