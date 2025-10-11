# 📱 Sistema de Notificaciones - Frontend

## 📋 Resumen

Este sistema maneja las notificaciones en la aplicación frontend, incluyendo la visualización, gestión y almacenamiento de notificaciones en Firestore.

## 🚀 Características Implementadas

### ✅ Hook `useNotifications`

- **Carga en tiempo real**: Las notificaciones se actualizan automáticamente desde Firestore
- **Gestión de estado**: Maneja loading, error y datos de notificaciones
- **Acciones**: Marcar como leída, eliminar, obtener contadores

### ✅ Página de Notificaciones (`/notifications`)

- **Interfaz completa**: Lista de notificaciones con filtros y acciones
- **Filtros avanzados**: Por tipo, estado de lectura, etc.
- **Estados de carga**: Loading, error, vacío
- **Responsive**: Funciona en móvil y desktop

### ✅ Integración en Home

- **Contador en tiempo real**: Muestra el número de notificaciones no leídas
- **Navegación**: Click para ir a la página de notificaciones
- **Badge visual**: Indicador visual de notificaciones pendientes

## 🔧 Estructura de Datos

### Notificaciones en Firestore

```
users/{userId}/notifications/{notificationId}
├── title: string
├── message: string
├── type: 'card_expiry' | 'info' | 'warning' | 'success' | 'error'
├── data?: {
│   ├── membershipId?: string
│   ├── cardId?: string
│   ├── expiryDate?: string
│   ├── membershipName?: string
│   ├── membershipCategory?: string
│   ├── cardName?: string
│   ├── cardBrand?: string
│   └── cardLevel?: string
│   }
├── read: boolean
├── createdAt: timestamp
└── userId: string
```

## 📱 Funcionalidades

### Hook `useNotifications`

```typescript
const {
  notifications, // Array de notificaciones
  loading, // Estado de carga
  error, // Error si existe
  markAsRead, // Marcar como leída
  markAllAsRead, // Marcar todas como leídas
  deleteNotification, // Eliminar notificación
  getUnreadCount, // Contador de no leídas
  getNotificationsByType, // Filtrar por tipo
} = useNotifications();
```

### Página de Notificaciones

- **Filtros**: Solo no leídas, por categoría
- **Acciones**: Marcar como leída, eliminar
- **Agrupación**: Por tiempo (hoy, ayer, esta semana, anterior)
- **Iconos**: Diferentes iconos según el tipo de notificación

### Contador en Home

- **Tiempo real**: Se actualiza automáticamente
- **Clickable**: Redirige a `/notifications`
- **Badge**: Muestra número de notificaciones no leídas

## 🔄 Flujo de Funcionamiento

1. **Carga inicial**: El hook `useNotifications` se conecta a Firestore
2. **Escucha en tiempo real**: Los cambios se reflejan automáticamente
3. **Interfaz reactiva**: La UI se actualiza según el estado
4. **Acciones del usuario**: Marcar como leída, eliminar, filtrar

## 📁 Archivos del Sistema

```
src/
├── hooks/
│   └── useNotifications.tsx          # Hook principal
├── pages/
│   ├── notifications/
│   │   └── index.tsx                 # Página de notificaciones
│   └── home/
│       └── index.tsx                 # Home con contador
└── types/
    └── membership.ts                 # Tipos de membresías
```

## 🧪 Cómo Probar

### 1. Crear Notificación Manual

```javascript
// En la consola del navegador o en un script
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";

const notificationData = {
  title: "Prueba de notificación",
  message: "Esta es una notificación de prueba",
  type: "info",
  read: false,
  createdAt: serverTimestamp(),
  userId: "tu-user-id",
};

await addDoc(
  collection(db, "users/tu-user-id/notifications"),
  notificationData
);
```

### 2. Verificar en la App

1. Ir a la página de notificaciones (`/notifications`)
2. Verificar que aparece la notificación
3. Probar marcar como leída
4. Probar eliminar
5. Verificar contador en el home

## 📝 Notas Importantes

1. **Tiempo real**: Las notificaciones se actualizan automáticamente
2. **Autenticación**: Solo funciona para usuarios autenticados
3. **Firestore**: Requiere conexión a Firebase
4. **Responsive**: Funciona en móvil y desktop

## 🎯 Posibles Mejoras Futuras

- [ ] Notificaciones push (OneSignal)
- [ ] Sonidos de notificación
- [ ] Animaciones de entrada
- [ ] Notificaciones agrupadas
- [ ] Búsqueda en notificaciones
- [ ] Exportar notificaciones

