'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { User } from '@/lib/db/schema'
import type { CalendarReservation, ConflictInfo } from './types'

interface ReservationModalProps {
  groupMembers: User[]
  editTarget?: CalendarReservation | null
  onDone: () => void
  onClose: () => void
}

// datetime-local renders/accepts local wall-clock time, so convert via local parts.
function isoToLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function localInputToIso(value: string): string | null {
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

function addMinutesToLocalInput(value: string, minutes: number): string {
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  d.setMinutes(d.getMinutes() + minutes)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fmtConflictTime(start: string, end: string): string {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    })
  return `${fmt(start)} – ${fmt(end)}`
}

export function ReservationModal({
  groupMembers,
  editTarget,
  onDone,
  onClose,
}: ReservationModalProps) {
  const [title, setTitle] = useState('')
  const [purpose, setPurpose] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [conflict, setConflict] = useState<ConflictInfo[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  useEffect(() => {
    if (editTarget) {
      setTitle(editTarget.title ?? '')
      setPurpose(editTarget.purpose ?? '')
      setStartTime(isoToLocalInput(editTarget.start_time))
      setEndTime(isoToLocalInput(editTarget.end_time))
      setSelectedUserId(editTarget.user_id)
    } else {
      const stored = localStorage.getItem('carshare_user_id')
      if (stored) setSelectedUserId(stored)
    }
  }, [editTarget])

  const inputClass =
    'mt-sm w-full rounded-lg border border-outline bg-surface px-md py-sm text-body-md text-on-surface'

  const submit = async (force: boolean) => {
    if (!selectedUserId) {
      setError('Select who the reservation is for.')
      return
    }
    if (!startTime || !endTime) {
      setError('Pick a start and end time.')
      return
    }
    const startIso = localInputToIso(startTime)
    const endIso = localInputToIso(endTime)
    if (!startIso || !endIso) {
      setError('Enter a valid start and end time.')
      return
    }
    if (new Date(endIso) <= new Date(startIso)) {
      setError('End time must be after start time.')
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      const body = {
        userId: selectedUserId,
        startTime: startIso,
        endTime: endIso,
        title: title.trim() || null,
        purpose: purpose.trim() || null,
        ...(force ? { force: true } : {}),
      }
      const url = editTarget ? `/api/reservations/${editTarget.id}` : '/api/reservations'
      const method = editTarget ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.status === 409) {
        const data = (await res.json()) as { conflicts: ConflictInfo[] }
        setConflict(data.conflicts)
        return
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        setError(data?.error ?? 'Could not save reservation. Please try again.')
        return
      }
      onDone()
    } catch {
      setError('Could not save reservation. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleForce = () => {
    setConflict(null)
    void submit(true)
  }

  const handleCancelReservation = async () => {
    if (!editTarget) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/reservations/${editTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        setError('Could not cancel reservation. Please try again.')
        return
      }
      onDone()
    } catch {
      setError('Could not cancel reservation. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-[32rem] overflow-y-auto rounded-t-2xl bg-surface-container-lowest p-lg sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-headline-lg-mobile text-on-surface">
            {editTarget ? 'Edit reservation' : 'New reservation'}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-on-surface-variant">
            <X size={24} />
          </button>
        </div>

        {conflict ? (
          <div className="mt-lg rounded-lg bg-error-container p-md text-on-error-container">
            <p className="text-label-lg">This overlaps an existing booking</p>
            <ul className="mt-sm space-y-2">
              {conflict.map((c) => (
                <li key={c.id} className="text-body-md">
                  <span className="font-medium">{c.title || 'Untitled reservation'}</span>
                  {c.user_name ? ` · ${c.user_name}` : ''}
                  <br />
                  <span className="text-label-md">{fmtConflictTime(c.start_time, c.end_time)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-md flex gap-3">
              <button
                onClick={handleForce}
                disabled={submitting}
                className="h-12 flex-1 rounded-lg bg-error text-label-lg text-on-error disabled:opacity-50"
              >
                Proceed anyway
              </button>
              <button
                onClick={() => setConflict(null)}
                disabled={submitting}
                className="h-12 flex-1 rounded-lg border border-outline text-label-lg text-on-surface"
              >
                Go back
              </button>
            </div>
          </div>
        ) : (
          <>
            <label className="mt-lg block text-label-md text-on-surface-variant">
              Title
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Airport run"
                className={inputClass}
              />
            </label>

            <label className="mt-md block text-label-md text-on-surface-variant">
              Purpose (optional)
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Drop off the kids"
                className={inputClass}
              />
            </label>

            <label className="mt-md block text-label-md text-on-surface-variant">
              Start
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => {
                  const next = e.target.value
                  setStartTime(next)
                  const minEnd = addMinutesToLocalInput(next, 1)
                  if (minEnd && endTime && endTime < minEnd) {
                    setEndTime(minEnd)
                  }
                }}
                className={inputClass}
              />
            </label>

            <label className="mt-md block text-label-md text-on-surface-variant">
              End
              <input
                type="datetime-local"
                value={endTime}
                min={startTime ? addMinutesToLocalInput(startTime, 1) : undefined}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputClass}
              />
            </label>

            <p className="mt-lg text-label-md text-on-surface-variant">For</p>
            <div className="mt-sm grid grid-cols-3 gap-3">
              {groupMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedUserId(m.id)}
                  className={`flex flex-col items-center gap-2 rounded-lg p-3 ${
                    selectedUserId === m.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed text-label-lg text-on-primary-fixed">
                    {m.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-label-md text-on-surface">{m.name}</span>
                </button>
              ))}
            </div>

            {error && (
              <p className="mt-md rounded-lg bg-error-container p-md text-body-md text-on-error-container">
                {error}
              </p>
            )}

            <button
              onClick={() => void submit(false)}
              disabled={submitting}
              className="mt-lg h-14 w-full rounded-lg bg-primary text-label-lg text-on-primary disabled:opacity-50"
            >
              {editTarget ? 'Save changes' : 'Create reservation'}
            </button>

            {editTarget &&
              (confirmingCancel ? (
                <div className="mt-md flex gap-3">
                  <button
                    onClick={() => void handleCancelReservation()}
                    disabled={submitting}
                    className="h-12 flex-1 rounded-lg bg-error text-label-lg text-on-error disabled:opacity-50"
                  >
                    Yes, cancel it
                  </button>
                  <button
                    onClick={() => setConfirmingCancel(false)}
                    disabled={submitting}
                    className="h-12 flex-1 rounded-lg border border-outline text-label-lg text-on-surface"
                  >
                    Keep it
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingCancel(true)}
                  disabled={submitting}
                  className="mt-md h-12 w-full rounded-lg text-label-lg text-error"
                >
                  Cancel reservation
                </button>
              ))}
          </>
        )}
      </div>
    </div>
  )
}
