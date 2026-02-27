import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareSupabaseClient } from '@/lib/supabase/middleware'

const RUTAS_PROTEGIDAS = ['/historial', '/vencimientos', '/cuenta']
const RUTAS_SOLO_INVITADO = ['/login', '/registro']

export async function middleware(request: NextRequest) {
  // Si las variables de entorno no están configuradas, pasar sin autenticar
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next()
  }

  try {
    const { supabase, response } = await createMiddlewareSupabaseClient(request)

    // Siempre usar getUser() — valida el token con Supabase (no solo lee la cookie)
    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    if (RUTAS_PROTEGIDAS.some(r => pathname.startsWith(r)) && !user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirigir', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (RUTAS_SOLO_INVITADO.some(r => pathname.startsWith(r)) && user) {
      return NextResponse.redirect(new URL('/historial', request.url))
    }

    return response
  } catch {
    // Error inesperado en middleware — pasar la request sin modificar
    // para que la app no quede completamente inaccesible
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|screenshots|manifest.json|sw.js|workbox-.*).*)'],
}
