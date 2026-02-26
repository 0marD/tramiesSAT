import { describe, it, expect } from 'vitest'
import {
  SchemaRfc,
  SchemaCurp,
  SchemaEmail,
  SchemaGuardarProgreso,
  SchemaCrearPago,
  SchemaPushSubscription,
} from '@/lib/validaciones/schemas'

// ─── RFC ─────────────────────────────────────────────────────────────────────

describe('SchemaRfc', () => {
  it('debe aceptar un RFC de persona física válido', () => {
    const resultado = SchemaRfc.safeParse('GOGA800101AA1')
    expect(resultado.success).toBe(true)
  })

  it('debe normalizar a mayúsculas y quitar espacios', () => {
    const resultado = SchemaRfc.safeParse('  goga800101aa1  ')
    expect(resultado.success).toBe(true)
    if (resultado.success) {
      expect(resultado.data).toBe('GOGA800101AA1')
    }
  })

  it('debe aceptar RFC con Ñ', () => {
    expect(SchemaRfc.safeParse('ÑOÑA800101AA1').success).toBe(true)
  })

  it('debe aceptar RFC con & (ampersand)', () => {
    expect(SchemaRfc.safeParse('&OGA800101AA1').success).toBe(true)
  })

  it('debe rechazar RFC con menos de 13 caracteres', () => {
    expect(SchemaRfc.safeParse('GOGA8001AA1').success).toBe(false)
  })

  it('debe rechazar RFC con más de 13 caracteres', () => {
    expect(SchemaRfc.safeParse('GOGA800101AA1X').success).toBe(false)
  })

  it('debe rechazar RFC vacío', () => {
    expect(SchemaRfc.safeParse('').success).toBe(false)
  })

  it('debe rechazar RFC con caracteres inválidos en el nombre', () => {
    // Dígito en posición de letras del nombre
    expect(SchemaRfc.safeParse('1OGA800101AA1').success).toBe(false)
  })

  it('debe rechazar RFC con fecha inválida (no dígitos)', () => {
    expect(SchemaRfc.safeParse('GOGAXXXXXAA1').success).toBe(false)
  })
})

// ─── CURP ─────────────────────────────────────────────────────────────────────

describe('SchemaCurp', () => {
  it('debe aceptar una CURP femenina válida', () => {
    expect(SchemaCurp.safeParse('GOGA800101MDFRRR01').success).toBe(true)
  })

  it('debe aceptar una CURP masculina válida', () => {
    expect(SchemaCurp.safeParse('GOGA800101HDFRRR01').success).toBe(true)
  })

  it('debe normalizar a mayúsculas', () => {
    const resultado = SchemaCurp.safeParse('goga800101mdfrrr01')
    expect(resultado.success).toBe(true)
    if (resultado.success) {
      expect(resultado.data).toBe('GOGA800101MDFRRR01')
    }
  })

  it('debe rechazar CURP con sexo inválido', () => {
    // Solo H o M son válidos
    expect(SchemaCurp.safeParse('GOGA800101XDFRRR01').success).toBe(false)
  })

  it('debe rechazar CURP con menos de 18 caracteres', () => {
    expect(SchemaCurp.safeParse('GOGA800101MDFRRR0').success).toBe(false)
  })

  it('debe rechazar CURP con más de 18 caracteres', () => {
    expect(SchemaCurp.safeParse('GOGA800101MDFRRR012').success).toBe(false)
  })

  it('debe rechazar CURP vacía', () => {
    expect(SchemaCurp.safeParse('').success).toBe(false)
  })
})

// ─── Email ────────────────────────────────────────────────────────────────────

