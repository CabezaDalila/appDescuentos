/**
 * Servicio de notificaciones para recomendaciones inteligentes
 */

import { authHeader } from "@/lib/data/auth-header";
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

    if (!topRecommendation) {
      console.warn("No hay recomendaciones para notificar");
      return;
    }

    const response = await fetch("/api/notifications/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({
        userId,
        title: "💡 Nueva Recomendación para ti",
        message: `¡Aprovechá ${discountDetails.percentage}% de descuento en ${discountDetails.merchant} con tu ${discountDetails.card}!`,
        data: {
          type: "fuel_recommendation",
          discountId: topRecommendation.discountId,
          merchant: discountDetails.merchant,
          percentage: discountDetails.percentage,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Error enviando notificación");
    }

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
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
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

  } catch (error) {
    console.error("Error enviando recordatorio:", error);
  }
}
