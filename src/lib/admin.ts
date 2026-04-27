import { getCategoryById, getCategoryByName, isValidCategory } from "@/constants/categories";
import {
  addDoc,
  collection,
  db,
  deleteField,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  updateDoc,
} from "@/lib/firebase/firebase";
import {
  ManualDiscount,
  ScrapedDiscountInput,
  ScrapingExecutionResult,
  ScrapingScript,
} from "@/types/admin";
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
    const expirationDate = discount.expirationDate
      ? typeof discount.expirationDate === "string"
        ? Timestamp.fromDate(new Date(discount.expirationDate))
        : Timestamp.fromDate(discount.expirationDate)
      : Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    const discountData = {
      ...discount,
      isVisible: discount.isVisible ?? true, // Por defecto visible
      expirationDate,
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
    const expirationDate = discount.expirationDate
      ? typeof discount.expirationDate === "string"
        ? Timestamp.fromDate(new Date(discount.expirationDate))
        : Timestamp.fromDate(discount.expirationDate)
      : Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    const discountData = {
      ...discount,
      expirationDate,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: "active",
      type: "scraped",
      approvalStatus: "pending", // Los descuentos de scraping deben estar pendientes de aprobación
      source: "scraping",
    };

    const docRef = await addDoc(collection(db, "discounts"), discountData);
    return docRef.id;
  } catch (error) {
    console.error("Error al crear descuento manual:", error);
    throw error;
  }
};

const parseExpirationDate = (raw?: string): Date => {
  if (!raw) {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  const slashMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{2,4})$/);
  if (slashMatch) {
    const day = Number.parseInt(slashMatch[1], 10);
    const month = Number.parseInt(slashMatch[2], 10) - 1;
    const yearShort = Number.parseInt(slashMatch[3], 10);
    const year = yearShort < 100 ? 2000 + yearShort : yearShort;
    const parsed = new Date(year, month, day);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
};

const extractCardBrandsFromHintText = (
  hintText: string
): Array<
  "Visa" | "Mastercard" | "American Express" | "Diners Club" | "Cabal" | "Otro"
> => {
  const text = hintText.toLowerCase();
  const brands: Array<
    "Visa" | "Mastercard" | "American Express" | "Diners Club" | "Cabal" | "Otro"
  > = [];
  if (/\bvisa\b/.test(text)) brands.push("Visa");
  if (/\bmaster\b|\bmastercard\b/.test(text)) brands.push("Mastercard");
  if (/\bamex\b|\bamerican express\b/.test(text)) brands.push("American Express");
  if (/\bdiners\b/.test(text)) brands.push("Diners Club");
  if (/\bcabal\b/.test(text)) brands.push("Cabal");
  return brands;
};

export const normalizeScrapedDiscountInput = (
  raw: ScrapedDiscountInput
): Omit<ManualDiscount, "id" | "createdAt" | "updatedAt"> => {
  const title = (raw.title || raw.name || "Promoción MODO").trim();
  const description = (raw.description || "Promoción disponible en MODO").trim();
  const rawCategory = (raw.category || "").trim();
  const categoryById = rawCategory ? getCategoryById(rawCategory) : undefined;
  const categoryByName = rawCategory ? getCategoryByName(rawCategory) : undefined;
  const category = categoryById?.name || categoryByName?.name || "General";
  const discountPercentage =
    typeof raw.discountPercentage === "number" &&
    Number.isFinite(raw.discountPercentage)
      ? raw.discountPercentage
      : undefined;
  const discountAmount =
    typeof raw.discountAmount === "number" && Number.isFinite(raw.discountAmount)
      ? raw.discountAmount
      : undefined;

  const credentialBanks =
    raw.membershipRequired && raw.membershipRequired.length > 0
      ? raw.membershipRequired
      : [];

  const hintsText = (raw.credentialHints || []).join(" ");
  const brandHintsFromText = extractCardBrandsFromHintText(hintsText);
  const brandCandidates = Array.from(
    new Set([
      ...(raw.cardBrandHint ? [raw.cardBrandHint] : []),
      ...brandHintsFromText,
    ])
  );
  const resolvedBrands = brandCandidates.length > 0 ? brandCandidates : ["Otro"];

  const credentials = credentialBanks.flatMap((bank) =>
    resolvedBrands.map((brand) => ({
      bank,
      type: raw.cardTypeHint || "Crédito",
      brand,
      level: raw.cardLevelHint || "Classic",
    }))
  );
  const mergedCredentials =
    raw.credentialCombos && raw.credentialCombos.length > 0
      ? Array.from(
          new Map(
            [
              ...raw.credentialCombos.map((combo) => ({
                bank: combo.bank,
                type: combo.type,
                brand: combo.brand,
                level: combo.level || raw.cardLevelHint || "Classic",
              })),
              ...credentials,
            ].map((credential) => [
              `${credential.bank}::${credential.type}::${credential.brand}::${credential.level}`,
              credential,
            ])
          ).values()
        )
      : credentials;

  return {
    title,
    origin: "Modo",
    category: isValidCategory(category) ? category : "General",
    expirationDate: parseExpirationDate(raw.expirationDate),
    description,
    discountPercentage,
    ...(typeof discountAmount === "number" ? { discountAmount } : {}),
    ...(typeof raw.installments === "number" && Number.isFinite(raw.installments)
      ? { installments: raw.installments }
      : {}),
    ...(raw.terms ? { terms: raw.terms } : {}),
    imageUrl: raw.imageUrl,
    url: raw.linkUrl,
    isVisible: true,
    availableCredentials: mergedCredentials,
    // Para MODO (tarjetas), no usar membresías.
    availableMemberships: [],
    membershipRequired: [],
    bancos: credentialBanks,
  };
};

