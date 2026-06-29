import { WifiOff } from 'lucide-react'

// Public, fully static, data-free page. Precached by the service worker as the
// guaranteed offline navigation fallback — never an auth-gated shell.
export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-gutter">
      <div className="w-full max-w-[24rem] rounded-2xl bg-surface-container-lowest p-lg text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto mb-md flex h-12 w-12 items-center justify-center rounded-full bg-surface-container">
          <WifiOff size={24} className="text-on-surface-variant" />
        </div>
        <h1 className="text-headline-lg-mobile text-on-surface">You&rsquo;re offline</h1>
        <p className="mt-sm text-body-sm text-on-surface-variant">
          CarShare needs a connection to load. Check your network and try again.
        </p>
      </div>
    </main>
  )
}
