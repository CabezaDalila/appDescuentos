import { isValidCategory } from "@/constants/categories";
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
} from "@/lib/firebase/firebase";
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
    // Obtener el script
    const scriptDoc = await getDoc(doc(db, "scrapingScripts", id));
    if (!scriptDoc.exists()) {
      throw new Error("Script no encontrado");
    }

    const scriptData = scriptDoc.data();
    const scriptCode = scriptData.script;

    // Ejecutar el script en el contexto del navegador
    let result;
    try {
      // Crear una función que ejecute el script
      const executeScript = new Function("return " + scriptCode);
      result = await executeScript();
    } catch (scriptError) {
      console.error("Error ejecutando el script:", scriptError);
      const errorMessage =
        scriptError instanceof Error
          ? scriptError.message
          : String(scriptError);
      throw new Error(`Error en el script: ${errorMessage}`);
    }

    // Si el script retorna descuentos, guardarlos en Firebase
    if (result && Array.isArray(result)) {
      for (const discountData of result) {
        try {
          // Validar que la categoría sea válida
          if (
            discountData.category &&
            !isValidCategory(discountData.category)
          ) {
            console.warn(
              `Categoría "${discountData.category}" no es válida, usando "general"`
            );
            discountData.category = "general";
          }

          // Guardar el descuento en Firebase como pendiente de aprobación
          await addDoc(collection(db, "discounts"), {
            ...discountData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            status: "active",
            type: "scraped",
            approvalStatus: "pending",
            source: "scraping",
          });
        } catch (discountError) {
          console.error("Error guardando descuento:", discountError);
        }
      }
    }

    // Actualizar la fecha de última ejecución
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

    // Convertir fechas ISO a Timestamps si es necesario
    const discountData = {
      ...discount,
      isVisible: discount.isVisible ?? true, // Por defecto visible
      validUntil: discount.validUntil
        ? typeof discount.validUntil === "string"
          ? Timestamp.fromDate(new Date(discount.validUntil))
          : discount.validUntil
        : Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 días por defecto
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: "active",
      type: "manual",
      approvalStatus: "approved", // Los descuentos manuales se aprueban automáticamente
    };

    const docRef = await addDoc(collection(db, "discounts"), discountData);
    return docRef.id;
  } catch (error) {
    console.error("Error al crear descuento manual:", error);
    throw error;
  }
};

export const createScrapedDiscount = async (
  discount: Omit<ManualDiscount, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  try {
    // Validar que la categoría sea válida
    if (discount.category && !isValidCategory(discount.category)) {
      throw new Error(
        `Categoría "${discount.category}" no es válida. Use una de las categorías predefinidas.`
      );
    }

    // Convertir fechas ISO a Timestamps si es necesario
    const discountData = {
      ...discount,
      validUntil: discount.validUntil
        ? typeof discount.validUntil === "string"
          ? Timestamp.fromDate(new Date(discount.validUntil))
          : discount.validUntil
        : Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 días por defecto
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: "active",
      type: "scraped",
    };

    const docRef = await addDoc(collection(db, "discounts"), discountData);
    return docRef.id;
  } catch (error) {
    console.error("Error al crear descuento manual:", error);
    throw error;
  }
};

export const updateManualDiscount = async (
  id: string,
  updates: Partial<Omit<ManualDiscount, "id" | "createdAt" | "updatedAt">>
): Promise<void> => {
  try {
    // Validar que la categoría sea válida si se está actualizando
    if (updates.category && !isValidCategory(updates.category)) {
      throw new Error(
        `Categoría "${updates.category}" no es válida. Use una de las categorías predefinidas.`
      );
    }

    // Preparar los datos de actualización
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    // Convertir fechas ISO a Timestamps si es necesario
    if (updates.expirationDate) {
      updateData.expirationDate =
        typeof updates.expirationDate === "string"
          ? Timestamp.fromDate(new Date(updates.expirationDate))
          : Timestamp.fromDate(updates.expirationDate);
    }

    const docRef = doc(db, "discounts", id);
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error al actualizar descuento manual:", error);
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
          data.expirationDate?.toDate?.() ||
          data.validUntil?.toDate?.() ||
          (data.expirationDate ? new Date(data.expirationDate) : null) ||
          (data.validUntil ? new Date(data.validUntil) : null) ||
          new Date(),
        description: data.description || data.descripcion || "Sin descripción",
        discountPercentage: data.discountPercentage,
        discountAmount: data.discountAmount,
        imageUrl: data.imageUrl,
        isVisible: data.isVisible ?? true,
        availableCredentials: data.availableCredentials || [],
        availableMemberships: data.availableMemberships || [],
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

    if (!userSnap.exists()) {
      return false;
    }

    const userData = userSnap.data();
    return userData.role === "admin";
  } catch (error) {
    console.error("Error verificando rol de admin:", error);
    return false;
  }
};
