# 🚀 Configuración de OneSignal para Notificaciones Push

## 📋 Pasos para Configurar OneSignal

### 1. Crear cuenta en OneSignal
1. Ve a [OneSignal.com](https://onesignal.com)
2. Crea una cuenta gratuita
3. Selecciona "Web Push" como plataforma

### 2. Crear una nueva aplicación
1. Haz clic en "New App/Website"
2. Nombre de la app: "App Descuentos"
3. Selecciona "Web" como plataforma
4. URL del sitio: `http://localhost:3000` (para desarrollo)

### 3. Configurar el sitio web
1. En la configuración de la app, ve a "Settings" > "Platforms"
2. Selecciona "Web Push"
3. Configura los siguientes campos:
   - **Site URL**: `https://tu-dominio.com` (para producción)
   - **Default Notification Icon URL**: URL de tu ícono de notificación
   - **Safari Web ID**: Se genera automáticamente

### 4. Obtener las credenciales
1. Ve a "Settings" > "Keys & IDs"
2. Copia el **App ID** (OneSignal App ID)
3. Copia el **Safari Web ID** (si usas Safari)

### 5. Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto:

```env
# OneSignal Configuration
NEXT_PUBLIC_ONESIGNAL_APP_ID=tu_app_id_aqui
ONESIGNAL_SAFARI_WEB_ID=tu_safari_web_id_aqui
```

### 6. Personalizar la configuración
En `src/components/OneSignal.tsx`, puedes personalizar:
- Colores del botón de notificación
- Textos en español
- Posición del botón
- Configuración de permisos

## 🧪 Probar las Notificaciones

### 1. Instalación
**¡Importante!** No necesitas instalar ningún paquete de npm para OneSignal. El SDK se carga directamente desde el CDN.

### 2. Desarrollo local
```bash
npm run dev
```

### 3. Solicitar permisos
1. Ve a la página de perfil
2. Haz clic en "Activar notificaciones"
3. Permite las notificaciones en el navegador

### 4. Enviar notificación de prueba
1. Ve al dashboard de OneSignal
2. Haz clic en "Messages" > "New Push"
3. Configura tu mensaje
4. Selecciona "Send to Test Device"
5. Ingresa la URL de tu sitio de prueba

## 📱 Funcionalidades Implementadas

### ✅ Componentes Creados
- **OneSignalComponent**: Configuración principal de OneSignal
- **NotificationButton**: Botón para activar/desactivar notificaciones
- **useOneSignal**: Hook personalizado para manejar OneSignal

### ✅ Características
- ✅ Solicitud de permisos de notificación
- ✅ Verificación del estado de suscripción
- ✅ Envío de tags personalizados
- ✅ Manejo de eventos de notificación
- ✅ Interfaz en español
- ✅ Integración con la página de perfil
- ✅ Configuración responsive

### ✅ Configuración del Botón
- Posición: Esquina inferior izquierda
- Colores: Púrpura (coincide con el tema de la app)
- Textos en español
- Estados visuales (activo/inactivo)

## 🎯 Próximos Pasos

### 1. Configurar notificaciones automáticas
- Notificaciones cuando hay nuevos descuentos
- Recordatorios de membresías próximas a vencer
- Ofertas especiales personalizadas

### 2. Segmentación de usuarios
- Tags por categorías de interés
- Tags por ubicación
- Tags por tipo de membresía

### 3. Métricas y análisis
- Seguimiento de engagement
- Tasas de apertura
- Conversión de notificaciones

## 🔧 Solución de Problemas

### Notificaciones no aparecen
1. Verifica que el App ID esté correcto
2. Asegúrate de que el dominio esté configurado en OneSignal
3. Verifica los permisos del navegador

### Botón de notificación no aparece
1. Verifica que OneSignal se esté cargando correctamente
2. Revisa la consola del navegador por errores
3. Asegúrate de que las variables de entorno estén configuradas

### Problemas en Safari
1. Verifica que el Safari Web ID esté configurado
2. Asegúrate de que el sitio esté en HTTPS (requerido para Safari)

## 📞 Soporte
- [Documentación de OneSignal](https://documentation.onesignal.com/)
- [OneSignal Community](https://community.onesignal.com/)
- [Guía de Web Push](https://documentation.onesignal.com/docs/web-push-quickstart)
