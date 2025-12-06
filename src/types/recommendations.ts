/**
 * Tipos genéricos para recomendaciones inteligentes
 * Funciona con cualquier categoría de descuento
 */

import type { Discount } from "./discount";

export interface RecommendationRequest {
  userId: string;
  userPreferences: {
    vehicleType?: string; // Del onboarding: transportType
    interests?: string[]; // Del onboarding: spendingCategories
  };
  userBanks: string[]; // Del onboarding: banks
  availableDiscounts: Discount[];
}

export interface AIRecommendation {
  recommendedDiscounts: {
    discountId: string;
    relevanceScore: number; // 0-100
    reasoning: string; // Explicación generada por IA
    suggestedDay: string;
    estimatedSavings: number;
  }[];
  insights: string; // Análisis general del comportamiento del usuario
  tips: string[]; // Tips personalizados para ahorrar más
  generatedAt: number;
}
