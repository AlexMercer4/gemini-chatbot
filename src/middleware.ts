import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh the session to ensure cookies are processed
  await supabase.auth.getSession()

  // Check if the route is an admin route
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // Skip auth check for login page
    if (req.nextUrl.pathname === '/admin/login') {
      return res
    }

    // Check authentication for other admin routes
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // If no user, redirect to login
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*']
}