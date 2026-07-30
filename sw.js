/*
 * Web7 Clock - Service Worker
 *
 * 目的: 一度訪れたあとの再訪を速くし、オフラインでも時計が動くようにする。
 *       Webフォントも同梱済みなので、外部通信ゼロで完全に動作する。
 *
 * 方針:
 *   - HTML（ナビゲーション）は network-first。更新をすぐ反映させたいため。
 *     オフライン時のみキャッシュ、それも無ければトップページを返す。
 *   - 静的アセット（css/js/font/画像）は cache-first。中身が変わるときは
 *     必ず下の VERSION を上げる。
 *   - 同一オリジンの GET だけを扱う。GitHub API などの外部通信には介入しない。
 *
 * ★ css/js/fonts/画像を変更したら VERSION を上げること。
 *   上げ忘れると古いアセットが配信され続ける。
 */
const VERSION = 'v4';
const STATIC_CACHE = `web7clock-static-${VERSION}`;
const RUNTIME_CACHE = `web7clock-runtime-${VERSION}`;
const OFFLINE_FALLBACK = '/';

// インストール時に取りに行くもの。全14ページがオフラインで完結する範囲（gzip前で約620KB）。
// 時計ページを入れていないと、未訪問のデザインをオフラインで開いたときに
// URLだけ /clocks/xxx/ でトップページの中身が出るという分かりにくい状態になる。
const PRECACHE = [
  '/',
  '/guide/',
  '/clocks/neon/',
  '/clocks/minimal/',
  '/clocks/retro/',
  '/clocks/matrix/',
  '/clocks/gradient/',
  '/clocks/flip/',
  '/clocks/cyber/',
  '/clocks/terminal/',
  '/clocks/glass/',
  '/clocks/forest/',
  '/clocks/fireplace/',
  '/clocks/ocean/',
  '/css/common.css',
  '/js/clock.js',
  '/js/pwa.js',
  '/js/analytics.js',
  '/fonts/fonts.css',
  '/fonts/orbitron.woff2',
  '/fonts/inter.woff2',
  '/fonts/outfit.woff2',
  '/fonts/cormorant-garamond.woff2',
  '/fonts/bebas-neue.woff2',
  '/fonts/share-tech-mono.woff2',
  '/fonts/jetbrains-mono.woff2',
  '/images/favicon.svg',
  '/images/previews/neon.jpg',
  '/images/previews/minimal.jpg',
  '/images/previews/retro.jpg',
  '/images/previews/matrix.jpg',
  '/images/previews/gradient.jpg',
  '/images/previews/flip.jpg',
  '/images/previews/cyber.jpg',
  '/images/previews/terminal.jpg',
  '/images/previews/glass.jpg',
  '/images/previews/forest.jpg',
  '/images/previews/fireplace.jpg',
  '/images/previews/ocean.jpg',
];

// cache-first で扱う拡張子
const STATIC_EXT = /\.(?:css|js|woff2|svg|jpg|jpeg|png|webp|ico|webmanifest)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    // 1つ失敗しても install 全体を落とさない
    await Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([STATIC_CACHE, RUNTIME_CACHE]);
    const names = await caches.keys();
    await Promise.all(names.filter((n) => !keep.has(n)).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const fallback = await caches.match(OFFLINE_FALLBACK);
    if (fallback) return fallback;
    throw err;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // 外部（GitHub API 等）は素通し

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (STATIC_EXT.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});
