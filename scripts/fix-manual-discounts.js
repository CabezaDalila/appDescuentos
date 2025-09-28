const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
} = require("firebase/firestore");

// Configuración de Firebase (usa la misma que tu aplicación)
const firebaseConfig = {
  // Aquí deberías poner tu configuración de Firebase
  // Por ahora usaremos variables de entorno o configuración local
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixManualDiscounts() {
  try {
    console.log("🔍 Buscando descuentos manuales sin approvalStatus...");

    // Obtener todos los descuentos
    const snapshot = await getDocs(collection(db, "discounts"));
    const discounts = snapshot.docs;

    console.log(`📊 Encontrados ${discounts.length} descuentos totales`);

    let updatedCount = 0;

    for (const discountDoc of discounts) {
      const data = discountDoc.data();

      // Si es un descuento manual y no tiene approvalStatus
      if (data.type === "manual" && !data.approvalStatus) {
        console.log(
          `🔄 Actualizando descuento: ${
            data.title || data.name || discountDoc.id
          }`
        );

        await updateDoc(doc(db, "discounts", discountDoc.id), {
          approvalStatus: "approved",
          isVisible: data.isVisible ?? true, // Asegurar que tenga el campo isVisible
        });

        updatedCount++;
      }
    }

    console.log(`✅ Actualizados ${updatedCount} descuentos manuales`);
    console.log("🎉 Proceso completado exitosamente");
  } catch (error) {
    console.error("❌ Error al actualizar descuentos:", error);
  }
}

// Ejecutar el script
fixManualDiscounts();
