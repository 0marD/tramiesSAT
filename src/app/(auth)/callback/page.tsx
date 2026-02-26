'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientSupabase } from '@/lib/supabase/client'
import { EstadoCargando } from '@/components/shared/EstadoCargando'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirigir = searchParams.get('redirigir') ?? '/historial'

  useEffect(() => {
    const supabase = createClientSupabase()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push(redirigir)
      }
    })

    return () => subscription.unsubscribe()
  }, [router, redirigir])

  return <EstadoCargando mensaje="Verificando sesión..." />
}

export default function PaginaCallback() {
  return (
    <Suspense fallback={<EstadoCargando mensaje="Verificando sesión..." />}>
      <CallbackContent />
    </Suspense>
  )
}
