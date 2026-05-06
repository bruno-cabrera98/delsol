const SHELL_CACHE = 'delsol-shell-v1'
const API_CACHE = 'delsol-api-v1'
const IMAGE_CACHE = 'delsol-images-v1'
const AUDIO_CACHE = 'delsol-audio-v1'

const ALL_CACHES = [SHELL_CACHE, API_CACHE, IMAGE_CACHE, AUDIO_CACHE]

const SHELL_URLS = ['./', './index.html', './offline.html']

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS))
  )
  self.skipWaiting()
})

// Activate: delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('delsol-') && !ALL_CACHES.includes(key))
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Audio files: serve from cache if downloaded, else pass through (Range request support)
  if (url.hostname === 'cdn.dl.uy' && url.pathname.startsWith('/solmp3/')) {
    event.respondWith(audioCacheFirst(request))
    return
  }

  // API requests: network-first, fall back to cache when offline
  if (url.hostname === 'delsol.uy' && url.pathname.startsWith('/apisol/')) {
    event.respondWith(networkFirstWithFallback(request, API_CACHE))
    return
  }

  // CDN images: cache-first
  if (url.hostname === 'cdn.dl.uy') {
    event.respondWith(cacheFirstWithFallback(request, IMAGE_CACHE))
    return
  }

  // Same-origin (app shell): cache-first
  if (url.origin === location.origin || request.mode === 'navigate') {
    event.respondWith(shellCacheFirst(request))
    return
  }
})

async function shellCacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    // Navigation fallback
    if (request.mode === 'navigate') {
      const offline = await caches.match('./offline.html')
      if (offline) return offline
    }
    return new Response('Not found', { status: 404 })
  }
}

async function networkFirstWithFallback(request, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const response = await fetch(request)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    const cached = await cache.match(request)
    return cached ?? new Response(JSON.stringify({ error: 'offline' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503,
    })
  }
}

async function audioCacheFirst(request) {
  const cache = await caches.open(AUDIO_CACHE)
  // Match by URL only so Range requests also hit the cache
  const cached = await cache.match(request.url)
  if (cached) return cached
  // Not cached — pass through so the browser can stream with Range support
  return fetch(request)
}

async function cacheFirstWithFallback(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    // Return transparent 1×1 PNG for missing images
    const transparent = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    return new Response(atob(transparent), {
      headers: { 'Content-Type': 'image/png' },
    })
  }
}

// Download audio via no-cors so CORS headers aren't required
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'CACHE_AUDIO') return
  const { url, episodeId } = event.data
  // DownloadsContext transfers a MessageChannel port so reply goes back to the
  // right listener. Fall back to event.source for callers that don't transfer one.
  const replyPort = event.ports[0]
  const reply = (msg) => replyPort ? replyPort.postMessage(msg) : event.source?.postMessage(msg)

  event.waitUntil(
    caches.open(AUDIO_CACHE)
      .then(async (cache) => {
        const response = await fetch(url, { mode: 'no-cors' })
        await cache.put(url, response)
        reply({ type: 'AUDIO_CACHED', episodeId })
      })
      .catch((err) => {
        reply({ type: 'AUDIO_ERROR', episodeId, error: String(err) })
      })
  )
})
