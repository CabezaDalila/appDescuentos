import type { ScrapedDiscountInput, ScrapingExecutionResult } from "@/types/admin";
import type { NextApiRequest, NextApiResponse } from "next";

const MODO_BASE_URL = "https://promoshub.modo.com.ar";
const REWARDS_BASE_URL = "https://rewards-handler.playdigital.com.ar";
const DEFAULT_LIMIT = 120;
const DEFAULT_MAX_TOTAL = 5000;

function parseFirstNumber(raw: string): number | undefined {
  const match = raw.match(/(\d+)/);
  if (!match) return undefined;
  return Number.parseInt(match[1], 10);
}

function parseInstallments(raw: string): number | undefined {
  const match = raw.match(/(\d+)\s*(cuotas|csi)/i);
  if (!match) return undefined;
  return Number.parseInt(match[1], 10);
}

function normalizeMoneyNumber(raw: string): number | undefined {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  return Number.parseInt(digits, 10);
}

function detectCapPeriod(rawText: string): string | undefined {
  const text = rawText.toLowerCase();
  if (/por transacci[oó]n|por operaci[oó]n|por pago/.test(text)) return "por pago";
  if (/semanal|por semana/.test(text)) return "semanal";
  if (/mensual|por mes/.test(text)) return "mensual";
  if (/diari[oa]|por d[ií]a/.test(text)) return "diario";
  if (/por usuario/.test(text)) return "por usuario";
  return undefined;
}

function extractCapInfo(rawText: string): { amount?: number; summary?: string } {
  const text = rawText || "";
  if (/sin tope/i.test(text)) {
    return { amount: undefined, summary: "Sin tope de reintegro" };
  }

  const capMatch =
    text.match(/tope(?:\s+m[aá]ximo)?(?:\s+de\s+reintegro)?[^$\d]{0,25}\$?\s*([\d\.\,]+)/i) ||
    text.match(/tope[^$\d]{0,10}([\d\.\,]+)/i);

  const amount = capMatch ? normalizeMoneyNumber(capMatch[1]) : undefined;
  if (!amount) return {};

  const period = detectCapPeriod(text);
  const summary = `Tope de reintegro: $${amount.toLocaleString("es-AR")}${
    period ? ` ${period}` : ""
  }`;
  return { amount, summary };
}

function pickCategory(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  if (/super|carrefour|coto|jumbo|disco|vea|chango|toledo|maxiconsumo|vital/.test(text)) return "food";
  if (/farmacia|farma|perfume|belleza|cosm[eé]tica/.test(text)) return "beauty";
  if (/combustible|nafta|ypf|shell|axion/.test(text)) return "automotive";
  if (/indumentaria|ropa|zapatilla|moda|fashion/.test(text)) return "fashion";
  if (/salud|cl[ií]nica|laboratorio/.test(text)) return "health";
  return "general";
}

const BANK_ALIASES: Array<{ canonical: string; patterns: RegExp[] }> = [
  { canonical: "Macro", patterns: [/\bmacro\b/i] },
  { canonical: "Galicia", patterns: [/\bgalicia\b/i] },
  { canonical: "BBVA", patterns: [/\bbbva\b/i, /\bfranc[eé]s\b/i] },
  { canonical: "Hipotecario", patterns: [/\bhipotecario\b/i] },
  { canonical: "Credicoop", patterns: [/\bcredicoop\b/i] },
  { canonical: "Comafi", patterns: [/\bcomafi\b/i] },
  { canonical: "Supervielle", patterns: [/\bsupervielle\b/i] },
  { canonical: "Santander", patterns: [/\bsantander\b/i, /\br[ií]o\b/i] },
  { canonical: "Nación", patterns: [/\bbna\b/i, /\bnaci[oó]n\b/i] },
  { canonical: "Ciudad", patterns: [/\bciudad\b/i] },
  { canonical: "Buepp", patterns: [/\bbuepp\b/i] },
  { canonical: "Provincia", patterns: [/\bprovincia\b/i, /\bbapro\b/i] },
];

function extractBanks(rawText: string): string[] {
  const normalized = rawText.toLowerCase();
  return BANK_ALIASES.filter((bank) =>
    bank.patterns.some((regex) => regex.test(normalized))
  ).map((bank) => bank.canonical);
}

function extractCardType(rawText: string): "Crédito" | "Débito" | undefined {
  if (/\bd[eé]bito\b/i.test(rawText)) return "Débito";
  if (/\bcr[eé]dito\b/i.test(rawText)) return "Crédito";
  return undefined;
}

