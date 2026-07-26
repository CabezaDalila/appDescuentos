/**
 * Recomendaciones de IA — ahora sobre Supabase.
 *
 * Este módulo re-exporta la capa `src/lib/supabase/recommendations.ts` para no
 * tocar a los consumidores (useAIRecommendations importa desde acá).
 *
 * Las funciones de tracking de rutas (saveDailyRoute, getWeeklyRoutes,
 * saveRoutesSummary, getRoutesSummary, hasLocationTrackingEnabled) se
 * eliminaron: eran código muerto (0 consumidores) y solo mantenían viva la
 * dependencia de Firestore.
 */
export {
  saveAIRecommendation,
  getLatestAIRecommendation,
} from "@/lib/supabase/recommendations";
