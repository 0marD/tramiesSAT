# CLAUDE.brand.md — Diseño y Voz de Marca en Código

> Lee `CLAUDE.md` primero. Este documento traduce el Libro de Marca de TrámiteSAT en convenciones de código concretas: tokens de diseño, componentes UI y guías de contenido.

---

## Principio Principal

**El código UI debe reflejar los valores de la marca: claridad, simplicidad y respeto.** Un componente mal nombrado o con texto confuso rompe la experiencia tanto como un bug.

---

## Tokens de Diseño

### Colores (clases Tailwind)

```typescript
// Usar SIEMPRE las clases semánticas, no los hex directamente en JSX.
// Los hex están en tailwind.config.ts → los alias están aquí.

// ══ Colores de marca ══
// bg-marca-profundo   → #1A2E44  Header, fondos oscuros
// bg-marca-accion     → #2563EB  Botones CTA, íconos activos
// bg-marca-suave      → #DBEAFE  Fondos de tarjetas destacadas

// ══ Colores semánticos (usar en UI) ══
// text-exito           → Verde #16A34A
// bg-exito-suave       → #F0FDF4
// text-alerta          → Naranja #EA580C
// bg-alerta-suave      → #FFF7ED
// text-error           → Rojo #DC2626
// bg-error-suave       → #FEF2F2

// ══ Neutros ══
// text-slate-900       → Texto principal
// text-slate-500       → Texto secundario / descriptivo
// border-slate-200     → Bordes de tarjetas e inputs
// bg-slate-50          → Fondo de pantalla principal

// ✅ Correcto
<button className="bg-marca-accion text-white hover:bg-blue-700">
  Continuar
</button>

// ❌ Incorrecto — nunca hex inline en className
<button style={{ backgroundColor: '#2563EB' }}>
  Continuar
</button>
```

### Tipografía (clases Tailwind)

```typescript
// ══ Escala de texto ══
// text-xs   → 12px — Etiquetas, fechas, metadatos
// text-sm   → 14px — Texto de apoyo, descripciones
// text-base → 16px — Instrucciones principales (Body Large)
// text-lg   → 18px — Subtítulos de sección (H3)
// text-xl   → 20px — Títulos de paso / tarjeta (H2)
// text-2xl  → 24px — Encabezados de pantalla (H1)
// text-3xl+ → Display — Solo portada / pantalla de éxito

// ══ Peso ══
// font-normal  → Texto corrido
// font-medium  → Énfasis suave
// font-semibold → Subtítulos
// font-bold     → Títulos y CTAs

// ══ Fuente mono ══
// font-mono → Solo para: RFC, CURP, folios
```

### Espaciado y Layout

```typescript
// ══ Estructura de pantalla (3 zonas fijas) ══
// La pantalla siempre tiene:
//   - Header: h-16 (64px) — fijo arriba
//   - Contenido: flex-1 overflow-y-auto — área de scroll
//   - BottomBar: h-20 (80px) — fijo abajo con CTA principal

// ══ Padding de pantalla ══
// px-4 → Margen horizontal estándar (16px)
// px-6 → Margen en tablets/desktop (24px)

// ══ Gap entre elementos ══
// gap-1  → 4px  — entre ícono y texto inline
// gap-2  → 8px  — entre etiquetas
// gap-3  → 12px — dentro de tarjetas
// gap-4  → 16px — entre tarjetas en lista
// gap-6  → 24px — entre secciones
// gap-8  → 32px — entre bloques principales

// ══ Border radius ══
// rounded        → 4px — inputs
// rounded-lg     → 8px — botones, chips
// rounded-xl     → 12px — tarjetas
// rounded-2xl    → 16px — modales, bottom sheets
// rounded-full   → Avatares, íconos circulares
```

---

## Componentes UI — Patrones de Uso

### TramiteCard

