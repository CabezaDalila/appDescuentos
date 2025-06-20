# App de Descuentos

Este es un proyecto de Next.js diseñado para ser una aplicación de descuentos y fidelización de clientes. Utiliza Firebase para la autenticación y está construido con componentes de shadcn/ui y Tailwind CSS para el diseño.

## 🚀 Cómo empezar

Sigue estos pasos para levantar el proyecto en tu entorno local.

### 1. Prerrequisitos

-   Node.js (versión 18 o superior)
-   npm, yarn o pnpm

### 2. Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd <NOMBRE_DEL_PROYECTO>
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

### 3. Configuración de Variables de Entorno

Para que la autenticación con Firebase funcione, necesitas crear un archivo `.env.local` en la raíz del proyecto y añadir tus credenciales de Firebase.

Crea el archivo `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENTID=...
```

> **Importante:** Puedes encontrar estas claves en la configuración de tu proyecto de Firebase.

### 4. Ejecutar el Proyecto

Una vez instaladas las dependencias y configuradas las variables de entorno, inicia el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

---

## 🏗️ Estructura del Proyecto

El proyecto sigue una estructura organizada para separar responsabilidades:

-   **/src/components**: Contiene componentes de React reutilizables.
    -   **/ui**: Componentes base de la UI (Button, Card, etc.), muchos de ellos basados en shadcn/ui.
    -   `AuthForm.tsx`: El formulario de login y registro.
-   **/src/layout**: Contiene los layouts o plantillas de página.
    -   `layout-home.tsx`: El layout principal para usuarios autenticados, que incluye el header y la barra de navegación.
-   **/src/lib**: Módulos y utilidades auxiliares.
    -   `firebase.js`: Inicialización y configuración de Firebase.
    -   `firebase-auth.js`: Funciones para interactuar con Firebase Auth (login, register, logout).
    -   `utils.ts`: Funciones de utilidad, como `cn` para fusionar clases de Tailwind.
-   **/src/pages**: Contiene las páginas y las rutas de la aplicación.
    -   `_app.tsx`: El componente raíz de la aplicación. Aquí se controla qué layout mostrar según el estado de autenticación.
    -   `/login/index.tsx`: La página de inicio de sesión.
    -   `/home/index.tsx`: La página principal para usuarios logueados.
    -   `/shared/hook/useAuth.tsx`: Hook personalizado para gestionar el estado de autenticación.
-   **/styles**: Archivos de estilos globales.

---

## ✨ Flujos y Conceptos Clave

### Autenticación

-   **Firebase Auth**: La autenticación de usuarios se gestiona completamente con Firebase (email/contraseña y Google).
-   **Hook `useAuth`**: Este hook (`src/pages/shared/hook/useAuth.tsx`) es el núcleo del sistema de autenticación en el frontend. Escucha los cambios de estado de Firebase y devuelve el usuario actual y un estado de carga.
-   **Rutas Protegidas**: La lógica de rutas protegidas se encuentra en `_app.tsx`. Si el hook `useAuth` no devuelve un usuario, el usuario es redirigido a `/login`. Las páginas públicas como `/login` se renderizan sin el layout principal.

### Layouts y Navegación

-   **Layout Condicional**: `_app.tsx` decide si envuelve la página actual con `LayoutHome`. Las páginas que no requieren autenticación se muestran sin este layout.
-   **Layout Principal (`LayoutHome`)**: Este componente (`src/layout/layout-home.tsx`) define la estructura visual para usuarios autenticados. Incluye:
    -   `HomeHeader`: El encabezado superior.
    -   `NavigationBar`: La barra de navegación inferior.
-   **Navegación**: La `NavigationBar` utiliza el router de Next.js para cambiar de página y resaltar el ícono activo según la ruta actual.

### UI y Estilos

-   **Tailwind CSS**: El proyecto está estilizado principalmente con clases de utilidad de Tailwind CSS.
-   **shadcn/ui**: Se utilizan componentes base de esta librería, que son personalizables y accesibles. La función `cn` en `lib/utils.ts` ayuda a gestionar las clases de estos componentes de forma eficiente.

¡Espero que esta documentación sea de gran ayuda para tu compañero!
