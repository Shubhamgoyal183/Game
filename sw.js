// Ye file tools/build-sw.js se banti hai. Haath se mat badlo.
const CACHE = "gamezone-ae58bf3dbe";
const FILES = [
  "./",
  "./css/game.css",
  "./css/style.css",
  "./games/2048/index.html",
  "./games/archery/index.html",
  "./games/bike/index.html",
  "./games/bubble/index.html",
  "./games/candy/index.html",
  "./games/car/index.html",
  "./games/connect4/index.html",
  "./games/cooking/index.html",
  "./games/dodge/index.html",
  "./games/flappy/flappy.js",
  "./games/flappy/index.html",
  "./games/fruit/index.html",
  "./games/guess/index.html",
  "./games/hillclimb/index.html",
  "./games/jigsaw/index.html",
  "./games/jumper/index.html",
  "./games/math/index.html",
  "./games/memory/index.html",
  "./games/mines/index.html",
  "./games/ninja/index.html",
  "./games/pong/index.html",
  "./games/pool/index.html",
  "./games/reaction/index.html",
  "./games/rope/index.html",
  "./games/rps/index.html",
  "./games/runner/index.html",
  "./games/simon/index.html",
  "./games/snake/index.html",
  "./games/tank/index.html",
  "./games/tictactoe/index.html",
  "./games/whack/index.html",
  "./games/zombie/index.html",
  "./icons/apple-touch-icon.png",
  "./icons/favicon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./index.html",
  "./js/common.js",
  "./js/games.js",
  "./js/home.js",
  "./js/pwa.js",
  "./manifest.json",
  "./games/2048/",
  "./games/archery/",
  "./games/bike/",
  "./games/bubble/",
  "./games/candy/",
  "./games/car/",
  "./games/connect4/",
  "./games/cooking/",
  "./games/dodge/",
  "./games/flappy/",
  "./games/fruit/",
  "./games/guess/",
  "./games/hillclimb/",
  "./games/jigsaw/",
  "./games/jumper/",
  "./games/math/",
  "./games/memory/",
  "./games/mines/",
  "./games/ninja/",
  "./games/pong/",
  "./games/pool/",
  "./games/reaction/",
  "./games/rope/",
  "./games/rps/",
  "./games/runner/",
  "./games/simon/",
  "./games/snake/",
  "./games/tank/",
  "./games/tictactoe/",
  "./games/whack/",
  "./games/zombie/"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("gamezone-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Pehle phone mein saved copy, na mile toh internet se
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).catch(() =>
        e.request.mode === "navigate" ? caches.match("./index.html") : Response.error()
      );
    })
  );
});