function extractCardBrand(
  rawText: string
): "Visa" | "Mastercard" | "American Express" | "Diners Club" | "Cabal" | "Otro" | undefined {
  if (/\bvisa\b/i.test(rawText)) return "Visa";
  if (/\bmaster\b|\bmastercard\b/i.test(rawText)) return "Mastercard";
  if (/\bamex\b|\bamerican express\b/i.test(rawText)) return "American Express";
  if (/\bdiners\b/i.test(rawText)) return "Diners Club";
  if (/\bcabal\b/i.test(rawText)) return "Cabal";
  return undefined;
}

function extractCardLevel(
  rawText: string
):
  | "Classic"
  | "Gold"
  | "Platinum"
  | "Black"
  | "Signature"
  | "Infinite"
  | "Internacional"
  | "Nacional"
  | undefined {
  if (/\binfinite\b/i.test(rawText)) return "Infinite";
  if (/\bsignature\b/i.test(rawText)) return "Signature";
  if (/\bblack\b/i.test(rawText)) return "Black";
  if (/\bplatinum\b/i.test(rawText)) return "Platinum";
  if (/\bgold\b/i.test(rawText)) return "Gold";
  if (/\bclassic\b/i.test(rawText)) return "Classic";
  if (/\binternacional\b/i.test(rawText)) return "Internacional";
  if (/\bnacional\b/i.test(rawText)) return "Nacional";
  return undefined;
}
interface RewardCard {
  slug?: string;
  source?: string;
  start_date?: string;
  stop_date?: string;
  title?: string;
  short_description?: string;
  search_tags?: string[];
  where?: string;
  content?: {
    row?: Array<{ text?: string }>;
    image?: {
      primary_image?: string;
      secondary_image?: string;
    };
  };
}

interface LandingTextResponse {
  promotion?: {
    start_date?: string;
    stop_date?: string;
  };
  sections?: {
    tyc?: {
      contents?: Array<{ description?: string }>;
    };
  };
  card?: {
    content?: {
      row?: Array<{ text?: string }>;
      image?: {
        primary_image?: string;
        secondary_image?: string;
      };
    };
  };
  trigger_params?: {
    cap_period?: string;
    cap_amount_period?: number;
    cap_amount?: number;
    pct_promo_value?: number;
    credit_promo_value?: number;
    debit_promo_value?: number;
    credit_list?: string[];
    debit_list?: string[];
    installments?: Array<{
      type?: string;
      number?: number;
    }>;
  };
  installments?: Array<{
    type?: string;
    number?: number;
  }>;
}

function buildQueryString(query: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

function stripHtml(raw: string): string {
  return raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

/** Año de 2 dígitos como 20xx (vigencias de promos actuales). */
function expandTwoDigitYear(y: number): number {
  if (y >= 100) return y;
  return 2000 + y;
}

function buildValidLocalDate(day: number, month: number, year: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(year, month - 1, day);
  if (
    Number.isNaN(d.getTime()) ||
    d.getFullYear() !== year ||
    d.getMonth() !== month - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

function parseDayMonthYearParts(day: number, month: number, yearPart: number): Date | null {
  const year = expandTwoDigitYear(yearPart);
  return buildValidLocalDate(day, month, year);
}

/** Patrones con alta confianza (fechas de campaña en UI / TyC estructurado). */
const VIGENCIA_STRICT_PATTERNS: RegExp[] = [
  /desde\s+(?:el\s+)?\d{1,2}\/\d{1,2}\s+al\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})/gi,
  /del\s+\d{1,2}\/\d{1,2}\s+al\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})/gi,
  /\bhasta\s+(?:el\s+)?(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/gi,
  /\bvigente\s+hasta\s+(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/gi,
];

/** Último recurso: TyC largo puede contener otras fechas; solo si no hubo match estricto. */
const VIGENCIA_LOOSE_PATTERNS: RegExp[] = [
  /\bvigencia\b[^.]{0,120}?\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/gi,
];

function collectVigenciaEndDates(text: string, patterns: RegExp[]): Date[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  const candidates: Date[] = [];
  for (const re of patterns) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(normalized)) !== null) {
      const day = Number.parseInt(m[1], 10);
      const month = Number.parseInt(m[2], 10);
      const yearPart = Number.parseInt(m[3], 10);
      const d = parseDayMonthYearParts(day, month, yearPart);
      if (d && !Number.isNaN(d.getTime())) candidates.push(d);
    }
  }
  return candidates;
}

