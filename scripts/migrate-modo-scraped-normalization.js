/* eslint-disable no-console */
/**
 * Normaliza descuentos ya guardados relacionados a MODO:
 * - origin: "MODO" -> "Modo"
 * - category: ids técnicos ("general", "food", etc.) -> nombre visible ("General", "Alimentos", etc.)
 * - availableCredentials[].brand: intenta inferir Visa/Mastercard/Amex/Diners desde descripción/hints
 *
 * Uso:
 *   node scripts/migrate-modo-scraped-normalization.js --dry-run
 *   node scripts/migrate-modo-scraped-normalization.js
 */

const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const contents = fs.readFileSync(envPath, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const CATEGORY_ID_TO_NAME = {
  food: "Alimentos",
  fashion: "Moda",
  technology: "Tecnología",
  home: "Hogar",
  sports: "Deportes",
  beauty: "Belleza",
  automotive: "Automóviles",
  entertainment: "Entretenimiento",
  health: "Salud",
  education: "Educación",
  wallets: "Billeteras",
  general: "General",
};

function initAdmin() {
  loadLocalEnv();
  const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      ...(projectId ? { projectId } : {}),
    });
  }
  return admin.firestore();
}

function inferBrandsFromText(rawText) {
  const text = String(rawText || "").toLowerCase();
  const brands = [];
  if (/\bvisa\b/.test(text)) brands.push("Visa");
  if (/\bmaster\b|\bmastercard\b/.test(text)) brands.push("Mastercard");
  if (/\bamex\b|\bamerican express\b/.test(text)) brands.push("American Express");
  if (/\bdiners\b/.test(text)) brands.push("Diners Club");
  if (/\bcabal\b/.test(text)) brands.push("Cabal");
  return brands;
}

function extractSlugFromDoc(data) {
  const fromLinkUrl = String(data.linkUrl || data.url || "");
  const match = fromLinkUrl.match(/promos\/([^/?#]+)/i);
  if (match?.[1]) return match[1];
  const directSlug = String(data.slug || "").trim();
  return directSlug || null;
}

async function fetchLandingTermsTextBySlug(slug) {
  if (!slug) return "";
  try {
    const response = await fetch(
      `https://rewards-handler.playdigital.com.ar/landing/${slug}?source=web_modo`
    );
    if (!response.ok) return "";
    const payload = await response.json();
    const contents = payload?.sections?.tyc?.contents;
    const tycText = Array.isArray(contents)
      ? contents
      .map((item) => String(item?.description || ""))
      .join(" ")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      : "";
    const fullPayloadText = JSON.stringify(payload);
    return `${tycText} ${fullPayloadText}`.trim();
  } catch {
    return "";
  }
}

function normalizeCategory(rawCategory) {
  const category = String(rawCategory || "").trim();
  if (!category) return null;
  if (CATEGORY_ID_TO_NAME[category]) return CATEGORY_ID_TO_NAME[category];
  return null;
}

function shouldConsiderModoDiscount(data) {
  const origin = String(data.origin || "").toLowerCase();
  const url = String(data.url || "").toLowerCase();
  const linkUrl = String(data.linkUrl || "").toLowerCase();
  const type = String(data.type || "").toLowerCase();
  return (
    origin.includes("modo") ||
    url.includes("promoshub.modo.com.ar") ||
    linkUrl.includes("promoshub.modo.com.ar") ||
    type === "scraped"
  );
}

async function migrate() {
  const isDryRun = process.argv.includes("--dry-run");
  const db = initAdmin();
  const snapshot = await db.collection("discounts").get();

  let scanned = 0;
  let affected = 0;
  let updated = 0;
  let originUpdated = 0;
  let categoryUpdated = 0;
  let credentialBrandUpdated = 0;
  let landingLookups = 0;
  let landingHits = 0;

  let batch = db.batch();
  let batchOps = 0;
  const flush = async () => {
    if (isDryRun || batchOps === 0) return;
    await batch.commit();
    batch = db.batch();
    batchOps = 0;
  };

  for (const docSnap of snapshot.docs) {
    scanned += 1;
    const data = docSnap.data() || {};
    if (!shouldConsiderModoDiscount(data)) continue;

    const updateData = {};

    const currentOrigin = String(data.origin || "").trim();
    if (currentOrigin && currentOrigin.toLowerCase() === "modo" && currentOrigin !== "Modo") {
      updateData.origin = "Modo";
      originUpdated += 1;
    }

    const normalizedCategory = normalizeCategory(data.category);
    if (normalizedCategory && normalizedCategory !== data.category) {
      updateData.category = normalizedCategory;
      categoryUpdated += 1;
    }

    const credentials = Array.isArray(data.availableCredentials) ? data.availableCredentials : [];
    if (credentials.length > 0) {
      const hasOtherBrand = credentials.some((cred) => String(cred?.brand || "") === "Otro");
      const hintText = [
        data.description || "",
        ...(Array.isArray(data.credentialHints) ? data.credentialHints : []),
      ].join(" ");
      let inferredBrands = inferBrandsFromText(hintText);
      if (inferredBrands.length === 0 && hasOtherBrand) {
        const slug = extractSlugFromDoc(data);
        if (slug) {
          landingLookups += 1;
          const landingText = await fetchLandingTermsTextBySlug(slug);
          if (landingText) {
            const landingBrands = inferBrandsFromText(landingText);
            if (landingBrands.length > 0) {
              inferredBrands = landingBrands;
              landingHits += 1;
            }
          }
        }
      }
      if (inferredBrands.length > 0) {
        const nextCredentials = credentials.map((cred, index) => {
          const currentBrand = cred?.brand;
          if (currentBrand && currentBrand !== "Otro") return cred;
          const brand = inferredBrands[index % inferredBrands.length];
          return {
            ...cred,
            brand,
          };
        });

        const changed = nextCredentials.some(
          (cred, idx) => (credentials[idx]?.brand || "") !== (cred?.brand || "")
        );
        if (changed) {
          updateData.availableCredentials = nextCredentials;
          credentialBrandUpdated += 1;
        }
      }
    }

    if (Object.keys(updateData).length === 0) continue;

    affected += 1;
    if (!isDryRun) {
      batch.update(docSnap.ref, {
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      batchOps += 1;
      updated += 1;
      if (batchOps >= 450) {
        await flush();
      }
    } else {
      updated += 1;
      console.log(`[DRY-RUN] ${docSnap.id}`, updateData);
    }
  }

  await flush();

  console.log(isDryRun ? "Dry-run completado" : "Migración completada");
  console.log(`- Documentos escaneados: ${scanned}`);
  console.log(`- Documentos afectados: ${affected}`);
  console.log(`- Documentos actualizados: ${updated}`);
  console.log(`- Origin normalizado: ${originUpdated}`);
  console.log(`- Categoría normalizada: ${categoryUpdated}`);
  console.log(`- Marca de credencial ajustada: ${credentialBrandUpdated}`);
  console.log(`- Lookups a landing de MODO: ${landingLookups}`);
  console.log(`- Marcas inferidas desde landing: ${landingHits}`);
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error en migración MODO:", error);
    if (
      String(error?.message || "").toLowerCase().includes("application default credentials") ||
      String(error?.message || "").toLowerCase().includes("could not load the default credentials")
    ) {
      console.error(
        "Configura GOOGLE_APPLICATION_CREDENTIALS con la ruta al JSON de service account y vuelve a ejecutar."
      );
    }
    process.exit(1);
  });
