import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { PWAInstallProvider } from '@/components/pwa/pwa-install-provider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

// Viewport is split from Metadata in Next.js 13+ to avoid the deprecated
// themeColor on the Metadata type.
export const viewport: Viewport = {
  themeColor: '#0050cb',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'CarShare',
  description: 'Shared car coordination for two people',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CarShare',
  },
  icons: { apple: '/icons/icon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <PWAInstallProvider />
        {children}
        <Script id="sw-register" strategy="afterInteractive">{`
          if ('serviceWorker' in navigator) {
            if (${JSON.stringify(process.env.NODE_ENV === 'production')}) {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            } else {
              navigator.serviceWorker.getRegistrations().then((rs) => {
                rs.forEach((r) => r.unregister());
              });
              if (window.caches) {
                caches.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
              }
            }
          }
        `}</Script>
      </body>
    </html>
  )
}
