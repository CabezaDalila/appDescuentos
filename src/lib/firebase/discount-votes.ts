import { db } from "@/lib/firebase/firebase";
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

export type VoteType = "up" | "down";

export interface DiscountVote {
  userId: string;
  discountId: string;
  vote: VoteType;
  createdAt: any;
}

/**
 * Vota por un descuento (recomiendo/no recomiendo)
 * @param userId ID del usuario
 * @param discountId ID del descuento
 * @param vote Tipo de voto: "up" (recomiendo) o "down" (no recomiendo)
 */
export async function voteDiscount(
  userId: string,
  discountId: string,
  vote: VoteType
): Promise<void> {
  try {
    const voteRef = doc(db, "discountVotes", `${userId}_${discountId}`);
    const discountRef = doc(db, "discounts", discountId);

    // Obtener el voto anterior si existe
    const previousVoteDoc = await getDoc(voteRef);
    const previousVote = previousVoteDoc.data() as DiscountVote | undefined;

    // Guardar o actualizar el voto del usuario (para saber si ya votó)
    await setDoc(
      voteRef,
      {
        userId,
        discountId,
        vote,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Obtener el descuento
    const discountDoc = await getDoc(discountRef);
    if (!discountDoc.exists()) {
      throw new Error("Descuento no encontrado");
    }

    // Obtener los contadores actuales de votos del descuento
    const discountData = discountDoc.data();
    let upVotes = discountData.upVotes || 0;
    let downVotes = discountData.downVotes || 0;

    // Revertir el voto anterior si existía
    if (previousVote) {
      if (previousVote.vote === "up") {
        upVotes = Math.max(0, upVotes - 1); // Quitar un voto positivo
      } else if (previousVote.vote === "down") {
        downVotes = Math.max(0, downVotes - 1); // Quitar un voto negativo
      }
    }

    // Aplicar el nuevo voto
    if (vote === "up") {
      upVotes += 1; // Sumar un voto positivo
    } else if (vote === "down") {
      downVotes += 1; // Sumar un voto negativo
    }

    // Calcular puntos: votos positivos - votos negativos
    const points = Math.max(0, upVotes - downVotes);

    // Actualizar el descuento con los nuevos contadores y puntos
    await updateDoc(discountRef, {
      upVotes,
      downVotes,
      points,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error al votar por el descuento:", error);
    throw error;
  }
}

/**
 * Obtiene el voto del usuario para un descuento
 * @param userId ID del usuario
 * @param discountId ID del descuento
 * @returns El voto del usuario o null si no ha votado
 */
export async function getUserVote(
  userId: string,
  discountId: string
): Promise<VoteType | null> {
  try {
    const voteRef = doc(db, "discountVotes", `${userId}_${discountId}`);
    const voteDoc = await getDoc(voteRef);

    if (!voteDoc.exists()) {
      return null;
    }

    const voteData = voteDoc.data() as DiscountVote;
    return voteData.vote;
  } catch (error) {
    console.error("Error al obtener el voto del usuario:", error);
    return null;
  }
}

/**
 * Elimina el voto del usuario
 * @param userId ID del usuario
 * @param discountId ID del descuento
 */
export async function removeVote(
  userId: string,
  discountId: string
): Promise<void> {
  try {
    const voteRef = doc(db, "discountVotes", `${userId}_${discountId}`);
    const discountRef = doc(db, "discounts", discountId);

    // Obtener el voto anterior
    const previousVoteDoc = await getDoc(voteRef);
    if (!previousVoteDoc.exists()) {
      return; // No hay voto que eliminar
    }

    const previousVote = previousVoteDoc.data() as DiscountVote;

    // Eliminar el voto del usuario
    await deleteDoc(voteRef);

    // Obtener el descuento
    const discountDoc = await getDoc(discountRef);
    if (!discountDoc.exists()) {
      return;
    }

    // Obtener los contadores actuales
    const discountData = discountDoc.data();
    let upVotes = discountData.upVotes || 0;
    let downVotes = discountData.downVotes || 0;

    // Quitar solo el voto del usuario (no sumar nada)
    if (previousVote.vote === "up") {
      upVotes = Math.max(0, upVotes - 1); // Solo quitar el voto positivo
    } else if (previousVote.vote === "down") {
      downVotes = Math.max(0, downVotes - 1); // Solo quitar el voto negativo
    }

    // Recalcular puntos: votos positivos - votos negativos
    const points = Math.max(0, upVotes - downVotes);

    // Actualizar el descuento
    await updateDoc(discountRef, {
      upVotes,
      downVotes,
      points,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error al eliminar el voto:", error);
    throw error;
  }
}
