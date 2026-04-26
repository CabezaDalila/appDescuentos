/* eslint-disable no-console */
/**
 * Migra la colección discounts para unificar fechas de vencimiento:
 * - Si un documento tiene validUntil y no expirationDate, copia validUntil -> expirationDate
 * - Elimina validUntil de TODOS los documentos
 *
 * Uso:
 *   node scripts/migrate-discounts-expiration-field.js
 *
 * Requisitos:
 * - GOOGLE_APPLICATION_CREDENTIALS apuntando a una service account JSON
 *   o credenciales por defecto disponibles en el entorno.
 */

const admin = require("firebase-admin");

function initAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
  return admin.firestore();
}

async function migrate() {
  const db = initAdmin();
  const snapshot = await db.collection("discounts").get();

  let scanned = 0;
  let updated = 0;
  let copiedFromValidUntil = 0;
  let removedValidUntil = 0;

  let batch = db.batch();
  let batchOps = 0;
  const flush = async () => {
    if (batchOps === 0) return;
    await batch.commit();
    batch = db.batch();
    batchOps = 0;
  };

  for (const docSnap of snapshot.docs) {
    scanned += 1;
    const data = docSnap.data();

    const hasValidUntil = data.validUntil != null;
    const hasExpirationDate = data.expirationDate != null;

    if (!hasValidUntil && !hasExpirationDate) {
      continue;
    }

    const updateData = {};

    if (hasValidUntil && !hasExpirationDate) {
      updateData.expirationDate = data.validUntil;
      copiedFromValidUntil += 1;
    }

    if (hasValidUntil) {
      updateData.validUntil = admin.firestore.FieldValue.delete();
      removedValidUntil += 1;
    }

    if (Object.keys(updateData).length > 0) {
      batch.update(docSnap.ref, updateData);
      batchOps += 1;
      updated += 1;
    }

    if (batchOps >= 450) {
      await flush();
    }
  }

  await flush();

  console.log("Migracion completada");
  console.log(`- Documentos escaneados: ${scanned}`);
  console.log(`- Documentos actualizados: ${updated}`);
  console.log(`- expirationDate copiado desde validUntil: ${copiedFromValidUntil}`);
  console.log(`- validUntil eliminados: ${removedValidUntil}`);
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error en migracion expirationDate:", error);
    process.exit(1);
  });
