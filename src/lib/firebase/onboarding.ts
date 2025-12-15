import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
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
 * Guarda las respuestas del onboarding en Firestore
 */
export async function saveOnboardingAnswers(
  userId: string,
  answers: OnboardingAnswers
): Promise<void> {
  const userRef = doc(db, "users", userId);

  // Preparar datos solo con valores definidos
  const onboardingData: any = {
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

  await setDoc(
    userRef,
    {
      onboarding: onboardingData,
    },
    { merge: true }
  );
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

  return {
    spendingCategories: onboarding.spendingCategories || [],
    mainGoal: onboarding.mainGoal || "",
    banks: onboarding.banks || [],
    transportType: onboarding.transportType,
    allowLocationTracking: onboarding.allowLocationTracking || false,
  };
}
