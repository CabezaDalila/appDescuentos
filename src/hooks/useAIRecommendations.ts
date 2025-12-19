/**
 * Hook para manejar recomendaciones inteligentes con IA
 */

import { useAuth } from "@/hooks/useAuth";
import { getOnboardingAnswers } from "@/lib/firebase/onboarding";
import {
  getLatestAIRecommendation,
  saveAIRecommendation,
} from "@/lib/firebase/routes";
import { getSmartRecommendations } from "@/lib/services/ai-recommendations.service";
import { sendRecommendationNotification } from "@/lib/services/notification.service";
import type { Discount } from "@/types/discount";
import type {
  AIRecommendationWithDiscounts,
  RecommendationRequest,
} from "@/types/recommendations";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseAIRecommendationsOptions {
  autoGenerate?: boolean; // Si debe generar automáticamente si no encuentra recomendaciones
  availableDiscounts?: Discount[]; // Descuentos disponibles para generar recomendaciones
  userMemberships?: string[]; // Membresías del usuario
}

export function useAIRecommendations(
  options: UseAIRecommendationsOptions = {}
) {
  const {
    autoGenerate = false,
    availableDiscounts = [],
    userMemberships = [],
  } = options;
  const { user } = useAuth();
  const [recommendation, setRecommendation] =
    useState<AIRecommendationWithDiscounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasLoadedRef = useRef(false);

  const generateRecommendationAutomatically = useCallback(async () => {
    if (!user?.uid || availableDiscounts.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Obtener datos del onboarding
      const onboarding = await getOnboardingAnswers(user.uid);

      if (!onboarding || !onboarding.spendingCategories?.length) {
        // No tiene onboarding completado, no generar
        setRecommendation(null);
        setLoading(false);
        return;
      }

      // Filtrar descuentos relevantes
      let relevantDiscounts = availableDiscounts.filter((d) =>
        onboarding.spendingCategories.includes(d.category || "")
      );

      // Si no hay suficientes, usar todos
      if (relevantDiscounts.length < 3) {
        relevantDiscounts = availableDiscounts.slice(0, 10);
      }

      if (relevantDiscounts.length === 0) {
        setRecommendation(null);
        setLoading(false);
        return;
      }

      // Combinar bancos del onboarding + membresías
      const banksFromOnboarding = onboarding.banks || [];
      const allUserBanks = [
        ...new Set([...banksFromOnboarding, ...userMemberships]),
      ];

      const request: RecommendationRequest = {
        userId: user.uid,
        userPreferences: {
          interests: onboarding.spendingCategories,
          vehicleType: onboarding.transportType,
        },
        userBanks: allUserBanks,
        availableDiscounts: relevantDiscounts.slice(0, 10),
      };

      // Llamar a Gemini para generar recomendación
      console.log("[IA] Llamando a Gemini API para generar recomendaciones...");
      const newRecommendation = await getSmartRecommendations(request);
      console.log("[IA] Recomendaciones generadas exitosamente");

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
      console.log("[IA] Recomendaciones guardadas en Firestore exitosamente");

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
    } catch (err) {
      console.error("Error generando recomendación automáticamente:", err);
      const errorObj =
        err instanceof Error ? err : new Error("Error generando recomendación");
      setError(errorObj);
      setRecommendation(null);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, availableDiscounts, userMemberships]);

  const loadLatestRecommendation = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // Evitar ejecuciones duplicadas
    if (hasLoadedRef.current) {
      return;
    }

    try {
      setLoading(true);
      hasLoadedRef.current = true;
      const latest = await getLatestAIRecommendation(user.uid);

      if (latest) {
        // Hay recomendación válida, usarla
        console.log("[IA] Cargando recomendación desde Firestore");
        setRecommendation(latest);
        setLoading(false);
      } else if (autoGenerate && availableDiscounts.length > 0) {
        // No hay recomendación o está vencida, generar nueva automáticamente
        console.log("[IA] Generando nueva recomendación con IA...");
        await generateRecommendationAutomatically();
      } else {
        // No hay recomendación y no se debe generar automáticamente
        console.log(
          " [IA] No hay recomendación y autoGenerate está desactivado"
        );
        setRecommendation(null);
        setLoading(false);
      }
    } catch (err) {
      console.error("Error cargando recomendación:", err);
      hasLoadedRef.current = false; // Reset en caso de error
      setLoading(false);
    }
  }, [
    user?.uid,
    autoGenerate,
    availableDiscounts.length,
    generateRecommendationAutomatically,
  ]);

  // Reset cuando cambia el usuario
  useEffect(() => {
    hasLoadedRef.current = false;
  }, [user?.uid]);

  // Cargar última recomendación al montar o cuando los descuentos estén listos
  useEffect(() => {
    if (user?.uid && availableDiscounts.length > 0 && !hasLoadedRef.current) {
      loadLatestRecommendation();
    }
  }, [user?.uid, availableDiscounts.length, loadLatestRecommendation]);

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
