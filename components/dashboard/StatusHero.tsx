'use client'

import { Car, Clock, CalendarCheck, AlertTriangle } from 'lucide-react'
import type { DashboardPayload } from './types'

interface StatusHeroProps {
  status: DashboardPayload['status']
  activeHandoff: DashboardPayload['activeHandoff']
  nextReservation: DashboardPayload['nextReservation']
  urgentNote: DashboardPayload['urgentNote']
  submitting: boolean
  onReturn: () => void
}

const fmtDateTime = (iso: string) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))

function ReturnButton({ submitting, onReturn }: { submitting: boolean; onReturn: () => void }) {
  return (
    <button
      onClick={onReturn}
      disabled={submitting}
      className="h-14 w-full rounded-lg bg-primary text-label-lg text-on-primary disabled:opacity-50"
    >
      Return Car
    </button>
  )
}

export function StatusHero({
  status,
  activeHandoff,
  nextReservation,
  urgentNote,
  submitting,
  onReturn,
}: StatusHeroProps) {
  if (status === 'needs_attention') {
    return (
      <section className="rounded-2xl bg-error-container p-lg">
        <span className="inline-flex items-center gap-1 rounded-full bg-error px-3 py-1 text-label-md text-on-error">
          <AlertTriangle size={16} /> Needs Attention
        </span>
        <p className="mt-md text-headline-lg-mobile text-on-error-container">
          {urgentNote?.body ?? 'The car needs attention.'}
        </p>
        <div className="mt-lg">
          <ReturnButton submitting={submitting} onReturn={onReturn} />
        </div>
      </section>
    )
  }

  if (status === 'in_use' && activeHandoff) {
    return (
      <section className="rounded-2xl bg-surface-container-low p-lg">
        <span className="inline-flex items-center rounded-full bg-tertiary px-3 py-1 text-label-md text-on-tertiary-container">
          In Use
        </span>
        <h2 className="mt-md text-headline-lg-mobile text-on-surface">
          {activeHandoff.userName} has the car
        </h2>
        <div className="mt-md space-y-2">
          <div className="flex items-center gap-2 text-body-md text-on-surface-variant">
            <Clock size={18} /> Since {fmtDateTime(activeHandoff.since)}
          </div>
          {activeHandoff.expectedReturn && (
            <div className="flex items-center gap-2 text-body-md text-on-surface-variant">
              <CalendarCheck size={18} /> Expected back{' '}
              {fmtDateTime(activeHandoff.expectedReturn)}
            </div>
          )}
        </div>
        <div className="mt-lg">
          <ReturnButton submitting={submitting} onReturn={onReturn} />
        </div>
      </section>
    )
  }

  if (status === 'reserved' && nextReservation) {
    return (
      <section className="rounded-2xl bg-primary-fixed p-lg">
        <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-label-md text-on-primary">
          Reserved
        </span>
        <h2 className="mt-md text-headline-lg-mobile text-on-primary-fixed">
          {nextReservation.userName} reserved the car
        </h2>
        <p className="mt-sm text-body-md text-on-primary-fixed-variant">
          Starting {fmtDateTime(nextReservation.startTime)}
        </p>
        <div className="mt-lg">
          <ReturnButton submitting={submitting} onReturn={onReturn} />
        </div>
      </section>
    )
  }

  // available
  return (
    <section className="flex flex-col items-center rounded-2xl bg-secondary-container p-lg text-center">
      <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-label-md text-on-secondary">
        Available
      </span>
      <Car size={72} className="my-lg text-on-secondary-fixed" />
      <h2 className="text-headline-lg-mobile text-on-secondary-fixed">Car is Available</h2>
      <div className="mt-lg w-full">
        <ReturnButton submitting={submitting} onReturn={onReturn} />
      </div>
    </section>
  )
}
