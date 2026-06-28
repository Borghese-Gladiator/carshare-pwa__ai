import type { User } from '@/lib/db/schema'

export interface CalendarReservation {
  id: string
  car_id: string
  user_id: string
  user_name: string
  start_time: string // ISO
  end_time: string // ISO
  title: string | null
  purpose: string | null
  status: string
  has_conflict: boolean
}

export interface CalendarPayload {
  reservations: CalendarReservation[]
  groupMembers: User[]
}

export interface ConflictInfo {
  id: string
  title: string | null
  start_time: string
  end_time: string
  user_name?: string
}
