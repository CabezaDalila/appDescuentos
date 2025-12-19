/**
 * Funciones de Firebase para rutas y recomendaciones de IA
 */

import { db } from "@/lib/firebase/firebase";
import type { Discount } from "@/types/discount";
import type { DailyRoute, RoutesSummary } from "@/types/location";
import type {
  AIRecommendation,
  AIRecommendationWithDiscounts,
} from "@/types/recommendations";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

/**
 * Guardar ruta diaria del usuario
 */
export async function saveDailyRoute(
  userId: string,
  route: DailyRoute
): Promise<void> {
  const routeRef = doc(db, "users", userId, "dailyRoutes", route.date);

  await setDoc(routeRef, {
    ...route,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Obtener rutas de la última semana
 */
export async function getWeeklyRoutes(userId: string): Promise<DailyRoute[]> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const dateStr = oneWeekAgo.toISOString().split("T")[0];

  const routesRef = collection(db, "users", userId, "dailyRoutes");
  const q = query(
    routesRef,
    where("date", ">=", dateStr),
    orderBy("date", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as DailyRoute);
}

/**
 * Guardar resumen de movilidad
 */
export async function saveRoutesSummary(
  userId: string,
  summary: RoutesSummary
): Promise<void> {
  const summaryRef = doc(db, "users", userId, "routesSummary", "current");

  await setDoc(summaryRef, {
    ...summary,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Obtener resumen de movilidad
 */
export async function getRoutesSummary(
  userId: string
): Promise<RoutesSummary | null> {
  const summaryRef = doc(db, "users", userId, "routesSummary", "current");
  const snapshot = await getDoc(summaryRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as RoutesSummary;
}

/**
 * Elimina valores undefined de un objeto para Firestore
 */
function removeUndefinedFields(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedFields).filter((item) => item !== undefined);
  }

  if (typeof obj === "object") {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value);
      }
    }
    return cleaned;
  }

  return obj;
}

/**
 * Guardar recomendación de IA con descuentos completos
 */
export async function saveAIRecommendation(
  userId: string,
  recommendation: AIRecommendation,
  fullDiscounts: Discount[] // Descuentos completos mapeados desde los IDs
): Promise<void> {
  const recommendationRef = doc(
    db,
    "users",
    userId,
    "aiRecommendations",
    "latest"
  );

  const recommendationWithDiscounts: AIRecommendationWithDiscounts = {
    ...recommendation,
    fullDiscounts,
    savedAt: Date.now(), // Guardar timestamp en milisegundos
  };

  // Limpiar valores undefined antes de guardar en Firestore
  const cleanedData = removeUndefinedFields(recommendationWithDiscounts);

  await setDoc(recommendationRef, cleanedData);
}

/**
 * Obtener última recomendación de IA con descuentos completos
 * Si pasaron más de 24 horas, elimina el documento y retorna null
 */
export async function getLatestAIRecommendation(
  userId: string
): Promise<AIRecommendationWithDiscounts | null> {
  const recommendationRef = doc(
    db,
    "users",
    userId,
    "aiRecommendations",
    "latest"
  );
  const snapshot = await getDoc(recommendationRef);

  if (!snapshot.exists()) {
    console.log("[IA] No hay recomendación guardada en Firestore");
    return null;
  }

  const data = snapshot.data() as AIRecommendationWithDiscounts;
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
  const now = Date.now();
  const age = now - (data.savedAt || 0);

  // Si pasaron más de 24 horas, eliminar y retornar null
  if (age > CACHE_DURATION) {
    await deleteDoc(recommendationRef);
    return null;
  }

  return data;
}

/**
 * Verificar si el usuario tiene tracking activo
 */
export async function hasLocationTrackingEnabled(
  userId: string
): Promise<boolean> {
  const userRef = doc(db, "users", userId);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return false;
  }

  const data = snapshot.data();
  return data.locationTracking === true;
}
