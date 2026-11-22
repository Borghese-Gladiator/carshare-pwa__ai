'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, GitCompareArrows, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/compare', label: 'Compare', Icon: GitCompareArrows },
  { href: '/week', label: 'Week', Icon: CalendarDays },
  { href: '/settings', label: 'Settings', Icon: Settings },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-surface-container-lowest pb-safe shadow-[var(--shadow-nav)] md:hidden"
        aria-label="Primary"
      >
        <ul className="flex h-full items-start justify-around px-4 pt-3">
          {tabs.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center gap-1',
                  isActive(href) ? 'text-primary' : 'text-on-surface-variant'
                )}
              >
                {isActive(href) && <span className="absolute -top-3 h-1 w-8 rounded-full bg-primary" />}
                <Icon size={24} aria-hidden />
                <span className="text-label-md">{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <aside
        className="fixed inset-y-0 left-0 z-50 hidden w-56 bg-surface-container-lowest p-md shadow-[var(--shadow-card)] md:block"
        aria-label="Sidebar"
      >
        <p className="px-sm pb-lg text-headline-lg-mobile text-on-surface">CarShare</p>
        <ul className="space-y-xs">
          {tabs.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                className={cn(
                  'flex h-12 items-center gap-sm rounded-lg px-sm text-label-lg',
                  isActive(href) ? 'bg-primary-fixed text-on-primary-fixed' : 'text-on-surface-variant'
                )}
              >
                <Icon size={20} aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
    </>
  )
}
