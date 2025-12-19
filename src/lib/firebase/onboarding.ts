import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export interface OnboardingAnswers {
  spendingCategories: string[]; // Reemplaza interests
  mainGoal: string; // Reemplaza goals (ahora es selección única)
  banks?: string[];
  transportType?: string; // Reemplaza vehicleType
  allowLocationTracking?: boolean;
  estimatedMonthlyKm?: number; // Opcional: para futuro
}

/**
 * Interfaz para los datos guardados en Firestore (incluye campos adicionales)
 */
interface OnboardingFirestoreData {
  completed: boolean;
  spendingCategories: string[];
  mainGoal: string;
  banks: string[];
  allowLocationTracking: boolean;
  completedAt: any; // serverTimestamp()
  transportType?: string; // Solo si existe
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
 * Guarda las respuestas del onboarding en Firestore
 */
export async function saveOnboardingAnswers(
  userId: string,
  answers: OnboardingAnswers
): Promise<void> {
  const userRef = doc(db, "users", userId);

  // Preparar datos solo con valores definidos
  const onboardingData: OnboardingFirestoreData = {
    completed: true,
    spendingCategories: answers.spendingCategories || [],
    mainGoal: answers.mainGoal || "",
    banks: answers.banks || [],
    allowLocationTracking: answers.allowLocationTracking || false,
    completedAt: serverTimestamp(),
  };

  // Solo agregar transportType si tiene un valor
  if (answers.transportType) {
    onboardingData.transportType = answers.transportType;
  }

  // Limpiar valores undefined antes de guardar
  const cleanedData = removeUndefinedFields({
    onboarding: onboardingData,
  });

  await setDoc(userRef, cleanedData, { merge: true });
}

/**
 * Obtiene las respuestas del onboarding de Firestore
 */
export async function getOnboardingAnswers(
  userId: string
): Promise<OnboardingAnswers | null> {
  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    return null;
  }

  const data = userDoc.data();
  const onboarding = data?.onboarding;

  if (!onboarding || !onboarding.completed) {
    return null;
  }

  // Construir respuesta sin valores undefined
  const result: OnboardingAnswers = {
    spendingCategories: onboarding.spendingCategories || [],
    mainGoal: onboarding.mainGoal || "",
    banks: onboarding.banks || [],
    allowLocationTracking: onboarding.allowLocationTracking || false,
  };

  // Solo agregar transportType si existe y no es undefined
  if (
    onboarding.transportType !== undefined &&
    onboarding.transportType !== null
  ) {
    result.transportType = onboarding.transportType;
  }

  // Solo agregar estimatedMonthlyKm si existe y no es undefined
  if (
    onboarding.estimatedMonthlyKm !== undefined &&
    onboarding.estimatedMonthlyKm !== null
  ) {
    result.estimatedMonthlyKm = onboarding.estimatedMonthlyKm;
  }

  return result;
}
