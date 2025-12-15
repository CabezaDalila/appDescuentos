/**
 * Hook para manejar recomendaciones inteligentes con IA
 */

import { useAuth } from "@/hooks/useAuth";
import {
  getLatestFuelRecommendation,
  saveFuelRecommendation,
} from "@/lib/firebase/routes";
import { getSmartRecommendations } from "@/lib/services/ai-recommendations.service";
import { sendRecommendationNotification } from "@/lib/services/notification.service";
import type { AIRecommendation, RecommendationRequest } from "@/types/recommendations";
import { useCallback, useEffect, useState } from "react";

export function useFuelRecommendations() {
  const { user } = useAuth();
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
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
      const latest = await getLatestFuelRecommendation(user.uid);
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

        // Guardar en Firestore
        await saveFuelRecommendation(user.uid, newRecommendation);

        // Enviar notificación automática
        if (newRecommendation.recommendedDiscounts.length > 0) {
          const topDiscount = request.availableDiscounts.find(
            (d) => d.id === newRecommendation.recommendedDiscounts[0].discountId
          );

          if (topDiscount) {
            await sendRecommendationNotification(
              user.uid,
              newRecommendation,
              {
                merchant: topDiscount.name || topDiscount.title || "Comercio",
                percentage: topDiscount.discountPercentage || 0,
                card: topDiscount.membershipRequired?.[0] || topDiscount.bancos?.[0] || "Tarjeta",
              }
            );
          }
        }

        setRecommendation(newRecommendation);
        return newRecommendation;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error("Error generando recomendación");
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
