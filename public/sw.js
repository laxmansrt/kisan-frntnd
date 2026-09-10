/**
 * GovProcure Service Worker
 * ============================================================
 * Strategies:
 *   - Cache-First:              Static assets (app shell, fonts, icons)
 *   - Stale-While-Revalidate:  Farmer status API (/api/farmers/:id/status)
 *   - Network-Only:            Write operations (register, officer actions)
 *   - Background Sync:         Offline registration queue
 */

const CACHE_NAME = 'govprocure-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ── Install: pre-cache app shell ──────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: remove old caches ───────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: routing logic ──────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET API calls — let them go through network directly
  if (url.pathname.startsWith('/api/') && request.method !== 'GET') return;

  // Stale-while-revalidate for farmer status API
  if (url.pathname.match(/^\/api\/farmers\/\d+\/status/)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Cache-first for static assets
  if (!url.pathname.startsWith('/api/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Network-first for other API GETs
  event.respondWith(networkFirst(request));
});

// ── Background Sync: offline registrations ─────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-registrations') {
    event.waitUntil(syncPendingRegistrations());
  }
});

async function syncPendingRegistrations() {
  const db = await openIdb();
  const pending = await db.getAll('pendingRegistrations');

  for (const item of pending) {
    try {
      const resp = await fetch('/api/farmers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${item.token}`,
        },
        body: JSON.stringify(item.payload),
      });

      if (resp.ok) {
        const data = await resp.json();
        // Notify the open client page
        const clients = await self.clients.matchAll({ includeUncontrolled: true });
        for (const client of clients) {
          client.postMessage({ type: 'SYNC_COMPLETE', data, tempId: item.tempId });
        }
        await db.delete('pendingRegistrations', item.tempId);
      }
    } catch (e) {
      // Will retry on next sync event
      console.warn('[SW] Sync failed for', item.tempId, e.message);
    }
  }
}

// ── Push Notifications ─────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'GovProcure Update', {
      body: data.body || 'Your procurement status has been updated.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.openWindow(event.notification.data?.url || '/')
  );
});

// ── Strategy helpers ───────────────────────────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const resp = await fetch(request);
    if (resp.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, resp.clone());
    }
    return resp;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503, headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((resp) => {
    if (resp.ok) cache.put(request, resp.clone());
    return resp;
  }).catch(() => null);

  return cached || fetchPromise || new Response(JSON.stringify({ error: 'Offline' }), {
    status: 503, headers: { 'Content-Type': 'application/json' }
  });
}

// ── Minimal IndexedDB helper ───────────────────────────────
function openIdb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('govprocure-sw', 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore('pendingRegistrations', { keyPath: 'tempId' });
    };
    req.onsuccess = () => resolve(wrapIdb(req.result));
    req.onerror = () => reject(req.error);
  });
}

function wrapIdb(db) {
  const tx = (store, mode) => db.transaction(store, mode).objectStore(store);
  return {
    getAll: (store) => new Promise((res, rej) => {
      const r = tx(store, 'readonly').getAll();
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }),
    delete: (store, key) => new Promise((res, rej) => {
      const r = tx(store, 'readwrite').delete(key);
      r.onsuccess = () => res();
      r.onerror = () => rej(r.error);
    }),
  };
}
