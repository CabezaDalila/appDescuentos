import { db } from "@/lib/firebase/firebase";
import {
  doc,
  serverTimestamp,
  updateDoc,
  deleteField,
} from "firebase/firestore";

export interface OnboardingAnswers {
  interests: string[];
  goals: string[];
  banks?: string[];
}

/**
 * Valida que las respuestas del onboarding sean válidas
 */
function validateOnboardingAnswers(answers: OnboardingAnswers): void {
  if (!Array.isArray(answers.interests)) {
    throw new Error("Los intereses deben ser un array");
  }
  if (!Array.isArray(answers.goals)) {
    throw new Error("Los objetivos deben ser un array");
  }
  if (answers.banks !== undefined && !Array.isArray(answers.banks)) {
    throw new Error("Los bancos deben ser un array");
  }
}

/**
 * Guarda las respuestas del onboarding en Firestore
 * Elimina cualquier estructura duplicada (como onboarding.answers)
 */
export async function saveOnboardingAnswers(
  userId: string,
  answers: OnboardingAnswers
): Promise<void> {
  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
    throw new Error("El identificador del usuario es requerido");
  }

  // Validar los datos antes de guardar
  validateOnboardingAnswers(answers);

  const userRef = doc(db, "users", userId);

  // Usar updateDoc con notación de punto para actualizar campos anidados
  // y eliminar la estructura duplicada 'answers' si existe
  // deleteField() debe usarse en el nivel superior, no dentro de objetos anidados
  await updateDoc(userRef, {
    "onboarding.completed": true,
    "onboarding.completedAt": serverTimestamp(),
    "onboarding.interests": answers.interests,
    "onboarding.goals": answers.goals,
    "onboarding.banks": answers.banks || [],
    // Eliminar la estructura duplicada 'answers' usando notación de punto
    "onboarding.answers": deleteField(),
  });
}
