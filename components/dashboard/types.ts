import type { CarNote, User } from '@/lib/db/schema'

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
  lastLocation: string | null
  groupMembers: User[]
  recentActivity: {
    id: string
    type: 'pickup' | 'return'
    userId: string
    userName: string
    loggedAt: string
    location: string | null
  }[]
  urgentNote: CarNote | null
}
