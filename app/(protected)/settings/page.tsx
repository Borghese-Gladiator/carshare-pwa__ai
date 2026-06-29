'use client'

import { useEffect, useState } from 'react'
import { Download, Smartphone } from 'lucide-react'
import {
  getDeferredInstallPrompt,
  clearDeferredInstallPrompt,
  INSTALL_PROMPT_EVENT,
} from '@/components/pwa/pwa-install-provider'

export default function SettingsPage() {
  const [canInstall, setCanInstall] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // SSR-safe: window only accessible client-side
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
    // Re-read availability whenever the provider captures/clears the prompt, so
    // a beforeinstallprompt firing after this page mounts still surfaces the
    // button (symmetric with the appinstalled listener below).
    const syncAvailability = () => setCanInstall(!!getDeferredInstallPrompt())
    syncAvailability()
    const onInstalled = () => {
      setInstalled(true)
      setCanInstall(false)
      clearDeferredInstallPrompt()
    }
    window.addEventListener(INSTALL_PROMPT_EVENT, syncAvailability)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener(INSTALL_PROMPT_EVENT, syncAvailability)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const handleInstall = async () => {
    const prompt = getDeferredInstallPrompt()
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') {
      setInstalled(true)
      clearDeferredInstallPrompt()
      setCanInstall(false)
    }
    // On 'dismissed' we keep the deferred prompt and the button is hidden only
    // because the browser will not allow re-prompting with the same event; the
    // UI falls through to the manual-instructions state so the user still has a
    // recoverable path.
    else {
      clearDeferredInstallPrompt()
      setCanInstall(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="fixed top-0 z-40 flex h-16 w-full items-center bg-background/80 px-gutter backdrop-blur-md">
        <h1 className="text-headline-lg-mobile font-bold text-on-surface">Settings</h1>
      </header>
      <main className="mx-auto max-w-[32rem] space-y-md px-gutter pb-8 pt-20">
        {/* Install card */}
        <div className="rounded-2xl bg-surface-container-lowest p-md shadow-[var(--shadow-card)]">
          <div className="mb-md flex items-center gap-3">
            <Smartphone size={24} className="text-primary" />
            <h2 className="text-headline-lg-mobile text-on-surface">Install App</h2>
          </div>
          {isStandalone || installed ? (
            <p className="text-body-md text-on-surface-variant">
              CarShare is installed on this device.
            </p>
          ) : canInstall ? (
            <>
              <p className="mb-md text-body-md text-on-surface-variant">
                Add CarShare to your home screen for a faster, full-screen experience.
              </p>
              <button
                onClick={() => void handleInstall()}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary text-label-lg text-on-primary"
              >
                <Download size={18} /> Add to Home Screen
              </button>
            </>
          ) : (
            <p className="text-body-md text-on-surface-variant">
              To install, open your browser menu and choose &ldquo;Add to Home Screen&rdquo;.
            </p>
          )}
        </div>
        {/* About card */}
        <div className="rounded-2xl bg-surface-container-lowest p-md shadow-[var(--shadow-card)]">
          <h2 className="mb-sm text-headline-lg-mobile text-on-surface">About</h2>
          <p className="text-body-sm text-on-surface-variant">CarShare · v0.1.0</p>
          <p className="mt-xs text-body-sm text-on-surface-variant">
            Shared car coordination for two people.
          </p>
        </div>
      </main>
    </div>
  )
}
