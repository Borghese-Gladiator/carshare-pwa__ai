'use client'

import { useState } from 'react'
import { UserRound } from 'lucide-react'
import { USERS } from '@/lib/users'

interface UserSwitcherProps {
  currentUserId: string | null
  onChange: (userId: string) => void
}

export function UserSwitcher({ currentUserId, onChange }: UserSwitcherProps) {
  const [open, setOpen] = useState(false)
  const current = USERS.find((u) => u.id === currentUserId) ?? null

  const select = (userId: string) => {
    localStorage.setItem('carshare_user_id', userId)
    onChange(userId)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Switch user"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-full bg-surface-container pl-1 pr-3"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-label-md text-on-primary">
          {current ? current.name.charAt(0).toUpperCase() : <UserRound size={18} />}
        </span>
        <span className="text-label-md text-on-surface">{current?.name ?? 'Who are you?'}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-2xl bg-surface-container-lowest shadow-[var(--shadow-card)]"
          >
            {USERS.map((u) => (
              <button
                key={u.id}
                role="menuitem"
                onClick={() => select(u.id)}
                className={`flex w-full items-center gap-3 px-md py-sm text-left text-body-md ${
                  u.id === currentUserId
                    ? 'bg-primary-fixed text-on-primary-fixed'
                    : 'text-on-surface'
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-label-md text-on-primary">
                  {u.name.charAt(0).toUpperCase()}
                </span>
                {u.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
