import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Anyone may reach these without a session.
const PUBLIC_PATHS = ['/login', '/signup', '/staff/login']

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { response, user } = await updateSession(request)
  const isPublic = isPublicPath(pathname)

  // Not signed in: block /user/* and /staff/* — but never the public
  // paths themselves (this used to redirect /staff/login to /staff/login,
  // an infinite loop, since '/staff/login' also starts with '/staff').
  if (!user) {
    if (!isPublic && (pathname.startsWith('/user') || pathname.startsWith('/staff'))) {
      const loginPath = pathname.startsWith('/staff') ? '/staff/login' : '/login'
      return NextResponse.redirect(new URL(loginPath, request.url))
    }
    return response
  }

  // Signed in: don't show login/signup forms again. Send to the root
  // route, which resolves the correct dashboard by role.
  if (isPublic) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Role-specific access (user vs staff) is intentionally NOT decided
  // here — that requires a profiles lookup, which src/app/user/layout.tsx
  // and src/app/staff/(protected)/layout.tsx perform server-side.
  // Middleware only answers "is there a session at all".
  return response
}

export const config = {
  // Skip static assets, images, and the public model/brand files.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|models/|brand/).*)'],
}
