import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Rutas públicas (no requieren auth)
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/check-email', '/update-password']
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // Ruta de espera de aprobación
  const isPendingRoute = request.nextUrl.pathname === '/pending-approval'

  // Rutas de API (siempre permitidas)
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')

  // Si no hay usuario y no es ruta pública ni API, redirigir a login
  if (!user && !isPublicRoute && !isApiRoute && !isPendingRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si hay usuario, verificar estado de aprobación
  if (user && !isApiRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status, role')
      .eq('id', user.id)
      .single()

    // Si el usuario está pendiente o rechazado
    if (profile && profile.status !== 'approved') {
      // Si está en ruta pública, redirigir a pending-approval
      if (isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/pending-approval'
        return NextResponse.redirect(url)
      }

      // Si no está en pending-approval, redirigir allí
      if (!isPendingRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/pending-approval'
        return NextResponse.redirect(url)
      }
    }

    // Si está aprobado y está en pending-approval o ruta pública, redirigir a home
    if (profile && profile.status === 'approved' && (isPendingRoute || isPublicRoute)) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // Verificar acceso a /admin (solo admins)
    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (!profile || profile.role !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
