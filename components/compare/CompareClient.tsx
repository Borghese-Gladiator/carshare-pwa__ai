'use client'

import { Check, RefreshCw, X } from 'lucide-react'
import { usePlan } from '@/components/plan/PlanProvider'
import { generatePlans, regenerate, type PlanOption } from '@/lib/planner/generate'
import type { Plan } from '@/lib/planner/model'

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })

const placeName = (plan: Plan, id?: string) => plan.locations.find((l) => l.id === id)?.name

export function CompareClient() {
  const { plan, accepted, accept, result, setResult } = usePlan()

  function run() {
    setResult(accepted ? regenerate(plan, accepted) : generatePlans(plan))
  }

  function reject(option: PlanOption) {
    if (!result) return
    setResult({ ...result, options: result.options.filter((o) => o !== option) })
  }

  const options = result?.options ?? []

  return (
    <div className="mx-auto w-full max-w-[80rem] px-gutter py-lg md:px-xl">
      <header className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">Compare</h1>
          <p className="text-body-sm text-on-surface-variant">
            {accepted ? 'Plan accepted. Change an event, then regenerate.' : 'Generate options for your goals.'}
          </p>
        </div>
        <button
          type="button"
          onClick={run}
          className="flex h-12 items-center gap-sm rounded-lg bg-primary px-lg text-label-lg text-on-primary"
        >
          <RefreshCw size={18} aria-hidden />
          Regenerate
        </button>
      </header>

      <section aria-label="Goals" className="mt-lg">
        <h2 className="text-label-md uppercase text-on-surface-variant">Goals</h2>
        <ul className="mt-sm space-y-sm">
          {plan.intentions.map((it) => {
            const block = accepted?.blocks.find((b) => b.intentionId === it.id)
            return (
              <li key={it.id} className="flex flex-wrap items-center justify-between gap-sm rounded-2xl bg-surface-container-lowest p-md shadow-[var(--shadow-card)]">
                <div>
                  <p className="text-body-md text-on-surface">{it.description}</p>
                  <p className="text-body-sm text-on-surface-variant">
                    At least {it.minMinutes / 60} hours
                    {it.locationIds?.length ? ` · ${it.locationIds.map((id) => placeName(plan, id)).join(' or ')}` : ''}
                  </p>
                </div>
                <span
                  className={
                    block
                      ? 'rounded-full bg-secondary-container px-md py-xs text-label-md text-on-secondary-container'
                      : 'rounded-full bg-surface-container px-md py-xs text-label-md text-on-surface-variant'
                  }
                >
                  {block ? `Scheduled ${fmt(block.start)} at ${placeName(plan, block.locationId)}` : 'Not scheduled'}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <section aria-label="Options" className="mt-xl">
        {!result && (
          <p className="rounded-2xl bg-surface-container-low p-lg text-body-md text-on-surface-variant">
            No options yet. Select Regenerate to see up to 3 ways to fit your goals.
          </p>
        )}
        {result && options.length === 0 && (
          <p role="status" className="rounded-2xl bg-error-container p-lg text-body-md text-on-error-container">
            {result.reason ?? 'All options are rejected. Select Regenerate to try again.'}
          </p>
        )}
        {options.length > 0 && (
          <ol className="flex snap-x snap-mandatory gap-md overflow-x-auto pb-md md:grid md:grid-cols-3 md:overflow-visible">
            {options.map((o, i) => (
              <li
                key={o.blocks.map((b) => b.start + b.locationId).join() + i}
                className="w-[85%] shrink-0 snap-center rounded-2xl bg-surface-container-lowest p-md shadow-[var(--shadow-card)] md:w-auto"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-headline-lg-mobile text-on-surface">Option {i + 1}</h3>
                  <span className="rounded-full bg-primary-fixed px-md py-xs text-label-md text-on-primary-fixed">
                    Score {o.score}
                  </span>
                </div>
                <ul className="mt-md space-y-xs">
                  {o.blocks.map((b) => (
                    <li key={b.intentionId} className="text-body-md text-on-surface">
                      {plan.intentions.find((it) => it.id === b.intentionId)?.description}: {fmt(b.start)} to {fmt(b.end)}
                      {b.locationId ? ` at ${placeName(plan, b.locationId)}` : ''}
                    </li>
                  ))}
                </ul>
                <p className="mt-md text-label-md uppercase text-on-surface-variant">
                  {o.movedEventIds.length === 0 ? 'No events move' : `${o.movedEventIds.length} event moves`}
                </p>
                <ul className="mt-xs space-y-xs">
                  {o.movedEventIds.map((id) => {
                    const before = plan.events.find((e) => e.id === id)!
                    const after = o.events.find((e) => e.id === id)!
                    return (
                      <li key={id} className="text-body-sm text-on-surface-variant">
                        {before.title}: {fmt(before.start)} to {fmt(after.start)}
                      </li>
                    )
                  })}
                </ul>
                <details className="mt-md">
                  <summary className="cursor-pointer text-body-sm text-primary">Why this option</summary>
                  <p className="mt-xs text-body-sm text-on-surface-variant">{o.explanation}</p>
                </details>
                <div className="mt-lg flex gap-sm">
                  <button
                    type="button"
                    onClick={() => accept(o)}
                    className="flex h-12 flex-1 items-center justify-center gap-xs rounded-lg bg-primary text-label-lg text-on-primary"
                  >
                    <Check size={18} aria-hidden />
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => reject(o)}
                    className="flex h-12 flex-1 items-center justify-center gap-xs rounded-lg bg-surface-container text-label-lg text-on-surface"
                  >
                    <X size={18} aria-hidden />
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
