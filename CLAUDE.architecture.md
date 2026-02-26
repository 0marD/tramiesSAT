# CLAUDE.architecture.md — Arquitectura del Sistema

> Lee `CLAUDE.md` primero. Este documento detalla la estructura del proyecto, patrones arquitectónicos y convenciones de organización de código.

---

## Estructura de Carpetas

```
tramitesat/
├── public/
│   ├── manifest.json              # PWA manifest
│   ├── icons/                     # Íconos de la PWA (192, 512, maskable)
│   └── screenshots/               # Capturas del SAT anotadas (assets estáticos)
│       ├── rfc/
│       │   ├── paso-01-curp.webp
│       │   ├── paso-02-datos.webp
│       │   └── ...
│       └── declaracion-anual/
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # Root layout: fuentes, providers, metadata
│   │   ├── page.tsx               # Home: selector de trámites
│   │   ├── error.tsx              # Error boundary global
│   │   ├── not-found.tsx          # 404
│   │   │
│   │   ├── (public)/              # Rutas sin autenticación requerida
│   │   │   └── tramite/
│   │   │       └── [slug]/
│   │   │           ├── page.tsx               # Landing SEO del trámite
│   │   │           ├── diagnostico/
│   │   │           │   └── page.tsx           # Preguntas de diagnóstico
│   │   │           ├── documentos/
│   │   │           │   └── page.tsx           # Checklist de documentos
│   │   │           └── guia/
│   │   │               └── [paso]/
│   │   │                   └── page.tsx       # Paso a paso
│   │   │
│   │   ├── (auth)/                # Rutas de autenticación
│   │   │   ├── login/page.tsx
│   │   │   ├── registro/page.tsx
│   │   │   └── callback/page.tsx  # OAuth callback de Supabase
│   │   │
│   │   ├── (app)/                 # Rutas protegidas (requieren sesión)
│   │   │   ├── layout.tsx         # Layout con BottomNav y verificación de sesión
│   │   │   ├── historial/page.tsx
│   │   │   ├── vencimientos/page.tsx
│   │   │   └── cuenta/
│   │   │       ├── page.tsx
│   │   │       └── suscripcion/page.tsx
│   │   │
│   │   └── api/                   # API Routes (solo server-side)
│   │       ├── pagos/
│   │       │   ├── crear/route.ts          # POST: crea preferencia MP
│   │       │   └── webhook/route.ts        # POST: webhook de MercadoPago
│   │       ├── push/
│   │       │   ├── subscribe/route.ts      # POST: registra suscripción push
│   │       │   └── send/route.ts           # POST: envía notificación (cron)
│   │       └── cron/
│   │           └── recordatorios/route.ts  # GET: disparado por Vercel Cron
│   │
│   ├── components/
│   │   ├── ui/                    # shadcn/ui (no modificar directamente)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── progress.tsx
│   │   │   └── ...
│   │   │
│   │   ├── tramite/               # Componentes específicos de trámites
│   │   │   ├── TramiteCard.tsx          # Tarjeta en la pantalla home
│   │   │   ├── DiagnosticoForm.tsx      # Preguntas de diagnóstico
│   │   │   ├── ChecklistDocumentos.tsx  # Lista de documentos requeridos
│   │   │   ├── PasoGuia.tsx             # Un paso individual de la guía
│   │   │   ├── BarraProgreso.tsx        # Progreso del trámite
│   │   │   └── BotonAyuda.tsx           # Ayuda contextual de un campo
│   │   │
│   │   ├── layout/                # Estructura global de la app
│   │   │   ├── Header.tsx               # Barra superior
│   │   │   ├── BottomNav.tsx            # Navegación inferior mobile
│   │   │   └── PageContainer.tsx        # Wrapper con padding y max-width
│   │   │
│   │   ├── pagos/
│   │   │   ├── ModalPago.tsx            # Modal de selección de plan
│   │   │   └── BotonPagar.tsx           # Botón que inicia flujo de pago
│   │   │
│   │   └── shared/                # Componentes genéricos reutilizables
│   │       ├── EstadoVacio.tsx          # Pantalla sin contenido
│   │       ├── EstadoCargando.tsx       # Skeleton loading
│   │       ├── EstadoError.tsx          # Error con reintentar
│   │       └── InsigniaEstado.tsx       # Badge de estado (activo, vencido, etc.)
│   │
│   ├── hooks/                     # Custom hooks
│   │   ├── useTramite.ts          # Estado y acciones del trámite activo
│   │   ├── usePaso.ts             # Navegación entre pasos
│   │   ├── useProgreso.ts         # Progreso guardado del usuario
│   │   ├── usePago.ts             # Flujo de pago con MercadoPago
│   │   ├── usePush.ts             # Suscripción a notificaciones push
│   │   └── useUsuario.ts          # Sesión y datos del usuario autenticado
│   │
│   ├── lib/                       # Lógica de negocio y utilidades
│   │   ├── supabase/
│   │   │   ├── client.ts          # Cliente para componentes del navegador
│   │   │   ├── server.ts          # Cliente para Server Components y API Routes
│   │   │   └── middleware.ts      # Cliente para middleware.ts
│   │   ├── mercadopago/
│   │   │   ├── client.ts          # Inicialización del SDK
│   │   │   └── preferencias.ts    # Funciones para crear preferencias de pago
│   │   ├── push/
│   │   │   └── notificaciones.ts  # Lógica de Web Push
│   │   ├── validaciones/
│   │   │   ├── rfc.ts             # Validador de RFC mexicano
│   │   │   ├── curp.ts            # Validador de CURP
│   │   │   └── schemas.ts         # Schemas Zod reutilizables
│   │   └── utils/
│   │       ├── fecha.ts           # Formateo de fechas en es-MX
│   │       ├── texto.ts           # Slugify, truncar, capitalizar
│   │       └── logger.ts          # Logger estructurado (wraps console en prod)
│   │
│   ├── types/                     # Tipos TypeScript del dominio
│   │   ├── tramite.ts
│   │   ├── usuario.ts
│   │   ├── pago.ts
│   │   └── database.ts            # Tipos generados por Supabase CLI
│   │
│   ├── constants/                 # Valores constantes del negocio
│   │   ├── tramites.ts            # IDs, slugs y metadatos de trámites
│   │   ├── planes.ts              # Precios y features de cada plan
│   │   └── vencimientos.ts        # Fechas y reglas de recordatorios
│   │
│   └── content/                   # Contenido de las guías (MDX/JSON)
│       └── tramites/
│           ├── rfc-persona-fisica/
│           │   ├── meta.json            # Metadatos del trámite
│           │   ├── diagnostico.json     # Preguntas y opciones
│           │   ├── documentos.json      # Lista de documentos requeridos
│           │   └── pasos/
│           │       ├── 01-acceder-sat.mdx
│           │       ├── 02-ingresar-curp.mdx
│           │       └── ...
│           ├── contrasena-sat/
│           ├── efirma/
│           ├── declaracion-anual/
│           └── cfdi-40/
│
├── middleware.ts                  # Protección de rutas, redirección auth
├── next.config.js                 # Config Next.js + next-pwa
├── tailwind.config.ts             # Tokens de diseño de la marca
├── tsconfig.json                  # TypeScript estricto
├── .env.example                   # Variables de entorno (sin valores)
└── CLAUDE.md                      # ← Empezar aquí
```