function latestDateToIso(dates: Date[]): string | undefined {
  if (dates.length === 0) return undefined;
  const end = new Date(Math.max(...dates.map((d) => d.getTime())));
  const y = end.getFullYear();
  const mo = String(end.getMonth() + 1).padStart(2, "0");
  const da = String(end.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

/**
 * Fin de vigencia desde texto: primero filas de la promo (UI), luego texto completo con
 * patrones estrictos; el patrón suelto "vigencia…" solo al final (evita fechas falsas en TyC).
 */
function resolveExpirationFromVigenciaText(
  rowTexts: string[],
  landingTermsText: string
): string | undefined {
  const rowHaystack = rowTexts.filter(Boolean).join(" · ");
  let dates = collectVigenciaEndDates(rowHaystack, VIGENCIA_STRICT_PATTERNS);
  let iso = latestDateToIso(dates);
  if (iso) return iso;

  const fullHaystack = [...rowTexts, landingTermsText].filter(Boolean).join(" · ");
  dates = collectVigenciaEndDates(fullHaystack, VIGENCIA_STRICT_PATTERNS);
  iso = latestDateToIso(dates);
  if (iso) return iso;

  dates = collectVigenciaEndDates(fullHaystack, VIGENCIA_LOOSE_PATTERNS);
  return latestDateToIso(dates);
}

/** Normaliza stop_date de la API a YYYY-MM-DD (fecha local de calendario). */
function normalizeApiStopDateToIso(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) {
    return t.slice(0, 10);
  }
  const slash = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    const d = parseDayMonthYearParts(
      Number.parseInt(slash[1], 10),
      Number.parseInt(slash[2], 10),
      Number.parseInt(slash[3], 10)
    );
    if (!d) return undefined;
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${mo}-${da}`;
  }
  const parsed = new Date(t);
  if (Number.isNaN(parsed.getTime())) return undefined;
  const y = parsed.getFullYear();
  const mo = String(parsed.getMonth() + 1).padStart(2, "0");
  const da = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

const BRAND_TOKEN_MAP: Record<string, "Visa" | "Mastercard" | "American Express" | "Diners Club" | "Cabal" | "Otro"> = {
  visa: "Visa",
  master: "Mastercard",
  mastercard: "Mastercard",
  amex: "American Express",
  "american express": "American Express",
  diners: "Diners Club",
  cabal: "Cabal",
};

function mapCapPeriodLabel(raw?: string): string | undefined {
  const value = (raw || "").toLowerCase();
  if (value.includes("month")) return "mensual";
  if (value.includes("week")) return "semanal";
  if (value.includes("day")) return "diario";
  if (value.includes("transaction")) return "por pago";
  return undefined;
}

function buildInstallmentsSummary(installments: Array<{ number?: number; type?: string }>): string | undefined {
  const numbers = installments
    .map((item) => item.number)
    .filter((num): num is number => typeof num === "number" && Number.isFinite(num))
    .sort((a, b) => a - b);
  if (numbers.length === 0) return undefined;
  if (numbers.length === 1) return `${numbers[0]} cuota${numbers[0] > 1 ? "s" : ""} sin interés`;
  const rendered = numbers.length === 2
    ? `${numbers[0]} y ${numbers[1]}`
    : `${numbers.slice(0, -1).join(", ")} y ${numbers[numbers.length - 1]}`;
  return `${rendered} cuotas sin interés`;
}

function buildCredentialCombos(
  banks: string[],
  creditList: string[] = [],
  debitList: string[] = [],
  level?: ScrapedDiscountInput["cardLevelHint"]
): NonNullable<ScrapedDiscountInput["credentialCombos"]> {
  const combos: NonNullable<ScrapedDiscountInput["credentialCombos"]> = [];
  for (const bank of banks) {
    for (const token of creditList) {
      const brand = BRAND_TOKEN_MAP[token.toLowerCase()];
      if (!brand) continue;
      combos.push({ bank, type: "Crédito", brand, ...(level ? { level } : {}) });
    }
    for (const token of debitList) {
      const brand = BRAND_TOKEN_MAP[token.toLowerCase()];
      if (!brand) continue;
      combos.push({ bank, type: "Débito", brand, ...(level ? { level } : {}) });
    }
  }
  return combos;
}

async function fetchLandingData(slug?: string): Promise<LandingTextResponse | null> {
  if (!slug) return null;
  try {
    const response = await fetch(`${REWARDS_BASE_URL}/landing/${slug}?source=web_modo`);
    if (!response.ok) return null;
    return (await response.json()) as LandingTextResponse;
  } catch {
    return null;
  }
}

async function toValidItem(card: RewardCard): Promise<ScrapedDiscountInput> {
  let rowTexts = (card.content?.row || [])
    .map((entry) => (entry.text || "").trim())
    .filter(Boolean);
  const title = rowTexts[0] || card.where || card.title || "Promoción MODO";
  const benefitText = rowTexts.find((text) => /%|cuotas|csi|reintegro/i.test(text)) || rowTexts[1] || "";
  const baseDescription = rowTexts.join(" · ") || "Promoción disponible en MODO";
  const categorySignalText = [
    card.title,
    card.where,
    card.short_description,
    ...(card.search_tags || []),
    baseDescription,
  ]
    .filter(Boolean)
    .join(" ");
  let discountPercentage = benefitText.includes("%") ? parseFirstNumber(benefitText) : undefined;
  let installments = /cuotas|csi/i.test(benefitText) ? parseInstallments(benefitText) : undefined;
  const quickTerms = rowTexts.find((text) => /tope|vigencia|d[ií]a|aplica|exclusivo/i.test(text));
  let banks = extractBanks(baseDescription);
  let cardTypeHint = extractCardType(baseDescription);
  let cardBrandHint = extractCardBrand(baseDescription);
  let cardLevelHint = extractCardLevel(baseDescription);
  const landingData = await fetchLandingData(card.slug);
  const landingTermsText = landingData?.sections?.tyc?.contents
    ?.map((content) => stripHtml(content.description || ""))
    .filter(Boolean)
    .join(" ") || "";
  const landingRowTexts = (landingData?.card?.content?.row || [])
    .map((entry) => (entry.text || "").trim())
    .filter(Boolean);
  if (landingRowTexts.length > 0) {
    rowTexts = landingRowTexts;
  }
  if (landingTermsText) {
    const enrichedText = `${baseDescription} ${landingTermsText}`;
    banks = banks.length > 0 ? banks : extractBanks(enrichedText);
    cardTypeHint = cardTypeHint || extractCardType(enrichedText);
    cardBrandHint = cardBrandHint || extractCardBrand(enrichedText);
    cardLevelHint = cardLevelHint || extractCardLevel(enrichedText);
  }
  if (landingData?.trigger_params?.pct_promo_value) {
    discountPercentage = landingData.trigger_params.pct_promo_value;
  } else if (landingData?.trigger_params?.credit_promo_value) {
    discountPercentage = landingData.trigger_params.credit_promo_value;
  } else if (landingData?.trigger_params?.debit_promo_value) {
    discountPercentage = landingData.trigger_params.debit_promo_value;
  }

  const landingInstallments =
    (landingData?.installments && landingData.installments.length > 0
      ? landingData.installments
      : landingData?.trigger_params?.installments) || [];
  const installmentsSummary = buildInstallmentsSummary(landingInstallments);
  if (!installments && landingInstallments.length > 0) {
    installments = Math.max(
      ...landingInstallments
        .map((inst) => inst.number || 0)
        .filter((num) => Number.isFinite(num) && num > 0)
    );
  }

  const enrichedTextForRules = landingTermsText
    ? `${baseDescription} ${landingTermsText}`
    : baseDescription;
  const capInfo = extractCapInfo(enrichedTextForRules);
  const capAmountFromTrigger = landingData?.trigger_params?.cap_amount_period;
  const capPeriodFromTrigger = mapCapPeriodLabel(landingData?.trigger_params?.cap_period);
  const effectiveCapAmount =
    typeof capAmountFromTrigger === "number" && capAmountFromTrigger > 0
      ? capAmountFromTrigger
      : capInfo.amount;
  const effectiveCapSummary =
    typeof capAmountFromTrigger === "number" && capAmountFromTrigger > 0
      ? `Tope de reintegro: $${capAmountFromTrigger.toLocaleString("es-AR")}${
          capPeriodFromTrigger ? ` ${capPeriodFromTrigger}` : ""
        }`
      : capInfo.summary;

  const credentialCombos = buildCredentialCombos(
    banks,
    landingData?.trigger_params?.credit_list || [],
    landingData?.trigger_params?.debit_list || [],
    cardLevelHint
  );
  if (credentialCombos.length > 0) {
    cardTypeHint = credentialCombos[0].type;
    cardBrandHint = credentialCombos[0].brand;
  }

  const keyHighlights = [
    title,
    discountPercentage ? `${discountPercentage}% de reintegro` : benefitText,
    installmentsSummary,
    rowTexts.find((text) => /desde|hasta|vigencia|del\s+\d{1,2}\//i.test(text)),
    effectiveCapSummary,
    rowTexts.find((text) => /exclusivo/i.test(text)),
    banks.length > 0 ? `Con ${banks.join("/")}` : undefined,
  ].filter(Boolean);
  const description = keyHighlights.join(" · ");
  const terms = effectiveCapSummary || installmentsSummary || quickTerms;
  const linkSlug = (card.slug || "").replace(/^\/+/, "");
  const linkUrl = linkSlug ? `${MODO_BASE_URL}/promos/${linkSlug}` : `${MODO_BASE_URL}/promos`;
  const imageUrl =
    landingData?.card?.content?.image?.primary_image ||
    landingData?.card?.content?.image?.secondary_image ||
    card.content?.image?.primary_image ||
    card.content?.image?.secondary_image;
  const fromTextIso = resolveExpirationFromVigenciaText(rowTexts, landingTermsText);
  const apiRaw = landingData?.promotion?.stop_date ?? card.stop_date;
  const apiStr = apiRaw == null ? "" : String(apiRaw).trim();
  const fromApiIso = apiStr ? normalizeApiStopDateToIso(apiStr) : undefined;
  const expirationDate = fromTextIso || fromApiIso || undefined;

  return {
    title,
    name: title,
    origin: "Modo",
    category: pickCategory(title, categorySignalText),
    description,
    discountPercentage,
    discountAmount: effectiveCapAmount,
    installments,
    terms,
    imageUrl,
    linkUrl,
    membershipRequired: banks,
    credentialHints: rowTexts,
    cardTypeHint,
    cardBrandHint,
    cardLevelHint,
    ...(credentialCombos.length > 0 ? { credentialCombos } : {}),
    expirationDate,
  };
}

interface RewardsSlotsResponse {
  data?: { cards?: RewardCard[] };
  metadata?: {
    pagination?: {
      page?: number;
      page_results?: number;
      total_pages?: number;
      total_results?: number;
    };
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const body =
    req.body && typeof req.body === "object" && !Array.isArray(req.body)
      ? (req.body as Record<string, unknown>)
      : {};

  const limitRaw = Number(body.limit);
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : DEFAULT_LIMIT;
  const maxTotalRaw = Number(body.maxTotal);
  const maxTotal =
    Number.isFinite(maxTotalRaw) && maxTotalRaw > 0
      ? Math.min(maxTotalRaw, 20000)
      : DEFAULT_MAX_TOTAL;

  try {
    const warnings: string[] = [];
    const errors: string[] = [];
    const allCards: RewardCard[] = [];
    const dedupeSlugs = new Set<string>();
    let page = 1;
    let totalPages = Number.POSITIVE_INFINITY;
    let safetyCounter = 0;

    while (allCards.length < maxTotal && page <= totalPages && safetyCounter < 500) {
      safetyCounter++;
      const query = buildQueryString({
        limit,
        page,
        source: "web_modo",
      });
      const listResponse = await fetch(`${REWARDS_BASE_URL}/slots?${query}`);

      if (!listResponse.ok) {
        errors.push(`Batch page=${page} respondió ${listResponse.status}`);
        break;
      }

      const payload = (await listResponse.json()) as RewardsSlotsResponse;
      const batchCards = payload.data?.cards || [];
      totalPages = payload.metadata?.pagination?.total_pages || totalPages;

      if (batchCards.length === 0) {
        break;
      }

      for (const card of batchCards) {
        const slugKey = (card.slug || "").trim().toLowerCase();
        if (!slugKey || dedupeSlugs.has(slugKey)) continue;
        dedupeSlugs.add(slugKey);
        allCards.push(card);
      }

      page += 1;
    }

    const cards = allCards.slice(0, maxTotal);
    const items: ScrapedDiscountInput[] = [];
    const BATCH_SIZE = 8;
    for (let index = 0; index < cards.length; index += BATCH_SIZE) {
      const batch = cards.slice(index, index + BATCH_SIZE);
      const mappedBatch = await Promise.all(batch.map((card) => toValidItem(card)));
      items.push(...mappedBatch.filter((item) => item.title && item.description));
    }

    if (items.length === 0) {
      warnings.push("La API devolvió 0 promociones visibles para los filtros actuales.");
    }

    const result: ScrapingExecutionResult = {
      source: "modo",
      stats: {
        totalDetected: cards.length,
        totalValid: items.length,
      },
      items,
      warnings,
      errors: errors.length > 0 ? errors : undefined,
    };

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      error: "Error interno ejecutando scraping de MODO",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
