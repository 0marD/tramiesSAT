# CLAUDE.testing.md — Estrategia de Pruebas

> Lee `CLAUDE.md` primero. Este documento define qué probar, cómo probarlo y los estándares de calidad del proyecto.

---

## Filosofía de Testing

**Probar el comportamiento, no la implementación.** Los tests deben sobrevivir un refactor interno. Si cambias el nombre de una función interna y el test falla, el test está mal escrito.

**Pirámide de testing para TrámiteSAT:**
```
        ┌─────────┐
        │  E2E    │  ← Pocos, críticos: flujo de pago, flujo de trámite
        │  10%    │
       ┌┴─────────┴┐
       │Integration │ ← API Routes, Server Actions, lógica de DB
       │   30%      │
      ┌┴────────────┴┐
      │  Unit Tests  │ ← Validadores, utilidades, lógica pura
      │    60%       │
      └──────────────┘
```

---

## Herramientas

| Tipo | Herramienta | Config |
|---|---|---|
| Unit + Integration | Vitest | `vitest.config.ts` |
| Componentes | Testing Library + Vitest | `@testing-library/react` |
| E2E | Playwright | `playwright.config.ts` |
| Mocks de Supabase | `@supabase/supabase-js` mock | `src/__mocks__/supabase.ts` |

---

## Estructura de Archivos de Test

```
src/
├── lib/
│   ├── validaciones/
│   │   ├── rfc.ts
│   │   └── rfc.test.ts          ← Test al lado del archivo que prueba
│   └── utils/
│       ├── fecha.ts
│       └── fecha.test.ts
├── components/
│   └── tramite/
│       ├── TramiteCard.tsx
│       └── TramiteCard.test.tsx
└── app/
    └── api/
        └── pagos/
            └── webhook/
                └── route.test.ts

e2e/
├── flujo-tramite.spec.ts    ← Flujo completo de un trámite
└── flujo-pago.spec.ts       ← Flujo completo de pago
```

---

## Tests Unitarios — Validadores

```typescript
// src/lib/validaciones/rfc.test.ts
import { describe, it, expect } from 'vitest'
import { validarRfcPersonaFisica } from './rfc'

describe('validarRfcPersonaFisica', () => {
  // ══ Casos válidos ══
  it('acepta un RFC válido estándar', () => {
    expect(validarRfcPersonaFisica('HEGG560427MVZRRL04')).toBe(true)
  })

  it('acepta RFC con Ñ en el nombre', () => {
    expect(validarRfcPersonaFisica('NUÑZ850101HDFRNS09')).toBe(true)
  })

  it('normaliza a mayúsculas antes de validar', () => {
    expect(validarRfcPersonaFisica('hegg560427mvzrrl04')).toBe(true)
  })

  // ══ Casos inválidos ══
  it('rechaza RFC con menos de 13 caracteres', () => {
    expect(validarRfcPersonaFisica('HEGG560427')).toBe(false)
  })

  it('rechaza RFC con más de 13 caracteres', () => {
    expect(validarRfcPersonaFisica('HEGG560427MVZRRL044')).toBe(false)
  })

  it('rechaza RFC con caracteres especiales', () => {
    expect(validarRfcPersonaFisica('HEGG-560427-MV3')).toBe(false)
  })

  it('rechaza string vacío', () => {
    expect(validarRfcPersonaFisica('')).toBe(false)
  })

  // ══ Edge cases ══
  it('rechaza null/undefined sin lanzar excepción', () => {
    // El compilador no debería permitir esto, pero defensivamente:
    expect(validarRfcPersonaFisica(null as unknown as string)).toBe(false)
  })
})
```

---

## Tests de Componentes

