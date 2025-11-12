import { db } from "@/lib/firebase/firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export interface OnboardingAnswers {
  interests: string[];
  goals: string[];
}

export async function saveOnboardingAnswers(
  userId: string,
  answers: OnboardingAnswers
): Promise<void> {
  if (!userId) {
    throw new Error("El identificador del usuario es requerido");
  }

  const userRef = doc(db, "users", userId);

  await setDoc(
    userRef,
    {
      onboarding: {
        completed: true,
        completedAt: serverTimestamp(),
        interests: answers.interests,
        goals: answers.goals,
      },
    },
    { merge: true }
  );
}
