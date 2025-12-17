import type {
  AIRecommendation,
  RecommendationRequest,
} from "@/types/recommendations";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { NextApiRequest, NextApiResponse } from "next";

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "") {
    throw new Error("Gemini API key no configurada");
  }

  return new GoogleGenerativeAI(apiKey);
};

function buildPrompt(request: RecommendationRequest): string {
  const discountsText = request.availableDiscounts
    .map((d, index) => {
      const title = d.name || d.title || "Descuento";
      const percentage = d.discountPercentage || 0;

      let cards = "Sin restricción de tarjeta";
      if (d.membershipRequired && d.membershipRequired.length > 0) {
        cards = d.membershipRequired.join(", ");
      } else if (d.bancos && d.bancos.length > 0) {
        cards = d.bancos.join(", ");
      }

      const category = d.category || "general";

      const description = d.description || "";

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

  let userContext = "";

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

function parseGeminiResponse(responseText: string): AIRecommendation {
  try {
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

async function analyzeWithGemini(
  request: RecommendationRequest
): Promise<AIRecommendation> {
  const genAI = getGeminiClient();
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = buildPrompt(request);

  console.log(" Consultando a Gemini para recomendaciones personalizadas...");
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const parsed = parseGeminiResponse(text);

    return parsed;
  } catch (error) {
    console.error("Error llamando a Gemini:", error);
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const request: RecommendationRequest = req.body;

    if (!request.userId) {
      return res.status(400).json({ error: "Usuario no identificado" });
    }

    if (
      !request.availableDiscounts ||
      request.availableDiscounts.length === 0
    ) {
      return res.status(400).json({
        error: "No hay descuentos disponibles para recomendar",
      });
    }

    if (!request.userBanks) {
      request.userBanks = [];
    }

    const recommendation = await analyzeWithGemini(request);

    if (
      !recommendation.recommendedDiscounts ||
      recommendation.recommendedDiscounts.length === 0
    ) {
      return res.status(500).json({
        error: "No se generaron recomendaciones",
      });
    }

    return res.status(200).json(recommendation);
  } catch (error) {
    console.error("Error en API de recomendaciones:", error);
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Error interno del servidor al generar recomendaciones",
    });
  }
}
