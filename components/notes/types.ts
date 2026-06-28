import type { CarNote } from '@/lib/db/schema'

// Wire shape: created_at arrives as a JSON string, not a Date.
export type NoteWithAuthor = Omit<CarNote, 'created_at'> & {
  created_at: string
  author_name: string
}

export interface NotesPayload {
  notes: NoteWithAuthor[]
}
