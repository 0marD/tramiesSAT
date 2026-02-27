'use client'

import { Suspense } from 'react'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PageContainer } from '@/components/layout/PageContainer'
import { EstadoCargando } from '@/components/shared/EstadoCargando'
import { createClientSupabase } from '@/lib/supabase/client'
import { SchemaEmail } from '@/lib/validaciones/schemas'
import { TEXTOS } from '@/constants/textos'

type Modo = 'magic-link' | 'password'

function FormularioLogin() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirigir = searchParams.get('redirigir') ?? '/historial'

  const [modo, setModo] = useState<Modo>('magic-link')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviado, setEnviado] = useState(false)

  const supabase = createClientSupabase()

  const enviarMagicLink = async () => {
    const resultado = SchemaEmail.safeParse(email)
    if (!resultado.success) {
      setError(resultado.error.issues[0]?.message ?? 'Correo inválido')
      return
    }

    setCargando(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: resultado.data,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?redirigir=${redirigir}` },
    })

    setCargando(false)

    if (authError) {
      setError(TEXTOS.errores.errorRed)
    } else {
      setEnviado(true)
    }
  }

  const iniciarSesionConPassword = async () => {
    const emailValidado = SchemaEmail.safeParse(email)
    if (!emailValidado.success) {
      setError(emailValidado.error.issues[0]?.message ?? 'Correo inválido')
      return
    }

    setCargando(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: emailValidado.data,
      password,
    })

    setCargando(false)

    if (authError) {
      setError('El correo o la contraseña no son correctos.')
    } else {
      router.push(redirigir)
    }
  }

  if (enviado) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4" aria-hidden="true">📬</div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Te enviamos un enlace</h2>
        <p className="text-slate-500 text-base">
          Revisa tu correo <strong>{email}</strong> y toca el enlace para entrar.
          A veces llega en la carpeta de spam.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          autoComplete="email"
          className="
            w-full px-4 py-3 rounded-input border border-slate-300 dark:border-slate-700
            bg-white dark:bg-slate-800
            text-slate-900 dark:text-white text-base
            focus:outline-none focus:ring-2 focus:ring-marca-accion focus:border-transparent
            placeholder:text-slate-400 dark:placeholder:text-slate-500
          "
        />
      </div>

      {modo === 'password' && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            className="
              w-full px-4 py-3 rounded-input border border-slate-300 dark:border-slate-700
              bg-white dark:bg-slate-800
              text-slate-900 dark:text-white text-base
              focus:outline-none focus:ring-2 focus:ring-marca-accion focus:border-transparent
            "
          />
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-error bg-error-suave p-3 rounded-input">
          {error}
        </p>
      )}

      <button
        onClick={modo === 'magic-link' ? enviarMagicLink : iniciarSesionConPassword}
        disabled={cargando || !email}
        className="
          w-full h-14 rounded-btn bg-marca-accion text-white font-semibold text-base
          flex items-center justify-center gap-2
          disabled:opacity-50 hover:bg-blue-700 active:scale-[0.98]
          motion-safe:transition-all duration-150
        "
      >
        {cargando ? (
          <Loader2 size={20} className="animate-spin" aria-hidden="true" />
        ) : modo === 'magic-link' ? (
          'Enviarme un enlace por correo'
        ) : (
          TEXTOS.botones.iniciarSesion
        )}
      </button>

      <button
        onClick={() => setModo(modo === 'magic-link' ? 'password' : 'magic-link')}
        className="w-full text-sm text-slate-500 hover:text-marca-accion transition-colors py-2"
      >
        {modo === 'magic-link'
          ? 'Prefiero usar mi contraseña'
          : 'Prefiero que me envíen un enlace por correo'}
      </button>
    </div>
  )
}

export default function PaginaLogin() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header titulo="Entrar" />
      <PageContainer>
        <Suspense fallback={<EstadoCargando />}>
          <FormularioLogin />
        </Suspense>
      </PageContainer>
    </div>
  )
}
