# CLAUDE.flows.md — Flujos de Usuario y Lógica de Negocio

> Lee `CLAUDE.md` primero. Este documento define los flujos completos de usuario, máquinas de estado y la lógica de negocio de cada feature.

---

## Flujo 1 — Selección y Diagnóstico de Trámite

```
PANTALLA HOME
│
│  El usuario ve 5 tarjetas de trámites.
│  Cada tarjeta muestra: nombre, descripción corta, duración estimada.
│  Sin registro requerido para ver el home.
│
└─► [Usuario toca una tarjeta]
        │
        ▼
    PANTALLA DE LANDING DEL TRÁMITE
    /tramite/[slug]
        │
        │  Muestra: qué es el trámite, qué necesita, cuánto tarda.
        │  CTA: "Empezar" → inicia el flujo.
        │
        └─► [Usuario toca "Empezar"]
                │
                ▼
            PANTALLA DE DIAGNÓSTICO
            /tramite/[slug]/diagnostico
                │
                │  2-3 preguntas de opción múltiple.
                │  Sin texto libre. Todo es tap en tarjetas.
                │  Ejemplo RFC: "¿Tienes CURP?" → Sí / No
                │                "¿Trabajas para una empresa?" → Sí / No / Ambas
                │
                │  Las respuestas determinan qué pasos mostrar.
                │  Se guardan en sessionStorage (sin login) o en DB (con login).
                │
                └─► [Usuario completa diagnóstico]
                        │
                        ▼
                    PANTALLA DE DOCUMENTOS
                    /tramite/[slug]/documentos
                        │
                        │  Lista personalizada de documentos necesarios.
                        │  Cada documento tiene checkbox.
                        │  El CTA "Ya tengo todo" solo se activa cuando todos están marcados.
                        │
                        └─► [Usuario marca todos y toca "Ya tengo todo"]
                                │
                                ▼
                            FLUJO DE PAGO (si el trámite requiere pago)
                            Ver Flujo 3
                                │
                                ▼
                            PANTALLA DEL PASO 1
                            /tramite/[slug]/guia/1
```

---

## Flujo 2 — Paso a Paso de la Guía

```
PANTALLA DE PASO N
/tramite/[slug]/guia/[paso]
│
│  Estructura de la pantalla:
│  ┌─────────────────────────────┐
│  │ Header: Logo | Paso 3 de 7  │
│  ├─────────────────────────────┤
│  │ BarraProgreso (43%)         │
│  ├─────────────────────────────┤
│  │                             │
│  │ Título del paso             │
│  │ Instrucción en 1 oración    │
│  │                             │
│  │ [Imagen: captura del SAT    │
│  │  con anotaciones]           │
│  │                             │
│  │ [Botón: ¿Qué significa esto?│
│  │  → despliega explicación]   │
│  │                             │
│  ├─────────────────────────────┤
│  │ [CTA: Hecho, siguiente paso]│
│  └─────────────────────────────┘
│
├─► [Usuario toca "Hecho, siguiente paso"]
│       │
│       ├─► Si hay sesión: guardar progreso en DB
│       ├─► Si no hay sesión: guardar en sessionStorage
│       │
│       ▼
│   ¿Era el último paso?
│   ├─► NO → Navegar a /tramite/[slug]/guia/[paso + 1]
│   └─► SÍ  → Navegar a pantalla de ÉXITO
│
├─► [Usuario toca "¿Qué significa esto?"]
│       │
│       ▼
│   Abre un BottomSheet (drawer desde abajo)
│   con la explicación simple del término o campo.
│   Toca fuera o "Entendí" para cerrar.
│
└─► [Usuario toca "Regresar"]
        │
        ▼
    Navegar al paso anterior.
    Mantener progreso guardado.
```

### Máquina de Estado del Paso

