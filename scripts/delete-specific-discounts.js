// Script para eliminar descuentos específicos por criterios
// Ejecutar con: node scripts/delete-specific-discounts.js

const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyBcIkqNq2pvxs6OA4JVHHnC4sMeL57n200",
  authDomain: "app-descuentos.firebaseapp.com",
  projectId: "app-descuentos",
  storageBucket: "app-descuentos.appspot.com",
  messagingSenderId: "862960295371",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteSpecificDiscounts() {
  try {
    console.log("🔍 Buscando descuentos para eliminar...");

    // EJEMPLOS DE FILTROS - Modifica según tus necesidades:

    // 1. Eliminar por categoría
    // const q = query(collection(db, 'discounts'), where('category', '==', 'otro'));

    // 2. Eliminar por estado
    // const q = query(collection(db, 'discounts'), where('status', '==', 'inactive'));

    // 3. Eliminar por origen
    // const q = query(collection(db, 'discounts'), where('origin', '==', 'sitio-web'));

    // 4. Eliminar por fecha (descuentos antiguos)
    // const oldDate = new Date('2024-01-01');
    // const q = query(collection(db, 'discounts'), where('createdAt', '<', oldDate));

    // 5. Eliminar todos (sin filtro)
    const q = collection(db, "discounts");

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log("✅ No se encontraron descuentos con esos criterios");
      return;
    }

    console.log(`📊 Encontrados ${snapshot.size} descuentos para eliminar`);

    // Mostrar información de los descuentos antes de eliminar
    console.log("\n📋 Descuentos que se eliminarán:");
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(
        `${index + 1}. ${data.name || data.title || "Sin nombre"} (${
          data.category || "Sin categoría"
        })`
      );
    });

    console.log("\n⚠️  ¿Estás seguro de eliminar estos descuentos?");
    console.log('   Escribe "SI" para confirmar:');

    // Simular confirmación (en un script real usarías readline)
    const confirmar = "SI"; // Cambia esto a 'NO' si no quieres eliminar

    if (confirmar !== "SI") {
      console.log("❌ Operación cancelada");
      return;
    }

    // Eliminar los descuentos
    let deletedCount = 0;
    for (const docSnapshot of snapshot.docs) {
      await deleteDoc(doc(db, "discounts", docSnapshot.id));
      deletedCount++;
      console.log(
        `🗑️ Eliminado: ${
          docSnapshot.data().name || docSnapshot.data().title || docSnapshot.id
        }`
      );
    }

    console.log(`\n✅ Eliminados ${deletedCount} descuentos exitosamente`);
  } catch (error) {
    console.error("❌ Error al eliminar descuentos:", error);
  } finally {
    process.exit(0);
  }
}

deleteSpecificDiscounts();
