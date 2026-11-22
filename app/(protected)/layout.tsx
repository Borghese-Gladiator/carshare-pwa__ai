import { BottomNav } from '@/components/nav/BottomNav'
import { PlanProvider } from '@/components/plan/PlanProvider'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlanProvider>
      <div className="relative min-h-dvh pb-20 md:pb-0 md:pl-56">{children}</div>
      <BottomNav />
    </PlanProvider>
  )
}