```tsx
// src/components/tramite/ChecklistDocumentos.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ChecklistDocumentos } from './ChecklistDocumentos'
import type { Documento } from '@/types/tramite'

const documentosMock: Documento[] = [
  { id: '1', nombre: 'CURP', obligatorio: true },
  { id: '2', nombre: 'INE', obligatorio: true },
  { id: '3', nombre: 'Comprobante de domicilio', obligatorio: true },
]

describe('ChecklistDocumentos', () => {
  it('renderiza todos los documentos', () => {
    render(<ChecklistDocumentos documentos={documentosMock} onTodosListos={vi.fn()} />)

    expect(screen.getByText('CURP')).toBeInTheDocument()
    expect(screen.getByText('INE')).toBeInTheDocument()
    expect(screen.getByText('Comprobante de domicilio')).toBeInTheDocument()
  })

  it('el botón CTA está deshabilitado hasta marcar todos', () => {
    render(<ChecklistDocumentos documentos={documentosMock} onTodosListos={vi.fn()} />)

    const boton = screen.getByRole('button', { name: /ya tengo todo/i })
    expect(boton).toBeDisabled()
  })

  it('habilita el CTA cuando todos están marcados', () => {
    render(<ChecklistDocumentos documentos={documentosMock} onTodosListos={vi.fn()} />)

    // Marcar todos los checkboxes
    documentosMock.forEach(doc => {
      fireEvent.click(screen.getByRole('checkbox', { name: doc.nombre }))
    })

    const boton = screen.getByRole('button', { name: /ya tengo todo/i })
    expect(boton).not.toBeDisabled()
  })

  it('llama onTodosListos cuando el usuario toca el CTA', () => {
    const onTodosListosMock = vi.fn()
    render(
      <ChecklistDocumentos
        documentos={documentosMock}
        onTodosListos={onTodosListosMock}
      />
    )

    documentosMock.forEach(doc => {
      fireEvent.click(screen.getByRole('checkbox', { name: doc.nombre }))
    })

    fireEvent.click(screen.getByRole('button', { name: /ya tengo todo/i }))
    expect(onTodosListosMock).toHaveBeenCalledTimes(1)
  })

  it('permite desmarcar un documento ya marcado', () => {
    render(<ChecklistDocumentos documentos={documentosMock} onTodosListos={vi.fn()} />)

    const checkbox = screen.getByRole('checkbox', { name: 'CURP' })
    fireEvent.click(checkbox) // marcar
    fireEvent.click(checkbox) // desmarcar

    expect(checkbox).not.toBeChecked()
  })
})
```

---

## Tests de API Routes

```typescript
// src/app/api/pagos/webhook/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

// Mock de dependencias externas
vi.mock('@/lib/mercadopago/webhook', () => ({
  verificarFirmaWebhook: vi.fn(),
}))

vi.mock('@/lib/mercadopago/client', () => ({
  consultarPago: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: vi.fn(() => ({ eq: vi.fn(() => ({ data: null, error: null })) })),
      insert: vi.fn(() => ({ data: null, error: null })),
    })),
  })),
}))

import { verificarFirmaWebhook } from '@/lib/mercadopago/webhook'
import { consultarPago } from '@/lib/mercadopago/client'

describe('POST /api/pagos/webhook', () => {
  const crearRequest = (body: object, signature = 'ts=123456789,v1=abc123') => {
    return new NextRequest('http://localhost/api/pagos/webhook', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
        'x-signature': signature,
        'x-request-id': 'test-request-123',
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna 401 si la firma del webhook es inválida', async () => {
    vi.mocked(verificarFirmaWebhook).mockReturnValue(false)

    const request = crearRequest({ type: 'payment', data: { id: '123' } })
    const response = await POST(request)

    expect(response.status).toBe(401)
  })

  it('retorna 200 para eventos que no son de tipo payment', async () => {
    vi.mocked(verificarFirmaWebhook).mockReturnValue(true)

    const request = crearRequest({ type: 'plan', data: { id: '123' } })
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(consultarPago).not.toHaveBeenCalled()
  })

  it('procesa un pago aprobado correctamente', async () => {
    vi.mocked(verificarFirmaWebhook).mockReturnValue(true)
    vi.mocked(consultarPago).mockResolvedValue({
      id: 123,
      status: 'approved',
      external_reference: 'pago-uuid-123',
      transaction_amount: 59,
    })

    const request = crearRequest({ type: 'payment', data: { id: '123' } })
    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(consultarPago).toHaveBeenCalledWith('123')
  })

  it('retorna 500 si falla el procesamiento (para que MP reintente)', async () => {
    vi.mocked(verificarFirmaWebhook).mockReturnValue(true)
    vi.mocked(consultarPago).mockRejectedValue(new Error('MP error'))

    const request = crearRequest({ type: 'payment', data: { id: '123' } })
    const response = await POST(request)

    expect(response.status).toBe(500)
  })
})
```

