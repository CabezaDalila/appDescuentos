import type {
  AIRecommendation,
  RecommendationRequest,
} from "@/types/recommendations";
import {
  getCachedRecommendation,
  setCachedRecommendation,
} from "./ai-cache.service";
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

  const cached = getCachedRecommendation(
    request.userId,
    request.userPreferences.interests || [],
    request.userBanks
  );

  if (cached) {
    return cached;
  }

  const rateLimitCheck = canMakeRequest(request.userId);
  if (!rateLimitCheck.allowed) {
    throw new Error(`Rate limit excedido: ${rateLimitCheck.reason}`);
  }

  try {
    const recommendation = await callGeminiAPI(request);

    if (
      !recommendation.recommendedDiscounts ||
      recommendation.recommendedDiscounts.length === 0
    ) {
      throw new Error("No se generaron recomendaciones");
    }

    recordRequest(request.userId);
    setCachedRecommendation(
      request.userId,
      request.userPreferences.interests || [],
      request.userBanks,
      recommendation
    );

    return recommendation;
  } catch (error) {
    throw error;
  }
}
