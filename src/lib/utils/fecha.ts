import { format, formatDistanceToNow, isAfter, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Formatea una fecha en español mexicano.
 * @param fecha - string ISO o Date
 * @returns "15 de octubre de 2024"
 */
export function formatearFecha(fecha: string | Date): string {
  return format(new Date(fecha), "d 'de' MMMM 'de' yyyy", { locale: es })
}

/**
 * Formatea una fecha en formato corto.
 * @returns "15/oct/2024"
 */
export function formatearFechaCorta(fecha: string | Date): string {
  return format(new Date(fecha), 'dd/MMM/yyyy', { locale: es })
}

/**
 * Devuelve tiempo relativo: "hace 3 días", "en 2 semanas"
 */
export function tiempoRelativo(fecha: string | Date): string {
  return formatDistanceToNow(new Date(fecha), { locale: es, addSuffix: true })
}

/**
 * Devuelve cuántos días faltan para una fecha de vencimiento.
 * Negativo si ya venció.
 */
export function diasParaVencer(fechaVencimiento: string | Date): number {
  return differenceInDays(new Date(fechaVencimiento), new Date())
}

/**
 * Verifica si una suscripción o plan sigue activo.
 */
export function estaActivo(fechaVencimiento: string | Date | null): boolean {
  if (!fechaVencimiento) return false
  return isAfter(new Date(fechaVencimiento), new Date())
}
