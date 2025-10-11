/**
 * Script para probar las funciones localmente
 * Ejecutar con: node test-local.js
 */

const admin = require('firebase-admin');

// Configurar Firebase Admin (usar las credenciales de tu proyecto)
const serviceAccount = require('./path/to/your/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id.firebaseio.com"
});

const db = admin.firestore();

// Función para validar formato de fecha MM/YY
function validateExpiry(expiry) {
  if (!expiry) return false;
  
  const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
  if (!expiryRegex.test(expiry)) {
    return false;
  }
  
  const [month, year] = expiry.split('/');
  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;
  
  const cardYear = parseInt(year);
  const cardMonth = parseInt(month);
  
  if (cardYear < currentYear || (cardYear === currentYear && cardMonth < currentMonth)) {
    return false;
  }
  
  return true;
}

// Función para verificar si una tarjeta vence dentro de X días
function isExpiringSoon(expiry, daysThreshold = 31) {
  if (!expiry || !validateExpiry(expiry)) return false;
  
  const [month, year] = expiry.split('/');
  const expiryDate = new Date(parseInt(`20${year}`), parseInt(month) - 1, 1);
  const now = new Date();
  const thresholdDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysThreshold);
  
  return expiryDate <= thresholdDate && expiryDate >= now;
}

async function testExpiryCheck() {
  console.log('🧪 Probando verificación de vencimientos...\n');
  
  try {
    // Obtener todos los usuarios
    const usersSnapshot = await db.collection('users').get();
    let totalCardsChecked = 0;
    let expiringCards = 0;
    
    console.log(`👥 Encontrados ${usersSnapshot.size} usuarios\n`);
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`🔍 Usuario: ${userId}`);
      
      // Obtener membresías del usuario
      const membershipsSnapshot = await db
        .collection(`users/${userId}/memberships`)
        .where('category', '==', 'banco')
        .get();
      
      console.log(`🏦 Bancos encontrados: ${membershipsSnapshot.size}`);
      
      for (const membershipDoc of membershipsSnapshot.docs) {
        const membershipData = membershipDoc.data();
        console.log(`  📋 Banco: ${membershipData.name}`);
        
        if (membershipData.cards && membershipData.cards.length > 0) {
          console.log(`  💳 Tarjetas: ${membershipData.cards.length}`);
          
          for (const card of membershipData.cards) {
            totalCardsChecked++;
            console.log(`    🎴 ${card.brand} ${card.level} - Vence: ${card.expiry || 'No especificado'}`);
            
            if (card.expiry && isExpiringSoon(card.expiry, 31)) {
              expiringCards++;
              console.log(`    ⚠️  ¡ESTA TARJETA VENCE PRONTO!`);
            }
          }
        } else {
          console.log(`  💳 Sin tarjetas`);
        }
        console.log('');
      }
    }
    
    console.log('📊 RESUMEN:');
    console.log(`  Total tarjetas revisadas: ${totalCardsChecked}`);
    console.log(`  Tarjetas por vencer: ${expiringCards}`);
    console.log(`  Tarjetas sin problemas: ${totalCardsChecked - expiringCards}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Ejecutar prueba
testExpiryCheck().then(() => {
  console.log('\n✅ Prueba completada');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error en prueba:', error);
  process.exit(1);
});
