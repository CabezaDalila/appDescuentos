// Script para limpiar todos los descuentos de la base de datos
// Ejecutar con: node scripts/clear-discounts.js

const admin = require("firebase-admin");
const serviceAccount = require("../android/app/serviceAccountKey.json"); // Ajusta la ruta según tu configuración

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Añade tu projectId si es necesario
});

const db = admin.firestore();

async function clearAllDiscounts() {
  try {
    console.log("🗑️ Iniciando limpieza de descuentos...");

    // Obtener todos los documentos de la colección discounts
    const discountsRef = db.collection("discounts");
    const snapshot = await discountsRef.get();

    if (snapshot.empty) {
      console.log("✅ No hay descuentos para eliminar");
      return;
    }

    console.log(`📊 Encontrados ${snapshot.size} descuentos`);

    // Eliminar en lotes para evitar problemas de rendimiento
    const batch = db.batch();
    let deletedCount = 0;

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deletedCount++;

      // Procesar en lotes de 500 (límite de Firestore)
      if (deletedCount % 500 === 0) {
        console.log(`🔄 Procesando lote de ${deletedCount} descuentos...`);
      }
    });

    // Ejecutar el batch
    await batch.commit();

    console.log(`✅ Eliminados ${deletedCount} descuentos exitosamente`);
    console.log("🎉 Base de datos limpiada correctamente");
  } catch (error) {
    console.error("❌ Error al limpiar descuentos:", error);
  } finally {
    // Cerrar la conexión
    process.exit(0);
  }
}

// Ejecutar la función
clearAllDiscounts();
