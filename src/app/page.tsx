import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// This route has no UI of its own — it just resolves a signed-in
// session to the correct home. Anonymous visitors land on /login via
// middleware before they ever reach here for a /user or /staff path;
// this page only needs to decide user-vs-staff for an authenticated
// visitor hitting "/".
export default async function RootPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'staff') {
    redirect('/staff/dashboard')
  }

  redirect('/user/dashboard')
}
