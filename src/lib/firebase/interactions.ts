import { db } from "@/lib/firebase/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

const COLLECTION_NAME = "user_discount_interactions";

export type FeedbackValue = -1 | 0 | 1;

export interface UserDiscountInteraction {
  userId: string;
  discountId: string;
  favorite?: boolean;
  feedback?: FeedbackValue;
  createdAt?: unknown;
  updatedAt?: unknown;
}

function getInteractionDocRef(userId: string, discountId: string) {
  if (!userId || !discountId) {
    throw new Error("userId y discountId son requeridos");
  }
  return doc(db, COLLECTION_NAME, `${userId}_${discountId}`);
}

/**
 * Obtiene la interacción de un usuario con un descuento (favorito / feedback).
 */
export async function getUserInteraction(
  userId: string,
  discountId: string
): Promise<UserDiscountInteraction | null> {
  try {
    const ref = getInteractionDocRef(userId, discountId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return null;
    }

    const data = snap.data() as UserDiscountInteraction;

    return {
      userId: data.userId || userId,
      discountId: data.discountId || discountId,
      favorite: !!data.favorite,
      feedback:
        typeof data.feedback === "number"
          ? (data.feedback as FeedbackValue)
          : 0,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error("Error obteniendo interacción de descuento:", error);
    return null;
  }
}

/**
 * Alterna el estado de favorito (corazón) para un usuario y un descuento.
 * Devuelve el nuevo estado de favorito.
 */
export async function toggleFavorite(
  userId: string,
  discountId: string
): Promise<boolean> {
  const ref = getInteractionDocRef(userId, discountId);
  const now = serverTimestamp();

  const snap = await getDoc(ref);
  const existing = snap.exists()
    ? (snap.data() as UserDiscountInteraction)
    : null;

  const currentFavorite = !!existing?.favorite;
  const newFavorite = !currentFavorite;

  if (snap.exists()) {
    await updateDoc(ref, {
      userId,
      discountId,
      favorite: newFavorite,
      updatedAt: now,
    });
  } else {
    await setDoc(ref, {
      userId,
      discountId,
      favorite: newFavorite,
      feedback: 0,
      createdAt: now,
      updatedAt: now,
    } as UserDiscountInteraction);
  }

  return newFavorite;
}

/**
 * Guarda el feedback explícito del usuario sobre un descuento.
 * value: -1 (no le gustó), 0 (sin feedback), 1 (le gustó).
 */
export async function setFeedback(
  userId: string,
  discountId: string,
  value: FeedbackValue
): Promise<FeedbackValue> {
  const ref = getInteractionDocRef(userId, discountId);
  const now = serverTimestamp();

  const snap = await getDoc(ref);

  if (snap.exists()) {
    await updateDoc(ref, {
      userId,
      discountId,
      feedback: value,
      updatedAt: now,
    });
  } else {
    await setDoc(ref, {
      userId,
      discountId,
      favorite: false,
      feedback: value,
      createdAt: now,
      updatedAt: now,
    } as UserDiscountInteraction);
  }

  return value;
}

/**
 * Obtiene todos los IDs de descuentos marcados como favoritos por un usuario.
 */
export async function getFavoriteDiscountIdsForUser(
  userId: string
): Promise<string[]> {
  if (!userId) return [];

  try {
    const ref = collection(db, COLLECTION_NAME);
    const q = query(
      ref,
      where("userId", "==", userId),
      where("favorite", "==", true)
    );
    const snap = await getDocs(q);

    const ids: string[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as UserDiscountInteraction;
      if (data.discountId) {
        ids.push(data.discountId);
      }
    });

    return ids;
  } catch (error) {
    console.error("Error obteniendo favoritos del usuario:", error);
    return [];
  }
}



