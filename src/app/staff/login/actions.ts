'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface StaffLoginState {
  error: string | null
}

export async function staffLogin(
  _prevState: StaffLoginState,
  formData: FormData
): Promise<StaffLoginState> {
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return { error: error?.message ?? 'Sign in failed.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  // Public signup can never produce role='staff' (see the handle_new_user
  // trigger and RLS), so a non-staff profile here means someone used the
  // wrong login page, not a privilege-escalation attempt to worry about —
  // but we still refuse the session rather than let them into /staff/*.
  if (profile?.role !== 'staff') {
    await supabase.auth.signOut()
    return { error: 'This login is for staff accounts only.' }
  }

  redirect('/')
}
