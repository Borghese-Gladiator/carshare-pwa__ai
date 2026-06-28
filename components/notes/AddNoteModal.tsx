'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { NoteUrgency } from '@/lib/db/schema'

interface AddNoteModalProps {
  onDone: () => void
  onClose: () => void
}

export function AddNoteModal({ onDone, onClose }: AddNoteModalProps) {
  const [body, setBody] = useState('')
  const [urgency, setUrgency] = useState<NoteUrgency>('fyi')
  const [location, setLocation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!body.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    const userId = localStorage.getItem('carshare_user_id') ?? ''
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, body, urgency, location: location || undefined }),
      })
      if (!res.ok) {
        setError('Could not save note.')
        return
      }
      onDone()
    } catch {
      setError('Could not save note.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-lg rounded-t-2xl bg-surface-container-lowest p-lg sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-headline-lg-mobile text-on-surface">Add Note</h2>
          <button onClick={onClose} aria-label="Close" className="text-on-surface-variant">
            <X size={24} />
          </button>
        </div>

        <p className="mt-md text-label-md text-on-surface-variant">Urgency</p>
        <div className="mt-sm grid grid-cols-2 gap-3">
          <button
            onClick={() => setUrgency('fyi')}
            className={`h-12 rounded-lg text-label-md ${
              urgency === 'fyi'
                ? 'bg-primary text-on-primary'
                : 'border border-outline-variant text-on-surface-variant'
            }`}
          >
            FYI
          </button>
          <button
            onClick={() => setUrgency('urgent')}
            className={`h-12 rounded-lg text-label-md uppercase tracking-wider ${
              urgency === 'urgent'
                ? 'bg-error text-on-error'
                : 'border border-outline-variant text-on-surface-variant'
            }`}
          >
            Urgent
          </button>
        </div>

        <label className="mt-lg block text-label-md text-on-surface-variant">
          Note
          <textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe the issue or note…"
            className="mt-sm w-full rounded-lg border border-outline bg-surface px-md py-sm text-body-md text-on-surface"
          />
        </label>

        <label className="mt-md block text-label-md text-on-surface-variant">
          Location (optional)
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Parked near the hydrant on Oak St (optional)"
            className="mt-sm w-full rounded-lg border border-outline bg-surface px-md py-sm text-body-md text-on-surface"
          />
        </label>

        {error && <p className="mt-sm text-body-sm text-error">{error}</p>}

        <button
          onClick={submit}
          disabled={!body.trim() || submitting}
          className="mt-lg h-14 w-full rounded-lg bg-primary text-label-md text-on-primary disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save Note'}
        </button>
      </div>
    </div>
  )
}
