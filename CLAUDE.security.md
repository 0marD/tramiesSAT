# CLAUDE.security.md — Ciberseguridad

> Lee `CLAUDE.md` primero. Este documento define todas las prácticas de seguridad del proyecto. **Nunca ignorar estas reglas aunque parezca conveniente.**

---

## Principios de Seguridad

1. **Nunca confiar en el cliente.** Toda validación crítica ocurre en el servidor.
2. **Principio de mínimo privilegio.** Cada pieza de código tiene solo el acceso que necesita.
3. **Defense in depth.** Múltiples capas de seguridad. Si falla una, hay otra.
4. **Fail secure.** Cuando algo falla, negar acceso. Nunca conceder por defecto.
5. **Nunca loguear datos sensibles.** Sin passwords, tokens, o datos fiscales en logs.

---

## Variables de Entorno y Secretos

```typescript
// ✅ CORRECTO: Variables de servidor nunca en el cliente
// Las variables sin NEXT_PUBLIC_ solo existen en el servidor
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,  // OK: es pública
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // OK: solo en server
)

// ❌ INCORRECTO: Nunca exponer service role al cliente
// Si un archivo tiene 'use client' y usa SUPABASE_SERVICE_ROLE_KEY → ERROR
```

```typescript
// Validación de que las env vars existen al iniciar la app
// src/lib/env.ts
function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(
      `Variable de entorno faltante: ${key}. ` +
      `Revisa .env.local y .env.example`
    )
  }
  return value
}

export const env = {
  supabaseUrl:            requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey:        requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  mercadopagoToken:       requireEnv('MERCADOPAGO_ACCESS_TOKEN'),
  webhookSecret:          requireEnv('WEBHOOK_SECRET_MERCADOPAGO'),
  cronSecret:             requireEnv('CRON_SECRET'),
  resendApiKey:           requireEnv('RESEND_API_KEY'),
} as const
```

---

## Validación de Inputs con Zod

**Regla: Todo input del usuario pasa por un schema Zod antes de usarse.**

```typescript
// src/lib/validaciones/schemas.ts

import { z } from 'zod'

// ══ RFC ══
// Formato: 4 letras + 6 dígitos fecha (AAMMDD) + 3 alfanuméricos = 13 chars
export const SchemaRfc = z
  .string()
  .transform(v => v.toUpperCase().trim())
  .refine(
    v => /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/.test(v),
    'El RFC no tiene el formato correcto (debe tener 13 caracteres)'
  )

// ══ CURP ══
// 18 caracteres alfanuméricos
export const SchemaCurp = z
  .string()
  .transform(v => v.toUpperCase().trim())
  .refine(
    v => /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(v),
    'La CURP no tiene el formato correcto (debe tener 18 caracteres)'
  )

// ══ Email ══
export const SchemaEmail = z
  .string()
  .email('Ingresa un correo electrónico válido')
  .max(254, 'El correo es muy largo')
  .toLowerCase()

// ══ Progreso de trámite ══
export const SchemaGuardarProgreso = z.object({
  tramiteSlug: z.string().regex(/^[a-z0-9-]+$/, 'Slug inválido').max(100),
  pasoActual:  z.number().int().min(1).max(50),
  respuestas:  z.record(z.string(), z.string()).optional(),
})

// ══ Crear pago ══
export const SchemaCrearPago = z.object({
  tramiteSlug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  tipoPlan:    z.enum(['por_tramite', 'suscripcion_anual']),
})

// ══ Suscripción push ══
export const SchemaPushSubscription = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().max(1024),
    auth:   z.string().max(256),
  }),
})
```

---

## Autenticación y Sesiones

```typescript
// ══ Nunca usar getSession() en Server Components ══
// getSession() lee del cookie, puede ser manipulado por el cliente
// ❌
const { data: { session } } = await supabase.auth.getSession()

// ✅ Siempre usar getUser() que valida el token con Supabase
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) {
  redirect('/login')
}

// ══ Obtener usuario en Server Component ══
// src/lib/supabase/server.ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

export async function createServiceRoleClient() {
  // Solo usar en operaciones que requieren acceso total (webhooks, crons)
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // ← NUNCA exponer al cliente
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}
```

