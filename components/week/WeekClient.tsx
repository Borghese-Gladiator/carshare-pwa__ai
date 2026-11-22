'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Lock, TriangleAlert } from 'lucide-react'
import { usePlan } from '@/components/plan/PlanProvider'
import { card, pageWrap, secondaryBtn } from '@/components/ui'
import { buildLanes, daysOf, withBlocks } from '@/lib/planner/week'

const DAY = 86400000
const HOURS = [0, 3, 6, 9, 12, 15, 18, 21]

const time = (t: number) =>
  new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })

const dayLabel = (day: string) =>
  new Date(day + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' })

export function WeekClient() {
  const { plan: base, accepted } = usePlan()
  const plan = withBlocks(base, accepted?.blocks)
  const days = daysOf(plan)
  const [index, setIndex] = useState(0)
  const day = days[Math.min(index, days.length - 1)]

  if (!day) {
    return (
      <div className={pageWrap}>
        <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">Week</h1>
        <p className="mt-lg rounded-2xl bg-surface-container-low p-lg text-body-md text-on-surface-variant">
          No events yet. Add an event to see it here.
        </p>
      </div>
    )
  }

  const from = Date.parse(day + 'T00:00:00Z')
  const lanes = buildLanes(plan, day)
  const pos = (t: number) => Math.max(0, Math.min(100, ((t - from) / DAY) * 100))

  return (
    <div className={pageWrap}>
      <header className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">Week</h1>
          <p className="text-body-sm text-on-surface-variant">Each row is one person or one car. Times are UTC.</p>
        </div>
        <div className="flex items-center gap-sm">
          <button
            type="button"
            aria-label="Previous day"
            disabled={index === 0}
            onClick={() => setIndex(index - 1)}
            className={secondaryBtn + ' w-12 px-0'}
          >
            <ChevronLeft size={20} aria-hidden />
          </button>
          <p aria-live="polite" className="min-w-40 text-center text-label-lg text-on-surface">
            {dayLabel(day)}
          </p>
          <button
            type="button"
            aria-label="Next day"
            disabled={index >= days.length - 1}
            onClick={() => setIndex(index + 1)}
            className={secondaryBtn + ' w-12 px-0'}
          >
            <ChevronRight size={20} aria-hidden />
          </button>
        </div>
      </header>

      <section aria-label="Schedule" className={card + ' mt-lg overflow-x-auto'}>
        <div className="min-w-[40rem]">
          <div className="relative ml-28 h-6" aria-hidden>
            {HOURS.map((h) => (
              <span key={h} className="absolute text-label-sm text-on-surface-variant" style={{ left: `${(h / 24) * 100}%` }}>
                {h === 0 ? '12a' : h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`}
              </span>
            ))}
          </div>
          <ul className="space-y-sm">
            {lanes.map((lane) => (
              <li key={lane.id} aria-label={`${lane.kind === 'car' ? 'Car' : 'Person'} ${lane.label}`} className="flex items-center gap-sm">
                <p className="w-28 shrink-0 truncate text-label-lg text-on-surface">{lane.label}</p>
                <div className="relative h-14 flex-1 rounded-lg bg-surface-container-low">
                  {lane.items.length === 0 && (
                    <p className="absolute inset-0 flex items-center px-sm text-body-sm text-on-surface-variant">Free all day</p>
                  )}
                  {lane.items.map((item) => {
                    const left = pos(item.start)
                    const width = Math.max(pos(item.end) - left, 1.5)
                    const tone =
                      item.kind === 'travel'
                        ? item.conflict
                          ? 'border border-dashed border-error bg-error-container text-on-error-container'
                          : 'border border-dashed border-outline bg-surface-container text-on-surface-variant'
                        : item.conflict
                          ? 'bg-error-container text-on-error-container'
                          : item.fixed
                            ? 'bg-primary text-on-primary'
                            : 'bg-primary-fixed text-on-primary-fixed'
                    return (
                      <div
                        key={item.id}
                        role="group"
                        aria-label={`${item.title}, ${time(item.start)} to ${time(item.end)}${item.fixed ? ', fixed' : ''}${item.conflict ? ', conflict' : ''}`}
                        className={`absolute top-1 bottom-1 overflow-hidden rounded-md px-xs text-label-sm ${tone}`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                      >
                        <p className="flex items-center gap-xs truncate">
                          {item.fixed && <Lock size={12} aria-hidden />}
                          {item.conflict && <TriangleAlert size={12} aria-hidden />}
                          {item.title}
                        </p>
                        <p className="truncate">{time(item.start)}</p>
                      </div>
                    )
                  })}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <ul aria-label="Legend" className="mt-md flex flex-wrap gap-md text-body-sm text-on-surface-variant">
        <li className="flex items-center gap-xs"><Lock size={14} aria-hidden /> Fixed event</li>
        <li className="flex items-center gap-xs"><span className="inline-block h-3 w-6 rounded-sm bg-primary-fixed" aria-hidden /> Movable event</li>
        <li className="flex items-center gap-xs"><span className="inline-block h-3 w-6 rounded-sm border border-dashed border-outline" aria-hidden /> Travel time</li>
        <li className="flex items-center gap-xs"><TriangleAlert size={14} aria-hidden /> Conflict</li>
      </ul>
    </div>
  )
}
