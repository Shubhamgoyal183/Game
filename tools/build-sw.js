// Offline ke liye service worker banata hai.
// Naya game ya file jodne ke baad chalao:  node tools/build-sw.js
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const SKIP_DIRS = new Set(["tools", "android", "node_modules", ".git", "download", "app"]);
const EXT = new Set([".html", ".css", ".js", ".json", ".png", ".svg", ".jpg", ".webp", ".ico"]);
const SKIP_FILES = new Set(["sw.js", "package.json", "package-lock.json", "capacitor.config.json"]);

const files = [];
(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(ROOT, full).split(path.sep).join("/");
    if (fs.statSync(full).isDirectory()) {
      if (!SKIP_DIRS.has(name) && !name.startsWith(".")) walk(full);
    } else if (EXT.has(path.extname(name)) && !SKIP_FILES.has(rel)) {
      files.push(rel);
    }
  }
})(ROOT);
files.sort();

// Files ka hash = version. Kuch bhi badla toh naya version, aur phone par apne aap update.
const hash = crypto.createHash("sha1");
for (const f of files) hash.update(f).update(fs.readFileSync(path.join(ROOT, f)));
const version = hash.digest("hex").slice(0, 10);

const urls = ["./", ...files.map((f) => "./" + f)];
// "games/car/" jaise folder wale URL bhi kaam karein
for (const f of files) if (f.endsWith("/index.html")) urls.push("./" + f.slice(0, -"index.html".length));

const sw = `// Ye file tools/build-sw.js se banti hai. Haath se mat badlo.
const CACHE = "gamezone-${version}";
const FILES = ${JSON.stringify(urls, null, 2)};

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
`;
fs.writeFileSync(path.join(ROOT, "sw.js"), sw);
console.log(`sw.js ready: ${files.length} files, version ${version}`);