---

## Rate Limiting

```typescript
// src/lib/security/rateLimiter.ts
// Implementación simple con Supabase (sin Redis requerido en fase inicial)
// En producción escalar a Upstash Redis si el tráfico lo requiere

const LIMITES = {
  login:          { intentos: 5,  ventanaSegundos: 300  }, // 5 intentos / 5 min
  crearPago:      { intentos: 10, ventanaSegundos: 3600 }, // 10 / hora
  registrarPush:  { intentos: 5,  ventanaSegundos: 3600 }, // 5 / hora
  webhook:        { intentos: 100, ventanaSegundos: 60  }, // 100 / min (llamadas de MP)
} as const

type AccionLimitada = keyof typeof LIMITES

/**
 * Verifica si una IP/usuario superó el rate limit.
 * Usa la base de datos como store (adecuado para tráfico inicial).
 */
export async function verificarRateLimit(
  identificador: string, // IP o user_id
  accion: AccionLimitada
): Promise<{ permitido: boolean; reintentoEn?: number }> {

  const limite = LIMITES[accion]
  const ventanaInicio = new Date(Date.now() - limite.ventanaSegundos * 1000).toISOString()

  const supabase = createServiceRoleClient()

  // Contar intentos en la ventana de tiempo
  const { count } = await supabase
    .from('rate_limit_log')
    .select('*', { count: 'exact', head: true })
    .eq('identificador', identificador)
    .eq('accion', accion)
    .gte('created_at', ventanaInicio)

  if ((count ?? 0) >= limite.intentos) {
    return {
      permitido: false,
      reintentoEn: limite.ventanaSegundos,
    }
  }

  // Registrar este intento
  await supabase.from('rate_limit_log').insert({
    identificador,
    accion,
  })

  return { permitido: true }
}

// ══ Uso en API Route ══
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  const { permitido, reintentoEn } = await verificarRateLimit(ip, 'crearPago')

  if (!permitido) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Espera unos minutos.' },
      {
        status: 429,
        headers: { 'Retry-After': String(reintentoEn) }
      }
    )
  }
  // ... resto del handler
}
```

---

## Headers de Seguridad HTTP

```typescript
// Configurados en next.config.js (ver CLAUDE.architecture.md)
// Estos headers aplican a todas las rutas:

// X-Frame-Options: DENY
//   Evita que la app sea embebida en iframes (clickjacking)

// X-Content-Type-Options: nosniff
//   Evita que el navegador adivine el MIME type

// Referrer-Policy: strict-origin-when-cross-origin
//   No envía URL completa como referrer a sitios externos

// Permissions-Policy: camera=(), microphone=(), geolocation=()
//   Deshabilita acceso a hardware que no se necesita

// Content-Security-Policy (añadir en producción):
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",      // Next.js requiere inline por ahora
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co https://api.mercadopago.com",
  "frame-ancestors 'none'",
].join('; ')
```

---

## Protección del Webhook de MercadoPago

