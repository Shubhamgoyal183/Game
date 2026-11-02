// Har page par chalta hai: "Game Zone by Shubham Goyal" branding + purane PWA ka cleanup
(() => {
  // ---------- Branding ----------
  const BRAND = "🎮 Game Zone by Shubham Goyal";
  const css = document.createElement("style");
  css.textContent = `
    .brand-sub { display: block; font-size: 0.66rem; font-weight: 600; letter-spacing: 0.2px; color: #ffcc33; opacity: 0.9; margin-top: 2px; white-space: nowrap; }
    @media (max-width: 420px) { .brand-sub { font-size: 0.6rem; letter-spacing: 0; } }
    .brand-float { position: fixed; left: 50%; bottom: 6px; transform: translateX(-50%); z-index: 30; pointer-events: none;
      font: 600 11px "Segoe UI", system-ui, sans-serif; color: #fff; background: rgba(0,0,0,0.35); padding: 3px 10px; border-radius: 999px; white-space: nowrap; }`;
  document.head.appendChild(css);
  const h1 = document.querySelector(".topbar h1");
  if (h1) {
    const sub = document.createElement("span");
    sub.className = "brand-sub";
    sub.textContent = BRAND;
    h1.appendChild(sub);
  } else if (!document.querySelector(".site-header")) {
    // Jis game mein header nahi (jaise Flappy Bird), wahan neeche chhota sa label
    const tag = document.createElement("div");
    tag.className = "brand-float";
    tag.textContent = BRAND;
    document.body.appendChild(tag);
  }

  // ---------- Purana PWA cleanup ----------
  // Pehle website offline app (service worker) thi; ab asli Android app hai. Purana cache hata do.
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
    if (window.caches) caches.keys().then((ks) => ks.filter((k) => k.startsWith("gamezone-")).forEach((k) => caches.delete(k))).catch(() => {});
  }
})();