---

## Patrones Arquitectónicos

### 1. Server Components por Defecto

```typescript
// ✅ Por defecto: Server Component (sin directiva)
// Obtiene datos directamente, sin useEffect, sin estado de carga
// src/app/(public)/tramite/[slug]/page.tsx

import { obtenerTramite } from '@/lib/tramites/consultas'
import { TramiteCard } from '@/components/tramite/TramiteCard'

interface Props {
  params: { slug: string }
}

export default async function PaginaTramite({ params }: Props) {
  // Fetch directo en el servidor — sin useEffect, sin loading state manual
  const tramite = await obtenerTramite(params.slug)

  if (!tramite) {
    notFound()
  }

  return <TramiteCard tramite={tramite} />
}

// ✅ Generar metadata dinámica para SEO
export async function generateMetadata({ params }: Props) {
  const tramite = await obtenerTramite(params.slug)
  return {
    title: `${tramite?.nombre} paso a paso — TrámiteSAT`,
    description: tramite?.descripcionSeo,
  }
}
```

### 2. Client Components Solo Cuando es Necesario

```typescript
// ✅ Client Component solo cuando hay: interactividad, estado, efectos, browser APIs
'use client'

// src/components/tramite/ChecklistDocumentos.tsx
import { useState } from 'react'
import type { Documento } from '@/types/tramite'

interface Props {
  documentos: Documento[]
  onTodosListos: () => void
}

export function ChecklistDocumentos({ documentos, onTodosListos }: Props) {
  const [marcados, setMarcados] = useState<Set<string>>(new Set())

  const toggleDocumento = (id: string) => {
    setMarcados(prev => {
      const nuevo = new Set(prev)
      nuevo.has(id) ? nuevo.delete(id) : nuevo.add(id)
      return nuevo
    })
  }

  const todosListos = marcados.size === documentos.length

  return (
    // JSX del componente
  )
}
```

