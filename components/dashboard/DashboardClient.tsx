'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, Calendar, Car, MapPin } from 'lucide-react'
import { StatusHero } from './StatusHero'
import { PickupModal } from './PickupModal'
import { ReturnModal, type ReturnData } from './ReturnModal'
import { RequestCarModal } from './RequestCarModal'
import type { DashboardPayload } from './types'

const fmtDateTime = (iso: string) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))

function LoadingSkeleton() {
  return (
    <div className="space-y-md">
      <div className="h-48 animate-pulse rounded-2xl bg-surface-container" />
      <div className="grid grid-cols-2 gap-md">
        <div className="h-24 animate-pulse rounded-2xl bg-surface-container" />
        <div className="h-24 animate-pulse rounded-2xl bg-surface-container" />
      </div>
      <div className="h-24 animate-pulse rounded-2xl bg-surface-container" />
    </div>
  )
}

function UpcomingCard({ reservation }: { reservation: DashboardPayload['nextReservation'] }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-md">
      <div className="flex items-center gap-2 text-label-md text-on-surface-variant">
        <Calendar size={16} /> UPCOMING
      </div>
      <p className="mt-sm text-body-md text-on-surface">
        {reservation
          ? `${reservation.userName} · ${fmtDateTime(reservation.startTime)}`
          : 'No upcoming reservations'}
      </p>
    </div>
  )
}

function LocationCard({ location }: { location: string | null }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-md">
      <div className="flex items-center gap-2 text-label-md text-on-surface-variant">
        <MapPin size={16} /> LOCATION
      </div>
      <p className="mt-sm text-body-md text-on-surface">{location ?? 'Unknown'}</p>
    </div>
  )
}

function SharedWithCard({ members }: { members: DashboardPayload['groupMembers'] }) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  useEffect(() => {
    setCurrentUserId(localStorage.getItem('carshare_user_id'))
  }, [])

  return (
    <div className="rounded-2xl bg-surface-container-low p-md">
      <div className="text-label-md text-on-surface-variant">SHARED WITH</div>
      <div className="mt-sm flex flex-wrap gap-2">
        {members.map((m) => (
          <span
            key={m.id}
            title={m.name}
            className={`flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-label-md text-on-primary-fixed ${
              currentUserId === m.id ? 'ring-2 ring-primary' : ''
            }`}
          >
            {m.name.charAt(0).toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  )
}

function RecentActivitySection({ items }: { items: DashboardPayload['recentActivity'] }) {
  return (
    <div className="rounded-2xl bg-surface-container-low p-md">
      <div className="text-label-md text-on-surface-variant">RECENT ACTIVITY</div>
      {items.length === 0 ? (
        <p className="mt-sm text-body-md text-on-surface-variant">No recent activity</p>
      ) : (
        <ul className="mt-sm space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <Car
                size={20}
                className={item.type === 'pickup' ? 'text-secondary' : 'text-outline'}
              />
              <div className="min-w-0">
                <p className="text-body-md text-on-surface">
                  {item.userName} {item.type === 'pickup' ? 'started a trip' : 'ended a trip'}
                  {item.location ? ` · ${item.location}` : ''}
                </p>
                <p className="text-label-md text-on-surface-variant">
                  {fmtDateTime(item.loggedAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function DashboardClient() {
  const [data, setData] = useState<DashboardPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPickup, setShowPickup] = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const [showRequestCar, setShowRequestCar] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const userId = localStorage.getItem('carshare_user_id')
      const res = await fetch(
        '/api/dashboard/status' + (userId ? `?userId=${userId}` : ''),
      )
      if (!res.ok) throw new Error('Failed to load dashboard')
      const payload = (await res.json()) as DashboardPayload
      setData(payload)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchData()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [fetchData])

  const handlePickup = async (userId: string, expectedReturn?: string) => {
    if (!userId) {
      setError('Select who is picking up the car.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/dashboard/pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          expectedReturn: expectedReturn
            ? new Date(expectedReturn).toISOString()
            : undefined,
        }),
      })
      if (!res.ok) {
        setError('Could not record pickup. Please try again.')
        return
      }
      await fetchData()
    } catch {
      setError('Could not record pickup. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReturn = async (rd: ReturnData) => {
    const userId = localStorage.getItem('carshare_user_id')
    if (!userId) {
      setError('We could not identify you. Pick up the car again before returning it.')
      return
    }
    const mileage = rd.mileage ? Math.round(Number(rd.mileage)) : undefined
    setSubmitting(true)
    try {
      const res = await fetch('/api/dashboard/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          parkingLocation: rd.parkingLocation,
          fuel: rd.fuel,
          mileage: Number.isFinite(mileage) ? mileage : undefined,
        }),
      })
      if (!res.ok) {
        setError('Could not record return. Please try again.')
        return
      }
      await fetchData()
    } catch {
      setError('Could not record return. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="fixed top-0 z-40 flex h-16 w-full items-center justify-between bg-background/80 px-gutter backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Car className="text-primary" />
          <span className="text-headline-lg-mobile font-bold text-primary">CarShare</span>
        </div>
        <div className="relative">
          <Bell className="text-on-surface-variant" size={24} />
          {data && data.pendingIncomingCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-error text-label-md text-on-error">
              {data.pendingIncomingCount}
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-lg space-y-md px-gutter pb-8 pt-20">
        {loading && <LoadingSkeleton />}
        {!loading && error && (
          <p className="rounded-2xl bg-error-container p-md text-body-md text-on-error-container">
            {error}
          </p>
        )}
        {!loading && data && (
          <>
            <StatusHero
              status={data.status}
              activeHandoff={data.activeHandoff}
              nextReservation={data.nextReservation}
              urgentNote={data.urgentNote}
              submitting={submitting}
              onPickup={() => setShowPickup(true)}
              onReturn={() => setShowReturn(true)}
              onRequestCar={() => setShowRequestCar(true)}
            />
            <div className="grid grid-cols-2 gap-md">
              <UpcomingCard reservation={data.nextReservation} />
              <LocationCard location={data.lastLocation} />
            </div>
            <SharedWithCard members={data.groupMembers} />
            <RecentActivitySection items={data.recentActivity} />
          </>
        )}
      </main>

      {showPickup && data && (
        <PickupModal
          groupMembers={data.groupMembers}
          onConfirm={async (uid, er) => {
            setShowPickup(false)
            await handlePickup(uid, er)
          }}
          onClose={() => setShowPickup(false)}
        />
      )}
      {showReturn && (
        <ReturnModal
          onConfirm={async (rd) => {
            setShowReturn(false)
            await handleReturn(rd)
          }}
          onClose={() => setShowReturn(false)}
        />
      )}
      {showRequestCar && (
        <RequestCarModal
          onClose={() => setShowRequestCar(false)}
          onDone={() => {
            setShowRequestCar(false)
            void fetchData()
          }}
        />
      )}
    </div>
  )
}
