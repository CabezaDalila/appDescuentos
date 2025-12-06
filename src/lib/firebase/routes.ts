/**
 * Funciones de Firebase para rutas y recomendaciones de nafta
 */

import { db } from "@/lib/firebase/firebase";
import type { GeminiRecommendation } from "@/types/fuel";
import type { DailyRoute, RoutesSummary } from "@/types/location";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    where
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
export async function getWeeklyRoutes(
  userId: string
): Promise<DailyRoute[]> {
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
 * Guardar recomendación de Gemini
 */
export async function saveFuelRecommendation(
  userId: string,
  recommendation: GeminiRecommendation
): Promise<void> {
  const recommendationRef = doc(
    db,
    "users",
    userId,
    "fuelRecommendations",
    "latest"
  );

  await setDoc(recommendationRef, {
    ...recommendation,
    savedAt: serverTimestamp(),
  });
}

/**
 * Obtener última recomendación
 */
export async function getLatestFuelRecommendation(
  userId: string
): Promise<GeminiRecommendation | null> {
  const recommendationRef = doc(
    db,
    "users",
    userId,
    "fuelRecommendations",
    "latest"
  );
  const snapshot = await getDoc(recommendationRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as GeminiRecommendation;
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
