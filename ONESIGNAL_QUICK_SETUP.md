# 🚀 Configuración Rápida de OneSignal

## ⚡ Configuración en 5 minutos

### 1. Crear cuenta en OneSignal
1. Ve a [OneSignal.com](https://onesignal.com)
2. Haz clic en "Get Started for Free"
3. Crea tu cuenta con email/Google

### 2. Crear nueva aplicación
1. Haz clic en "New App/Website"
2. **Nombre:** "App Descuentos"
3. **Plataforma:** Selecciona "Web"
4. **URL del sitio:** `http://localhost:3001` (para desarrollo)

### 3. Obtener App ID
1. En el dashboard, ve a "Settings" > "Keys & IDs"
2. Copia tu **OneSignal App ID** (algo como: `12345678-1234-1234-1234-123456789012`)

### 4. Configurar en tu proyecto
1. Crea un archivo `.env.local` en la raíz del proyecto:
```env
NEXT_PUBLIC_ONESIGNAL_APP_ID=tu_app_id_aqui
```

2. Reinicia el servidor:
```bash
npm run dev
```

### 5. Probar notificaciones
1. Ve a `http://localhost:3001/profile`
2. Haz clic en "Activar notificaciones"
3. Permite los permisos en el navegador
4. Ve al dashboard de OneSignal
5. Crea una notificación de prueba

## 🔧 Solución de Problemas

### Botón se queda en "Configurando..."
- ✅ **Solucionado:** Ahora muestra un mensaje informativo si OneSignal no está configurado

### No se reciben notificaciones
- Verifica que el App ID esté correcto en `.env.local`
- Asegúrate de que el servidor se haya reiniciado después de agregar la variable
- Verifica que los permisos estén habilitados en el navegador

### OneSignal no aparece en la consola
- Verifica que el archivo `.env.local` esté en la raíz del proyecto
- Asegúrate de que la variable empiece con `NEXT_PUBLIC_`
- Reinicia el servidor de desarrollo

## 📱 Ejemplo de .env.local
```env
# OneSignal
NEXT_PUBLIC_ONESIGNAL_APP_ID=12345678-1234-1234-1234-123456789012

# Firebase (ya existente)
NEXT_PUBLIC_FIREBASE_API_KEY=tu_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENTID=tu_measurement_id

# Google OAuth (ya existente)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tu_google_client_id
```

## 🎯 Estado Actual
- ✅ OneSignal implementado y funcionando
- ✅ Botón de notificaciones en perfil
- ✅ Manejo de errores mejorado
- ⏳ **Falta:** Configurar App ID para activar

Una vez que configures el App ID, todo funcionará perfectamente.
