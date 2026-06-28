'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Calendar, Inbox, LayoutDashboard, Settings, StickyNote } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', Icon: Calendar },
  { href: '/inbox', label: 'Inbox', Icon: Inbox },
  { href: '/notes', label: 'Notes', Icon: StickyNote },
  { href: '/settings', label: 'Settings', Icon: Settings },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    const load = () => {
      const userId = localStorage.getItem('carshare_user_id')
      if (!userId) return
      // Same server-computed count the dashboard Bell uses, so the two badges
      // never disagree.
      fetch(`/api/requests/count?userId=${userId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d: { pendingIncomingCount: number } | null) => {
          if (!d) return
          setPendingCount(d.pendingIncomingCount)
        })
        .catch(() => {})
    }
    load()
    const onVis = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-surface-container-lowest pb-safe shadow-[var(--shadow-nav)]"
      aria-label="Primary"
    >
      <ul className="flex h-full items-start justify-around px-4 pt-3">
        {tabs.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center gap-1',
                  isActive ? 'text-primary' : 'text-on-surface-variant'
                )}
              >
                {isActive && (
                  <span className="absolute -top-3 h-1 w-8 rounded-full bg-primary" />
                )}
                <div className="relative">
                  <Icon size={24} aria-hidden />
                  {href === '/inbox' && pendingCount > 0 && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-error" />
                  )}
                </div>
                <span className="text-label-md">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
