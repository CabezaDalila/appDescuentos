/**
 * Componente de recomendaciones inteligentes
 */

import { useFuelRecommendations } from "@/hooks/useFuelRecommendations";
import { Calendar, Sparkles, TrendingDown } from "lucide-react";
import { useRouter } from "next/router";

export function SmartRecommendation() {
  const { recommendation, loading } = useFuelRecommendations();
  const router = useRouter();

  if (loading) {
    return (
      <div className="mb-6 p-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg animate-pulse">
        <div className="h-6 bg-white/20 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-white/20 rounded w-full mb-2"></div>
        <div className="h-4 bg-white/20 rounded w-5/6"></div>
      </div>
    );
  }

  if (!recommendation || recommendation.recommendedDiscounts.length === 0) {
    return null;
  }

  const topRecommendation = recommendation.recommendedDiscounts[0];

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-2xl shadow-xl overflow-hidden">
        {/* Header con ícono de IA */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Recomendación Inteligente
            </h3>
          </div>

          {/* Explicación generada por IA */}
          <p className="text-white/95 text-base leading-relaxed mb-4">
            {topRecommendation.reasoning}
          </p>

          {/* Detalles de la recomendación */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Ahorro estimado */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-green-300" />
                <span className="text-xs text-white/70">Ahorro estimado</span>
              </div>
              <p className="text-xl font-bold text-white">
                ${topRecommendation.estimatedSavings.toLocaleString()}
              </p>
            </div>

            {/* Día recomendado */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-blue-300" />
                <span className="text-xs text-white/70">Mejor día</span>
              </div>
              <p className="text-lg font-bold text-white capitalize">
                {topRecommendation.suggestedDay}
              </p>
            </div>
          </div>

          {/* Insights adicionales */}
          {recommendation.insights && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-4">
              <p className="text-sm text-white/90">
                💡 {recommendation.insights}
              </p>
            </div>
          )}

          {/* Botón para ver descuento */}
          <button
            onClick={() => router.push(`/discount/${topRecommendation.discountId}`)}
            className="w-full bg-white text-purple-600 font-semibold py-3 px-4 rounded-xl hover:bg-purple-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-center gap-2">
              <span>Ver Descuento Completo</span>
            </div>
          </button>
        </div>

        {/* Footer con badge de IA */}
        <div className="bg-black/20 px-6 py-3">
          <p className="text-xs text-white/70 text-center">
            ✨ Generado por IA analizando tus patrones de comportamiento
          </p>
        </div>
      </div>

      {/* Tips adicionales (opcional) */}
      {recommendation.tips && recommendation.tips.length > 0 && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            💡 Tips personalizados
          </h4>
          <ul className="space-y-1">
            {recommendation.tips.slice(0, 2).map((tip, index) => (
              <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default SmartRecommendation;
