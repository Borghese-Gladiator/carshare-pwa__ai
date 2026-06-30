'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export interface ReturnData {
  parkingLocation: string
  fuel?: string
  mileage?: string
  note?: string
}

interface ReturnModalProps {
  onConfirm: (data: ReturnData) => void
  onClose: () => void
}

export function ReturnModal({ onConfirm, onClose }: ReturnModalProps) {
  const [parkingLocation, setParkingLocation] = useState('')
  const [fuel, setFuel] = useState('')
  const [mileage, setMileage] = useState('')
  const [note, setNote] = useState('')

  const inputClass =
    'mt-sm w-full rounded-lg border border-outline bg-surface px-md py-sm text-body-md text-on-surface'

  const confirm = () => {
    if (!parkingLocation.trim()) return
    onConfirm({
      parkingLocation: parkingLocation.trim(),
      fuel: fuel.trim() || undefined,
      mileage: mileage.trim() || undefined,
      note: note.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-[32rem] rounded-t-2xl bg-surface-container-lowest p-lg sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-headline-lg-mobile text-on-surface">Return car</h2>
          <button onClick={onClose} aria-label="Close" className="text-on-surface-variant">
            <X size={24} />
          </button>
        </div>

        <label className="mt-lg block text-label-md text-on-surface-variant">
          Parking location
          <input
            type="text"
            value={parkingLocation}
            onChange={(e) => setParkingLocation(e.target.value)}
            placeholder="e.g. Level 2, spot 14"
            className={inputClass}
          />
        </label>

        <label className="mt-md block text-label-md text-on-surface-variant">
          Fuel level (optional)
          <input
            type="text"
            value={fuel}
            onChange={(e) => setFuel(e.target.value)}
            placeholder="e.g. 3/4"
            className={inputClass}
          />
        </label>

        <label className="mt-md block text-label-md text-on-surface-variant">
          Mileage (optional)
          <input
            type="number"
            step="1"
            inputMode="numeric"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="mt-md block text-label-md text-on-surface-variant">
          Note (optional)
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Left it with half a tank, rear tyre looks low"
            rows={3}
            className={inputClass}
          />
        </label>

        <button
          onClick={confirm}
          disabled={!parkingLocation.trim()}
          className="mt-lg h-14 w-full rounded-lg bg-primary text-label-lg text-on-primary disabled:opacity-50"
        >
          Confirm Return
        </button>
      </div>
    </div>
  )
}
