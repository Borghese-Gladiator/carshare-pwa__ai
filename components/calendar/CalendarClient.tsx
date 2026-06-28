'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Car, Plus } from 'lucide-react'
import { ReservationModal } from './ReservationModal'
import type { CalendarPayload, CalendarReservation } from './types'

function getWeekMonday(today: Date): Date {
  const d = new Date(today)
  d.setHours(0, 0, 0, 0)
  const dow = d.getDay() // 0=Sun
  const offset = dow === 0 ? -6 : 1 - dow
  d.setDate(d.getDate() + offset)
  return d
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI']

function fmtAgendaTime(start: string, end: string, today: Date): string {
  const s = new Date(start)
  const e = new Date(end)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const dayLabel = isSameDay(s, today)
    ? 'Today'
    : isSameDay(s, tomorrow)
      ? 'Tomorrow'
      : s.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  const fmt = (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${dayLabel}, ${fmt(s)} – ${fmt(e)}`
}

function DayStrip({
  weekDays,
  selectedDay,
  onSelect,
}: {
  weekDays: Date[]
  selectedDay: Date
  onSelect: (d: Date) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {weekDays.map((d, i) => {
        const selected = isSameDay(d, selectedDay)
        return (
          <button
            key={d.toISOString()}
            onClick={() => onSelect(d)}
            className={`flex h-20 min-w-[56px] flex-1 flex-col items-center justify-center rounded-2xl ${
              selected
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            <span className="text-label-md">{DAY_LABELS[i]}</span>
            <span className="text-headline-lg-mobile">{d.getDate()}</span>
          </button>
        )
      })}
    </div>
  )
}

function StatusPill({
  isMine,
  hasConflict,
  hasPendingRequest,
}: {
  isMine: boolean
  hasConflict: boolean
  hasPendingRequest: boolean
}) {
  return (
    <div className="flex flex-shrink-0 flex-col items-end gap-1">
      {isMine ? (
        <span className="rounded-full bg-primary-fixed px-3 py-1 text-label-md text-on-primary-fixed-variant">
          Your Trip
        </span>
      ) : (
        <span className="rounded-full bg-secondary-container px-3 py-1 text-label-md text-on-secondary-container">
          Confirmed
        </span>
      )}
      {hasConflict && (
        <span className="rounded-full bg-error-container px-3 py-1 text-label-md text-on-error-container">
          Conflict
        </span>
      )}
      {hasPendingRequest && (
        <span className="rounded-full bg-tertiary-container px-3 py-1 text-label-md text-on-tertiary-container">
          Pending
        </span>
      )}
    </div>
  )
}

