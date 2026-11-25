// オフラインで動かすための仕組み（Webアプリとして置いたときだけ使われる。Claudeのページでは使われない）。
// 電波があるときは毎回いちばん新しい版を取りに行き（3秒で返事がなければ保存しておいた版）、電波がないときは保存しておいた版を出す
const CACHE = "srpg-mapmaker-v13";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: "reload" }))))); self.skipWaiting(); });
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k); // 古い版の保存を消す
  await self.clients.claim();
})()));
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req, { cache: "no-cache" }).then(r => { if (r.ok) c.put(req, r.clone()); return r; });
    if (!hit) return net;
    const timeout = new Promise(res => setTimeout(() => res(null), 3000));
    try { return (await Promise.race([net, timeout])) || hit; } catch (err) { return hit; }
  })());
});