```typescript
// src/lib/mercadopago/webhook.ts

import crypto from 'crypto'

interface VerificarFirmaParams {
  body: string        // Body crudo como string
  signature: string   // Header x-signature
  requestId: string   // Header x-request-id
  secret: string      // WEBHOOK_SECRET_MERCADOPAGO
}

/**
 * Verifica que el webhook proviene de MercadoPago y no fue manipulado.
 * Usa HMAC-SHA256 como indica la documentación de MP.
 * SIEMPRE llamar esto antes de procesar cualquier webhook.
 */
export function verificarFirmaWebhook(params: VerificarFirmaParams): boolean {
  const { body, signature, requestId, secret } = params

  // Extraer ts y v1 del header x-signature
  // Formato: "ts=1704067200,v1=abc123..."
  const partes = Object.fromEntries(
    signature.split(',').map(p => p.split('=') as [string, string])
  )

  const ts = partes['ts']
  const v1 = partes['v1']

  if (!ts || !v1) return false

  // Verificar que el timestamp no es viejo (max 5 minutos)
  const ahora = Math.floor(Date.now() / 1000)
  if (Math.abs(ahora - parseInt(ts)) > 300) {
    return false
  }

  // Construir el string a firmar
  const templateString = `id:${requestId};request-id:${requestId};ts:${ts};`

  // Calcular HMAC
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(templateString)
    .digest('hex')

  // Comparación segura (evita timing attacks)
  return crypto.timingSafeEqual(
    Buffer.from(hmac, 'hex'),
    Buffer.from(v1, 'hex')
  )
}
```

---

## Protección de Rutas Cron

```typescript
// Las rutas /api/cron/* solo deben ser accesibles por Vercel Cron
// Se protegen con un secret en el header

// src/app/api/cron/recordatorios/route.ts
export async function GET(request: NextRequest) {
  // Verificar que el request viene de Vercel Cron (o nuestro propio servidor)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // ... lógica del cron
}

// vercel.json
// {
//   "crons": [
//     {
//       "path": "/api/cron/recordatorios",
//       "schedule": "0 15 * * *"    // 9am Ciudad de México (UTC-6) = 15:00 UTC
//     }
//   ]
// }
```

---

## Sanitización de Contenido

```typescript
// src/lib/utils/sanitizar.ts
// Para cualquier contenido dinámico que se renderice como HTML

/**
 * Escapa caracteres HTML especiales para prevenir XSS.
 * Usar cuando se renderiza texto del usuario en el DOM.
 * En React con JSX esto es automático — solo necesario con dangerouslySetInnerHTML.
 */
export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// ✅ En React: el JSX escapa automáticamente
// <p>{textoDelUsuario}</p> — SEGURO

// ❌ NUNCA sin sanitizar:
// <p dangerouslySetInnerHTML={{ __html: textoDelUsuario }} /> — PELIGROSO

// ✅ Si necesitas renderizar HTML del servidor (como MDX de /content/):
// Usar next-mdx-remote que sanitiza por defecto
// El contenido de /content/ es nuestro propio código, no input del usuario
```

---

## Datos Sensibles — Qué No Guardar

```typescript
// ❌ NUNCA guardar en la base de datos:
// - Contraseñas (Supabase las maneja)
// - Tokens de acceso completos
// - Números de tarjeta (MercadoPago los maneja)
// - CLABE interbancaria completa
// - RFC + CURP + Nombre completo juntos en una sola tabla sin RLS
// - Datos de terceros sin consentimiento

// ✅ Lo que SÍ guardamos y por qué:
// - tipo_contribuyente → Para personalizar guías (no es dato sensible)
// - mp_payment_id → Para confirmar pagos (ID externo, no datos del pago)
// - endpoint de push → Para notificaciones (sin datos personales)
// - progreso del trámite → Para no perder el avance del usuario
```

---

## Checklist de Seguridad por Feature

Antes de hacer deploy de cualquier feature nueva, verificar:

```
□ ¿Todo input del usuario pasa por un schema Zod?
□ ¿Las API Routes validan la sesión del usuario cuando se requiere?
□ ¿Las operaciones de DB usan el cliente correcto (anon vs service role)?
□ ¿Los webhooks verifican su firma criptográfica?
□ ¿Las rutas cron verifican el CRON_SECRET?
□ ¿Las variables sensibles tienen el prefijo correcto (con/sin NEXT_PUBLIC_)?
□ ¿Hay rate limiting en las rutas que pueden ser abusadas?
□ ¿Los errores no exponen detalles internos al cliente?
□ ¿Se usan comparaciones de tiempo constante (timingSafeEqual) donde aplica?
□ ¿El contenido dinámico está escapado correctamente?
```
