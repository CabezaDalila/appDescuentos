# Script para generar APK de la Central de Descuentos
Write-Host "🚀 Iniciando build de APK para Central de Descuentos..." -ForegroundColor Green

# Paso 1: Limpiar builds anteriores
Write-Host "📁 Limpiando builds anteriores..." -ForegroundColor Yellow
if (Test-Path "out") {
    Remove-Item -Recurse -Force "out"
}
if (Test-Path "android") {
    Remove-Item -Recurse -Force "android"
}

# Paso 2: Instalar dependencias
Write-Host "📦 Instalando dependencias..." -ForegroundColor Yellow
npm install

# Paso 3: Build de Next.js
Write-Host "🔨 Generando build estático..." -ForegroundColor Yellow
npm run export

# Paso 4: Agregar plataforma Android (si no existe)
if (-not (Test-Path "android")) {
    Write-Host "🤖 Agregando plataforma Android..." -ForegroundColor Yellow
    npx cap add android
}

# Paso 5: Copiar archivos web
Write-Host "📋 Copiando archivos web..." -ForegroundColor Yellow
npx cap copy

# Paso 6: Sincronizar
Write-Host "🔄 Sincronizando..." -ForegroundColor Yellow
npx cap sync

# Paso 7: Abrir Android Studio
Write-Host "🎯 Abriendo Android Studio..." -ForegroundColor Green
Write-Host "📝 Instrucciones:" -ForegroundColor Cyan
Write-Host "   1. En Android Studio, ve a: Build > Build Bundle(s) / APK(s) > Build APK" -ForegroundColor White
Write-Host "   2. El APK se generará en: android/app/build/outputs/apk/debug/" -ForegroundColor White
Write-Host "   3. El archivo se llamará: app-debug.apk" -ForegroundColor White

npx cap open android 