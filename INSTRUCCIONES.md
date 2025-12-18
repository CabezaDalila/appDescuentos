# 📋 Instrucciones para Ejecutar el Proyecto

Este documento contiene las instrucciones paso a paso para ejecutar el proyecto fácilmente.

## 🎯 Forma Más Rápida: Usando Docker

### Requisitos Previos
- **Docker Desktop** instalado y ejecutándose
  - Descarga: https://www.docker.com/products/docker-desktop/
  - Verifica que esté corriendo

### Pasos para Ejecutar

1. **Abrir la terminal** en la carpeta del proyecto

2. **Crear el archivo de variables de entorno:**
   ```bash
   cp .env.example .env.local
   ```

3. **Editar el archivo `.env.local`** con un editor de texto y completar las credenciales.

4. **Ejecutar el proyecto:**
   ```bash
   docker-compose up --build
   ```

5. **Esperar a que aparezca el mensaje:**
   ```
   app-1  | ▲ Next.js 14.2.33
   app-1  | - Local:        http://localhost:3000
   ```

6. **Abrir el navegador** en: http://localhost:3000

### Comandos Útiles

- **Ver los logs:** `docker-compose logs -f`
- **Detener el contenedor:** `docker-compose down`
- **Reiniciar:** `docker-compose restart`
- **Ejecutar en segundo plano:** `docker-compose up -d --build`

---

## 🔧 Forma Alternativa: Sin Docker

Si no se puede usar Docker, el proyecto también puede ejecutarse directamente con Node.js.

### Requisitos Previos
- **Node.js** versión 18 o superior
- **npm** (incluido con Node.js)

### Pasos para Ejecutar

1. **Instalar dependencias:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Crear el archivo `.env.local`** (igual que en la opción Docker)

3. **Ejecutar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

4. **Abrir el navegador** en: http://localhost:3000

---

## ⚠️ Solución de Problemas

### Error: "Cannot connect to Docker daemon"
- **Solución:** Asegúrate de que Docker Desktop esté ejecutándose

### Error: "Firebase: Error (auth/invalid-api-key)"
- **Solución:** Verifica que el archivo `.env.local` tenga todas las variables de Firebase correctamente configuradas

### Error: "Port 3000 is already in use"
- **Solución:** Cambia el puerto en `docker-compose.yml` o detén la aplicación que está usando el puerto 3000

---

## 📁 Archivos Importantes

- **`Dockerfile`**: Configuración para construir la imagen Docker
- **`docker-compose.yml`**: Configuración para ejecutar el contenedor
- **`.env.example`**: Plantilla de variables de entorno
- **`.env.local`**: Archivo con las credenciales reales (NO debe compartirse)

---


