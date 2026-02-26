/**
 * Tipo discriminado para operaciones que pueden fallar.
 * Evita el uso de excepciones para control de flujo.
 */
export type Result<T> =
  | { exito: true; datos: T }
  | { exito: false; error: string }
