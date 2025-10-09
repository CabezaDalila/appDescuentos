# Arquitectura del Panel de Administración

## 🏗️ Visión General

El Panel de Administración está diseñado con una arquitectura modular que separa claramente las responsabilidades y facilita el mantenimiento del código. Utiliza patrones modernos de React y TypeScript para crear una aplicación escalable y mantenible.

## 🧩 Componentes Principales

### 1. Hooks Personalizados (`src/hooks/`)

#### `useDiscounts.tsx`

- **Responsabilidad**: Manejo de operaciones CRUD de descuentos
- **Funciones principales**:
  - `loadDiscounts()`: Cargar lista de descuentos desde Firebase
  - `createDiscount()`: Crear nuevo descuento
  - `updateDiscount()`: Actualizar descuento existente
  - `deleteDiscountById()`: Eliminar descuento individual
  - `deleteMultipleDiscountsByIds()`: Eliminar múltiples descuentos
  - `toggleVisibility()`: Cambiar visibilidad de descuento

#### `useDiscountForm.tsx`

- **Responsabilidad**: Manejo del estado del formulario de descuentos
- **Funciones principales**:
  - `handleCategoryChange()`: Manejo de selección de categoría
  - `handleEditDiscount()`: Cargar datos para edición
  - `resetForm()`: Limpiar formulario
  - `validateForm()`: Validación de campos requeridos

#### `useConfirmation.tsx`

- **Responsabilidad**: Manejo de modales de confirmación
- **Funciones principales**:
  - `showConfirmation()`: Mostrar modal de confirmación
  - `hideConfirmation()`: Ocultar modal

#### `useAdmin.tsx`

- **Responsabilidad**: Verificación de permisos de administrador
- **Funciones principales**:
  - Verificación de rol de usuario
  - Redirección automática para usuarios no autorizados

### 2. Componentes Reutilizables (`src/components/admin/`)

#### `ManualDiscountsManager.tsx`

- **Responsabilidad**: Componente principal de gestión de descuentos
- **Características**:
  - Integración de todos los hooks personalizados
  - Manejo de estado global del componente
  - Coordinación entre formulario y lista de descuentos

#### `DiscountForm.tsx`

- **Responsabilidad**: Formulario para crear/editar descuentos
- **Props principales**:
  - `formData`: Estado del formulario
  - `onSubmit`: Handler para envío
  - `onCancel`: Handler para cancelar
  - `isEditing`: Estado de edición
- **Características**:
  - Validación de campos requeridos
  - Switch para control de visibilidad
  - Selector de categorías
  - Campos opcionales (porcentaje, monto, imagen)

#### `DiscountCard.tsx`

- **Responsabilidad**: Tarjeta individual de descuento
- **Props principales**:
  - `discount`: Datos del descuento
  - `onEdit`: Handler para editar
  - `onDelete`: Handler para eliminar
  - `onToggleVisibility`: Handler para cambiar visibilidad
- **Características**:
  - Información completa del descuento
  - Botones de acción (editar, eliminar)
  - Switch de visibilidad
  - Estados visuales (activo, expirado, etc.)

### 3. Constantes y Configuración (`src/lib/constants/admin.ts`)

#### `ADMIN_CONSTANTS`

- **Mensajes de éxito**: Textos para operaciones exitosas
- **Mensajes de error**: Textos para manejo de errores
- **Textos de UI**: Etiquetas y textos de la interfaz
- **Configuración**: Valores por defecto y configuración

### 4. Tipos y Interfaces (`src/types/admin.ts`)

#### Tipos Específicos

- `CreateManualDiscountData`: Datos para crear descuentos
- `UpdateManualDiscountData`: Datos para actualizar descuentos
- `DiscountFormState`: Estado del formulario
- `ConfirmationModalState`: Estado del modal de confirmación
- `OperationResult`: Resultado de operaciones

## 🔄 Flujo de Datos

### 1. Carga de Descuentos

```
useDiscounts → Firebase → ManualDiscountsManager → DiscountCard
```

### 2. Creación de Descuento

```
DiscountForm → useDiscountForm → useDiscounts → Firebase → Actualización de UI
```

### 3. Edición de Descuento

```
DiscountCard → useDiscountForm → DiscountForm → useDiscounts → Firebase
```

### 4. Eliminación de Descuento

```
DiscountCard → useConfirmation → useDiscounts → Firebase → Actualización de UI
```

## 🎯 Beneficios de la Arquitectura

### 1. **Mantenibilidad**

- Código más fácil de entender y modificar
- Separación clara de responsabilidades
- Menos acoplamiento entre componentes

### 2. **Reutilización**

- Hooks reutilizables en otros componentes
- Componentes de formulario y tarjetas reutilizables
- Constantes centralizadas

### 3. **Testabilidad**

- Hooks pueden ser probados independientemente
- Componentes más pequeños y enfocados
- Lógica de negocio separada de la presentación

### 4. **Escalabilidad**

- Fácil agregar nuevas funcionalidades
- Estructura preparada para crecimiento
- Patrones consistentes

### 5. **Experiencia de Desarrollo**

- Mejor autocompletado con TypeScript
- Código más legible y autodocumentado
- Menos bugs por mejor tipado

## 🚀 Patrones Utilizados

### 1. **Custom Hooks Pattern**

```typescript
// Encapsula lógica reutilizable
const { discounts, createDiscount } = useDiscounts();
```

### 2. **Component Composition**

```typescript
// Componentes pequeños y enfocados
<DiscountForm {...formProps} />
<DiscountCard {...cardProps} />
```

### 3. **Props Drilling Prevention**

```typescript
// Hooks evitan pasar props por múltiples niveles
const { formData, handleSubmit } = useDiscountForm();
```

### 4. **Separation of Concerns**

```typescript
// Lógica de negocio en hooks
// Presentación en componentes
// Configuración en constantes
```

## 📁 Estructura de Archivos Detallada

```
src/
├── components/
│   └── admin/
│       ├── ManualDiscountsManager.tsx    # Componente principal
│       ├── DiscountForm.tsx              # Formulario reutilizable
│       └── DiscountCard.tsx              # Tarjeta reutilizable
├── hooks/
│   ├── useDiscounts.tsx                  # Lógica CRUD
│   ├── useDiscountForm.tsx               # Estado del formulario
│   ├── useConfirmation.tsx               # Modales de confirmación
│   └── useAdmin.tsx                      # Permisos de admin
├── lib/
│   ├── firebase/
│   │   └── admin.ts                      # Operaciones Firebase
│   └── constants/
│       └── admin.ts                      # Constantes centralizadas
├── pages/
│   └── admin/
│       └── index.tsx                     # Página principal
└── types/
    └── admin.ts                          # Tipos TypeScript
```

## 🔧 Tecnologías y Herramientas

- **React 18**: Hooks y componentes funcionales
- **TypeScript**: Tipado estático y mejor DX
- **Firebase Firestore**: Base de datos en tiempo real
- **Tailwind CSS**: Estilos utilitarios
- **Radix UI**: Componentes accesibles
- **React Hot Toast**: Notificaciones

## 📈 Métricas de Calidad

- **Separación de responsabilidades**: Alta
- **Reutilización de código**: Alta
- **Mantenibilidad**: Alta
- **Testabilidad**: Alta
- **Escalabilidad**: Alta
- **Legibilidad**: Alta

Esta arquitectura proporciona una base sólida para el crecimiento futuro del panel de administración, manteniendo el código limpio, organizado y fácil de mantener.
