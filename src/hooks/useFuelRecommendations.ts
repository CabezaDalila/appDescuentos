/**
 * Hook para manejar recomendaciones inteligentes con IA
 */

import { useAuth } from "@/hooks/useAuth";
import {
  getLatestAIRecommendation,
  saveAIRecommendation,
} from "@/lib/firebase/routes";
import { getSmartRecommendations } from "@/lib/services/ai-recommendations.service";
import { sendRecommendationNotification } from "@/lib/services/notification.service";
import type {
  AIRecommendationWithDiscounts,
  RecommendationRequest,
} from "@/types/recommendations";
import { useCallback, useEffect, useState } from "react";

export function useAIRecommendations() {
  const { user } = useAuth();
  const [recommendation, setRecommendation] =
    useState<AIRecommendationWithDiscounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Cargar última recomendación al montar
  useEffect(() => {
    if (user?.uid) {
      loadLatestRecommendation();
    }
  }, [user?.uid]);

  const loadLatestRecommendation = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const latest = await getLatestAIRecommendation(user.uid);
      setRecommendation(latest);
    } catch (err) {
      console.error("Error cargando recomendación:", err);
    }
  }, [user?.uid]);

  // Generar recomendación
  const generateRecommendation = useCallback(
    async (request: RecommendationRequest) => {
      if (!user?.uid) {
        setError(new Error("Usuario no autenticado"));
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // Llamar a Gemini para generar recomendación
        const newRecommendation = await getSmartRecommendations(request);

        // Mapear IDs a descuentos completos
        const fullDiscounts = newRecommendation.recommendedDiscounts
          .map((rec) => {
            const discount = request.availableDiscounts.find(
              (d) => d.id === rec.discountId
            );
            return discount;
          })
          .filter((d): d is NonNullable<typeof d> => d !== undefined);

        // Crear recomendación con descuentos completos
        const recommendationWithDiscounts: AIRecommendationWithDiscounts = {
          ...newRecommendation,
          fullDiscounts,
          savedAt: Date.now(),
        };

        // Guardar en Firestore con descuentos completos
        await saveAIRecommendation(user.uid, newRecommendation, fullDiscounts);

        // Enviar notificación automática
        if (fullDiscounts.length > 0) {
          const topDiscount = fullDiscounts[0];
          await sendRecommendationNotification(user.uid, newRecommendation, {
            merchant: topDiscount.name || topDiscount.title || "Comercio",
            percentage: topDiscount.discountPercentage || 0,
            card:
              topDiscount.membershipRequired?.[0] ||
              topDiscount.bancos?.[0] ||
              "Tarjeta",
          });
        }

        setRecommendation(recommendationWithDiscounts);
        return recommendationWithDiscounts;
      } catch (err) {
        const errorObj =
          err instanceof Error
            ? err
            : new Error("Error generando recomendación");
        setError(errorObj);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user?.uid]
  );

  const refreshRecommendation = useCallback(async () => {
    await loadLatestRecommendation();
  }, [loadLatestRecommendation]);

  return {
    recommendation,
    loading,
    error,
    generateRecommendation,
    refreshRecommendation,
  };
}
