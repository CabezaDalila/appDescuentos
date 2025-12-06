/**
 * Servicio genérico de IA para recomendaciones inteligentes
 * Adaptador que usa Gemini internamente pero expone una interfaz genérica
 */

import type {
  AIRecommendation,
  RecommendationRequest,
} from "@/types/recommendations";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Inicializar Gemini
const getGeminiClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "") {
    throw new Error(
      "Gemini API key no configurada. Obtén tu key gratuita en https://makersuite.google.com/app/apikey"
    );
  }
  
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Construir prompt genérico para Gemini
 */
function buildPrompt(request: RecommendationRequest): string {
  const discountsText = request.availableDiscounts
    .map((d) => {
      const merchant = d.name || d.title || "Comercio";
      const percentage = d.discountPercentage || 0;
      const cards = d.membershipRequired?.join(", ") || d.bancos?.join(", ") || "cualquier tarjeta";
      return `- ${merchant}: ${percentage}% con ${cards}`;
    })
    .join("\n");

  // Detectar categoría principal
  const mainCategory = request.availableDiscounts[0]?.category || "general";
  
  // Construir contexto del usuario según datos disponibles
  let userContext = "";
  
  // Categorías de gasto (del onboarding)
  if (request.userPreferences.interests && request.userPreferences.interests.length > 0) {
    userContext += `- Categorías de interés: ${request.userPreferences.interests.join(", ")}`;
  }
  
  // Tipo de transporte (del onboarding)
  if (request.userPreferences.vehicleType) {
    if (userContext) userContext += "\n";
    userContext += `- Medio de transporte: ${request.userPreferences.vehicleType}`;
  }

  return `Eres un asistente experto en finanzas personales y ahorro en Argentina.

Analiza los siguientes datos del usuario:
${userContext}
- Tarjetas/Bancos disponibles: ${request.userBanks.join(", ")}

Descuentos disponibles:
${discountsText}

Genera recomendaciones personalizadas en formato JSON con esta estructura:
{
  "recommendedDiscounts": [
    {
      "discountId": "id del descuento",
      "relevanceScore": número del 0-100,
      "reasoning": "explicación clara y motivadora en español argentino, sin mencionar categorías específicas",
      "suggestedDay": "día de la semana recomendado",
      "estimatedSavings": número en pesos estimado de ahorro mensual
    }
  ],
  "insights": "análisis breve del comportamiento del usuario",
  "tips": ["tip 1", "tip 2", "tip 3"]
}

IMPORTANTE:
- Solo recomienda descuentos que coincidan con las tarjetas del usuario
- Sé específico con los ahorros estimados
- Usa lenguaje cercano y motivador
- NO menciones la categoría específica (nafta, supermercado, etc.) en el reasoning
- Enfócate en el ahorro y beneficio para el usuario
- Responde SOLO con el JSON, sin texto adicional`;
}

/**
 * Parsear respuesta de Gemini
 */
function parseGeminiResponse(responseText: string): AIRecommendation {
  try {
    // Limpiar posible markdown
    const jsonText = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(jsonText);

    return {
      ...parsed,
      generatedAt: Date.now(),
    };
  } catch (error) {
    console.error("Error parseando respuesta de Gemini:", error);
    throw new Error("No se pudo procesar la respuesta de Gemini");
  }
}

/**
 * Analizar con Gemini y obtener recomendaciones
 */
async function analyzeWithGemini(
  request: RecommendationRequest
): Promise<AIRecommendation> {
  const genAI = getGeminiClient();
  // Modelo experimental disponible en plan gratuito (con límites de cuota)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = buildPrompt(request);
  
  console.log("📝 [Gemini] Prompt generado:");
  console.log("─".repeat(80));
  console.log(prompt);
  console.log("─".repeat(80));

  try {
    console.log("⏳ [Gemini] Enviando request a Gemini API...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("📨 [Gemini] Respuesta raw de Gemini:");
    console.log("─".repeat(80));
    console.log(text);
    console.log("─".repeat(80));

    const parsed = parseGeminiResponse(text);
    console.log("✅ [Gemini] JSON parseado exitosamente:", parsed);
    
    return parsed;
  } catch (error) {
    console.error("❌ [Gemini] Error detallado:", error);
    throw error;
  }
}

/**
 * Función principal: obtener recomendaciones inteligentes
 */
export async function getSmartRecommendations(
  request: RecommendationRequest
): Promise<AIRecommendation> {
  console.log("🎯 [Service] getSmartRecommendations iniciado");
  console.log("📊 [Service] Request:", {
    userId: request.userId,
    interests: request.userPreferences.interests,
    vehicleType: request.userPreferences.vehicleType,
    banks: request.userBanks,
    discountsCount: request.availableDiscounts.length
  });
  
  try {
    const recommendation = await analyzeWithGemini(request);

    // Validar que haya al menos una recomendación
    if (!recommendation.recommendedDiscounts || recommendation.recommendedDiscounts.length === 0) {
      console.error("❌ [Service] No se generaron recomendaciones");
      throw new Error("No se generaron recomendaciones");
    }

    console.log("✅ [Service] Recomendación válida generada");
    return recommendation;
  } catch (error) {
    console.error("❌ [Service] Error obteniendo recomendaciones:", error);
    throw error;
  }
}
