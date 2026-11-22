import { BottomNav } from '@/components/nav/BottomNav'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="relative min-h-dvh pb-20 md:pb-0 md:pl-56">{children}</div>
      <BottomNav />
    </>
  )
}
