'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { User } from '@/lib/db/schema'

interface PickupModalProps {
  groupMembers: User[]
  onConfirm: (userId: string, expectedReturn?: string) => void
  onClose: () => void
}

export function PickupModal({ groupMembers, onConfirm, onClose }: PickupModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expectedReturn, setExpectedReturn] = useState('')

  const confirm = () => {
    if (!selectedId) return
    localStorage.setItem('carshare_user_id', selectedId)
    onConfirm(selectedId, expectedReturn || undefined)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-lg rounded-t-2xl bg-surface-container-lowest p-lg sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-headline-lg-mobile text-on-surface">Pick up car</h2>
          <button onClick={onClose} aria-label="Close" className="text-on-surface-variant">
            <X size={24} />
          </button>
        </div>

        <p className="mt-md text-label-md text-on-surface-variant">Who&apos;s driving?</p>
        <div className="mt-sm grid grid-cols-3 gap-3">
          {groupMembers.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedId(m.id)}
              className={`flex flex-col items-center gap-2 rounded-lg p-3 ${
                selectedId === m.id ? 'ring-2 ring-primary' : ''
              }`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed text-label-lg text-on-primary-fixed">
                {m.name.charAt(0).toUpperCase()}
              </span>
              <span className="text-label-md text-on-surface">{m.name}</span>
            </button>
          ))}
        </div>

        <label className="mt-lg block text-label-md text-on-surface-variant">
          Expected return (optional)
          <input
            type="datetime-local"
            value={expectedReturn}
            onChange={(e) => setExpectedReturn(e.target.value)}
            className="mt-sm w-full rounded-lg border border-outline bg-surface px-md py-sm text-body-md text-on-surface"
          />
        </label>

        <button
          onClick={confirm}
          disabled={!selectedId}
          className="mt-lg h-14 w-full rounded-lg bg-primary text-label-lg text-on-primary disabled:opacity-50"
        >
          Confirm Pickup
        </button>
      </div>
    </div>
  )
}
