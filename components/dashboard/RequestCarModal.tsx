'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface RequestCarModalProps {
  onClose: () => void
  onDone: () => void
}

function localInputToIso(value: string): string | null {
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

export function RequestCarModal({ onClose, onDone }: RequestCarModalProps) {
  const [requestedStart, setRequestedStart] = useState('')
  const [requestedEnd, setRequestedEnd] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const inputClass =
    'mt-sm w-full rounded-lg border border-outline bg-surface px-md py-sm text-body-md text-on-surface'

  const submit = async () => {
    const requesterId = localStorage.getItem('carshare_user_id')
    if (!requesterId) {
      setError('Pick who you are first (use the car once).')
      return
    }
    const startIso = localInputToIso(requestedStart)
    const endIso = localInputToIso(requestedEnd)
    if (!startIso || !endIso) {
      setError('Pick a valid start and end time.')
      return
    }
    if (new Date(endIso) <= new Date(startIso)) {
      setError('End time must be after start time.')
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'borrow_now',
          requesterId,
          requestedStart: startIso,
          requestedEnd: endIso,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        setError(data?.error ?? 'Could not send request. Please try again.')
        return
      }
      onDone()
    } catch {
      setError('Could not send request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-lg rounded-t-2xl bg-surface-container-lowest p-lg sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-headline-lg-mobile text-on-surface">Request car</h2>
          <button onClick={onClose} aria-label="Close" className="text-on-surface-variant">
            <X size={24} />
          </button>
        </div>

        <p className="mt-md text-body-md text-on-surface-variant">
          Ask the current driver to lend you the car for a window.
        </p>

        <label className="mt-lg block text-label-md text-on-surface-variant">
          From
          <input
            type="datetime-local"
            value={requestedStart}
            onChange={(e) => setRequestedStart(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="mt-md block text-label-md text-on-surface-variant">
          Until
          <input
            type="datetime-local"
            value={requestedEnd}
            onChange={(e) => setRequestedEnd(e.target.value)}
            className={inputClass}
          />
        </label>

        {error && (
          <p className="mt-md rounded-lg bg-error-container p-md text-body-md text-on-error-container">
            {error}
          </p>
        )}

        <button
          onClick={() => void submit()}
          disabled={submitting}
          className="mt-lg h-14 w-full rounded-lg bg-primary text-label-lg text-on-primary disabled:opacity-50"
        >
          Send request
        </button>
      </div>
    </div>
  )
}
