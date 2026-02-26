import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareSupabaseClient } from '@/lib/supabase/middleware'

const RUTAS_PROTEGIDAS = ['/historial', '/vencimientos', '/cuenta']
const RUTAS_SOLO_INVITADO = ['/login', '/registro']

export async function middleware(request: NextRequest) {
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
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons|screenshots|manifest.json|sw.js|workbox-.*).*)'],
}