```typescript
// src/hooks/usePaso.ts

type EstadoPaso =
  | 'cargando'
  | 'listo'          // Mostrando el paso, esperando acción del usuario
  | 'completando'    // Guardando progreso (spinner)
  | 'completado'     // Guardado exitoso, navegando al siguiente
  | 'error'          // Falló al guardar, mostrar opción de reintentar

interface EstadoHook {
  estado: EstadoPaso
  pasoActual: number
  totalPasos: number
  paso: Paso | null
  avanzar: () => Promise<void>
  retroceder: () => void
}

export function usePaso(slug: string, numeroPaso: number): EstadoHook {
  const [estado, setEstado] = useState<EstadoPaso>('cargando')

  const avanzar = useCallback(async () => {
    setEstado('completando')

    const resultado = await guardarProgreso({
      tramiteSlug: slug,
      pasoActual: numeroPaso + 1,
    })

    if (!resultado.exito) {
      setEstado('error')
      return
    }

    setEstado('completado')

    if (numeroPaso >= totalPasos) {
      router.push(`/tramite/${slug}/exito`)
    } else {
      router.push(`/tramite/${slug}/guia/${numeroPaso + 1}`)
    }
  }, [slug, numeroPaso])

  return { estado, pasoActual: numeroPaso, totalPasos, paso, avanzar, retroceder }
}
```

---

## Flujo 3 — Pago con MercadoPago

```
USUARIO QUIERE ACCEDER A TRÁMITE DE PAGO
│
├─► ¿El usuario tiene plan anual activo?
│       └─► SÍ → Acceso directo a documentos. Fin.
│
└─► ¿El usuario desbloqueó este trámite específico antes?
        └─► SÍ → Acceso directo a documentos. Fin.
        └─► NO → Mostrar MODAL DE PAGO

MODAL DE PAGO
│
│  Opción A: "Solo este trámite — $59 MXN"
│  Opción B: "Acceso anual a todo — $349 MXN/año"
│            (destacada como "Mejor valor")
│
└─► [Usuario elige opción]
        │
        ▼
    CREAR PREFERENCIA (Server — API Route)
    POST /api/pagos/crear
        │
        │  1. Validar que el usuario tiene sesión
        │  2. Verificar que no tiene acceso ya (doble check)
        │  3. Crear registro en tabla `pagos` con estado 'pendiente'
        │  4. Llamar a MercadoPago SDK para crear preferencia
        │  5. Retornar { preferenceId, initPoint }
        │
        ▼
    REDIRIGIR A MERCADOPAGO
    window.location.href = initPoint
        │
        │  El usuario completa el pago en la plataforma de MP.
        │  MP maneja: tarjeta, OXXO, SPEI, débito.
        │
        ▼
    MERCADOPAGO LLAMA AL WEBHOOK
    POST /api/pagos/webhook
        │
        │  1. Verificar firma del webhook (HMAC-SHA256)
        │  2. Si tipo === 'payment': consultar estado del pago a MP
        │  3. Si estado === 'approved':
        │     a. Actualizar pago en DB → estado: 'aprobado'
        │     b. Si tipo === 'por_tramite': insertar en tramites_desbloqueados
        │     c. Si tipo === 'suscripcion_anual': actualizar perfiles.plan y plan_vence_en
        │     d. Crear recordatorios según tipo_contribuyente
        │  4. Si estado === 'rejected': actualizar pago → estado: 'rechazado'
        │
        ▼
    USUARIO REGRESA A LA APP
    /tramite/[slug]/documentos?pago=exitoso
        │
        │  La app verifica el estado del pago en DB.
        │  Si aprobado → continuar a documentos.
        │  Si pendiente → mostrar "Verificando pago..." con polling cada 3s.
        │  Si rechazado → mostrar error con opción de reintentar.
```

### Implementación del Webhook

