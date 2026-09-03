'use client'

import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { login, type LoginState } from './actions'

const initialState: LoginState = { error: null }

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full py-2">
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  )
}

export default function LoginPage() {
  const [state, formAction] = useFormState(login, initialState)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-app px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-ink-primary">DefectFlow</h1>
          <p className="mt-2 text-sm text-ink-secondary">Sign in to report and track defects.</p>
        </div>
        
        <div className="card p-8">
          <form action={formAction} className="space-y-6">
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
                autoComplete="current-password"
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

            <SubmitButton />
          </form>

          <div className="mt-6 flex flex-col gap-3">
            <p className="text-center text-sm text-ink-secondary">
              New here?{' '}
              <Link href="/signup" className="font-medium text-brand-700 hover:text-brand-800 hover:underline">
                Create an account
              </Link>
            </p>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-surface px-2 text-ink-muted">or</span>
              </div>
            </div>
            <p className="text-center text-sm text-ink-muted">
              <Link href="/staff/login" className="font-medium text-ink-secondary hover:text-ink-primary hover:underline">
                Sign in as staff
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
