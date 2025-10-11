#!/usr/bin/env node

/**
 * Script de configuración para Firebase Cloud Functions
 * Ejecutar con: node setup-cloud-functions.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupCloudFunctions() {
  console.log('🚀 Configuración de Firebase Cloud Functions');
  console.log('===========================================\n');

  try {
    // 1. Verificar si Firebase CLI está instalado
    console.log('1️⃣ Verificando Firebase CLI...');
    try {
      const { execSync } = require('child_process');
      execSync('firebase --version', { stdio: 'pipe' });
      console.log('✅ Firebase CLI está instalado\n');
    } catch (error) {
      console.log('❌ Firebase CLI no está instalado');
      console.log('📦 Instalando Firebase CLI...');
      const { execSync } = require('child_process');
      execSync('npm install -g firebase-tools', { stdio: 'inherit' });
      console.log('✅ Firebase CLI instalado\n');
    }

    // 2. Configurar proyecto Firebase
    console.log('2️⃣ Configurando proyecto Firebase...');
    const projectId = await question('Ingresa tu Firebase Project ID: ');
    
    // Actualizar .firebaserc
    const firebasercContent = {
      projects: {
        default: projectId
      }
    };
    
    fs.writeFileSync(
      '.firebaserc', 
      JSON.stringify(firebasercContent, null, 2)
    );
    console.log('✅ .firebaserc configurado\n');

    // 3. Configurar OneSignal
    console.log('3️⃣ Configurando OneSignal...');
    const onesignalApiKey = await question('Ingresa tu OneSignal REST API Key: ');
    
    // Crear archivo de configuración
    const envContent = `# OneSignal Configuration
ONESIGNAL_APP_ID=ab94a58e-b696-4f40-89ef-24597d45fe56
ONESIGNAL_REST_API_KEY=${onesignalApiKey}

# Firebase Configuration
FIREBASE_PROJECT_ID=${projectId}

# Notification Settings
NOTIFICATION_THRESHOLD_DAYS=31
NOTIFICATION_SCHEDULE_TIME=09:00
`;
    
    fs.writeFileSync('functions/.env', envContent);
    console.log('✅ Variables de entorno configuradas\n');

    // 4. Instalar dependencias
    console.log('4️⃣ Instalando dependencias...');
    const { execSync } = require('child_process');
    execSync('cd functions && npm install', { stdio: 'inherit' });
    console.log('✅ Dependencias instaladas\n');

    // 5. Inicializar Firebase
    console.log('5️⃣ Inicializando Firebase...');
    console.log('📝 Ejecuta manualmente: firebase login');
    console.log('📝 Ejecuta manualmente: firebase use --add');
    console.log('📝 Ejecuta manualmente: firebase deploy --only functions\n');

    console.log('🎉 Configuración completada!');
    console.log('📚 Revisa CLOUD_FUNCTIONS_SETUP.md para más detalles');

  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
  } finally {
    rl.close();
  }
}

// Ejecutar configuración
setupCloudFunctions();
