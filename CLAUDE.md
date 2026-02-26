# TrámiteSAT — CLAUDE.md Principal

> Documento de referencia técnica para agentes de IA y desarrolladores.
> Este archivo es el punto de entrada. Lee este archivo primero, luego navega a los subdocumentos según la tarea.

---

## ¿Qué es TrámiteSAT?

TrámiteSAT es una **PWA (Progressive Web App)** que guía paso a paso a personas físicas mexicanas en sus trámites del SAT. No es un despacho contable, no hace los trámites por el usuario: es una guía interactiva, personalizada y siempre actualizada.

**Audiencia objetivo:** Personas sin formación contable o técnica. El lenguaje de la app debe ser equivalente a nivel secundaria. Nunca usar tecnicismos sin explicarlos.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Supabase · MercadoPago · Vercel

---

## Mapa de Documentos

| Archivo | Contenido |
|---|---|
| `CLAUDE.md` | **Este archivo.** Visión general, reglas globales, mapa de docs |
| `CLAUDE.architecture.md` | Arquitectura del sistema, estructura de carpetas, patrones |
| `CLAUDE.database.md` | Esquema de base de datos, RLS policies, tipos TypeScript |
| `CLAUDE.flows.md` | Flujos de usuario completos, máquinas de estado, lógica |
| `CLAUDE.security.md` | Ciberseguridad, autenticación, validaciones, rate limiting |
| `CLAUDE.brand.md` | Tokens de diseño, componentes UI, voz y tono en código |
| `CLAUDE.testing.md` | Estrategia de pruebas, convenciones, ejemplos |

---

## Reglas Globales — Leer Siempre

Estas reglas aplican en TODOS los archivos del proyecto sin excepción.

### Lenguaje y Tipado

```
- TypeScript estricto en todo el proyecto. Nunca usar `any`.
- Activar: strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes en tsconfig.
- Todos los tipos de dominio viven en /src/types/. Nunca definir tipos inline en componentes.
- Usar `type` para uniones/intersecciones simples, `interface` para objetos extensibles.
```

### Nombrado

```
- Archivos de componentes: PascalCase → PasoGuia.tsx
- Archivos de utilidades/hooks: camelCase → useTramite.ts
- Constantes globales: SCREAMING_SNAKE_CASE → MAX_PASOS_POR_TRAMITE
- Variables y funciones: camelCase descriptivo → tramiteActivo, obtenerPasoActual
- Nunca abreviar sin contexto: `usr` ❌  `usuario` ✅
- Nunca nombres de una letra salvo índices de loop: `i`, `j`
```

### Funciones y Componentes

```
- Una función = una responsabilidad. Si hace dos cosas, separarla.
- Máximo 40 líneas por función. Más → refactorizar.
- Máximo 200 líneas por archivo de componente. Más → dividir.
- Preferir funciones puras. Si una función tiene efectos secundarios, documentarlos.
- Todos los parámetros de función deben tener tipo explícito.
- Todas las funciones async deben manejar errores con try/catch o Result type.
```

### Imports

```typescript
// Orden de imports (siempre en este orden, separados por línea en blanco):
// 1. React y Next.js
import { useState, useCallback } from 'react'
import { redirect } from 'next/navigation'

// 2. Librerías externas
import { z } from 'zod'

// 3. Componentes internos (alias @/)
import { Button } from '@/components/ui/button'
import { TramiteCard } from '@/components/tramite/TramiteCard'

// 4. Hooks internos
import { useTramite } from '@/hooks/useTramite'

// 5. Tipos
import type { Tramite, Paso } from '@/types/tramite'

// 6. Utilidades y constantes
import { formatearFecha } from '@/lib/utils/fecha'
import { TRAMITES_DISPONIBLES } from '@/constants/tramites'
```

### Comentarios

