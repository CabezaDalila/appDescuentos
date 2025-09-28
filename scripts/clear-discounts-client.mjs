// Script para limpiar descuentos usando el SDK del cliente
// Ejecutar con: node scripts/clear-discounts-client.js

import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  writeBatch,
} from "firebase/firestore";

// Configuración de Firebase (ajusta según tu configuración)
const firebaseConfig = {
  apiKey: "AIzaSyBcIkqNq2pvxs6OA4JVHHnC4sMeL57n200",
  authDomain: "app-descuentos.firebaseapp.com",
  projectId: "app-descuentos",
  storageBucket: "app-descuentos.appspot.com",
  messagingSenderId: "862960295371",
  appId: "1:862960295371:web:your-app-id",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearAllDiscounts() {
  try {
    console.log("🗑️ Iniciando limpieza de descuentos...");

    // Obtener todos los documentos de la colección discounts
    const discountsCollection = collection(db, "discounts");
    const snapshot = await getDocs(discountsCollection);

    if (snapshot.empty) {
      console.log("✅ No hay descuentos para eliminar");
      return;
    }

    console.log(`📊 Encontrados ${snapshot.size} descuentos`);

    // Eliminar en lotes
    const batch = writeBatch(db);
    let batchCount = 0;
    let totalDeleted = 0;

    for (const docSnapshot of snapshot.docs) {
      batch.delete(doc(db, "discounts", docSnapshot.id));
      batchCount++;
      totalDeleted++;

      // Ejecutar batch cada 500 documentos (límite de Firestore)
      if (batchCount === 500) {
        console.log(`🔄 Eliminando lote de ${batchCount} descuentos...`);
        await batch.commit();
        batchCount = 0;
      }
    }

    // Ejecutar el último batch si queda algo
    if (batchCount > 0) {
      console.log(`🔄 Eliminando último lote de ${batchCount} descuentos...`);
      await batch.commit();
    }

    console.log(`✅ Eliminados ${totalDeleted} descuentos exitosamente`);
    console.log("🎉 Base de datos limpiada correctamente");
  } catch (error) {
    console.error("❌ Error al limpiar descuentos:", error);
    console.error("Detalles del error:", error.message);
  } finally {
    // Cerrar la conexión
    process.exit(0);
  }
}

// Ejecutar la función
clearAllDiscounts();