describe('SchemaEmail', () => {
  it('debe aceptar un email válido', () => {
    expect(SchemaEmail.safeParse('usuario@correo.com').success).toBe(true)
  })

  it('debe normalizar el email a minúsculas', () => {
    const resultado = SchemaEmail.safeParse('Usuario@Correo.COM')
    expect(resultado.success).toBe(true)
    if (resultado.success) {
      expect(resultado.data).toBe('usuario@correo.com')
    }
  })

  it('debe aceptar email con subdominios', () => {
    expect(SchemaEmail.safeParse('user@mail.empresa.com.mx').success).toBe(true)
  })

  it('debe rechazar email sin @', () => {
    expect(SchemaEmail.safeParse('usuariocorreo.com').success).toBe(false)
  })

  it('debe rechazar email sin dominio', () => {
    expect(SchemaEmail.safeParse('usuario@').success).toBe(false)
  })

  it('debe rechazar email vacío', () => {
    expect(SchemaEmail.safeParse('').success).toBe(false)
  })

  it('debe rechazar email mayor a 254 caracteres', () => {
    // '@correo.com' = 11 chars → 244 + 11 = 255 chars (supera el límite de 254)
    const largo = 'a'.repeat(244) + '@correo.com'
    expect(SchemaEmail.safeParse(largo).success).toBe(false)
  })
})

// ─── GuardarProgreso ──────────────────────────────────────────────────────────

describe('SchemaGuardarProgreso', () => {
  it('debe aceptar datos válidos sin respuestas', () => {
    expect(SchemaGuardarProgreso.safeParse({
      tramiteSlug: 'rfc-persona-fisica',
      pasoActual: 1,
    }).success).toBe(true)
  })

  it('debe aceptar datos válidos con respuestas', () => {
    expect(SchemaGuardarProgreso.safeParse({
      tramiteSlug: 'rfc-persona-fisica',
      pasoActual: 3,
      respuestas: { pregunta1: 'respuesta1' },
    }).success).toBe(true)
  })

  it('debe rechazar paso 0', () => {
    expect(SchemaGuardarProgreso.safeParse({
      tramiteSlug: 'rfc-persona-fisica',
      pasoActual: 0,
    }).success).toBe(false)
  })

  it('debe rechazar paso mayor a 50', () => {
    expect(SchemaGuardarProgreso.safeParse({
      tramiteSlug: 'rfc-persona-fisica',
      pasoActual: 51,
    }).success).toBe(false)
  })

  it('debe rechazar slug con caracteres inválidos', () => {
    expect(SchemaGuardarProgreso.safeParse({
      tramiteSlug: 'RFC Persona Física!',
      pasoActual: 1,
    }).success).toBe(false)
  })

  it('debe rechazar slug vacío', () => {
    expect(SchemaGuardarProgreso.safeParse({
      tramiteSlug: '',
      pasoActual: 1,
    }).success).toBe(false)
  })
})

// ─── CrearPago ────────────────────────────────────────────────────────────────

describe('SchemaCrearPago', () => {
  it('debe aceptar tipo por_tramite sin slug', () => {
    expect(SchemaCrearPago.safeParse({ tipoPlan: 'por_tramite' }).success).toBe(true)
  })

  it('debe aceptar tipo suscripcion_anual', () => {
    expect(SchemaCrearPago.safeParse({ tipoPlan: 'suscripcion_anual' }).success).toBe(true)
  })

  it('debe aceptar por_tramite con slug', () => {
    expect(SchemaCrearPago.safeParse({
      tipoPlan: 'por_tramite',
      tramiteSlug: 'rfc-persona-fisica',
    }).success).toBe(true)
  })

  it('debe rechazar tipo de plan inválido', () => {
    expect(SchemaCrearPago.safeParse({ tipoPlan: 'gratis' }).success).toBe(false)
  })
})

// ─── PushSubscription ─────────────────────────────────────────────────────────

describe('SchemaPushSubscription', () => {
  it('debe aceptar una suscripción válida', () => {
    expect(SchemaPushSubscription.safeParse({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
      keys: {
        p256dh: 'clave_publica_ejemplo',
        auth: 'clave_auth_ejemplo',
      },
    }).success).toBe(true)
  })

  it('debe rechazar endpoint que no es URL', () => {
    expect(SchemaPushSubscription.safeParse({
      endpoint: 'no-es-una-url',
      keys: { p256dh: 'abc', auth: 'def' },
    }).success).toBe(false)
  })

  it('debe rechazar si faltan keys', () => {
    expect(SchemaPushSubscription.safeParse({
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
    }).success).toBe(false)
  })
})