function AgendaTimeline({
  reservations,
  selectedDay,
  today,
  currentUserId,
  onEdit,
}: {
  reservations: CalendarReservation[]
  selectedDay: Date
  today: Date
  currentUserId: string | null
  onEdit: (r: CalendarReservation) => void
}) {
  const dayStart = startOfDay(selectedDay).getTime()
  const nextDay = startOfDay(selectedDay)
  nextDay.setDate(nextDay.getDate() + 1)
  const dayEnd = nextDay.getTime()
  const items = reservations
    .filter((r) => {
      const t = new Date(r.start_time).getTime()
      return t >= dayStart && t < dayEnd
    })
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
  const hasLaterThisWeek = reservations.some(
    (r) => new Date(r.start_time).getTime() >= dayEnd,
  )
  const emptyMessage =
    items.length === 0
      ? hasLaterThisWeek
        ? 'No reservations for this day'
        : 'No more reservations for this week'
      : hasLaterThisWeek
        ? null
        : 'No more reservations for this week'

  return (
    <div className="relative pl-6">
      <div className="absolute bottom-0 left-[7px] top-4 w-0.5 bg-outline-variant" />

      {items.map((r) => {
        const isMine = r.user_id === currentUserId
        const dotColor = r.has_conflict
          ? 'bg-error'
          : isMine
            ? 'bg-primary'
            : 'bg-outline-variant'
        return (
          <div key={r.id} className="relative mb-lg">
            <div
              className={`absolute -left-[23px] top-1 z-10 h-4 w-4 rounded-full border-4 border-background ${dotColor}`}
            />
            <button
              onClick={() => onEdit(r)}
              className={`block w-full rounded-2xl border bg-surface-container-lowest p-md text-left ${
                r.has_conflict ? 'border-error' : 'border-surface-container'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-label-md text-primary">
                    {fmtAgendaTime(r.start_time, r.end_time, today)}
                  </p>
                  <p className="mt-1 truncate text-headline-lg-mobile text-on-surface">
                    {r.title || 'Untitled reservation'}
                  </p>
                  {r.purpose && (
                    <p className="mt-1 truncate text-body-md text-on-surface-variant">
                      {r.purpose}
                    </p>
                  )}
                </div>
                <StatusPill
                  isMine={isMine}
                  hasConflict={r.has_conflict}
                  hasPendingRequest={r.has_pending_request}
                />
              </div>
              <div className="mt-md flex items-center gap-2 border-t border-surface-container pt-md">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-fixed text-label-md text-on-primary-fixed">
                  {r.user_name.charAt(0).toUpperCase()}
                </span>
                <span className="text-label-md text-on-surface-variant">{r.user_name}</span>
              </div>
            </button>
          </div>
        )
      })}

      {emptyMessage && (
        <div className="relative">
          <div className="absolute -left-[21px] top-1 z-10 h-3 w-3 rounded-full border-2 border-dashed border-outline-variant bg-background" />
          <div className="flex flex-col items-center py-xl text-center opacity-60">
            <p className="text-body-md text-on-surface-variant">{emptyMessage}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function CalendarClient() {
  const today = useMemo(() => new Date(), [])
  const weekDays = useMemo(() => getWeekDays(getWeekMonday(today)), [today])
  const [selectedDay, setSelectedDay] = useState<Date>(() => {
    const dow = today.getDay()
    return dow === 0 || dow === 6 ? getWeekMonday(today) : new Date(today)
  })
  const [data, setData] = useState<CalendarPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<CalendarReservation | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    setCurrentUserId(localStorage.getItem('carshare_user_id'))
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const monday = getWeekMonday(today)
      const friday = new Date(monday)
      friday.setDate(monday.getDate() + 4)
      friday.setHours(23, 59, 59, 999)
      const res = await fetch(
        `/api/reservations?from=${monday.toISOString()}&to=${friday.toISOString()}`,
      )
      if (!res.ok) throw new Error('Failed to load reservations')
      const payload = (await res.json()) as CalendarPayload
      setData(payload)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => {
    fetchData()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchData()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [fetchData])

  const handleDone = () => {
    setShowModal(false)
    setEditTarget(null)
    void fetchData()
  }

  const openCreate = () => {
    setEditTarget(null)
    setShowModal(true)
  }

  const openEdit = (r: CalendarReservation) => {
    setEditTarget(r)
    setShowModal(true)
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="fixed top-0 z-40 flex h-16 w-full items-center justify-between bg-background/80 px-gutter backdrop-blur-md">
        <span className="text-headline-lg-mobile font-bold text-on-surface">Reservations</span>
        <Car className="text-primary" size={24} />
      </header>

      <main className="mx-auto max-w-2xl px-gutter pb-32 pt-20">
        <DayStrip weekDays={weekDays} selectedDay={selectedDay} onSelect={setSelectedDay} />

        <h2 className="mb-md mt-lg text-headline-lg-mobile text-on-surface">Upcoming Bookings</h2>

        {loading && <p className="text-body-md text-on-surface-variant">Loading…</p>}
        {!loading && error && (
          <p className="rounded-2xl bg-error-container p-md text-body-md text-on-error-container">
            {error}
          </p>
        )}
        {!loading && data && (
          <AgendaTimeline
            reservations={data.reservations}
            selectedDay={selectedDay}
            today={today}
            currentUserId={currentUserId}
            onEdit={openEdit}
          />
        )}
      </main>

      <button
        onClick={openCreate}
        aria-label="New reservation"
        className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-xl"
      >
        <Plus size={24} />
      </button>

      {showModal && data && (
        <ReservationModal
          groupMembers={data.groupMembers}
          editTarget={editTarget}
          onDone={handleDone}
          onClose={() => {
            setShowModal(false)
            setEditTarget(null)
          }}
        />
      )}
    </div>
  )
}
