// Cookie-aware Supabase client for use in Server Components, Route
// Handlers, and Server Actions. Reads the current user's session from
// cookies so RLS policies apply as that user — this is NOT a privileged
// client. For trusted writes that must bypass RLS, use ./admin.ts
// instead, and only after verifying the caller's role/authorization
// yourself.
//
// Next.js 14's `cookies()` is synchronous (this changes in Next 15+;
// if this project is ever upgraded, wrap the calls below in `await`).
//
// The `realtime.transport: ws` option below is required on Node < 22:
// supabase-js now expects the runtime's native WebSocket, which only
// Node 22+ provides. Server Components/Actions run under the Node.js
// runtime by default (unlike middleware, which runs on the Edge
// runtime and already has native WebSocket) — so without this, every
// call to createClient() here throws immediately on an older Node.
// Safe to remove once this project's Node version is 22+.

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import ws from 'ws'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component, which can't set cookies.
            // Harmless as long as middleware is refreshing the session
            // on every request (see src/lib/supabase/middleware.ts).
          }
        },
      },
      realtime: {
        transport: ws as any,
      },
    }
  )
}
