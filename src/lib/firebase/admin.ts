import { isValidCategory } from "@/lib/categories";
import {
  addDoc,
  collection,
  db,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  updateDoc,
} from "@/lib/firebase";
import { ManualDiscount, ScrapingScript } from "@/types/admin";
// ===== GESTIÓN DE SCRIPTS DE SCRAPING =====

export const getScrapingScripts = async (): Promise<ScrapingScript[]> => {
  try {
    const snapshot = await getDocs(collection(db, "scrapingScripts"));
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        lastExecuted: data.lastExecuted?.toDate(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as ScrapingScript;
    });
  } catch (error) {
    console.error("Error al obtener scripts de scraping:", error);
    throw error;
  }
};

export const createScrapingScript = async (
  script: Omit<ScrapingScript, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "scrapingScripts"), {
      ...script,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error al crear script de scraping:", error);
    throw error;
  }
};

export const updateScrapingScript = async (
  id: string,
  updates: Partial<ScrapingScript>
): Promise<void> => {
  try {
    const docRef = doc(db, "scrapingScripts", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error al actualizar script de scraping:", error);
    throw error;
  }
};

export const deleteScrapingScript = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, "scrapingScripts", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error al eliminar script de scraping:", error);
    throw error;
  }
};

export const executeScrapingScript = async (id: string): Promise<void> => {
  try {
    // Aquí se ejecutaría la lógica del script
    // Por ahora solo actualizamos la fecha de última ejecución
    const docRef = doc(db, "scrapingScripts", id);
    await updateDoc(docRef, {
      lastExecuted: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error al ejecutar script de scraping:", error);
    throw error;
  }
};

// ===== GESTIÓN DE DESCUENTOS MANUALES =====

export const createManualDiscount = async (
  discount: Omit<ManualDiscount, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    // Validar que la categoría sea válida
    if (discount.category && !isValidCategory(discount.category)) {
      throw new Error(
        `Categoría "${discount.category}" no es válida. Use una de las categorías predefinidas.`
      );
    }

    const docRef = await addDoc(collection(db, "discounts"), {
      ...discount,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: "active",
      type: "manual",
    });
    return docRef.id;
  } catch (error) {
    console.error("Error al crear descuento manual:", error);
    throw error;
  }
};

export const getManualDiscounts = async (): Promise<ManualDiscount[]> => {
  try {
    // Obtener todos los descuentos para mostrar
    const allSnapshot = await getDocs(collection(db, "discounts"));
    const allDiscounts = allSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || data.name || "Sin título",
        origin: data.origin || "Origen no especificado",
        category: data.category || "Sin categoría",
        expirationDate:
          data.expirationDate?.toDate() ||
          data.validUntil?.toDate() ||
          new Date(),
        description: data.description || data.descripcion || "Sin descripción",
        discountPercentage: data.discountPercentage,
        discountAmount: data.discountAmount,
        imageUrl: data.imageUrl,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as ManualDiscount;
    });

    // Ordenar por fecha de creación (más recientes primero)
    return allDiscounts.sort((a, b) => {
      const dateA = a.createdAt || new Date(0);
      const dateB = b.createdAt || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error("Error al obtener descuentos manuales:", error);
    throw error;
  }
};

// ===== VERIFICACIÓN DE ADMIN =====

export const checkAdminRole = async (userId: string): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return false;

    const userData = userSnap.data();
    return userData.role === "admin";
  } catch (error) {
    console.error("Error al verificar rol de admin:", error);
    return false;
  }
};
