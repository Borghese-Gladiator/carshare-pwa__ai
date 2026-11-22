'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { GenerateResult, PlanOption } from '@/lib/planner/generate'
import type { Plan } from '@/lib/planner/model'
import { samplePlan } from '@/lib/planner/sample'

type PlanState = {
  plan: Plan
  setPlan: (plan: Plan) => void
  accepted?: PlanOption
  accept: (option: PlanOption) => void
  result?: GenerateResult
  setResult: (result?: GenerateResult) => void
}

const KEY = 'carshare-plan-v1'
const Ctx = createContext<PlanState | null>(null)

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlanRaw] = useState<Plan>(samplePlan)
  const [accepted, setAccepted] = useState<PlanOption | undefined>()
  const [result, setResult] = useState<GenerateResult | undefined>()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved.plan) setPlanRaw(saved.plan)
        if (saved.accepted) setAccepted(saved.accepted)
      }
    } catch {}
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(KEY, JSON.stringify({ plan, accepted }))
    } catch {}
  }, [plan, accepted, loaded])

  function setPlan(next: Plan) {
    setPlanRaw(next)
    setResult(undefined)
  }

  function accept(option: PlanOption) {
    setPlanRaw({ ...plan, events: option.events.filter((e) => !e.id.startsWith('intention:')) })
    setAccepted(option)
    setResult(undefined)
  }

  return <Ctx.Provider value={{ plan, setPlan, accepted, accept, result, setResult }}>{children}</Ctx.Provider>
}

export function usePlan(): PlanState {
  const value = useContext(Ctx)
  if (!value) throw new Error('usePlan needs PlanProvider')
  return value
}
