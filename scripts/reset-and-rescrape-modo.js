/* eslint-disable no-console */
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
    if (!(key in process.env)) process.env[key] = value;
  }
}

function initAdmin() {
  loadLocalEnv();
  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      ...(projectId ? { projectId } : {}),
    });
  }
  return admin.firestore();
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

function parseExpirationDate(raw) {
  if (!raw) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

function extractBrands(rawText) {
  const text = String(rawText || "").toLowerCase();
  const brands = [];
  if (/\bvisa\b/.test(text)) brands.push("Visa");
  if (/\bmaster\b|\bmastercard\b/.test(text)) brands.push("Mastercard");
  if (/\bamex\b|\bamerican express\b/.test(text)) brands.push("American Express");
  if (/\bdiners\b/.test(text)) brands.push("Diners Club");
  if (/\bcabal\b/.test(text)) brands.push("Cabal");
  return brands;
}

async function fetchModoItems() {
  const maxTotalArg = Number(process.argv.find((arg) => arg.startsWith("--maxTotal="))?.split("=")[1]);
  const maxTotal = Number.isFinite(maxTotalArg) && maxTotalArg > 0 ? maxTotalArg : 900;
  const response = await fetch("http://localhost:3000/api/scraping/modo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ limit: 120, maxTotal }),
  });
  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Falló /api/scraping/modo (${response.status}): ${payload}`);
  }
  const payload = await response.json();
  return payload.items || [];
}

async function clearDiscountsCollection(db) {
  const snapshot = await db.collection("discounts").get();
  let deleted = 0;
  let batch = db.batch();
  let ops = 0;
  for (const docSnap of snapshot.docs) {
    batch.delete(docSnap.ref);
    ops += 1;
    deleted += 1;
    if (ops >= 450) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }
  if (ops > 0) await batch.commit();
  return deleted;
}

function normalizeItem(item) {
  const title = String(item.title || item.name || "Promoción MODO").trim();
  const categoryId = String(item.category || "general").trim();
  const category = CATEGORY_ID_TO_NAME[categoryId] || "General";
  const banks = Array.isArray(item.membershipRequired) ? item.membershipRequired : [];
  const hintsText = `${item.description || ""} ${Array.isArray(item.credentialHints) ? item.credentialHints.join(" ") : ""}`;
  const brands = Array.from(
    new Set([
      ...(item.cardBrandHint ? [item.cardBrandHint] : []),
      ...extractBrands(hintsText),
    ])
  );
  const resolvedBrands = brands.length > 0 ? brands : ["Otro"];
  const inferredCredentials = banks.flatMap((bank) =>
    resolvedBrands.map((brand) => ({
      bank,
      type: item.cardTypeHint || "Crédito",
      brand,
      level: item.cardLevelHint || "Classic",
    }))
  );
  const comboCredentials = Array.isArray(item.credentialCombos)
    ? item.credentialCombos.map((combo) => ({
        bank: combo.bank,
        type: combo.type,
        brand: combo.brand,
        level: combo.level || item.cardLevelHint || "Classic",
      }))
    : [];
  const availableCredentials = Array.from(
    new Map(
      [...comboCredentials, ...inferredCredentials].map((credential) => [
        `${credential.bank}::${credential.type}::${credential.brand}::${credential.level}`,
        credential,
      ])
    ).values()
  );

  return {
    title,
    name: title,
    origin: "Modo",
    category,
    expirationDate: admin.firestore.Timestamp.fromDate(
      parseExpirationDate(item.expirationDate)
    ),
    description: String(item.description || "Promoción disponible en MODO").trim(),
    ...(typeof item.discountPercentage === "number"
      ? { discountPercentage: item.discountPercentage }
      : {}),
    ...(typeof item.discountAmount === "number" ? { discountAmount: item.discountAmount } : {}),
    ...(typeof item.installments === "number" ? { installments: item.installments } : {}),
    ...(item.terms ? { terms: item.terms } : {}),
    ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
    ...(item.linkUrl ? { url: item.linkUrl } : {}),
    isVisible: true,
    availableCredentials,
    availableMemberships: [],
    membershipRequired: [],
    bancos: banks,
    createdAt: admin.firestore.Timestamp.now(),
    updatedAt: admin.firestore.Timestamp.now(),
    status: "active",
    type: "scraped",
    approvalStatus: "pending",
    source: "scraping",
  };
}

async function saveScrapedDiscounts(db, items) {
  const dedupe = new Set();
  let saved = 0;
  let skipped = 0;
  let failed = 0;
  let skippedDuplicate = 0;
  let skippedNoEvidence = 0;
  let batch = db.batch();
  let batchOps = 0;
  const flush = async () => {
    if (batchOps === 0) return;
    await batch.commit();
    batch = db.batch();
    batchOps = 0;
  };

  for (const item of items) {
    const key = `${item.origin || "Modo"}::${item.linkUrl || ""}::${item.terms || ""}::${item.discountAmount || ""}::${item.discountPercentage || ""}`.toLowerCase();
    if (dedupe.has(key)) {
      skipped += 1;
      skippedDuplicate += 1;
      continue;
    }
    dedupe.add(key);
    try {
      const normalized = normalizeItem(item);
      const hasEvidence =
        (normalized.bancos && normalized.bancos.length > 0) ||
        (normalized.availableCredentials && normalized.availableCredentials.length > 0);
      if (!hasEvidence) {
        skipped += 1;
        skippedNoEvidence += 1;
        continue;
      }
      const docRef = db.collection("discounts").doc();
      batch.set(docRef, normalized);
      batchOps += 1;
      saved += 1;
      if (batchOps >= 400) {
        await flush();
      }
    } catch {
      failed += 1;
    }
  }
  await flush();
  return { saved, skipped, failed, skippedDuplicate, skippedNoEvidence };
}

async function run() {
  const db = initAdmin();
  console.log("1) Eliminando descuentos actuales...");
  const deleted = await clearDiscountsCollection(db);
  console.log(`- Eliminados: ${deleted}`);

  console.log("2) Scrapeando MODO con formato nuevo...");
  const items = await fetchModoItems();
  console.log(`- Items scrapeados detectados: ${items.length}`);

  console.log("3) Guardando descuentos scrapeados...");
  const result = await saveScrapedDiscounts(db, items);
  console.log("Proceso completado:");
  console.log(`- Guardados: ${result.saved}`);
  console.log(`- Omitidos: ${result.skipped}`);
  console.log(`  - Duplicados: ${result.skippedDuplicate}`);
  console.log(`  - Sin evidencia credencial/banco: ${result.skippedNoEvidence}`);
  console.log(`- Fallidos: ${result.failed}`);
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error en reset + rescrape:", error);
    process.exit(1);
  });