---

## Tests E2E con Playwright

```typescript
// e2e/flujo-tramite.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Flujo completo de trámite RFC', () => {
  test('usuario invitado puede completar el diagnóstico y ver la guía', async ({ page }) => {
    // 1. Ir a la home
    await page.goto('/')

    // 2. Verificar que se ven los trámites
    await expect(page.getByText('RFC')).toBeVisible()

    // 3. Seleccionar RFC
    await page.getByText('RFC').click()
    await expect(page).toHaveURL('/tramite/rfc-persona-fisica')

    // 4. Iniciar el trámite
    await page.getByRole('button', { name: /empezar/i }).click()
    await expect(page).toHaveURL('/tramite/rfc-persona-fisica/diagnostico')

    // 5. Responder diagnóstico
    await page.getByText('Sí, tengo CURP').click()
    await page.getByText('Trabajo para una empresa').click()
    await page.getByRole('button', { name: /continuar/i }).click()

    // 6. Verificar que llega a documentos
    await expect(page).toHaveURL('/tramite/rfc-persona-fisica/documentos')
    await expect(page.getByText('CURP')).toBeVisible()

    // 7. Marcar todos los documentos
    const checkboxes = page.getByRole('checkbox')
    const count = await checkboxes.count()
    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).click()
    }

    // 8. El botón debe activarse
    const botonContinuar = page.getByRole('button', { name: /ya tengo todo/i })
    await expect(botonContinuar).not.toBeDisabled()

    // 9. Continuar al primer paso
    await botonContinuar.click()
    await expect(page).toHaveURL('/tramite/rfc-persona-fisica/guia/1')
    await expect(page.getByText('Paso 1')).toBeVisible()
  })

  test('la barra de progreso refleja el paso actual', async ({ page }) => {
    await page.goto('/tramite/rfc-persona-fisica/guia/3')

    // La barra de progreso existe y tiene el valor correcto
    const progressbar = page.getByRole('progressbar')
    await expect(progressbar).toBeVisible()
    await expect(progressbar).toHaveAttribute('aria-valuenow', '43') // 3/7 = ~43%
  })
})
```

---

## Convenciones de Naming en Tests

```typescript
// Estructura: describe → it con lenguaje natural

// ✅ Correcto:
describe('ChecklistDocumentos', () => {
  it('habilita el CTA cuando todos los documentos están marcados', () => {})
  it('deshabilita el CTA si falta al menos un documento', () => {})
  it('llama onTodosListos al hacer clic en el botón habilitado', () => {})
})

// ❌ Incorrecto:
describe('checklist', () => {
  it('test 1', () => {})
  it('should work', () => {})
  it('handleClick', () => {})
})

// El nombre del test debe completar la oración:
// "ChecklistDocumentos [habilita el CTA cuando todos los documentos están marcados]"
```

---

## Scripts de Testing

```json
// package.json
{
  "scripts": {
    "test":          "vitest",
    "test:watch":    "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:e2e":      "playwright test",
    "test:e2e:ui":   "playwright test --ui",
    "test:ci":       "vitest --run && playwright test"
  }
}
```

---

## Cobertura Mínima Requerida

| Módulo | Cobertura mínima |
|---|---|
| `src/lib/validaciones/` | 100% — Son validadores críticos |
| `src/lib/mercadopago/` | 90% — Manejo de dinero |
| `src/lib/security/` | 90% — Seguridad |
| `src/app/api/` | 80% — API Routes |
| `src/components/tramite/` | 70% — Flujo principal |
| `src/components/shared/` | 60% — Componentes genéricos |

Configurar en `vitest.config.ts`:
```typescript
coverage: {
  thresholds: {
    'src/lib/validaciones/**': { statements: 100 },
    'src/lib/mercadopago/**':  { statements: 90 },
  }
}
```
