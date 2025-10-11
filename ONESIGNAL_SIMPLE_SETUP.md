# OneSignal - Configuración Simple

## 🚀 Configuración Rápida

### 1. Obtener App ID de OneSignal
1. Ve a [OneSignal.com](https://onesignal.com)
2. Crea una cuenta o inicia sesión
3. Crea una nueva aplicación web
4. Copia tu App ID

### 2. Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_ONESIGNAL_APP_ID=tu_app_id_aqui
```

### 3. Ejecutar la aplicación
```bash
npm run dev
```

### 4. Acceder a la aplicación
Ve a `http://localhost:3000` (sin HTTPS)

## ✅ Características

- ✅ **Funciona en localhost HTTP** - Sin necesidad de HTTPS
- ✅ **Configuración simple** - Solo necesitas el App ID
- ✅ **Una sola inicialización** - Sin errores de duplicación
- ✅ **Permisos nativos** - Solicita permisos del navegador correctamente

## 🔧 Cómo funciona

La configuración usa:
```javascript
OneSignal.init({
  appId: "TU_APP_ID",
  allowLocalhostAsSecureOrigin: true,
  subdomainName: "app-descuentos", // Tu subdominio de OneSignal
  autoRegister: false,
  autoResubscribe: true
});
```

### 📍 Configurar el subdomainName

1. Ve a tu panel de OneSignal
2. Ve a **Settings → Web Push → Site URL / Subdomain**
3. Configura tu subdominio (ej: `app-descuentos`)
4. Actualiza el código con tu subdominio real

## 📱 Para probar

1. Ve a la página de perfil
2. Haz clic en "Activar notificaciones"
3. Acepta los permisos del navegador
4. ¡Listo! Las notificaciones están activadas

## 🐛 Debug

Si hay problemas, revisa la consola del navegador. Deberías ver:
- `🚀 Inicializando OneSignal...`
- `✅ OneSignal inicializado correctamente`
- `🔔 Solicitando permisos...`
