import { z } from 'zod'

export const SchemaRfc = z
  .string()
  .transform(v => v.toUpperCase().trim())
  .refine(
    v => /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/.test(v),
    'El RFC no tiene el formato correcto (debe tener 13 caracteres)'
  )

export const SchemaCurp = z
  .string()
  .transform(v => v.toUpperCase().trim())
  .refine(
    v => /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/.test(v),
    'La CURP no tiene el formato correcto (debe tener 18 caracteres)'
  )

export const SchemaEmail = z
  .string()
  .email('Ingresa un correo electrónico válido')
  .max(254, 'El correo es muy largo')
  .toLowerCase()

export const SchemaGuardarProgreso = z.object({
  tramiteSlug: z.string().regex(/^[a-z0-9-]+$/, 'Slug inválido').max(100),
  pasoActual:  z.number().int().min(1).max(50),
  respuestas:  z.record(z.string(), z.string()).optional(),
})

export const SchemaCrearPago = z.object({
  tramiteSlug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  tipoPlan:    z.enum(['por_tramite', 'suscripcion_anual']),
})

export const SchemaPushSubscription = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().max(1024),
    auth:   z.string().max(256),
  }),
})

export const SchemaRespuestasDiagnostico = z.record(z.string(), z.string())

export type GuardarProgresoInput = z.infer<typeof SchemaGuardarProgreso>
export type CrearPagoInput = z.infer<typeof SchemaCrearPago>
