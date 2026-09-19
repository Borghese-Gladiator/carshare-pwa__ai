import type { CarNote } from '@/lib/db/schema'

export interface DashboardPayload {
  car: { id: string; name: string; details: string | null }
  status: 'available' | 'reserved' | 'in_use' | 'needs_attention'
  activeHandoff: {
    userId: string
    userName: string
    userAvatar: string | null
    since: string
    expectedReturn: string | null
  } | null
  nextReservation: {
    userId: string
    userName: string
    startTime: string
    endTime: string
    title: string | null
  } | null
  upcomingReservations: {
    userId: string
    userName: string
    startTime: string
    endTime: string
    title: string | null
  }[]
  lastLocation: string | null
  recentActivity: {
    id: string
    type: 'pickup' | 'return'
    userId: string
    userName: string
    loggedAt: string
    location: string | null
    note: string | null
  }[]
  urgentNote: CarNote | null
}
