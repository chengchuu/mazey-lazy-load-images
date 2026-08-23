/* global self, caches, fetch, URL */
const PROJECT_BASE = "__PWA_PROJECT_BASE__";
const CACHE_PREFIX = "__PWA_CACHE_PREFIX__";
const CACHE_NAME = `${CACHE_PREFIX}__PWA_CACHE_VERSION__`;
const API_APP_SHELL = __PWA_API_APP_SHELL__;
const APP_SHELL = [
  PROJECT_BASE,
  `${PROJECT_BASE}playground/`,
  `${PROJECT_BASE}api/`,
  `${PROJECT_BASE}manifest.webmanifest`,
  `${PROJECT_BASE}assets/shared.css`,
  `${PROJECT_BASE}assets/shared.js`,
  `${PROJECT_BASE}assets/home.js`,
  `${PROJECT_BASE}assets/playground.js`,
  `${PROJECT_BASE}assets/playground.css`,
  `${PROJECT_BASE}assets/api.js`,
  `${PROJECT_BASE}assets/api.css`,
  ...API_APP_SHELL,
];
const APP_SHELL_PATHS = new Set(APP_SHELL);

function canCache(response) {
  return (
    response.ok &&
    response.status === 200 &&
    response.type !== "opaque" &&
    response.type !== "opaqueredirect"
  );
}
function isProjectRequest(request) {
  const url = new URL(request.url);
  return (
    request.method === "GET" &&
    url.origin === self.location.origin &&
    url.pathname.startsWith(PROJECT_BASE) &&
    !url.pathname.endsWith(".map")
  );
}
async function put(request, response) {
  if (!canCache(response)) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  const keys = await cache.keys();
  const runtime = keys.filter((key) => {
    const url = new URL(key.url);
    return !APP_SHELL_PATHS.has(`${url.pathname}${url.search}`);
  });
  await Promise.all(
    runtime
      .slice(0, Math.max(0, runtime.length - 96))
      .map((key) => cache.delete(key)),
  );
}
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    await put(request, response);
    return response;
  } catch (error) {
    const cached = await caches.match(request, { cacheName: CACHE_NAME });
    if (cached) return cached;
    throw error;
  }
}
async function cacheFirst(request) {
  const cached = await caches.match(request, { cacheName: CACHE_NAME });
  if (cached) return cached;
  const response = await fetch(request);
  await put(request, response);
  return response;
}
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter(
              (name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME,
            )
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", (event) => {
  if (!isProjectRequest(event.request)) return;
  const destination = event.request.destination;
  if (
    event.request.mode === "navigate" ||
    ["document", "script", "style"].includes(destination)
  )
    event.respondWith(networkFirst(event.request));
  else if (["font", "image"].includes(destination))
    event.respondWith(cacheFirst(event.request));
});
