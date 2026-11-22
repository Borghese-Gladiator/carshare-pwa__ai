'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { usePlan } from '@/components/plan/PlanProvider'
import { card, field, pageWrap, primaryBtn, secondaryBtn } from '@/components/ui'
import { travelMinutes } from '@/lib/planner/model'
import { addCar, addLocation, addPerson, missingTravel, removeCar, removeLocation, removePerson, setTravel, type Edit } from '@/lib/planner/setup'

export function SetupClient() {
  const { plan, setPlan } = usePlan()
  const [error, setError] = useState('')
  const [person, setPerson] = useState('')
  const [place, setPlace] = useState('')
  const [carName, setCarName] = useState('')
  const [carPlace, setCarPlace] = useState('')

  function apply(edit: Edit, after?: () => void) {
    if (edit.error) {
      setError(edit.error)
      return
    }
    setError('')
    setPlan(edit.plan)
    after?.()
  }

  const missing = missingTravel(plan)
  const placeName = (id: string) => plan.locations.find((l) => l.id === id)?.name ?? id

  return (
    <div className={pageWrap}>
      <header>
        <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">Setup</h1>
        <p className="text-body-sm text-on-surface-variant">People, places, cars and travel times. The planner uses these to check what fits.</p>
      </header>

      {error && (
        <p role="alert" className="mt-md rounded-2xl bg-error-container p-md text-body-md text-on-error-container">
          {error}
        </p>
      )}

      <div className="mt-lg grid gap-lg md:grid-cols-3">
        <section aria-label="People" className={card}>
          <h2 className="text-headline-lg-mobile text-on-surface">People</h2>
          <ul className="mt-md space-y-sm">
            {plan.people.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-sm text-body-md text-on-surface">
                {p.name}
                <button type="button" aria-label={`Remove ${p.name}`} onClick={() => apply(removePerson(plan, p.id))} className={secondaryBtn + ' w-12 px-0'}>
                  <Trash2 size={18} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <form
            className="mt-md flex gap-sm"
            onSubmit={(e) => {
              e.preventDefault()
              apply(addPerson(plan, person), () => setPerson(''))
            }}
          >
            <label htmlFor="person-name" className="sr-only">Person name</label>
            <input id="person-name" className={field} placeholder="Name" value={person} onChange={(e) => setPerson(e.target.value)} />
            <button type="submit" aria-label="Add person" className={primaryBtn + ' w-12 shrink-0 px-0'}>
              <Plus size={18} aria-hidden />
            </button>
          </form>
        </section>

        <section aria-label="Places" className={card}>
          <h2 className="text-headline-lg-mobile text-on-surface">Places</h2>
          <ul className="mt-md space-y-sm">
            {plan.locations.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-sm text-body-md text-on-surface">
                {l.name}
                <button type="button" aria-label={`Remove ${l.name}`} onClick={() => apply(removeLocation(plan, l.id))} className={secondaryBtn + ' w-12 px-0'}>
                  <Trash2 size={18} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <form
            className="mt-md flex gap-sm"
            onSubmit={(e) => {
              e.preventDefault()
              apply(addLocation(plan, place), () => setPlace(''))
            }}
          >
            <label htmlFor="place-name" className="sr-only">Place name</label>
            <input id="place-name" className={field} placeholder="Place" value={place} onChange={(e) => setPlace(e.target.value)} />
            <button type="submit" aria-label="Add place" className={primaryBtn + ' w-12 shrink-0 px-0'}>
              <Plus size={18} aria-hidden />
            </button>
          </form>
        </section>

        <section aria-label="Cars" className={card}>
          <h2 className="text-headline-lg-mobile text-on-surface">Cars</h2>
          <ul className="mt-md space-y-sm">
            {plan.cars.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-sm text-body-md text-on-surface">
                <span>
                  {c.name}
                  <span className="block text-body-sm text-on-surface-variant">Kept at {placeName(c.locationId)}</span>
                </span>
                <button type="button" aria-label={`Remove ${c.name}`} onClick={() => apply(removeCar(plan, c.id))} className={secondaryBtn + ' w-12 px-0'}>
                  <Trash2 size={18} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <form
            className="mt-md space-y-sm"
            onSubmit={(e) => {
              e.preventDefault()
              apply(addCar(plan, carName, carPlace || plan.locations[0]?.id || ''), () => setCarName(''))
            }}
          >
            <label htmlFor="car-name" className="sr-only">Car name</label>
            <input id="car-name" className={field} placeholder="Car name" value={carName} onChange={(e) => setCarName(e.target.value)} />
            <label htmlFor="car-place" className="sr-only">Car is kept at</label>
            <select id="car-place" className={field} value={carPlace || plan.locations[0]?.id || ''} onChange={(e) => setCarPlace(e.target.value)}>
              {plan.locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <button type="submit" className={primaryBtn + ' w-full'}>
              <Plus size={18} aria-hidden />
              Add car
            </button>
          </form>
        </section>
      </div>

      <section aria-label="Travel times" className={card + ' mt-lg'}>
        <h2 className="text-headline-lg-mobile text-on-surface">Travel times</h2>
        <p className="text-body-sm text-on-surface-variant">Minutes by car between two places. The time is the same in both directions. Leave a cell empty if you do not know it.</p>
        {missing.length > 0 && (
          <p role="status" className="mt-sm text-body-sm text-tertiary">
            {missing.length} pair{missing.length === 1 ? '' : 's'} with no time. The planner treats them as zero.
          </p>
        )}
        <div className="mt-md overflow-x-auto">
          <table className="w-full min-w-[32rem] border-separate border-spacing-xs text-body-sm">
            <thead>
              <tr>
                <td />
                {plan.locations.map((l) => (
                  <th key={l.id} scope="col" className="px-sm text-left text-label-md text-on-surface-variant">{l.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plan.locations.map((row) => (
                <tr key={row.id}>
                  <th scope="row" className="pr-sm text-left text-label-md text-on-surface-variant">{row.name}</th>
                  {plan.locations.map((col) => {
                    if (row.id === col.id) return <td key={col.id} className="rounded-lg bg-surface-container-low px-sm text-center text-on-surface-variant">–</td>
                    const value = travelMinutes(plan.travel, row.id, col.id)
                    return (
                      <td key={col.id}>
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          aria-label={`Minutes from ${row.name} to ${col.name}`}
                          className={field + ' h-12 text-center'}
                          value={value ?? ''}
                          onChange={(e) => apply(setTravel(plan, row.id, col.id, e.target.value === '' ? undefined : Number(e.target.value)))}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