```tsx
// src/components/tramite/TramiteCard.tsx
// Tarjeta de trámite en el home. Mobile-first, touch-friendly.

interface TramiteCardProps {
  tramite: Tramite
  // No pasar onClick: la navegación va via Next.js Link para SEO y PWA
}

export function TramiteCard({ tramite }: TramiteCardProps) {
  return (
    // min-h-touch: 44px mínimo para área táctil (WCAG)
    <Link
      href={`/tramite/${tramite.slug}`}
      className="
        flex items-center gap-4
        p-4 rounded-xl
        bg-white border border-slate-200
        hover:border-marca-accion hover:shadow-sm
        active:scale-[0.98]
        transition-all duration-150
        min-h-[72px]
      "
    >
      <div className="
        flex items-center justify-center
        w-12 h-12 rounded-xl
        bg-marca-suave text-marca-accion
        shrink-0
      ">
        <IconoTramite slug={tramite.slug} size={24} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-base">
          {tramite.nombre}
        </p>
        <p className="text-sm text-slate-500 mt-0.5 truncate">
          {tramite.descripcion}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-xs text-slate-400">
          {tramite.duracionMinutos} min
        </span>
        <ChevronRight size={16} className="text-slate-300" />
      </div>
    </Link>
  )
}
```

### BarraProgreso

```tsx
// src/components/tramite/BarraProgreso.tsx

interface BarraProgresoProps {
  pasoActual: number
  totalPasos: number
}

export function BarraProgreso({ pasoActual, totalPasos }: BarraProgresoProps) {
  const porcentaje = Math.round((pasoActual / totalPasos) * 100)

  return (
    <div className="px-4 py-3 border-b border-slate-100">
      {/* Texto accesible para lectores de pantalla */}
      <p className="text-sm text-slate-500 mb-2">
        Paso <span className="font-semibold text-slate-900">{pasoActual}</span> de {totalPasos}
      </p>

      {/* Barra visual */}
      <div
        role="progressbar"
        aria-valuenow={porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progreso: ${porcentaje}%`}
        className="h-2 bg-slate-100 rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-marca-accion rounded-full transition-all duration-500"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  )
}
```

### Botón CTA (Acción Principal)

```tsx
// src/components/ui/BotonPrincipal.tsx
// Botón de acción principal de cada pantalla.
// Siempre fijo al fondo de la pantalla.

interface BotonPrincipalProps {
  texto: string
  onClick?: () => void
  cargando?: boolean
  deshabilitado?: boolean
  tipo?: 'button' | 'submit'
}

export function BotonPrincipal({
  texto,
  onClick,
  cargando = false,
  deshabilitado = false,
  tipo = 'button',
}: BotonPrincipalProps) {
  return (
    // Zona inferior fija con padding safe-area para iPhones
    <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-white border-t border-slate-100">
      <button
        type={tipo}
        onClick={onClick}
        disabled={deshabilitado || cargando}
        className="
          w-full h-14 rounded-lg
          bg-marca-accion text-white
          font-semibold text-base
          flex items-center justify-center gap-2
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:bg-blue-700
          active:scale-[0.98]
          transition-all duration-150
          focus-visible:outline-2 focus-visible:outline-marca-accion focus-visible:outline-offset-2
        "
        aria-busy={cargando}
      >
        {cargando ? (
          <>
            <Loader2 size={20} className="animate-spin" aria-hidden="true" />
            <span>Guardando...</span>
          </>
        ) : (
          texto
        )}
      </button>
    </div>
  )
}
```

### EstadoVacio

```tsx
// src/components/shared/EstadoVacio.tsx
// Pantalla cuando no hay contenido. Amigable, no técnica.

interface EstadoVacioProps {
  titulo: string
  descripcion: string
  icono?: React.ReactNode
  accion?: {
    texto: string
    href: string
  }
}

