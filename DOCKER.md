# Dockerización del Proyecto

Este proyecto está dockerizado y listo para ejecutarse en contenedores Docker.

## Archivos Docker

- `Dockerfile`: Configuración multi-stage para construir y ejecutar la aplicación
- `.dockerignore`: Archivos y carpetas excluidos del contexto de Docker
- `docker-compose.yml`: Configuración para orquestar el contenedor

## Requisitos Previos

- Docker instalado en tu sistema
- Docker Compose (incluido en Docker Desktop)

## Construcción y Ejecución

### Opción 1: Usando Docker Compose (Recomendado)

```bash
# Construir y ejecutar el contenedor
docker-compose up --build

# Ejecutar en segundo plano
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Detener el contenedor
docker-compose down
```

### Opción 2: Usando Docker directamente

```bash
# Construir la imagen
docker build -t app-descuentos .

# Ejecutar el contenedor
docker run -p 3000:3000 app-descuentos

# Ejecutar con variables de entorno
docker run -p 3000:3000 \
  -e FIREBASE_API_KEY=tu_api_key \
  -e FIREBASE_AUTH_DOMAIN=tu_auth_domain \
  app-descuentos
```

## Variables de Entorno

### Configuración Requerida

**IMPORTANTE**: Docker Compose leerá automáticamente las variables de entorno desde:

1. `.env.local` (si existe) - Este es el archivo que usa Next.js por defecto
2. `.env` (si `.env.local` no existe)

#### Si ya tienes las variables configuradas:

Si ya tienes un archivo `.env.local` con tus credenciales (como se menciona en el README), Docker las usará automáticamente. **No necesitas hacer nada más**.

#### Si necesitas crear el archivo:

1. **Copia el archivo de ejemplo:**

   ```bash
   cp .env.example .env.local
   ```

2. **Edita el archivo `.env.local`** y completa las siguientes variables **REQUERIDAS**:

   #### Firebase (Requerido)

   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENTID`

   **Dónde obtenerlas**: Ve a [Firebase Console](https://console.firebase.google.com) > Tu proyecto > Configuración del proyecto > Tus aplicaciones > Configuración

   #### Google OAuth (Requerido para login con Google)

   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

   **Dónde obtenerla**: Ve a [Google Cloud Console](https://console.cloud.google.com) > APIs y servicios > Credenciales > Crear credenciales > ID de cliente OAuth 2.0

### Variables Opcionales

Estas variables son opcionales pero recomendadas según las funcionalidades que uses:

- `NEXT_PUBLIC_ONESIGNAL_APP_ID` y `ONESIGNAL_REST_API_KEY` - Para notificaciones push
- `GEMINI_API_KEY` - Para recomendaciones con IA
- `NEXT_PUBLIC_OPEN_ROUTE_DISTANCE` - Para cálculo de distancias
- `NEXT_PUBLIC_SITE_URL` - URL del sitio (por defecto: http://localhost:3000)

### Sincronizar variables desde Vercel

Si ya tienes las variables configuradas en Vercel, puedes exportarlas fácilmente:

1. **Desde la CLI de Vercel:**

   ```bash
   vercel env pull .env.local
   ```

2. **O manualmente:** Copia las variables desde el dashboard de Vercel (Settings > Environment Variables) y pégalas en tu archivo `.env.local`

### Nota de Seguridad

⚠️ **NUNCA** subas los archivos `.env` o `.env.local` al repositorio. Están incluidos en `.gitignore` por seguridad.

## Acceso a la Aplicación

Una vez que el contenedor esté ejecutándose, la aplicación estará disponible en:

- http://localhost:3000

## Notas Importantes

- El Dockerfile utiliza el modo `standalone` de Next.js para optimizar el tamaño de la imagen
- La aplicación se ejecuta en modo producción por defecto
- El puerto 3000 está expuesto por defecto, puedes cambiarlo en `docker-compose.yml` si es necesario
