/* eslint-disable no-console */
const admin = require("firebase-admin");
const http = require("http");
const https = require("https");
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

function stripEnvQuotes(value) {
  const v = String(value || "").trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

/**
 * Admin SDK no puede usar las NEXT_PUBLIC_* del cliente: hace falta cuenta de servicio.
 * Opciones (local):
 * - FIREBASE_SERVICE_ACCOUNT_PATH o GOOGLE_APPLICATION_CREDENTIALS = ruta al JSON descargado desde Firebase Console
 * - FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (clave con \n escapados como en Vercel)
 */
function resolveAdminCredential(projectId) {
  const keyPathRaw =
    stripEnvQuotes(process.env.FIREBASE_SERVICE_ACCOUNT_PATH) ||
    stripEnvQuotes(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  if (keyPathRaw) {
    const resolved = path.isAbsolute(keyPathRaw)
      ? keyPathRaw
      : path.resolve(process.cwd(), keyPathRaw);
    if (!fs.existsSync(resolved)) {
      const dir = path.dirname(resolved);
      throw new Error(
        `No existe el archivo de cuenta de servicio:\n  ${resolved}\n\n` +
          "Pasos:\n" +
          "  1) Firebase Console → Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada.\n" +
          "  2) Guardá el JSON exactamente en esa ruta (o cambiá FIREBASE_SERVICE_ACCOUNT_PATH en .env.local).\n" +
          `  3) Si falta la carpeta, creala: ${dir}\n` +
          "  4) El nombre del archivo tiene que coincidir con el de tu variable de entorno."
      );
    }
    const serviceAccount = JSON.parse(fs.readFileSync(resolved, "utf8"));
    return admin.credential.cert(serviceAccount);
  }

  const clientEmail = stripEnvQuotes(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (clientEmail && privateKeyRaw) {
    const privateKey = stripEnvQuotes(privateKeyRaw).replace(/\\n/g, "\n");
    return admin.credential.cert({
      projectId: projectId || process.env.FIREBASE_PROJECT_ID,
      clientEmail,
      privateKey,
    });
  }

  throw new Error(
    "Firebase Admin: no hay credenciales de cuenta de servicio.\n\n" +
      "La app web usa NEXT_PUBLIC_* en el navegador; los scripts de Node necesitan un JSON de service account.\n\n" +
      "1) Firebase Console → Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada (JSON).\n" +
      "2) Guardá el archivo fuera del repo o en una carpeta ignorada por git (ej. secrets/).\n" +
      "3) En .env.local agregá una línea:\n" +
      "   FIREBASE_SERVICE_ACCOUNT_PATH=./secrets/tu-proyecto-firebase-adminsdk.json\n\n" +
      "Alternativa: GOOGLE_APPLICATION_CREDENTIALS con la misma ruta, o FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.\n\n" +
      "Ver: https://firebase.google.com/docs/admin/setup#initialize-sdk"
  );
}

function initAdmin() {
  loadLocalEnv();
  const projectId =
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID;
  if (!admin.apps.length) {
    const credential = resolveAdminCredential(projectId);
    admin.initializeApp({
      credential,
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
  const t = String(raw).trim();
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]);
    const d = Number(iso[3]);
    const parsed = new Date(y, m - 1, d);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const parsed = new Date(t);
  if (!Number.isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  }
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

function getScrapeRequestTarget() {
  const baseRaw =
    process.env.SCRAPE_BASE_URL || `http://127.0.0.1:${process.env.PORT || "3000"}`;
  const base = baseRaw.replace(/\/+$/, "");
  const full = `${base}/api/scraping/modo/`;
  return new URL(full);
}

function fetchModoItemsHttp(maxTotal) {
  const body = JSON.stringify({ limit: 120, maxTotal });
  const timeoutMs = 60 * 60 * 1000;
  const target = getScrapeRequestTarget();
  const isHttps = target.protocol === "https:";
  const lib = isHttps ? https : http;
  const port =
    target.port || (isHttps ? 443 : 80);
  const pathWithQuery = `${target.pathname}${target.search || ""}`;

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        hostname: target.hostname,
        port,
        path: pathWithQuery,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body, "utf8"),
        },
        timeout: timeoutMs,
      },
      (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`Falló /api/scraping/modo (${res.statusCode}): ${raw.slice(0, 500)}`));
            return;
          }
          try {
            const payload = JSON.parse(raw);
            resolve(payload.items || []);
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout esperando respuesta de /api/scraping/modo (¿Next en :3000?)"));
    });
    req.write(body);
    req.end();
  });
}

async function fetchModoItems() {
  const maxTotalArg = Number(process.argv.find((arg) => arg.startsWith("--maxTotal="))?.split("=")[1]);
  const maxTotal = Number.isFinite(maxTotalArg) && maxTotalArg > 0 ? maxTotalArg : 900;
  return fetchModoItemsHttp(maxTotal);
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
  const skipDelete = process.argv.includes("--skip-delete");
  const db = initAdmin();
  if (skipDelete) {
    console.log("1) Omitiendo borrado (--skip-delete).");
  } else {
    console.log("1) Eliminando descuentos actuales...");
    const deleted = await clearDiscountsCollection(db);
    console.log(`- Eliminados: ${deleted}`);
  }

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

