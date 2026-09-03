// Browser-side Supabase client. Only ever holds the public URL and the
// publishable (formerly "anon") key — safe to ship in the client bundle
// because every table has Row Level Security enforcing the real
// boundary. Never import the service-role key here.

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