```typescript
// src/app/api/pagos/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { verificarFirmaWebhook, consultarPago } from '@/lib/mercadopago/client'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text() // texto crudo para verificar firma
  const signature = request.headers.get('x-signature') ?? ''
  const requestId = request.headers.get('x-request-id') ?? ''

  // 1. SIEMPRE verificar la firma antes de procesar
  const firmaValida = verificarFirmaWebhook({
    body,
    signature,
    requestId,
    secret: process.env.WEBHOOK_SECRET_MERCADOPAGO!,
  })

  if (!firmaValida) {
    logger.warn('webhook_firma_invalida', { requestId })
    return NextResponse.json({ error: 'Firma inválida' }, { status: 401 })
  }

  const evento = JSON.parse(body)

  // Solo procesar eventos de tipo 'payment'
  if (evento.type !== 'payment') {
    return NextResponse.json({ ok: true }, { status: 200 })
  }

  const pagoId = evento.data.id

  try {
    // 2. Consultar estado real del pago (no confiar en el webhook)
    const pago = await consultarPago(pagoId)

    const supabase = createServiceRoleClient()

    if (pago.status === 'approved') {
      await procesarPagoAprobado(supabase, pago)
    } else if (pago.status === 'rejected' || pago.status === 'cancelled') {
      await supabase
        .from('pagos')
        .update({ estado: pago.status === 'rejected' ? 'rechazado' : 'cancelado' })
        .eq('mp_payment_id', String(pagoId))
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    logger.error('webhook_procesamiento_fallo', { error, pagoId })
    // Retornar 500 para que MP reintente el webhook
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
```

---

## Flujo 4 — Autenticación

```
USUARIO SIN SESIÓN INTENTA ACCEDER A /historial
│
▼
MIDDLEWARE redirige a /login?redirigir=/historial

PANTALLA DE LOGIN /login
│
│  Opción A: Email + contraseña
│  Opción B: "Entrar con Google" (OAuth)
│  Opción C: "Envíame un link al correo" (Magic Link — recomendado)
│
│  Para usuarios sin educación formal: Magic Link es lo más simple.
│  No requiere recordar contraseña. Solo verificar el correo.
│
├─► [Magic Link]
│       │
│       ▼
│   Supabase envía email con link seguro.
│   Usuario toca el link → redirige a /auth/callback
│   → Supabase confirma sesión → redirige a la URL original (/historial)
│
├─► [Google OAuth]
│       │
│       ▼
│   Redirigir a Google → Usuario autoriza → Callback en /auth/callback
│   → Supabase confirma → redirigir a destino original
│
└─► [Email + Contraseña]
        │
        ▼
    Validar con Zod en cliente (UX)
    → Llamar a supabase.auth.signInWithPassword()
    → Si error: mostrar mensaje específico (no "credenciales incorrectas", sino
      "No encontramos esa cuenta" o "La contraseña no es correcta")
    → Si éxito: redirigir a destino original
```

---

## Flujo 5 — Recordatorios y Notificaciones Push

```
USUARIO COMPLETA PAGO (webhook aprobado)
│
▼
CREAR RECORDATORIOS AUTOMÁTICAMENTE (en el webhook)
    │
    │  Según tipo_contribuyente del perfil:
    │  - asalariado → declaracion_anual_abril (30 de abril del año siguiente)
    │  - freelancer → iva_mensual (17 de cada mes), isr_mensual (17 de cada mes)
    │  - negocio_propio → igual que freelancer + declaracion_anual_abril
    │
    ▼
CRON JOB: cada día a las 9am (hora Ciudad de México)
Vercel Cron → GET /api/cron/recordatorios
    │
    │  Query: recordatorios donde fecha_vencimiento está en:
    │    - exactamente 30 días → notificado_30 = false
    │    - exactamente 7 días  → notificado_7 = false
    │    - exactamente 1 día   → notificado_1 = false
    │
    ▼
PARA CADA RECORDATORIO PENDIENTE:
    │
    ├─► Obtener push_subscriptions activas del usuario
    ├─► Enviar Web Push notification
    ├─► Marcar recordatorio como notificado (notificado_30/7/1 = true)
    └─► Si falla el push: marcar subscription como inactiva (endpoint expiró)

ESTRUCTURA DE NOTIFICACIÓN PUSH:
{
  title: "TrámiteSAT",
  body: "Tu declaración vence en 7 días. Hazla hoy y evita multas.",
  icon: "/icons/icon-192.png",
  badge: "/icons/badge-72.png",
  data: {
    url: "/vencimientos",
    tramiteSlug: "declaracion-anual"
  },
  actions: [
    { action: "ver_guia", title: "Ver guía" },
    { action: "dismiss", title: "Ahora no" }
  ]
}
```

