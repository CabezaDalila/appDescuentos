import type { Discount, HomePageDiscount } from "./discount";

export interface RecommendationRequest {
  userId: string;
  userPreferences: {
    vehicleType?: string;
    interests?: string[];
  };
  userBanks: string[];
  availableDiscounts: Discount[];
}

export interface AIRecommendation {
  recommendedDiscounts: {
    discountId: string;
    relevanceScore: number;
  }[];
  generatedAt: number;
}

export interface AIRecommendationWithDiscounts extends AIRecommendation {
  fullDiscounts: HomePageDiscount[];
  savedAt: number;
}
