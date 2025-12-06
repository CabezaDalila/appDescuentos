// Script temporal para probar la API de Gemini y listar modelos disponibles
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

// Leer .env.local manualmente
const envContent = fs.readFileSync('.env.local', 'utf8');
const apiKeyMatch = envContent.match(/NEXT_PUBLIC_GEMINI_API_KEY=(.+)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

async function testGemini() {
  console.log("🔑 API Key configurada:", apiKey ? "✅ Sí" : "❌ No");
  console.log("📝 Primeros caracteres:", apiKey ? apiKey.substring(0, 10) + "..." : "N/A");
  
  if (!apiKey) {
    console.error("❌ No se encontró NEXT_PUBLIC_GEMINI_API_KEY en .env.local");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  console.log("\n📋 Probando diferentes modelos...\n");
  
  // Modelos a probar según la documentación
  const modelsToTest = [
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
  ];
  
  for (const modelName of modelsToTest) {
    try {
      console.log(`🧪 Probando: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Di solo 'OK'");
      const response = await result.response;
      const text = response.text();
      console.log(`   ✅ FUNCIONA! Respuesta: ${text.trim()}\n`);
      console.log(`🎯 MODELO CORRECTO: "${modelName}"\n`);
      return modelName;
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
  
  console.log("❌ Ningún modelo funcionó");
}

testGemini();
