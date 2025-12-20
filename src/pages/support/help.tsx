import { Button } from "@/components/Share/button";
import { PageHeader } from "@/components/Share/page-header";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Check, Mail, Send } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function HelpPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useUserProfile(user?.uid);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Scroll al top cuando se carga la página
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Pre-llenar campos con datos del usuario
  useEffect(() => {
    if (user) {
      const profileName = profile?.name;
      const nameValue =
        (typeof profileName === "string" ? profileName : null) ||
        user.displayName ||
        "";
      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
        name: nameValue,
      }));
    }
  }, [user, profile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.subject.trim() ||
      !formData.message.trim()
    ) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Por favor ingresa un email válido");
      return;
    }

    setIsSubmitting(true);

    // Simular envío del mensaje
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      
      // Después de mostrar el éxito, redirigir al perfil
      setTimeout(() => {
        router.push("/profile");
      }, 1500);
    }, 1000);
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 with-bottom-nav-pb">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <PageHeader title="Ayuda" onBack={() => router.push("/support")} />
      </div>

      {/* Contenido */}
      <div className="px-4 py-4">
        <div className="max-w-2xl mx-auto">
          {/* Información */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Contacta con nuestro equipo
                </h3>
                <p className="text-sm text-gray-600">
                  Completa el formulario y te responderemos lo antes posible
                </p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg border border-gray-200 p-5 space-y-3.5"
          >
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                placeholder="Tu nombre completo"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="subject"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Asunto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
                placeholder="¿Sobre qué necesitas ayuda?"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Mensaje <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 resize-none"
                placeholder="Describe tu consulta o problema..."
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || isSuccess || !formData.subject.trim() || !formData.message.trim()}
              className={`w-full py-2.5 text-sm mt-1 transition-all duration-500 ${
                isSuccess 
                  ? "bg-green-500 hover:bg-green-500" 
                  : "bg-purple-600 hover:bg-purple-700"
              } text-white`}
            >
              {isSuccess ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  ¡Mensaje enviado!
                </>
              ) : isSubmitting ? (
                <>
                  <Send className="h-4 w-4 mr-2 animate-pulse" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar mensaje
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