### 3. Data Fetching con Server Actions

```typescript
// src/lib/tramites/acciones.ts
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Result } from '@/types/comun'

const SchemaGuardarProgreso = z.object({
  tramiteId: z.string().uuid(),
  pasoActual: z.number().int().positive(),
})

export async function guardarProgreso(
  input: z.infer<typeof SchemaGuardarProgreso>
): Promise<Result<void>> {
  // 1. Validar input (nunca confiar en el cliente)
  const validado = SchemaGuardarProgreso.safeParse(input)
  if (!validado.success) {
    return { exito: false, error: 'Datos inválidos' }
  }

  // 2. Obtener sesión del servidor (nunca del cliente)
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { exito: false, error: 'Sesión expirada' }
  }

  // 3. Operación con DB
  const { error } = await supabase
    .from('user_progreso')
    .upsert({
      user_id: user.id,
      tramite_id: validado.data.tramiteId,
      paso_actual: validado.data.pasoActual,
      updated_at: new Date().toISOString(),
    })

  if (error) {
    logger.error('guardar_progreso_fallo', { error, userId: user.id })
    return { exito: false, error: 'No pudimos guardar tu progreso' }
  }

  // 4. Revalidar cache de la ruta si es necesario
  revalidatePath('/historial')

  return { exito: true, datos: undefined }
}
```

### 4. Tipo Result para Manejo de Errores

```typescript
// src/types/comun.ts

/**
 * Tipo discriminado para operaciones que pueden fallar.
 * Evita el uso de excepciones para control de flujo.
 */
export type Result<T> =
  | { exito: true; datos: T }
  | { exito: false; error: string }

// Uso:
const resultado = await guardarProgreso({ tramiteId, pasoActual })
if (!resultado.exito) {
  mostrarError(resultado.error)
  return
}
// En este punto TypeScript sabe que resultado.datos existe
usarDatos(resultado.datos)
```

### 5. Contenido de Guías como Archivos Estáticos

```typescript
// El contenido de los trámites vive en /src/content/ como JSON/MDX.
// Nunca en la base de datos — es contenido que cambia con el código,
// se versiona en git y se despliega junto con la app.

// src/content/tramites/rfc-persona-fisica/meta.json
{
  "slug": "rfc-persona-fisica",
  "nombre": "RFC para persona física",
  "descripcion": "Obtén tu registro en el SAT",
  "descripcionSeo": "Cómo sacar el RFC paso a paso en 2024. Guía actualizada con capturas del SAT.",
  "duracionMinutos": 10,
  "requiereAuth": false,
  "requierePago": false,
  "categoria": "identidad",
  "version": "2024.3",
  "ultimaActualizacion": "2024-10-15"
}
```

---

## Middleware — Protección de Rutas

```typescript
// middleware.ts (raíz del proyecto)
import { createMiddlewareClient } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas que requieren sesión activa
const RUTAS_PROTEGIDAS = ['/historial', '/vencimientos', '/cuenta']

// Rutas que no deben mostrarse si ya hay sesión
const RUTAS_SOLO_INVITADO = ['/login', '/registro']

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request)

  // Refrescar sesión en cada request (Supabase lo requiere)
  const { data: { session } } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname

  // Redirigir a login si ruta protegida y sin sesión
  if (RUTAS_PROTEGIDAS.some(r => pathname.startsWith(r)) && !session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirigir', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirigir a historial si ya tiene sesión y visita login/registro
  if (RUTAS_SOLO_INVITADO.some(r => pathname.startsWith(r)) && session) {
    return NextResponse.redirect(new URL('/historial', request.url))
  }

  return response
}

export const config = {
  // Aplicar middleware a todas las rutas excepto estáticos y API internas de Next
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|screenshots).*)'],
}
```

