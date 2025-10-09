import { db } from "@/lib/firebase";
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
    console.log(`Descuento ${discountId} eliminado correctamente`);
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
    console.log(` ${discountIds.length} descuentos eliminados correctamente`);
  } catch (error) {
    console.error("Error al eliminar descuentos:", error);
    throw error;
  }
};

// Eliminar descuentos por criterios específicos
export const deleteDiscountsByCriteria = async (criteria: {
  category?: string;
  status?: string;
  origin?: string;
  source?: string;
  approvalStatus?: string;
}): Promise<number> => {
  try {
    const conditions = [];

    if (criteria.category) {
      conditions.push(where("category", "==", criteria.category));
    }
    if (criteria.status) {
      conditions.push(where("status", "==", criteria.status));
    }
    if (criteria.origin) {
      conditions.push(where("origin", "==", criteria.origin));
    }
    if (criteria.source) {
      conditions.push(where("source", "==", criteria.source));
    }
    if (criteria.approvalStatus) {
      conditions.push(where("approvalStatus", "==", criteria.approvalStatus));
    }

    const q = query(collection(db, "discounts"), ...conditions);
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return 0;
    }

    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });

    await batch.commit();

    console.log(`✅ ${snapshot.size} descuentos eliminados por criterios`);
    return snapshot.size;
  } catch (error) {
    console.error("Error al eliminar descuentos por criterios:", error);
    throw error;
  }
};

// Eliminar todos los descuentos
export const deleteAllDiscounts = async (): Promise<number> => {
  try {
    const snapshot = await getDocs(collection(db, "discounts"));

    if (snapshot.empty) {
      return 0;
    }

    const batch = writeBatch(db);
    let batchCount = 0;
    let totalDeleted = 0;

    for (const docSnapshot of snapshot.docs) {
      batch.delete(docSnapshot.ref);
      batchCount++;
      totalDeleted++;

      // Ejecutar batch cada 500 documentos
      if (batchCount === 500) {
        await batch.commit();
        batchCount = 0;
      }
    }

    // Ejecutar el último batch si queda algo
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`✅ ${totalDeleted} descuentos eliminados`);
    return totalDeleted;
  } catch (error) {
    console.error("Error al eliminar todos los descuentos:", error);
    throw error;
  }
};
