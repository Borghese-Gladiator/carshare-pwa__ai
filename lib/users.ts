import type { User } from './db/schema'

export const GROUP_ID = '00000000-0000-0000-0000-000000000001'
export const CAR_ID = '00000000-0000-0000-0000-000000000004'

export const JON_ID = '00000000-0000-0000-0000-000000000002'
export const TIMMY_ID = '00000000-0000-0000-0000-000000000003'

export const USERS: User[] = [
  { id: JON_ID, name: 'Jon', avatar: null, group_id: GROUP_ID, created_at: new Date(0) },
  { id: TIMMY_ID, name: 'Timmy', avatar: null, group_id: GROUP_ID, created_at: new Date(0) },
]

export function isKnownUserId(id: string | null | undefined): id is string {
  return id === JON_ID || id === TIMMY_ID
}
