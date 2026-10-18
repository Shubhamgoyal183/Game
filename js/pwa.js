// Offline support: service worker register karo (har page par chalta hai)
(() => {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  const swUrl = new URL("../sw.js", document.currentScript.src);
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(swUrl.href, { scope: new URL("./", swUrl).href }).catch(() => {});
  });
})();
