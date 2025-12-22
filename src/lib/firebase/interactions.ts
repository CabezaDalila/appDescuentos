import { db } from "@/lib/firebase/firebase";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    increment,
    query,
    runTransaction,
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
 * También actualiza el contador de favoritos en el documento del descuento.
 * Devuelve el nuevo estado de favorito.
 */
export async function toggleFavorite(
  userId: string,
  discountId: string
): Promise<boolean> {
  const interactionRef = getInteractionDocRef(userId, discountId);
  const discountRef = doc(db, "discounts", discountId);
  const now = serverTimestamp();

  return await runTransaction(db, async (transaction) => {
    // Leer la interacción actual
    const interactionSnap = await transaction.get(interactionRef);
    const existing = interactionSnap.exists()
      ? (interactionSnap.data() as UserDiscountInteraction)
      : null;

    const currentFavorite = !!existing?.favorite;
    const newFavorite = !currentFavorite;

    // Actualizar o crear la interacción
    if (interactionSnap.exists()) {
      transaction.update(interactionRef, {
        userId,
        discountId,
        favorite: newFavorite,
        updatedAt: now,
      });
    } else {
      transaction.set(interactionRef, {
        userId,
        discountId,
        favorite: newFavorite,
        feedback: 0,
        createdAt: now,
        updatedAt: now,
      } as UserDiscountInteraction);
    }

    // Actualizar el contador de favoritos en el documento del descuento
    if (currentFavorite && !newFavorite) {
      // Se desmarcó como favorito: decrementar
      transaction.update(discountRef, {
        favoritesCount: increment(-1),
        updatedAt: now,
      });
    } else if (!currentFavorite && newFavorite) {
      // Se marcó como favorito: incrementar
      transaction.update(discountRef, {
        favoritesCount: increment(1),
        updatedAt: now,
      });
    }

    return newFavorite;
  });
}

/**
 * Obtiene el contador de favoritos para un descuento específico.
 * Calcula dinámicamente contando los documentos con favorite === true.
 */
export async function getFavoritesCountForDiscount(
  discountId: string
): Promise<number> {
  try {
    const favoritesQuery = query(
      collection(db, COLLECTION_NAME),
      where("discountId", "==", discountId),
      where("favorite", "==", true)
    );
    const snapshot = await getDocs(favoritesQuery);
    return snapshot.size;
  } catch (error) {
    console.error("Error obteniendo contador de favoritos:", error);
    return 0;
  }
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




