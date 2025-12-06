/**
 * Componente temporal para testing de recomendaciones
 * ELIMINAR en producción
 */

import { useAuth } from "@/hooks/useAuth";
import { useCachedDiscounts } from "@/hooks/useCachedDiscounts";
import { useFuelRecommendations } from "@/hooks/useFuelRecommendations";
import { getOnboardingAnswers } from "@/lib/firebase/onboarding";
import { Sparkles } from "lucide-react";
import { useState } from "react";

export function TestRecommendationButton() {
  const { user } = useAuth();
  const { generateRecommendation } = useFuelRecommendations();
  const { discounts } = useCachedDiscounts();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleGenerateTest = async () => {
    if (!user?.uid) {
      setMessage("❌ No hay usuario autenticado");
      return;
    }

    setLoading(true);
    setMessage("⏳ Generando recomendación...");

    try {
      // Obtener datos del onboarding
      const onboardingData = await getOnboardingAnswers(user.uid);
      
      if (!onboardingData) {
        setMessage("⚠️ Completa el onboarding primero en /onboarding");
        setLoading(false);
        return;
      }

      // Intentar filtrar descuentos de combustible primero
      let selectedDiscounts = discounts.filter(d => 
        d.category === "combustible" || 
        d.category === "nafta" ||
        d.title?.toLowerCase().includes("ypf") ||
        d.title?.toLowerCase().includes("shell") ||
        d.title?.toLowerCase().includes("axion")
      );

      // Si no hay descuentos de combustible, usar descuentos de las categorías del usuario
      if (selectedDiscounts.length === 0 && onboardingData.spendingCategories.length > 0) {
        selectedDiscounts = discounts.filter(d => 
          onboardingData.spendingCategories.includes(d.category || "")
        );
      }

      // Si aún no hay, usar cualquier descuento disponible
      if (selectedDiscounts.length === 0) {
        selectedDiscounts = discounts;
      }

      // Limitar a 5 descuentos
      selectedDiscounts = selectedDiscounts.slice(0, 5);

      if (selectedDiscounts.length === 0) {
        setMessage("⚠️ No hay descuentos en la base de datos");
        setLoading(false);
        return;
      }

      console.log("📊 Descuentos seleccionados:", selectedDiscounts.map(d => ({
        title: d.title,
        category: d.category
      })));

      // Crear request de prueba
      const request = {
        userId: user.uid,
        userPreferences: {
          vehicleType: onboardingData.transportType || "auto-nafta",
          usageFrequency: "diario",
          interests: onboardingData.spendingCategories || [],
        },
        behaviorData: {
          weeklyKm: 150,
          monthlyKm: 600,
          frequentLocations: ["CABA", "Zona Norte"],
        },
        userBanks: onboardingData.banks || ["Galicia"],
        availableDiscounts: selectedDiscounts as any, // Cast temporal para testing
      };

      const result = await generateRecommendation(request);
      
      if (result) {
        setMessage("✅ ¡Recomendación generada! Recarga la página para verla.");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage("❌ Error generando recomendación");
      }
    } catch (error) {
      console.error("Error completo:", error);
      const errorMessage = error instanceof Error ? error.message : "Desconocido";
      setMessage(`❌ Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 bg-white rounded-lg shadow-lg p-4 border-2 border-purple-500 max-w-xs">
      <p className="text-xs font-bold text-purple-600 mb-2">🧪 TEST MODE</p>
      <button
        onClick={handleGenerateTest}
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Sparkles className="h-4 w-4" />
        {loading ? "Generando..." : "Generar Recomendación"}
      </button>
      {message && (
        <p className="text-xs mt-2 text-gray-600">{message}</p>
      )}
    </div>
  );
}