```typescript
// ✅ Comentar el POR QUÉ, no el QUÉ
// El SAT requiere RFC en mayúsculas para validación en su API interna
const rfcNormalizado = rfc.toUpperCase().trim()

// ❌ No comentar lo obvio
// Convertir a mayúsculas
const rfcNormalizado = rfc.toUpperCase()

// ✅ JSDoc en todas las funciones públicas de /lib y /hooks
/**
 * Valida que un RFC tenga el formato correcto para persona física.
 * Persona física: 4 letras + 6 dígitos fecha + 3 dígitos verificación = 13 caracteres.
 * @param rfc - RFC sin espacios ni guiones
 * @returns true si el formato es válido, false si no
 */
export function validarRfcPersonaFisica(rfc: string): boolean { ... }
```

### Manejo de Errores

```typescript
// Nunca silenciar errores
// ❌
try { ... } catch (_) {}

// ✅ Siempre loguear y manejar
try {
  ...
} catch (error) {
  logger.error('contexto_del_error', { error, contexto: datosRelevantes })
  // Retornar estado de error, nunca throw sin capturar arriba
  return { exito: false, error: 'mensaje_para_usuario' }
}

// Para operaciones que pueden fallar, usar tipo Result
type Result<T> = { exito: true; datos: T } | { exito: false; error: string }
```

---

## Tecnologías y Versiones Fijas

| Tecnología | Versión | Justificación |
|---|---|---|
| Next.js | 14.x (App Router) | Server Components, streaming, layouts anidados |
| TypeScript | 5.x | Tipado estricto, mejor DX |
| Tailwind CSS | 3.x | Utility-first, tree-shaking, mobile-first por defecto |
| shadcn/ui | Latest | Componentes accesibles, sin vendor lock-in |
| Supabase JS | 2.x | BaaS completo: DB + Auth + Storage + Realtime |
| Zod | 3.x | Validación de schemas en runtime, integra con TS |
| MercadoPago SDK | 2.x | Pagos en México, OXXO, SPEI, débito |
| next-pwa | 5.x | Service Worker y caché offline |
| Lucide React | Latest | Íconos consistentes con la marca |
| date-fns | 3.x | Manejo de fechas, localización es-MX |

**No agregar dependencias sin documentar la razón en este archivo.**

---

## Variables de Entorno Requeridas

```bash
# .env.local (nunca commitear, solo para desarrollo)
# .env.example (sí commitear, sin valores reales)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...   # Solo en server, NUNCA en cliente

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...   # Solo en server
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-...  # Puede ir en cliente

# App
NEXT_PUBLIC_APP_URL=https://tramitesat.mx
NEXT_PUBLIC_APP_NAME=TrámiteSAT

# Seguridad
WEBHOOK_SECRET_MERCADOPAGO=...         # Para validar webhooks
CRON_SECRET=...                         # Para proteger rutas cron

# Email (Resend)
RESEND_API_KEY=re_...

# Opcional: Sentry
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...
```

---

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Build de producción
npm run build

# Verificar tipos TypeScript
npm run type-check

# Lint
npm run lint

# Pruebas
npm run test          # Vitest unitario
npm run test:e2e      # Playwright

# Generar tipos de Supabase (después de cambios en DB)
npm run db:generate-types
```

---

## Principios de Diseño No Negociables

1. **Mobile-first siempre.** Diseñar para 375px de ancho primero, luego escalar.
2. **Una acción por pantalla.** El usuario nunca debe dudar qué hacer.
3. **Lenguaje de secundaria.** Si un alumno de 14 años no lo entiende, reescribir.
4. **Offline-ready.** Las guías deben funcionar sin conexión una vez cargadas.
5. **Accesibilidad WCAG 2.1 AA mínimo.** Contraste, focus visible, ARIA labels.
6. **Seguridad por defecto.** Validar siempre en servidor, nunca confiar en cliente.

---

## Contacto y Decisiones de Arquitectura

Cualquier decisión que cambie la arquitectura definida en `CLAUDE.architecture.md` debe documentarse aquí bajo un header `## ADR (Architecture Decision Records)` con fecha y justificación.
