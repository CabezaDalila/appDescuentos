# 📱 Generación de APK - Central de Descuentos

## 🚀 Método Rápido (Recomendado)

### Opción 1: Script Automatizado
```powershell
# Ejecutar el script de automatización
.\build-apk.ps1
```

### Opción 2: Comandos Manuales
```bash
# 1. Generar build estático
npm run export

# 2. Agregar plataforma Android (solo la primera vez)
npx cap add android

# 3. Copiar archivos web
npx cap copy

# 4. Sincronizar
npx cap sync

# 5. Abrir Android Studio
npx cap open android
```

## 🎯 Generar APK en Android Studio

1. **Abrir el proyecto** en Android Studio
2. **Esperar** a que se sincronice el proyecto
3. **Ir a**: `Build > Build Bundle(s) / APK(s) > Build APK`
4. **Esperar** a que termine el build
5. **Encontrar el APK** en: `android/app/build/outputs/apk/debug/app-debug.apk`

## 📋 Requisitos Previos

- ✅ Node.js 18+ instalado
- ✅ Android Studio instalado
- ✅ Android SDK configurado
- ✅ Variables de entorno ANDROID_HOME configuradas

## 🔧 Configuración de Android Studio

### Si es la primera vez:
1. **Instalar Android Studio** desde [developer.android.com](https://developer.android.com/studio)
2. **Configurar Android SDK**:
   - Abrir Android Studio
   - Ir a `Tools > SDK Manager`
   - Instalar Android SDK 33+ (API Level 33)
   - Instalar Android SDK Build-Tools

### Variables de entorno (Windows):
```powershell
# Agregar al PATH del sistema:
# C:\Users\[TuUsuario]\AppData\Local\Android\Sdk\platform-tools
# C:\Users\[TuUsuario]\AppData\Local\Android\Sdk\tools
```

## 🐛 Solución de Problemas

### Error: "Android SDK not found"
```bash
# Verificar que ANDROID_HOME esté configurado
echo $env:ANDROID_HOME
# Debería mostrar: C:\Users\[Usuario]\AppData\Local\Android\Sdk
```

### Error: "Gradle sync failed"
- Abrir Android Studio
- Ir a `File > Sync Project with Gradle Files`
- Esperar a que termine la sincronización

### Error: "Build failed"
- Limpiar el proyecto: `Build > Clean Project`
- Rebuild: `Build > Rebuild Project`

## 📱 Probar la APK

### En dispositivo físico:
1. **Habilitar "Fuentes desconocidas"** en Configuración > Seguridad
2. **Transferir el APK** al dispositivo
3. **Instalar** tocando el archivo APK

### En emulador:
1. **Crear un AVD** en Android Studio
2. **Arrastrar el APK** al emulador
3. **Instalar automáticamente**

## 🔄 Actualizaciones

Para generar una nueva versión:
```bash
# Limpiar y regenerar
npm run build:apk
```

## 📞 Soporte

Si tienes problemas:
1. Verificar que todos los requisitos estén instalados
2. Revisar los logs de Android Studio
3. Ejecutar `npx cap doctor` para diagnosticar problemas 