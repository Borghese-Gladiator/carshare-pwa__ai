'use client'

import { useCallback, useEffect, useState } from 'react'

interface RequestRow {
  id: string
  type: 'borrow_now' | 'swap'
  status: 'pending' | 'accepted' | 'declined'
  requester_id: string
  target_user_id: string | null
  requester_name: string
  requested_start: string | null
  requested_end: string | null
  target_res_start: string | null
  target_res_end: string | null
  target_res_title: string | null
}

const fmtWindow = (start: string | null, end: string | null): string => {
  if (!start || !end) return ''
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    })
  return `${fmt(start)} – ${fmt(end)}`
}

const typeLabel = (type: RequestRow['type']) =>
  type === 'borrow_now' ? 'Car borrow request' : 'Swap request'

function StatusBadge({ status }: { status: RequestRow['status'] }) {
  if (status === 'accepted') {
    return (
      <span className="rounded-full bg-secondary-container px-3 py-1 text-label-md text-on-secondary-container">
        Accepted
      </span>
    )
  }
  if (status === 'declined') {
    return (
      <span className="rounded-full bg-surface-container px-3 py-1 text-label-md text-on-surface-variant">
        Declined
      </span>
    )
  }
  return (
    <span className="rounded-full bg-tertiary-container px-3 py-1 text-label-md text-on-tertiary-container">
      Pending
    </span>
  )
}

function RequestDetails({ req }: { req: RequestRow }) {
  if (req.type === 'borrow_now') {
    return (
      <p className="mt-1 text-body-md text-on-surface-variant">
        Wants the car {fmtWindow(req.requested_start, req.requested_end)}
      </p>
    )
  }
  return (
    <div className="mt-1 space-y-1 text-body-md text-on-surface-variant">
      <p>
        Wants your slot{req.target_res_title ? ` · ${req.target_res_title}` : ''} ·{' '}
        {fmtWindow(req.target_res_start, req.target_res_end)}
      </p>
      <p>In exchange for {fmtWindow(req.requested_start, req.requested_end)}</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-md">
      {[0, 1].map((i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-container" />
      ))}
    </div>
  )
}

export function InboxClient() {
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acting, setActing] = useState<string | null>(null)

  const fetchData = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/requests?userId=${userId}`)
      if (!res.ok) throw new Error('Failed to load requests')
      const data = (await res.json()) as { requests: RequestRow[] }
      setRequests(data.requests)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const userId = localStorage.getItem('carshare_user_id')
    setCurrentUserId(userId)
    if (!userId) {
      setLoading(false)
      return
    }
    void fetchData(userId)
    const onVis = () => {
      if (document.visibilityState === 'visible') void fetchData(userId)
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [fetchData])

  const act = async (id: string, action: 'accept' | 'decline') => {
    if (!currentUserId) return
    setActing(id)
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId: currentUserId }),
      })
      if (!res.ok) {
        setError('Could not update the request. Please try again.')
        return
      }
      await fetchData(currentUserId)
    } catch {
      setError('Could not update the request. Please try again.')
    } finally {
      setActing(null)
    }
  }

  const incoming = requests.filter((r) => r.target_user_id === currentUserId)
  const outgoing = requests.filter((r) => r.requester_id === currentUserId)

  return (
    <div className="min-h-dvh bg-background">
      <header className="fixed top-0 z-40 flex h-16 w-full items-center bg-background/80 px-gutter backdrop-blur-md">
        <h1 className="text-headline-lg-mobile font-bold text-on-surface">Inbox</h1>
      </header>

      <main className="mx-auto max-w-[32rem] space-y-lg px-gutter pb-24 pt-20">
        {loading && <LoadingSkeleton />}
        {!loading && !currentUserId && (
          <p className="text-body-md text-on-surface-variant">
            Pick who you are first by using the car once.
          </p>
        )}
        {error && (
          <p className="rounded-2xl bg-error-container p-md text-body-md text-on-error-container">
            {error}
          </p>
        )}

        {!loading && currentUserId && (
          <>
            <section>
              <h2 className="text-label-lg text-on-surface-variant">INCOMING</h2>
              {incoming.length === 0 ? (
                <p className="mt-sm text-body-md text-on-surface-variant">No incoming requests</p>
              ) : (
                <ul className="mt-sm space-y-md">
                  {incoming.map((req) => (
                    <li key={req.id} className="rounded-2xl bg-surface-container-lowest p-md">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-headline-lg-mobile text-on-surface">
                            {typeLabel(req.type)}
                          </p>
                          <p className="mt-1 text-body-md text-on-surface-variant">
                            From {req.requester_name}
                          </p>
                          <RequestDetails req={req} />
                        </div>
                        {req.status !== 'pending' && <StatusBadge status={req.status} />}
                      </div>
                      {req.status === 'pending' && (
                        <div className="mt-md flex gap-3">
                          <button
                            onClick={() => void act(req.id, 'accept')}
                            disabled={acting === req.id}
                            className="h-12 flex-1 rounded-lg bg-primary text-label-lg text-on-primary disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => void act(req.id, 'decline')}
                            disabled={acting === req.id}
                            className="h-12 flex-1 rounded-lg border border-outline text-label-lg text-on-surface disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="text-label-lg text-on-surface-variant">SENT</h2>
              {outgoing.length === 0 ? (
                <p className="mt-sm text-body-md text-on-surface-variant">No sent requests</p>
              ) : (
                <ul className="mt-sm space-y-md">
                  {outgoing.map((req) => (
                    <li key={req.id} className="rounded-2xl bg-surface-container-lowest p-md">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-headline-lg-mobile text-on-surface">
                            {typeLabel(req.type)}
                          </p>
                          <RequestDetails req={req} />
                        </div>
                        <StatusBadge status={req.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
