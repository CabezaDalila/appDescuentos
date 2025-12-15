import type {
  AIRecommendation,
  RecommendationRequest,
} from "@/types/recommendations";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getCachedRecommendation,
  setCachedRecommendation,
} from "./ai-cache.service";
import { canMakeRequest, recordRequest } from "./ai-rate-limiter.service";

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

function buildPrompt(request: RecommendationRequest): string {
  // Crear lista de descuentos con ID, nombre y detalles completos
  const discountsText = request.availableDiscounts
    .map((d, index) => {
      const title = d.name || d.title || "Descuento";
      const percentage = d.discountPercentage || 0;

      // Obtener tarjetas específicas (priorizar membershipRequired, luego bancos)
      let cards = "Sin restricción de tarjeta";
      if (d.membershipRequired && d.membershipRequired.length > 0) {
        cards = d.membershipRequired.join(", ");
      } else if (d.bancos && d.bancos.length > 0) {
        cards = d.bancos.join(", ");
      }

      // Categoría
      const category = d.category || "general";

      // Descripción (si existe)
      const description = d.description || "";

      // Construir línea de descuento con toda la info
      let discountLine = `${index + 1}. ID: "${d.id}"\n`;
      discountLine += `   Título: ${title}\n`;
      discountLine += `   Categoría: ${category}\n`;
      discountLine += `   Descuento: ${percentage}%\n`;
      discountLine += `   Tarjetas: ${cards}`;

      if (description) {
        discountLine += `\n   Descripción: ${description.substring(0, 100)}`;
      }

      return discountLine;
    })
    .join("\n\n");

  // Construir contexto del usuario según datos disponibles
  let userContext = "";

  // Categorías que son de interés del usuario
  if (
    request.userPreferences.interests &&
    request.userPreferences.interests.length > 0
  ) {
    userContext += `- Categorías de interés: ${request.userPreferences.interests.join(
      ", "
    )}`;
  }

  return `Eres un asistente experto en finanzas personales y ahorro en Argentina.

Analiza los siguientes datos del usuario:
${userContext}
- Tarjetas/Bancos disponibles: ${
    request.userBanks.join(", ") || "ninguna especificada"
  }

Descuentos disponibles:
${discountsText}

Genera recomendaciones personalizadas en formato JSON con esta estructura:
{
  "recommendedDiscounts": [
    {
      "discountId": "ID EXACTO del descuento",
      "relevanceScore": número del 0-100
    }
  ]
}

INSTRUCCIONES IMPORTANTES:

1. MATCHING DE TARJETAS:
   - Si el usuario tiene bancos/tarjetas específicos, PRIORIZA descuentos que los acepten
   - Si un descuento dice "Sin restricción de tarjeta", es válido para todos
   - Si el usuario NO tiene tarjetas, solo recomienda descuentos sin restricción

2. MATCHING DE CATEGORÍAS:
   - PRIORIZA descuentos cuya categoría coincida con los intereses del usuario
   - Ejemplo: Si le interesa "automotive", prioriza descuentos de esa categoría
   - Dale mayor relevanceScore a las coincidencias de categoría

3. RELEVANCE SCORE:
   - 90-100: Coincide categoría Y tarjeta del usuario
   - 70-89: Coincide categoría O tarjeta del usuario, o ambas
   - 50-69: Descuento sin restricción pero no coincide categoría
   - 0-49: No recomendable

4. FORMATO:
   - El "discountId" DEBE ser el ID exacto (ej: "NnTEpUs4d9xUfZXKfwXB")
   - Ordena por relevanceScore (más alto primero)
   - Máximo 5 descuentos recomendados
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
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = buildPrompt(request);

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log(text);
    const parsed = parseGeminiResponse(text);

    return parsed;
  } catch (error) {
    throw error;
  }
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
    const recommendation = await analyzeWithGemini(request);

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
