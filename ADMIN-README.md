# Panel de Administración - App Descuentos

## Descripción

El Panel de Administración es una interfaz exclusiva para usuarios con permisos de administrador que permite gestionar scripts de scraping y cargar descuentos manualmente.

## Características

### 🔧 Gestión de Scripts de Scraping

- **Listar scripts**: Visualiza todos los scripts de scraping configurados
- **Crear scripts**: Agrega nuevos scripts para sitios web específicos
- **Editar scripts**: Modifica scripts existentes (nombre del sitio, código, estado)
- **Activar/Desactivar**: Toggle para habilitar o deshabilitar scripts
- **Ejecutar scripts**: Botón para ejecutar scripts manualmente
- **Eliminar scripts**: Elimina scripts que ya no se necesiten

### 🎁 Carga Manual de Descuentos

- **Formulario completo**: Campos para título, origen, categoría, fecha de expiración y descripción
- **Categorías predefinidas**: Lista de categorías comunes para organizar descuentos
- **Validación**: Campos requeridos y validación de fechas
- **Imágenes opcionales**: URL de imagen para mejorar la presentación
- **Porcentajes y montos**: Campos para especificar el tipo de descuento

## Acceso

### Para Usuarios Administradores

1. Inicia sesión en la aplicación
2. Ve a tu perfil (pestaña "Perfil")
3. Verás un botón azul "Panel de Administración"
4. Haz clic para acceder al panel

### Para Usuarios Regulares

- No tendrán acceso al panel
- Verán un mensaje de "Acceso Denegado" si intentan acceder directamente

## Estructura de Datos

### Scripts de Scraping

```typescript
interface ScrapingScript {
  id: string;
  siteName: string;
  script: string;
  isActive: boolean;
  lastExecuted?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Descuentos Manuales

```typescript
interface ManualDiscount {
  id?: string;
  title: string;
  origin: string;
  category: string;
  expirationDate: Date;
  description: string;
  discountPercentage?: number;
  discountAmount?: number;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

## Configuración de Permisos

### En Firestore

Para que un usuario sea administrador, debe tener el campo `role: 'admin'` en su documento de usuario:

```javascript
// Ejemplo de documento de usuario administrador
{
  uid: "user123",
  email: "admin@ejemplo.com",
  role: "admin",
  permissions: ["manage_scripts", "manage_discounts"]
}
```

### Verificación Automática

La aplicación verifica automáticamente los permisos de administrador:

- Al cargar la página de administración
- Al acceder desde el perfil del usuario
- En cada operación sensible

## Uso

### Gestión de Scripts

1. **Crear nuevo script**:

   - Haz clic en "Nuevo Script"
   - Completa el nombre del sitio web
   - Pega el código del script en el textarea
   - Activa/desactiva según sea necesario
   - Guarda los cambios

2. **Editar script existente**:

   - Haz clic en el botón de editar (ícono de lápiz)
   - Modifica los campos necesarios
   - Guarda los cambios

3. **Ejecutar script**:
   - Haz clic en el botón de ejecutar (ícono de play)
   - El script se ejecutará y se actualizará la fecha de última ejecución

### Carga de Descuentos

1. **Crear descuento manual**:

   - Haz clic en "Nuevo Descuento"
   - Completa todos los campos requeridos
   - Agrega descripción y detalles adicionales
   - Guarda el descuento

2. **Ver descuentos existentes**:
   - Los descuentos se muestran en orden cronológico
   - Se indica el estado de expiración (Activo, Expira pronto, Expirado)
   - Se muestran los porcentajes y montos de descuento

## Notificaciones

La aplicación incluye un sistema de notificaciones toast que informa sobre:

- ✅ Operaciones exitosas
- ❌ Errores durante las operaciones
- ⚠️ Validaciones de formularios
- 🔄 Estado de carga de datos

## Seguridad

- **Verificación de permisos**: Solo usuarios administradores pueden acceder
- **Validación de datos**: Todos los formularios incluyen validación
- **Auditoría**: Se registran timestamps de creación y modificación
- **Redirección automática**: Usuarios no autorizados son redirigidos

## Tecnologías Utilizadas

- **Frontend**: Next.js, React, TypeScript
- **UI Components**: Radix UI, Tailwind CSS
- **Estado**: React Hooks (useState, useEffect)
- **Base de datos**: Firebase Firestore
- **Autenticación**: Firebase Auth
- **Notificaciones**: React Hot Toast

## Estructura de Archivos

```
src/
├── components/
│   └── admin/
│       ├── ScrapingScriptsManager.tsx
│       └── ManualDiscountsManager.tsx
├── hooks/
│   └── useAdmin.tsx
├── lib/
│   └── firebase/
│       └── admin.ts
├── pages/
│   └── admin/
│       └── index.tsx
└── types/
    └── admin.ts
```

## Próximas Mejoras

- [ ] Programación automática de scripts
- [ ] Logs de ejecución de scripts
- [ ] Métricas de rendimiento
- [ ] Exportación de datos
- [ ] Gestión de usuarios administradores
- [ ] Auditoría de cambios
- [ ] Backup automático de scripts

## Soporte

Para problemas o preguntas sobre la funcionalidad de administración:

1. Revisa los logs de la consola del navegador
2. Verifica los permisos del usuario en Firestore
3. Confirma que todas las dependencias estén instaladas
4. Revisa la configuración de Firebase