export interface ModoScrapingRunResult extends ScrapingExecutionResult {
  stats: ScrapingExecutionResult["stats"] & {
    totalSaved: number;
    totalFailed: number;
    totalDiscardedNoCredential: number;
  };
}

export const runModoScrapingAndSave = async (
  limit = 40
): Promise<ModoScrapingRunResult> => {
  const response = await fetch("/api/scraping/modo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ limit }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(
      payload?.error || "No se pudo ejecutar scraping de MODO desde la API"
    );
  }

  const execution = payload as ScrapingExecutionResult;
  const dedupeSet = new Set<string>();
  let totalSaved = 0;
  let totalFailed = 0;
  let totalDiscardedNoCredential = 0;
  const warnings = [...(execution.warnings || [])];

  for (const item of execution.items || []) {
    const dedupeKey = `${item.origin || "MODO.com.ar"}::${item.title || item.name || ""}::${item.linkUrl || ""}`.toLowerCase();
    if (dedupeSet.has(dedupeKey)) {
      warnings.push(`Duplicado omitido: ${item.title || item.name || "sin título"}`);
      continue;
    }
    dedupeSet.add(dedupeKey);

    try {
      const hasBankOrCardEvidence =
        (item.membershipRequired && item.membershipRequired.length > 0) ||
        !!item.cardTypeHint ||
        !!item.cardBrandHint;

      if (!hasBankOrCardEvidence) {
        totalDiscardedNoCredential++;
        warnings.push(
          `Descartado por falta de datos de tarjeta/banco: "${
            item.title || item.name || "promoción"
          }"`
        );
        continue;
      }

      const normalized = normalizeScrapedDiscountInput(item);
      await createScrapedDiscount(normalized);
      totalSaved++;
    } catch (error) {
      totalFailed++;
      warnings.push(
        `No se pudo guardar "${item.title || item.name || "promoción"}": ${
          error instanceof Error ? error.message : "error desconocido"
        }`
      );
    }
  }

  return {
    ...execution,
    warnings,
    stats: {
      ...execution.stats,
      totalSaved,
      totalFailed,
      totalDiscardedNoCredential,
    },
  };
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
      // Unificación de schema: dejar un solo campo de expiración.
      updateData.validUntil = deleteField();
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
    const allDiscounts = allSnapshot.docs
      .filter((doc) => {
        const data = doc.data();
        const type = data.type;
        const approvalStatus = data.approvalStatus;
        
        // Solo incluir descuentos manuales aprobados
        // Excluir descuentos de scraping (type === "scraped") que estén pendientes
        // Incluir descuentos con type === "manual" o sin type pero aprobados
        if (type === "scraped" && approvalStatus === "pending") {
          return false; // Excluir descuentos de scraping pendientes
        }
        
        // Incluir descuentos manuales o descuentos aprobados
        return type === "manual" || approvalStatus === "approved";
      })
      .map((doc) => {
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
