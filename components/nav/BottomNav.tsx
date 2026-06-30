'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, LayoutDashboard, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', Icon: Calendar },
  { href: '/settings', label: 'Settings', Icon: Settings },
] as const

export function BottomNav() {
  const pathname = usePathname()

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
