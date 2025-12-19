import type {
  AIRecommendation,
  RecommendationRequest,
} from "@/types/recommendations";
import { canMakeRequest, recordRequest } from "./ai-rate-limiter.service";

/**
 * Llamar al API Route del servidor para generar recomendaciones con Gemini
 */
async function callGeminiAPI(
  request: RecommendationRequest
): Promise<AIRecommendation> {
  const response = await fetch("/api/ai/recommendations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || "Error al generar recomendaciones con IA"
    );
  }

  return response.json();
}

export async function getSmartRecommendations(
  request: RecommendationRequest
): Promise<AIRecommendation> {
  if (!request.userId) {
    throw new Error("Usuario no identificado");
  }

  if (!request.availableDiscounts || request.availableDiscounts.length === 0) {
    throw new Error("No hay descuentos disponibles para recomendar");
  }

  if (!request.userBanks) {
    request.userBanks = [];
  }

  // Verificar rate limit antes de llamar a la IA
  const rateLimitCheck = canMakeRequest(request.userId);
  if (!rateLimitCheck.allowed) {
    throw new Error(`Rate limit excedido: ${rateLimitCheck.reason}`);
  }

  try {
    console.log("[IA] Enviando request a Gemini API...");
    const recommendation = await callGeminiAPI(request);
    console.log("[IA] Respuesta recibida de Gemini API");

    if (
      !recommendation.recommendedDiscounts ||
      recommendation.recommendedDiscounts.length === 0
    ) {
      throw new Error("No se generaron recomendaciones");
    }

    recordRequest(request.userId);

    return recommendation;
  } catch (error) {
    console.error("[IA] Error llamando a Gemini API:", error);
    throw error;
  }
}
