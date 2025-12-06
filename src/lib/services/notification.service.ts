/**
 * Servicio de notificaciones para recomendaciones inteligentes
 */

import type { AIRecommendation } from "@/types/recommendations";

/**
 * Enviar notificación de recomendación
 */
export async function sendRecommendationNotification(
  userId: string,
  recommendation: AIRecommendation,
  discountDetails: {
    merchant: string;
    percentage: number;
    card: string;
  }
): Promise<void> {
  try {
    const topRecommendation = recommendation.recommendedDiscounts[0];

    // The instruction implies that `topRecommendation` will always be available or handled upstream.
    // If `topRecommendation` might be undefined, additional handling would be needed here.
    // For now, proceeding assuming it's always present as per the provided snippet.

    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        title: "💡 Nueva Recomendación Inteligente",
        message: `${topRecommendation.reasoning.substring(0, 100)}...`,
        data: {
          type: "fuel_recommendation",
          discountId: topRecommendation.discountId,
          estimatedSavings: topRecommendation.estimatedSavings,
          merchant: discountDetails.merchant,
          percentage: discountDetails.percentage,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Error enviando notificación");
    }

    console.log("Notificación de recomendación enviada exitosamente");
  } catch (error) {
    console.error("Error enviando notificación de recomendación:", error);
  }
}

/**
 * Enviar notificación de recordatorio
 */
export async function sendReminderNotification(
  userId: string,
  merchant: string,
  percentage: number,
  day: string
): Promise<void> {
  try {
    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        title: "🔔 Recordatorio: Descuento disponible hoy",
        message: `Hoy es ${day}, aprovechá el ${percentage}% de descuento en ${merchant}`,
        data: {
          type: "discount_reminder",
          merchant,
          percentage,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Error enviando recordatorio");
    }

    console.log("Recordatorio enviado exitosamente");
  } catch (error) {
    console.error("Error enviando recordatorio:", error);
  }
}
