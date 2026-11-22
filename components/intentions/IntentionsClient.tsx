'use client'

import { useMemo, useState } from 'react'
import { CircleAlert, CircleCheck, Plus, Trash2 } from 'lucide-react'
import { usePlan } from '@/components/plan/PlanProvider'
import { card, field, pageWrap, primaryBtn, secondaryBtn } from '@/components/ui'
import { addIntention, checkAll, removeIntention, validateIntention } from '@/lib/planner/fit'
import type { Intention } from '@/lib/planner/model'

const fromInput = (v: string) => (v ? `${v}:00Z` : '')

const empty = {
  description: '',
  hours: '2',
  start: '2026-11-28T09:00',
  end: '2026-11-29T21:00',
  people: [] as string[],
  places: [] as string[],
}

export function IntentionsClient() {
  const { plan, setPlan } = usePlan()
  const fits = useMemo(() => checkAll(plan), [plan])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')

  const nameOf = (id: string) => plan.people.find((p) => p.id === id)?.name ?? id
  const placeOf = (id: string) => plan.locations.find((l) => l.id === id)?.name ?? id

  function toggle(list: string[], id: string) {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const intention: Intention = {
      id: `goal-${Date.now()}`,
      description: form.description.trim(),
      personIds: form.people,
      minMinutes: Math.round(Number(form.hours) * 60),
      windowStart: fromInput(form.start),
      windowEnd: fromInput(form.end),
      ...(form.places.length > 0 ? { locationIds: form.places } : {}),
    }
    const problem = validateIntention(plan, intention)
    if (problem) {
      setError(problem)
      return
    }
    setPlan(addIntention(plan, intention))
    setForm(empty)
    setError('')
    setOpen(false)
  }

  return (
    <div className={pageWrap}>
      <header className="flex flex-wrap items-center justify-between gap-md">
        <div>
          <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">Goals</h1>
          <p className="text-body-sm text-on-surface-variant">
            A goal stays the same when the time changes. Each card says if the goal still fits.
          </p>
        </div>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className={primaryBtn}>
          <Plus size={18} aria-hidden />
          Add goal
        </button>
      </header>

      {open && (
        <form onSubmit={submit} aria-label="New goal" className={card + ' mt-lg space-y-md'}>
          <div>
            <label htmlFor="goal-name" className="text-body-sm text-on-surface-variant">Goal name</label>
            <input id="goal-name" className={field + ' mt-xs'} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <p className="text-body-sm text-on-surface-variant">The window is the time range that the goal can use. Times are UTC.</p>
          <div className="grid gap-md md:grid-cols-3">
            <div>
              <label htmlFor="goal-hours" className="text-body-sm text-on-surface-variant">Length in hours</label>
              <input id="goal-hours" type="number" min="0.5" step="0.5" className={field + ' mt-xs'} value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
            </div>
            <div>
              <label htmlFor="goal-start" className="text-body-sm text-on-surface-variant">Window starts</label>
              <input id="goal-start" type="datetime-local" className={field + ' mt-xs'} value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
            </div>
            <div>
              <label htmlFor="goal-end" className="text-body-sm text-on-surface-variant">Window ends</label>
              <input id="goal-end" type="datetime-local" className={field + ' mt-xs'} value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
            </div>
          </div>
          <fieldset>
            <legend className="text-body-sm text-on-surface-variant">Who is there</legend>
            <div className="mt-xs flex flex-wrap gap-sm">
              {plan.people.map((p) => (
                <label key={p.id} className="flex h-12 items-center gap-sm rounded-lg bg-surface-container px-md text-body-md text-on-surface">
                  <input type="checkbox" checked={form.people.includes(p.id)} onChange={() => setForm({ ...form, people: toggle(form.people, p.id) })} />
                  {p.name}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-body-sm text-on-surface-variant">Places that can work (leave empty for any)</legend>
            <div className="mt-xs flex flex-wrap gap-sm">
              {plan.locations.map((l) => (
                <label key={l.id} className="flex h-12 items-center gap-sm rounded-lg bg-surface-container px-md text-body-md text-on-surface">
                  <input type="checkbox" checked={form.places.includes(l.id)} onChange={() => setForm({ ...form, places: toggle(form.places, l.id) })} />
                  {l.name}
                </label>
              ))}
            </div>
          </fieldset>
          {error && <p role="alert" className="text-body-sm text-error">{error}</p>}
          <div className="flex gap-sm">
            <button type="submit" className={primaryBtn}>Save goal</button>
            <button type="button" onClick={() => { setOpen(false); setError('') }} className={secondaryBtn}>Cancel</button>
          </div>
        </form>
      )}

      <section aria-label="Goal list" className="mt-lg">
        {plan.intentions.length === 0 ? (
          <p className="rounded-2xl bg-surface-container-low p-lg text-body-md text-on-surface-variant">
            No goals yet. Select Add goal to say what you want to fit in.
          </p>
        ) : (
          <ul className="space-y-sm">
            {plan.intentions.map((it) => {
              const fit = fits.find((f) => f.intentionId === it.id)
              return (
                <li key={it.id} className={card + ' flex flex-wrap items-start justify-between gap-md'}>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-headline-lg-mobile text-on-surface">{it.description}</h2>
                    <p className="text-body-sm text-on-surface-variant">
                      At least {it.minMinutes / 60} hours · {it.personIds.map(nameOf).join(', ')}
                      {it.locationIds?.length ? ` · ${it.locationIds.map(placeOf).join(' or ')}` : ''}
                    </p>
                    <p className="mt-xs text-body-sm text-on-surface-variant">{fit?.reason}</p>
                    {fit?.fits && <p className="text-body-sm text-on-surface-variant">{fit.options} way{fit.options === 1 ? '' : 's'} to fit it.</p>}
                  </div>
                  <div className="flex items-center gap-sm">
                    <span
                      className={
                        fit?.fits
                          ? 'flex items-center gap-xs rounded-full bg-secondary-container px-md py-xs text-label-md text-on-secondary-container'
                          : 'flex items-center gap-xs rounded-full bg-error-container px-md py-xs text-label-md text-on-error-container'
                      }
                    >
                      {fit?.fits ? <CircleCheck size={14} aria-hidden /> : <CircleAlert size={14} aria-hidden />}
                      {fit?.fits ? 'Fits' : 'Cannot fit'}
                    </span>
                    <button
                      type="button"
                      aria-label={`Delete ${it.description}`}
                      onClick={() => setPlan(removeIntention(plan, it.id))}
                      className={secondaryBtn + ' w-12 px-0'}
                    >
                      <Trash2 size={18} aria-hidden />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
