'use client'

import { useEffect } from 'react'

// Browser's BeforeInstallPromptEvent is not in the standard lib.
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Module-level — survives re-renders; accessible synchronously from any
// component without a context provider.
let _deferred: BeforeInstallPromptEvent | null = null

// Fired whenever the captured prompt's availability changes (captured or
// cleared). Subscribers (e.g. Settings) read getDeferredInstallPrompt() on it,
// so a beforeinstallprompt that fires AFTER a page mounts is not missed.
export const INSTALL_PROMPT_EVENT = 'carshare:install-availability'

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return _deferred
}

export function clearDeferredInstallPrompt(): void {
  _deferred = null
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(INSTALL_PROMPT_EVENT))
  }
}

// Renders nothing. Must be mounted in the root layout so the event is captured
// before Settings (or any other page) ever mounts.
export function PWAInstallProvider() {
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault() // suppress the default mini-infobar
      _deferred = e as BeforeInstallPromptEvent
      window.dispatchEvent(new Event(INSTALL_PROMPT_EVENT))
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])
  return null
}
