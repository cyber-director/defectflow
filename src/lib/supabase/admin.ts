// Service-role ("secret key") Supabase client. This bypasses Row Level
// Security entirely, so it must NEVER be imported into a Client
// Component and must never leave the server.
//
// The `server-only` import below makes any accidental client-side
// import of this file a build-time error rather than a leaked secret.
//
// Use this only after the calling route handler / server action has
// already verified the current user's identity and authorization
// (role, staff_category, ownership) using ./server.ts. This client
// itself performs no such checks — it trusts its caller completely.
//
// `realtime.transport: ws` is the same Node < 22 workaround as in
// ./server.ts — see that file's comment for why it's needed.

import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import ws from 'ws'

let adminClient: ReturnType<typeof createSupabaseClient> | null = null

export function createAdminClient() {
  if (!adminClient) {
    adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        realtime: {
          transport: ws as any,
        },
      }
    )
  }
  return adminClient as any
}
