# Roadmap de lanzamiento — App de Descuentos

> Objetivo: llevar el proyecto de "prototipo funcional" a **producto lanzable**.
> Decisiones tomadas: migrar **todo a Supabase** (auth + datos), motor de ingesta
> **multi-fuente híbrido**, cerrar bloqueadores de seguridad primero.

---

## Principios

1. **Migración incremental, no big-bang.** La app sigue viva mientras migramos.
2. **La ingesta es el producto.** Sin descuentos frescos y confiables, no hay app.
3. **No hard-codear un scraper por sitio.** "Todas las fuentes" solo escala con un
   motor de 3 niveles (automático → LLM → manual/curado).
4. **Datos de usuario = responsabilidad legal.** Guardás metadata de tarjetas
   (banco/tipo/marca/nivel, NO números) → política de privacidad obligatoria.

---

## Fase 0 — Estabilizar (bloqueadores de lanzamiento) · ~semana 1

Esto frena cualquier lanzamiento serio. Va primero, en paralelo a la Fase 1.

- [ ] **Auth en las API routes.** Hoy cualquiera puede:
  - `POST /api/notifications/send` con `send_to_all:true` → push a TODOS los usuarios.
  - `POST /api/scraping/modo` → abusar como proxy de scraping.
  - `POST /api/ai/recommendations` → quemar cuota de Gemini.
  - **Fix:** verificar ID token (Firebase/Supabase) + rol admin en cada handler.
- [ ] **Reglas de acceso a datos.** `firestore.rules` niega todo fuera de
  `/users/{uid}`, pero el cliente lee/escribe `discounts` y `scrapingScripts`.
  O están abiertas en modo test, o la app depende de eso. Resolver antes de exponer.
- [ ] **CI mínimo.** GitHub Action con `tsc --noEmit` + `next lint` en cada PR.
  Hoy cada deploy es a ciegas (0 tests, 0 CI).

## Fase 1 — Fundaciones en Supabase · ~semanas 1–2

### Schema relacional (el modelo actual pide esto a gritos)
El tipo `Discount` actual es un objeto plano con `description`+`descripcion`,
`image`+`imageUrl`, arrays sueltos de bancos/memberships → síntoma de Firestore.

```
sources ──< discounts >── categories
                │
   ┌────────────┼─────────────┐
discount_banks  discount_cards  discount_memberships   (N:M)
                │
users ──< user_cards >── cards ── banks
discounts ──< discount_locations   (geo)
raw_discounts   (JSON crudo de cada fuente, pre-normalización)
```

- [ ] Modelar tablas en Supabase (Postgres) + **Drizzle** o **Prisma** como ORM.
- [ ] Consultas clave que hoy sufren en Firestore y acá son triviales:
  *"descuentos activos hoy, categoría super, que apliquen a MI Visa Galicia crédito,
  cerca de mí"* → `JOIN` + índices.
- [ ] **RLS (Row Level Security)**: usuario solo ve/edita sus `user_cards`,
  memberships y perfil; `discounts` es lectura pública, escritura solo admin.

### Auth → Supabase Auth
- [ ] Google OAuth + email/password en Supabase Auth.
- [ ] **Ojo Capacitor/Android**: hoy usás `@codetrix-studio/capacitor-google-auth`.
  Validar el flujo nativo con Supabase (deep link / redirect) en el APK, no solo web.
- [ ] Migrar usuarios existentes (export Firebase Auth → import Supabase).

### Datos
- [ ] Script de migración Firestore → Postgres (discounts, memberships, user data).
- [ ] Storage de imágenes: Firebase Storage → Supabase Storage.

## Fase 2 — Motor de ingesta multi-fuente · ~semanas 2–4  ⭐ EL CORAZÓN

Estrategia **por niveles**, porque "todas las fuentes" es heterogéneo:

| Nivel | Tipo de fuente | Técnica | Ejemplos |
|-------|----------------|---------|----------|
| **A — Automático** | Endpoint JSON interno, sin login | Connector + cron | MODO, algunas billeteras |
| **B — Semi-auto** | JSON detrás de login/token | Connector + sesión | Clubes, bancos logueados |
| **C — LLM-assisted** | Solo HTML/imagen/PDF | Fetch → **Gemini** → JSON estructurado | Bancos con landing estática |
| **D — Manual/crowd** | Sin acceso programático | Panel admin + aporte de usuarios | Locales, promos raras |