export function EstadoVacio({ titulo, descripcion, icono, accion }: EstadoVacioProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {icono && (
        <div className="text-slate-300 mb-6" aria-hidden="true">
          {icono}
        </div>
      )}
      <h2 className="text-xl font-semibold text-slate-900 mb-2">
        {titulo}
      </h2>
      <p className="text-slate-500 text-base max-w-xs">
        {descripcion}
      </p>
      {accion && (
        <Link
          href={accion.href}
          className="mt-6 px-6 py-3 rounded-lg bg-marca-accion text-white font-semibold"
        >
          {accion.texto}
        </Link>
      )}
    </div>
  )
}

// ══ Uso: historial vacío ══
<EstadoVacio
  icono={<FileText size={48} />}
  titulo="Aún no tienes trámites"
  descripcion="Empieza con el RFC. Es el primer paso para cualquier trámite del SAT."
  accion={{ texto: "Empezar con RFC", href: "/tramite/rfc-persona-fisica" }}
/>
```

---

## Voz y Tono en Código — Textos de la UI

### Reglas para Escribir Textos

```typescript
// src/constants/textos.ts
// Todos los textos reutilizables de la UI viven aquí.
// Nunca hardcodear mensajes de error o success en los componentes.

export const TEXTOS = {
  errores: {
    // ✅ Específico, orientado a la acción, sin culpar al usuario
    rfcInvalido:       'El RFC no tiene el formato correcto. Debe tener 13 caracteres.',
    curpInvalida:      'La CURP no tiene el formato correcto. Debe tener 18 caracteres.',
    sesionExpirada:    'Tu sesión venció. Vuelve a entrar para continuar.',
    errorRed:          'No pudimos conectarnos. Revisa tu internet e intenta de nuevo.',
    errorGuardado:     'No pudimos guardar tu avance. Intenta de nuevo.',
    errorPago:         'El pago no se pudo procesar. Intenta de nuevo o usa otro método.',

    // ❌ Nunca usar:
    // 'Error 422', 'Unprocessable Entity', 'Request failed with status 500'
    // 'Credenciales inválidas', 'Usuario no encontrado'
  },

  exitos: {
    tramiteCompletado: 'Lo lograste. Tu trámite está listo.',
    pagoExitoso:       'Pago recibido. Ya tienes acceso a la guía.',
    progresoGuardado:  'Tu avance está guardado.',
    sesionIniciada:    'Bienvenido de nuevo.',
  },

  ayudas: {
    queEsRfc:    'Es el código que el SAT le da a cada persona para identificarla. Tiene 13 caracteres.',
    queEsCurp:   'Es tu clave única de identidad. La encuentras en tu INE o acta de nacimiento.',
    queEsEfirma: 'Es tu firma digital. La necesitas para trámites más avanzados en el SAT.',
    queEsCfdi:   'Es la factura electrónica oficial en México. La "e" es de electrónica.',
  },

  botones: {
    continuar:       'Continuar',
    siguiente:       'Siguiente paso',
    regresar:        'Regresar',
    empezar:         'Empezar',
    tengoTodo:       'Ya tengo todo, continuar',
    iniciarSesion:   'Entrar',
    registrarse:     'Crear cuenta',
    cerrarSesion:    'Cerrar sesión',
    verGuia:         'Ver guía completa',
    pagarTramite:    'Desbloquear este trámite — $59',
    suscribirAnual:  'Suscripción anual — $349',
  },

  estados: {
    cargando:       'Cargando...',
    guardando:      'Guardando...',
    verificando:    'Verificando...',
    enviando:       'Enviando...',
  },
} as const
```

### Regla de Microcopy

```typescript
// Antes de escribir cualquier texto en la UI, verificar:

// ✅ ¿Dice exactamente qué hacer? ("Ingresa tu CURP de 18 caracteres")
// ✅ ¿Usa palabras de uso cotidiano? ("número de registro" no "RFC alfanumérico")
// ✅ ¿Tiene máximo 15 palabras? (para instrucciones de paso)
// ✅ ¿El error explica cómo arreglarlo? ("Revisa que tenga 13 caracteres")
// ✅ ¿El éxito es celebratorio sin ser exagerado? ("Lo lograste. Tu RFC está listo.")

