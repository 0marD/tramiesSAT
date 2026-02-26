import { describe, it, expect } from 'vitest'
import { formatearFecha, formatearFechaCorta, diasParaVencer, estaActivo } from '@/lib/utils/fecha'

// ─── formatearFecha ───────────────────────────────────────────────────────────

describe('formatearFecha', () => {
  it('debe formatear una fecha en español', () => {
    // Usar new Date(año, mes, día) para evitar problemas de zona horaria con ISO strings
    expect(formatearFecha(new Date(2024, 9, 15))).toBe('15 de octubre de 2024')
  })

  it('debe formatear enero correctamente', () => {
    expect(formatearFecha(new Date(2024, 0, 1))).toBe('1 de enero de 2024')
  })

  it('debe aceptar un objeto Date', () => {
    const fecha = new Date(2024, 3, 15) // abril (0-indexed)
    expect(formatearFecha(fecha)).toBe('15 de abril de 2024')
  })
})

// ─── formatearFechaCorta ──────────────────────────────────────────────────────

describe('formatearFechaCorta', () => {
  it('debe formatear en formato corto con mes en minúsculas', () => {
    const resultado = formatearFechaCorta(new Date(2024, 9, 15))
    // date-fns devuelve mes abreviado en minúsculas en español: "oct"
    expect(resultado).toMatch(/15\/\w+\/2024/)
  })

  it('debe incluir el año de 4 dígitos', () => {
    expect(formatearFechaCorta('2024-06-20')).toContain('2024')
  })
})

// ─── diasParaVencer ───────────────────────────────────────────────────────────

describe('diasParaVencer', () => {
  it('debe devolver un número positivo para fechas futuras', () => {
    const enDiezDias = new Date()
    enDiezDias.setDate(enDiezDias.getDate() + 10)
    const dias = diasParaVencer(enDiezDias)
    // Puede ser 9 o 10 según la hora exacta, lo importante es que es positivo
    expect(dias).toBeGreaterThanOrEqual(9)
    expect(dias).toBeLessThanOrEqual(10)
  })

  it('debe devolver un número negativo o cero para fechas pasadas', () => {
    const haceUnaSemana = new Date()
    haceUnaSemana.setDate(haceUnaSemana.getDate() - 7)
    expect(diasParaVencer(haceUnaSemana)).toBeLessThanOrEqual(0)
  })

  it('debe aceptar un string ISO como argumento', () => {
    const futuro = new Date()
    futuro.setDate(futuro.getDate() + 5)
    const resultado = diasParaVencer(futuro.toISOString())
    expect(typeof resultado).toBe('number')
  })
})

// ─── estaActivo ───────────────────────────────────────────────────────────────

describe('estaActivo', () => {
  it('debe devolver true para una fecha de vencimiento futura', () => {
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    expect(estaActivo(manana)).toBe(true)
  })

  it('debe devolver false para una fecha de vencimiento pasada', () => {
    const ayer = new Date()
    ayer.setDate(ayer.getDate() - 1)
    expect(estaActivo(ayer)).toBe(false)
  })

  it('debe devolver false cuando la fecha es null', () => {
    expect(estaActivo(null)).toBe(false)
  })

  it('debe aceptar un string ISO como argumento', () => {
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    expect(estaActivo(manana.toISOString())).toBe(true)
  })
})