### Arquitectura común
```
[connector A]  ┐
[connector B]  ├─→ raw_discounts (JSON crudo) ─→ normalizador ─→ dedup ─→ discounts
[LLM extractor]┘        (histórico, debug)         (schema canónico)   (source+external_id)
       ▲
   Vercel Cron (por fuente, frecuencia configurable)
```

- [ ] **Framework de connectors**: interfaz `fetch() → RawDiscount[]` +
  `normalize(raw) → Discount`. Un archivo por fuente.
- [ ] **MODO primero** (mata tu dolor manual): mover lo que hoy hacés en la consola
  del navegador a un connector server-side que pega a
  `rewards-handler.playdigital.com.ar/slots` + `/landing`, en cron. **Cero manual.**
- [ ] **Extractor LLM genérico** (Nivel C): ya tenés `@google/generative-ai`.
  Fetch del HTML → prompt con schema → `Discount` JSON. Escala a "cualquier fuente"
  sin escribir un parser por sitio. Validar salida con `yup`/zod antes de insertar.
- [ ] **Dedup** por `(source, external_id)` o hash de `(comercio,banco,%,vigencia)`.
- [ ] **Capa de aprobación**: `approvalStatus: pending → approved` antes de publicar
  (ya existe en el modelo). Nada auto-scrapeado se publica sin revisión al principio.
- [ ] **Resiliencia**: si una fuente cambia formato o te bloquea por IP, el resto
  sigue. Guardás `raw` → no perdés histórico.

### ⚠️ Legal (crítico para vender)
- [ ] Consumir endpoints internos de terceros suele violar sus **ToS** y hay tema de
  **propiedad de datos**. Para un producto comercial: combinar con fuentes
  redistribuibles (curado manual, acuerdos con comercios) y tener plan B ante bloqueos.
- [ ] Revisar con alguien de legales antes de monetizar sobre data de terceros.

## Fase 3 — Producto listo para usuarios · ~semanas 4–6

- [ ] **Onboarding de tarjetas = tu diferencial.** El matching "esta promo aplica a
  TU tarjeta" es lo que te distingue de mirar la web del banco. Pulirlo.
- [ ] **Refactor `search/index.tsx`** (1.349 líneas, ~30 `useState/useEffect`) en
  hooks + subcomponentes. Es el core de la experiencia y hoy es inmantenible.
- [ ] **Notificaciones relevantes, no spam**: "nueva promo para tu Galicia Visa",
  no "hay 200 promos". Segmentar por tarjetas del usuario.
- [ ] **Tests de lo crítico**: `lib/discounts.ts`, normalizadores de ingesta,
  matching tarjeta↔descuento, y las API con auth.

## Fase 4 — Go-to-market · ~semanas 6+

- [ ] **Privacidad + Términos** (ya hay `pages/privacy`; completarlo). Data de
  tarjetas aunque sea metadata → declarar qué guardás y por qué.
- [ ] **Analytics** (eventos: alta de tarjeta, promo vista, promo usada, retención).
- [ ] **Publicación**: web (Vercel) + APK (Capacitor). Resolver el toggle manual de
  `next.config.js` (`standalone` web vs `export` Android) → dos configs/scripts.
- [ ] **Monetización**: definir (freemium por # de tarjetas, afiliados con comercios,
  destacar promos, etc.).

---

## Orden de ataque sugerido

```
Fase 0 (seguridad)  ─┐
                     ├─ en paralelo
Fase 1 (Supabase)   ─┘
        ↓
Fase 2 (ingesta) ← acá está el mayor valor y tu mayor dolor
        ↓
Fase 3 (producto) → Fase 4 (lanzar)
```

**Quick win inmediato:** cerrar las 3 APIs (Fase 0) + automatizar MODO server-side
(Fase 2) → en pocos días tenés seguridad + fin del proceso manual.
