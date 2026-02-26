import Link from 'next/link'

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
      <h2 className="text-xl font-semibold text-slate-900 mb-2">{titulo}</h2>
      <p className="text-slate-500 text-base max-w-xs">{descripcion}</p>
      {accion && (
        <Link
          href={accion.href}
          className="mt-6 px-6 py-3 rounded-btn bg-marca-accion text-white font-semibold hover:bg-blue-700 transition-colors"
        >
          {accion.texto}
        </Link>
      )}
    </div>
  )
}