---

## Configuración PWA

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // Capturas del SAT: cache-first (rara vez cambian)
    {
      urlPattern: /\/screenshots\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'screenshots-v1',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 días
        },
      },
    },
    // Íconos y fuentes: cache-first
    {
      urlPattern: /\.(woff2|woff|ttf)$/,
      handler: 'CacheFirst',
      options: { cacheName: 'fonts-v1' },
    },
    // Páginas de la app: network-first (actualización inmediata)
    {
      urlPattern: /^\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-v1',
        networkTimeoutSeconds: 5,
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Seguridad: headers HTTP
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
  // Solo permitir imágenes del dominio propio y Supabase Storage
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}

module.exports = withPWA(nextConfig)
```

---

## Tokens de Tailwind (Design System)

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Marca TrámiteSAT (ver CLAUDE.brand.md para uso semántico)
        marca: {
          profundo:  '#1A2E44', // Azul profundo — primario
          accion:    '#2563EB', // Azul acción — CTAs
          suave:     '#DBEAFE', // Azul suave — fondos
        },
        // Semánticos — usar estos en la UI, no los de marca directamente
        exito:     { DEFAULT: '#16A34A', suave: '#F0FDF4' },
        alerta:    { DEFAULT: '#EA580C', suave: '#FFF7ED' },
        error:     { DEFAULT: '#DC2626', suave: '#FEF2F2' },
      },
      fontFamily: {
        // Inter desde Google Fonts (configurado en layout.tsx)
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // JetBrains Mono solo para código/RFC/CURP
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      spacing: {
        // Grid base: múltiplos de 4px
        // Los valores default de Tailwind ya son múltiplos de 4, no cambiar
      },
      borderRadius: {
        input: '4px',   // Inputs
        btn:   '8px',   // Botones
        card:  '12px',  // Tarjetas
        modal: '16px',  // Modales
      },
      // Alturas fijas de la app (para el layout de 3 zonas)
      height: {
        header:     '64px',
        bottomnav:  '80px',
      },
    },
  },
  plugins: [],
}

export default config
```

---

## Convenciones de API Routes

```typescript
// Toda API Route sigue esta estructura:
// src/app/api/[recurso]/[accion]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// 1. Schema de validación al inicio del archivo
const Schema = z.object({ ... })

// 2. Handler con nombre HTTP explícito
export async function POST(request: NextRequest): Promise<NextResponse> {
  // 3. Validar método implícito (Next.js ya lo hace, pero ser explícito)

  // 4. Parsear y validar body
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const validado = Schema.safeParse(body)
  if (!validado.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', detalles: validado.error.flatten() },
      { status: 400 }
    )
  }

  // 5. Lógica de negocio
  try {
    const resultado = await procesarLogica(validado.data)
    return NextResponse.json(resultado, { status: 200 })
  } catch (error) {
    logger.error('api_error', { error, ruta: '/api/...' })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
```

---

## Escalabilidad — Decisiones de Diseño

| Decisión | Justificación |
|---|---|
| Contenido en archivos, no en DB | Los trámites cambian con el código. Versionado en git. Sin joins complejos para leer una guía. |
| Un slug = una URL canónica | SEO limpio. Cada trámite tiene su propio ranking. Fácil de compartir. |
| Server Components por defecto | Menos JS en el cliente. Mejor rendimiento en móviles con datos lentos. |
| Supabase RLS para todo | La seguridad está en la base de datos, no solo en la app. Si hay un bug en el código, RLS protege los datos. |
| Zod en servidor Y cliente | Doble validación. El cliente valida para UX. El servidor valida porque nunca confía en el cliente. |
| Result type en lugar de exceptions | Las excepciones no controladas crashean la app. Result type fuerza al desarrollador a manejar el error. |