---

## Flujo 6 — Onboarding de Nuevo Usuario

```
USUARIO RECIÉN REGISTRADO (primer acceso post-auth)
│
├─► Trigger en DB crea perfil con plan: 'gratuito'
│
▼
PANTALLA DE BIENVENIDA (solo una vez)
    │
    │  "¡Hola! Cuéntanos un poco sobre ti para darte
    │   guías más precisas."
    │
    │  Pregunta: ¿Cómo trabajas principalmente?
    │  □ Trabajo para una empresa (asalariado)
    │  □ Trabajo por mi cuenta (freelancer)
    │  □ Tengo mi propio negocio
    │  □ Estoy empezando (primera vez en el SAT)
    │
    │  Este dato personaliza las recomendaciones y los recordatorios.
    │
    ▼
GUARDAR tipo_contribuyente en perfiles
    │
    ▼
PANTALLA HOME con trámites recomendados según tipo
    │
    │  asalariado → destacar: RFC, Declaración Anual
    │  freelancer → destacar: RFC, CFDI, Contraseña SAT
    │  negocio_propio → destacar: RFC, e.firma, CFDI
    │  nuevo → destacar: RFC, Contraseña SAT (en ese orden)
```

---

## Reglas de Acceso a Trámites

```typescript
// src/lib/tramites/acceso.ts

/**
 * Determina si un usuario puede acceder al contenido completo de un trámite.
 * Las guías gratuitas son accesibles para todos.
 * Las guías de pago requieren: plan anual activo O trámite desbloqueado individualmente.
 */
export async function verificarAccesoTramite(
  tramiteSlug: string,
  userId: string | null
): Promise<{ tieneAcceso: boolean; razon: 'gratuito' | 'anual' | 'desbloqueado' | 'sin_acceso' }> {

  // 1. ¿El trámite es gratuito?
  const tramite = await obtenerTramitePorSlug(tramiteSlug)
  if (!tramite?.requierePago) {
    return { tieneAcceso: true, razon: 'gratuito' }
  }

  // 2. Sin usuario → no tiene acceso
  if (!userId) {
    return { tieneAcceso: false, razon: 'sin_acceso' }
  }

  const supabase = await createServerClient()

  // 3. ¿Tiene plan anual activo?
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('plan, plan_vence_en')
    .eq('id', userId)
    .single()

  if (perfil?.plan === 'anual' && perfil.plan_vence_en) {
    const vence = new Date(perfil.plan_vence_en)
    if (vence > new Date()) {
      return { tieneAcceso: true, razon: 'anual' }
    }
  }

  // 4. ¿Tiene el trámite desbloqueado individualmente?
  const { data: desbloqueado } = await supabase
    .from('tramites_desbloqueados')
    .select('id')
    .eq('user_id', userId)
    .eq('tramite_slug', tramiteSlug)
    .single()

  if (desbloqueado) {
    return { tieneAcceso: true, razon: 'desbloqueado' }
  }

  return { tieneAcceso: false, razon: 'sin_acceso' }
}
```

---

## Estados de la Aplicación (Resumen)

| Feature | Estado Posibles |
|---|---|
| Paso de guía | `cargando` → `listo` → `completando` → `completado` \| `error` |
| Pago | `idle` → `creando_preferencia` → `redirigiendo` → `verificando` → `aprobado` \| `rechazado` \| `pendiente` |
| Autenticación | `cargando` → `autenticado` \| `invitado` |
| Push | `no_soportado` → `no_suscrito` → `solicitando_permiso` → `suscrito` \| `denegado` |
| Checklist | `incompleto` → `listo` (todos marcados) |
