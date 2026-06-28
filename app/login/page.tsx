'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      if (res.ok) {
        router.replace('/dashboard')
        router.refresh()
        return
      }
      setError('Invalid access code')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-gutter">
      <div className="w-full max-w-sm rounded-2xl bg-surface-container-lowest p-lg shadow-[var(--shadow-card)]">
        <h1 className="text-headline-lg-mobile text-on-surface">CarShare</h1>
        <p className="mt-sm text-body-sm text-on-surface-variant">
          Enter the shared access code to continue.
        </p>
        <form onSubmit={handleSubmit} className="mt-lg">
          <label htmlFor="code" className="text-body-sm text-on-surface-variant">
            Access code
          </label>
          <input
            id="code"
            type="password"
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mt-xs w-full rounded-lg border border-outline bg-surface px-md py-sm text-body-md text-on-surface outline-none focus:border-primary"
          />
          {error && <p className="mt-sm text-body-sm text-error">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !code.trim()}
            className="mt-lg w-full rounded-lg bg-primary px-md py-sm text-body-md text-on-primary disabled:opacity-60"
          >
            {submitting ? 'Verifying…' : 'Continue'}
          </button>
        </form>
      </div>
    </main>
  )
}
