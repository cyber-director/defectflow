'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface SignupState {
  error: string | null
  message: string | null
}

export async function signup(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const fullName = String(formData.get('fullName') || '').trim()
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')

  if (!fullName || !email || !password) {
    return { error: 'All fields are required.', message: null }
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.', message: null }
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
    },
  })

  if (error) {
    return { error: error.message, message: null }
  }

  // If email confirmation is enabled on the Supabase project, signUp()
  // succeeds but returns no session yet — the user must confirm first.
  if (!data.session) {
    return {
      error: null,
      message: 'Account created. Check your email to confirm it, then sign in.',
    }
  }

  redirect('/')
}
