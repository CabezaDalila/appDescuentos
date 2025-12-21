import { db } from "@/lib/firebase/firebase";
import {
    doc,
    getDoc,
    runTransaction,
    serverTimestamp
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
  const voteRef = doc(db, "discountVotes", `${userId}_${discountId}`);
  const discountRef = doc(db, "discounts", discountId);

  try {
    // Usar transacción para evitar condiciones de carrera
    await runTransaction(db, async (transaction) => {
      // Leer ambos documentos en la transacción
      const voteDoc = await transaction.get(voteRef);
      const discountDoc = await transaction.get(discountRef);

      if (!discountDoc.exists()) {
        throw new Error("Descuento no encontrado");
      }

      // Obtener el voto anterior si existe
      const previousVote = voteDoc.exists()
        ? (voteDoc.data() as DiscountVote)
        : null;

      // Obtener los contadores actuales
      const discountData = discountDoc.data();
      let upVotes = discountData.upVotes || 0;
      let downVotes = discountData.downVotes || 0;

      // Revertir el voto anterior si existía
      if (previousVote) {
        if (previousVote.vote === "up") {
          upVotes = Math.max(0, upVotes - 1);
        } else if (previousVote.vote === "down") {
          downVotes = Math.max(0, downVotes - 1);
        }
      }

      // Aplicar el nuevo voto (solo sumar 1)
      if (vote === "up") {
        upVotes += 1;
      } else if (vote === "down") {
        downVotes += 1;
      }

      // Calcular puntos: votos positivos - votos negativos
      const points = Math.max(0, upVotes - downVotes);

      // Actualizar ambos documentos en la transacción
      transaction.set(
        voteRef,
        {
          userId,
          discountId,
          vote,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      transaction.update(discountRef, {
        upVotes,
        downVotes,
        points,
        updatedAt: serverTimestamp(),
      });
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
  const voteRef = doc(db, "discountVotes", `${userId}_${discountId}`);
  const discountRef = doc(db, "discounts", discountId);

  try {
    // Usar transacción para evitar condiciones de carrera
    await runTransaction(db, async (transaction) => {
      // Leer ambos documentos en la transacción
      const voteDoc = await transaction.get(voteRef);
      const discountDoc = await transaction.get(discountRef);

      if (!voteDoc.exists()) {
        return; // No hay voto que eliminar
      }

      if (!discountDoc.exists()) {
        return;
      }

      const previousVote = voteDoc.data() as DiscountVote;

      // Obtener los contadores actuales
      const discountData = discountDoc.data();
      let upVotes = discountData.upVotes || 0;
      let downVotes = discountData.downVotes || 0;

      // Quitar solo el voto del usuario
      if (previousVote.vote === "up") {
        upVotes = Math.max(0, upVotes - 1);
      } else if (previousVote.vote === "down") {
        downVotes = Math.max(0, downVotes - 1);
      }

      // Recalcular puntos: votos positivos - votos negativos
      const points = Math.max(0, upVotes - downVotes);

      // Eliminar voto y actualizar descuento en la transacción
      transaction.delete(voteRef);
      transaction.update(discountRef, {
        upVotes,
        downVotes,
        points,
        updatedAt: serverTimestamp(),
      });
    });
  } catch (error) {
    console.error("Error al eliminar el voto:", error);
    throw error;
  }
}
