# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar gettext para envsubst (opcional, para procesar archivos .env)
RUN apk add --no-cache gettext

# Copiar dependencias del stage anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar archivos del proyecto
COPY . .

# Variables de entorno para el build
ENV NEXT_TELEMETRY_DISABLED 1

# Build arguments para variables de entorno (fallback si .env.local no está disponible)
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_FIREBASE_MEASUREMENTID
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_ONESIGNAL_APP_ID
ARG NEXT_PUBLIC_OPEN_ROUTE_DISTANCE
ARG NEXT_PUBLIC_SITE_URL
ARG GEMINI_API_KEY
ARG ONESIGNAL_REST_API_KEY

# Cargar variables de entorno desde .env.local si existe, sino usar ARGs
RUN if [ -f .env.local ]; then \
      set -a && \
      . .env.local && \
      set +a && \
      npm run build; \
    else \
      echo "Usando variables pasadas como ARG" && \
      export NEXT_PUBLIC_FIREBASE_API_KEY="$NEXT_PUBLIC_FIREBASE_API_KEY" && \
      export NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" && \
      export NEXT_PUBLIC_FIREBASE_PROJECT_ID="$NEXT_PUBLIC_FIREBASE_PROJECT_ID" && \
      export NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" && \
      export NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" && \
      export NEXT_PUBLIC_FIREBASE_APP_ID="$NEXT_PUBLIC_FIREBASE_APP_ID" && \
      export NEXT_PUBLIC_FIREBASE_MEASUREMENTID="$NEXT_PUBLIC_FIREBASE_MEASUREMENTID" && \
      export NEXT_PUBLIC_GOOGLE_CLIENT_ID="$NEXT_PUBLIC_GOOGLE_CLIENT_ID" && \
      export NEXT_PUBLIC_ONESIGNAL_APP_ID="$NEXT_PUBLIC_ONESIGNAL_APP_ID" && \
      export NEXT_PUBLIC_OPEN_ROUTE_DISTANCE="$NEXT_PUBLIC_OPEN_ROUTE_DISTANCE" && \
      export NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL" && \
      export GEMINI_API_KEY="$GEMINI_API_KEY" && \
      export ONESIGNAL_REST_API_KEY="$ONESIGNAL_REST_API_KEY" && \
      npm run build; \
    fi

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copiar archivos de build de Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]

