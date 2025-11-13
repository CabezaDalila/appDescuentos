import { db } from "@/lib/firebase/firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";

// Eliminar un descuento específico por ID
export const deleteDiscount = async (discountId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "discounts", discountId));
  } catch (error) {
    console.error("Error al eliminar descuento:", error);
    throw error;
  }
};

// Eliminar múltiples descuentos por IDs
export const deleteMultipleDiscounts = async (
  discountIds: string[]
): Promise<void> => {
  try {
    const batch = writeBatch(db);

    discountIds.forEach((id) => {
      batch.delete(doc(db, "discounts", id));
    });

    await batch.commit();
  } catch (error) {
    console.error("Error al eliminar descuentos:", error);
    throw error;
  }
};

