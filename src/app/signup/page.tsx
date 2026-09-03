'use client'

import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { signup, type SignupState } from './actions'

const initialState: SignupState = { error: null, message: null }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full py-2">
      {pending ? 'Creating account…' : 'Create account'}
    </button>
  )
}

export default function SignupPage() {
  const [state, formAction] = useFormState(signup, initialState)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-app px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-ink-primary">Create your account</h1>
          <p className="mt-2 text-sm text-ink-secondary">Report and track facility defects.</p>
        </div>
        
        <div className="card p-8">
          <form action={formAction} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-ink-primary mb-1">Full name</label>
              <input id="fullName" name="fullName" type="text" required autoComplete="name" className="input-field" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink-primary mb-1">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" className="input-field" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink-primary mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="input-field"
              />
            </div>

            {state.error && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2" role="alert">
                <svg className="h-4 w-4 text-red-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-red-700">{state.error}</p>
              </div>
            )}
            
            {state.message && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-100 flex items-start gap-2" role="alert">
                <svg className="h-4 w-4 text-green-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-700">{state.message}</p>
              </div>
            )}

            <SubmitButton />
          </form>

          <div className="mt-6">
            <p className="text-center text-sm text-ink-secondary">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-brand-700 hover:text-brand-800 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
