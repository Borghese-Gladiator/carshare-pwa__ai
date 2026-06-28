'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, MapPin, MessageSquare, Plus, Search, StickyNote } from 'lucide-react'
import { AddNoteModal } from './AddNoteModal'
import type { NoteWithAuthor, NotesPayload } from './types'

function fmtRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `${Math.max(mins, 1)}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function NotesClient() {
  const [notes, setNotes] = useState<NoteWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [resolving, setResolving] = useState<Set<string>>(new Set())

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch('/api/notes')
      if (!res.ok) {
        setError('Could not load notes.')
        return
      }
      const data: NotesPayload = await res.json()
      setNotes(data.notes)
      setError(null)
    } catch {
      setError('Could not load notes.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotes()
    const onVis = () => {
      if (document.visibilityState === 'visible') fetchNotes()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [fetchNotes])

  async function handleResolve(id: string) {
    setResolving((prev) => new Set(prev).add(id))
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'PATCH' })
      if (!res.ok) {
        setError('Could not resolve note. Please try again.')
        return
      }
      await fetchNotes()
    } catch {
      setError('Could not resolve note. Please try again.')
    } finally {
      setResolving((prev) => {
        const s = new Set(prev)
        s.delete(id)
        return s
      })
    }
  }

  const filtered = notes.filter((n) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      n.body.toLowerCase().includes(q) || (n.location?.toLowerCase().includes(q) ?? false)
    )
  })

  return (
    <div className="min-h-dvh bg-background">
      <header className="fixed top-0 z-40 flex h-16 w-full items-center justify-between border-b border-outline-variant/20 bg-background/80 px-gutter backdrop-blur-md">
        <div className="flex items-center gap-2">
          <StickyNote size={24} className="text-primary" />
          <span className="text-headline-lg-mobile font-bold text-primary">Notes &amp; Issues</span>
        </div>
        <button
          onClick={() => setShowSearch((v) => !v)}
          aria-label="Search notes"
          className="text-on-surface-variant"
        >
          <Search size={24} />
        </button>
      </header>

      {showSearch && (
        <div className="fixed top-16 z-30 w-full bg-background px-gutter pb-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes…"
            autoFocus
            className="w-full rounded-lg border border-outline bg-surface px-md py-sm text-body-md text-on-surface"
          />
        </div>
      )}

      <main
        className={`mx-auto max-w-lg space-y-md px-gutter pb-8 ${showSearch ? 'pt-32' : 'pt-20'}`}
      >
        <button
          onClick={() => setShowAddModal(true)}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-label-md text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-95"
        >
          <Plus size={20} /> Add Note
        </button>

        {loading && <LoadingSkeleton />}

        {error && (
          <p className="rounded-2xl bg-error-container p-md text-body-md text-on-error-container">
            {error}
          </p>
        )}

        {!loading &&
          filtered.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onResolve={handleResolve}
              resolving={resolving.has(note.id)}
            />
          ))}

        {!loading && filtered.length === 0 && <EmptyState />}
      </main>

      {showAddModal && (
        <AddNoteModal
          onDone={() => {
            setShowAddModal(false)
            fetchNotes()
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}

interface NoteCardProps {
  note: NoteWithAuthor
  onResolve: (id: string) => void
  resolving: boolean
}

function NoteCard({ note, onResolve, resolving }: NoteCardProps) {
  if (note.location) return <LocationNoteCard note={note} onResolve={onResolve} resolving={resolving} />
  return (
    <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-md shadow-[var(--shadow-card)]">
      <div className="mb-sm flex items-start justify-between">
        <span
          className={`rounded-full px-3 py-1 text-label-sm uppercase tracking-wider ${
            note.urgency === 'urgent' ? 'bg-error text-on-error' : 'bg-primary text-on-primary'
          }`}
        >
          {note.urgency === 'urgent' ? 'Urgent' : 'FYI'}
        </span>
        <span className="text-label-sm text-on-surface-variant">
          {fmtRelative(note.created_at)}
        </span>
      </div>
      <p className="mb-lg text-body-md text-on-surface">{note.body}</p>
      <NoteFooter note={note} onResolve={onResolve} resolving={resolving} />
    </div>
  )
}

function LocationNoteCard({ note, onResolve, resolving }: NoteCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-[var(--shadow-card)]">
      <div className="relative flex h-24 w-full items-center justify-center bg-surface-container-high">
        <MapPin size={32} className="text-on-surface-variant opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/60 to-transparent" />
        <div className="absolute left-sm top-sm">
          <span className="flex items-center gap-1 rounded-full bg-on-surface px-3 py-1 text-label-sm uppercase tracking-wider text-surface">
            <MapPin size={12} /> Location
          </span>
        </div>
      </div>
      <div className="p-md">
        <p className="mb-xs text-body-md text-on-surface">{note.body}</p>
        <p className="mb-sm text-body-sm text-on-surface-variant">{note.location}</p>
        <NoteFooter note={note} onResolve={onResolve} resolving={resolving} />
      </div>
    </div>
  )
}

function NoteFooter({ note, onResolve, resolving }: NoteCardProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-fixed text-label-md text-on-primary-fixed">
          {note.author_name.charAt(0).toUpperCase()}
        </div>
        <span className="text-label-md text-on-surface">{note.author_name}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          disabled
          aria-label="Reply (coming soon)"
          className="flex cursor-not-allowed items-center gap-1 py-3 -my-3 text-label-md text-on-surface-variant opacity-40"
        >
          <MessageSquare size={14} /> Reply
        </button>
        <button
          onClick={() => onResolve(note.id)}
          disabled={resolving}
          className="flex items-center gap-1 py-3 -my-3 text-label-md text-on-surface-variant disabled:opacity-40"
        >
          <Check size={14} /> Resolve
        </button>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant p-lg text-center opacity-60">
      <StickyNote size={40} className="mb-sm text-on-surface-variant" />
      <p className="text-label-md text-on-surface-variant">No more notes to show</p>
      <p className="text-body-sm text-on-surface-variant/80">Stay safe and share updates!</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <>
      <div className="h-24 animate-pulse rounded-2xl bg-surface-container" />
      <div className="h-24 animate-pulse rounded-2xl bg-surface-container" />
    </>
  )
}