// ❌ Jamás:
// - "El sistema no pudo procesar su solicitud en este momento"
// - "Ocurrió un error inesperado. Comuníquese con soporte"
// - "Operación completada exitosamente"
// - "Por favor ingrese los datos requeridos en los campos correspondientes"
```

---

## Accesibilidad (WCAG 2.1 AA)

```tsx
// Reglas obligatorias:

// 1. ARIA labels en todo elemento interactivo sin texto visible
<button aria-label="Cerrar ayuda contextual">
  <X size={20} aria-hidden="true" />
</button>

// 2. Alt text en imágenes (no vacío si la imagen es informativa)
<Image
  src="/screenshots/rfc/paso-01-curp.webp"
  alt="El campo CURP en el portal del SAT, marcado con un recuadro rojo"
  width={800}
  height={500}
/>

// 3. Focus visible en todos los elementos interactivos
// (Tailwind: focus-visible:outline-2 focus-visible:outline-marca-accion)
// Nunca usar: outline: none sin reemplazarlo

// 4. Contraste mínimo:
// Texto normal: 4.5:1 — texto-slate-900 sobre blanco: 16:1 ✅
// Texto grande (18px+): 3:1
// Verificar en: https://webaim.org/resources/contrastchecker/

// 5. Tamaño mínimo de área táctil: 44x44px
// En Tailwind: min-h-[44px] min-w-[44px]

// 6. Orden de foco lógico: el Tab key debe seguir el flujo visual
// En la pantalla de paso: 1) Imagen, 2) Botón ayuda, 3) Botón siguiente

// 7. No depender solo del color para comunicar estado
// ✅ Verde + ícono ✓ + texto "Completado"
// ❌ Solo verde sin ícono ni texto
```

---

## Iconografía — Uso en Código

```tsx
// Siempre de Lucide React. Siempre con aria-hidden si es decorativo.
import { CheckCircle, AlertCircle, ChevronRight, FileText } from 'lucide-react'

// ══ Ícono decorativo (acompañado de texto) ══
<CheckCircle size={20} className="text-exito" aria-hidden="true" />

// ══ Ícono funcional (sin texto visible) ══
<button aria-label="Ir al siguiente paso">
  <ChevronRight size={20} aria-hidden="true" />
</button>

// ══ Tamaños estándar ══
// size={16} → En línea con texto pequeño (xs, sm)
// size={20} → Estándar en listas y formularios (base)
// size={24} → Tarjetas y navegación (lg)
// size={32} → Selector de trámite en home (xl)
// size={48} → Pantallas vacías y éxito (2xl)

// ══ Colores ══
// className="text-marca-accion"  → Activo/interactivo
// className="text-slate-400"     → Secundario/decorativo
// className="text-exito"         → Completado/éxito
// className="text-alerta"        → Advertencia
// className="text-error"         → Error
```

---

## Animaciones

```typescript
// Solo animaciones funcionales. Nada decorativo que pueda distraer.
// Respetar prefers-reduced-motion SIEMPRE.

// ✅ Durations permitidas:
// duration-150 → Interacciones táctiles (tap, hover)
// duration-300 → Transiciones de pantalla
// duration-500 → Barra de progreso (celebratorio pero no lento)

// ✅ Animaciones aprobadas:
// scale-[0.98] en active → feedback táctil de botones
// opacity-50 en disabled → estado deshabilitado
// animate-spin → spinner de carga
// transition-all → transiciones suaves de estado

// ❌ Prohibidas:
// animate-bounce en elementos de UI (distrae)
// Animaciones de entrada complejas (aumentan tiempo percibido)
// Paralax, efectos 3D

// En Tailwind, usar la clase motion-safe: para animaciones opcionales:
// className="motion-safe:transition-all motion-safe:duration-300"
```
