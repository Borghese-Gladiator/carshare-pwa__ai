const CACHE = 'carshare-v1'

// Precached on install. /offline is PUBLIC (no auth) and fully static, so its
// fetch always returns 200 — it is the guaranteed offline navigation fallback.
// The auth-gated tab routes are precached opportunistically too, but ONLY
// /offline is treated as required: a logged-out first install must still yield
// a working offline page. /login and /api/* are never precached.
const OFFLINE_URL = '/offline'
const PRECACHE = [
  OFFLINE_URL,
  '/dashboard',
  '/calendar',
  '/settings',
]

// ── Install: precache resiliently ────────────────────────────────────────────
// addAll is atomic — one non-2xx (e.g. an auth 302 on /dashboard while logged
// out) would reject the whole batch and cache nothing. Instead add each URL
// independently via allSettled so a redirect on an auth-gated page can't void
// the batch, and the always-200 /offline page is guaranteed to land in cache.
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      Promise.allSettled(
        PRECACHE.map((url) =>
          fetch(url, { redirect: 'manual' }).then((res) => {
            // Only store genuine 200s. A redirect (type 'opaqueredirect' with
            // redirect:'manual', or any non-ok) is dropped, never cached.
            if (res.ok && res.type !== 'opaqueredirect') {
              return c.put(url, res)
            }
          })
        )
      )
    )
  )
  self.skipWaiting()
})

// ── Activate: purge stale cache versions ────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (e) => {
  const { request } = e
  // Only intercept GET; POST/PATCH/DELETE (mutations) always go to the network.
  if (request.method !== 'GET') return
  // Only intercept same-origin requests.
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // ── NEVER CACHE: all API routes ──────────────────────────────────────────
  // Explicit exclusions (belt-and-suspenders comment for review):
  //   /api/dashboard/status, /api/dashboard/return
  //   /api/reservations, /api/reservations/[id]
  //   /api/notes, /api/notes/[id]
  //   /api/auth/login, /api/auth/logout
  // Rationale: these carry live auth-gated data; stale responses cause data
  // divergence; mutations must never be replayed from a cache.
  if (url.pathname.startsWith('/api/')) return

  // ── CACHE-FIRST: Next.js content-addressed static assets ────────────────
  // /_next/static/ filenames embed a build hash, so they are immutable once
  // deployed. Serve from cache; on miss, fetch and store for next time.
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone()
              e.waitUntil(caches.open(CACHE).then((c) => c.put(request, copy)))
            }
            return res
          })
      )
    )
    return
  }

  // ── NETWORK-FIRST: navigation (HTML page) requests ───────────────────────
  // Strategy: try network; on success, update cache ONLY if res.ok (200).
  //   - A 302 redirect (unauthenticated → /login) is never cached, so an
  //     unauthenticated offline user never gets a cached authed shell.
  //   - On network failure (offline), fall back to the cache for the same URL,
  //     then to the always-public /offline page, then to a cached /offline.
  //   We deliberately NEVER fall back to an auth-gated page (e.g. /dashboard):
  //   doing so would flash protected chrome to a logged-out/offline user before
  //   the APIs 401. The /offline page is auth-free and data-free, so it is safe.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            e.waitUntil(caches.open(CACHE).then((c) => c.put(request, copy)))
          }
          return res
        })
        .catch(async () => {
          // 1. The exact page the user requested, if it was previously cached
          //    (only res.ok navigations are ever cached). This is the legit
          //    "logged-in then offline → my shell still loads" path. We do NOT
          //    substitute a different auth-gated page (e.g. /dashboard) for an
          //    arbitrary failed navigation — that was the SW2 leak.
          const hit = await caches.match(request)
          if (hit) return hit
          // 2. The guaranteed-public, auth-free, data-free offline page
          //    (precached on install — always lands because it returns 200).
          const offline = await caches.match(OFFLINE_URL)
          if (offline) return offline
          // 3. Last resort if even /offline missed the cache: route there.
          return Response.redirect(OFFLINE_URL, 302)
        })
    )
  }
  // All other GET requests (fonts, images from next/image, etc.) fall through
  // to the browser's own HTTP cache — no SW interception needed.
})
