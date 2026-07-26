import { getCategoryById, getCategoryByName, isValidCategory } from "@/constants/categories";
import { authHeader } from "@/lib/data/auth-header";
import { getRole } from "@/lib/supabase/profiles";
import { supabase } from "@/lib/supabase/client";
import {
  fetchAllDiscountDocs,
  insertDiscount,
  updateDiscountRow,
} from "@/lib/supabase/discounts-data";
import { parseDateDdMmYyyy, parseIsoYmdLocal } from "@/lib/date-ar";
import {
  ManualDiscount,
  ScrapedDiscountInput,
  ScrapingExecutionResult,
  ScrapingScript,
} from "@/types/admin";

// ===== GESTIÓN DE SCRIPTS DE SCRAPING (Supabase: public.scraping_scripts) =====

type ScrapingScriptRow = {
  id: string;
  site_name: string;
  script: string | null;
  frequency: ScrapingScript["frequency"];
  is_active: boolean;
  last_executed: string | null;
  created_at: string;
  updated_at: string;
};

const rowToScrapingScript = (row: ScrapingScriptRow): ScrapingScript => ({
  id: row.id,
  siteName: row.site_name,
  script: row.script ?? "",
  frequency: row.frequency,
  isActive: row.is_active,
  lastExecuted: row.last_executed ? new Date(row.last_executed) : undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

/** camelCase parcial -> columnas snake_case de scraping_scripts. */
const scriptToRow = (
  s: Partial<Omit<ScrapingScript, "id" | "createdAt" | "updatedAt">>
): Record<string, unknown> => {
  const row: Record<string, unknown> = {};
  if (s.siteName !== undefined) row.site_name = s.siteName;
  if (s.script !== undefined) row.script = s.script;
  if (s.frequency !== undefined) row.frequency = s.frequency;
  if (s.isActive !== undefined) row.is_active = s.isActive;
  if (s.lastExecuted !== undefined)
    row.last_executed = s.lastExecuted ? s.lastExecuted.toISOString() : null;
  return row;
};

export const getScrapingScripts = async (): Promise<ScrapingScript[]> => {
  const { data, error } = await supabase
    .from("scraping_scripts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error al obtener scripts de scraping:", error);
    throw error;
  }
  return (data ?? []).map((r) => rowToScrapingScript(r as ScrapingScriptRow));
};

export const createScrapingScript = async (
  script: Omit<ScrapingScript, "id" | "createdAt" | "updatedAt">
): Promise<string> => {
  const { data, error } = await supabase
    .from("scraping_scripts")
    .insert(scriptToRow(script))
    .select("id")
    .single();
  if (error) {
    console.error("Error al crear script de scraping:", error);
    throw error;
  }
  return data.id as string;
};

export const updateScrapingScript = async (
  id: string,
  updates: Partial<ScrapingScript>
): Promise<void> => {
  const { error } = await supabase
    .from("scraping_scripts")
    .update({ ...scriptToRow(updates), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("Error al actualizar script de scraping:", error);
    throw error;
  }
};

export const deleteScrapingScript = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("scraping_scripts")
    .delete()
    .eq("id", id);
  if (error) {
    console.error("Error al eliminar script de scraping:", error);
    throw error;
  }
};

export const executeScrapingScript = async (id: string): Promise<void> => {
  try {
    // Obtener el script
    const { data: scriptRow, error: readError } = await supabase
      .from("scraping_scripts")
      .select("script")
      .eq("id", id)
      .maybeSingle();
    if (readError) throw readError;
    if (!scriptRow) {
      throw new Error("Script no encontrado");
    }

    const scriptCode = scriptRow.script;

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

    // Si el script retorna descuentos, guardarlos como pendientes de aprobación
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

          await insertDiscount({
            ...discountData,
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
    await updateScrapingScript(id, { lastExecuted: new Date() });
  } catch (error) {
    console.error("Error al ejecutar script de scraping:", error);
    throw error;
  }
};

// ===== GESTIÓN DE DESCUENTOS MANUALES =====

/** Fecha de expiración por defecto: 30 días desde ahora. */
const defaultExpiration = () =>
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

/** Normaliza expirationDate (string ISO | Date | ausente) a Date. */
const resolveExpiration = (raw?: string | Date): Date => {
  if (!raw) return defaultExpiration();
  return typeof raw === "string" ? new Date(raw) : raw;
};

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

    return await insertDiscount({
      ...discount,
      isVisible: discount.isVisible ?? true, // Por defecto visible
      expirationDate: resolveExpiration(discount.expirationDate),
      status: "active",
      type: "manual",
      approvalStatus: "approved", // Los descuentos manuales se aprueban automáticamente
    });
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

    return await insertDiscount({
      ...discount,
      expirationDate: resolveExpiration(discount.expirationDate),
      status: "active",
      type: "scraped",
      approvalStatus: "pending", // Los descuentos de scraping deben estar pendientes de aprobación
      source: "scraping",
    });
  } catch (error) {
    console.error("Error al crear descuento scrapeado:", error);
    throw error;
  }
};

const parseExpirationDate = (raw?: string): Date => {
  if (!raw) {
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  const trimmed = raw.trim();

  const fromIsoYmd = parseIsoYmdLocal(trimmed);
  if (fromIsoYmd) return fromIsoYmd;

  const fromDdMm = parseDateDdMmYyyy(trimmed);
  if (fromDdMm) return fromDdMm;

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
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

  const banksFromCombos =
    Array.isArray(raw.credentialCombos) && raw.credentialCombos.length > 0
      ? Array.from(
          new Set(
            raw.credentialCombos
              .map((c) => (typeof c.bank === "string" ? c.bank.trim() : ""))
              .filter((b) => b.length > 0)
          )
        )
      : [];
  const credentialBanks =
    raw.membershipRequired && raw.membershipRequired.length > 0
      ? raw.membershipRequired
      : banksFromCombos;

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

/** Tope de promos por ejecución desde el panel (evita timeouts en servidor y en el navegador). */
export const MODO_ADMIN_SCRAPE_MAX_TOTAL = 350;

export type RunModoScrapingOptions = {
  limit?: number;
  maxTotal?: number;
};

function resolveModoScrapeRequest(
  options: RunModoScrapingOptions | number | undefined
): { limit: number; maxTotal: number } {
  if (typeof options === "number") {
    return { limit: options, maxTotal: MODO_ADMIN_SCRAPE_MAX_TOTAL };
  }
  const o = options || {};
  return {
    limit: Number.isFinite(o.limit) && (o.limit as number) > 0 ? (o.limit as number) : 120,
    maxTotal:
      Number.isFinite(o.maxTotal) && (o.maxTotal as number) > 0
        ? Math.min(o.maxTotal as number, 20000)
        : MODO_ADMIN_SCRAPE_MAX_TOTAL,
  };
}

export const runModoScrapingAndSave = async (
  options?: RunModoScrapingOptions | number
): Promise<ModoScrapingRunResult> => {
  const { limit, maxTotal } = resolveModoScrapeRequest(options);
  const response = await fetch("/api/scraping/modo/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(await authHeader()),
    },
    body: JSON.stringify({ limit, maxTotal }),
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
        (Array.isArray(item.credentialCombos) && item.credentialCombos.length > 0) ||
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
    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: new Date(),
    };

    if (updates.expirationDate) {
      updateData.expirationDate = resolveExpiration(updates.expirationDate);
    }

    await updateDiscountRow(id, updateData);
  } catch (error) {
    console.error("Error al actualizar descuento manual:", error);
    throw error;
  }
};

export const getManualDiscounts = async (): Promise<ManualDiscount[]> => {
  try {
    // Obtener todos los descuentos para mostrar (RLS deja al admin ver todo)
    const allSnapshot = await fetchAllDiscountDocs();
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
          expirationDate: data.expirationDate?.toDate?.() || new Date(),
          description: data.description || "Sin descripción",
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
    const role = await getRole(userId);
    return role === "admin";
  } catch (error) {
    console.error("Error verificando rol de admin:", error);
    return false;
  }
};
