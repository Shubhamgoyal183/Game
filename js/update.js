// App khulte hi GitHub par naya version check karo; mile toh "Naya update aaya" dikhao.
// version.json build script (app/scripts/build-apk.js) se banti hai aur GitHub par push hoti hai.
(() => {
  const C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return; // sirf Android app mein
  const URL_JSON = "https://raw.githubusercontent.com/Shubhamgoyal183/Game/main/version.json";
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // Ek session mein ek hi baar check
  if (sessionStorage.getItem("gz_update_checked")) return;
  sessionStorage.setItem("gz_update_checked", "1");

  async function check() {
    if (!C.isPluginAvailable("App")) return;
    const info = await C.Plugins.App.getInfo(); // { version: "1.1.0", build: "3" }
    const res = await fetch(URL_JSON + "?t=" + Date.now(), { cache: "no-store" });
    if (!res.ok) return;
    const v = await res.json();
    if (!(v.versionCode > +info.build)) return;
    // "Baad mein" dabaya tha toh usi version ke liye 1 din tak mat dikhao
    const later = JSON.parse(localStorage.getItem("gz_update_later") || "{}");
    if (later.code === v.versionCode && Date.now() - later.at < 86400000) return;
    show(v, info);
  }

  function show(v, info) {
    const css = document.createElement("style");
    css.textContent = `
      .gz-upd-bg { position: fixed; inset: 0; z-index: 95; background: rgba(0,0,0,0.6); display: grid; place-items: center; padding: 18px; }
      .gz-upd { width: min(100%, 380px); background: #1b1d40; border: 1px solid rgba(255,255,255,0.12); border-radius: 24px; padding: 24px 20px 18px; text-align: center; color: #fff; font-family: "Segoe UI", system-ui, sans-serif; box-shadow: 0 24px 60px rgba(0,0,0,0.5); animation: gzUpdIn 0.35s cubic-bezier(.2,1.3,.4,1) both; }
      @keyframes gzUpdIn { from { transform: scale(0.85); opacity: 0; } }
      .gz-upd .ico { font-size: 3rem; }
      .gz-upd h3 { margin: 6px 0 2px; font-size: 1.35rem; }
      .gz-upd .ver { color: #9ea2d4; font-size: 0.85rem; }
      .gz-upd ul { text-align: left; margin: 14px 0 6px; padding-left: 20px; color: #dfe1ff; font-size: 0.92rem; line-height: 1.5; }
      .gz-upd .go { width: 100%; margin-top: 12px; border: none; border-radius: 14px; padding: 13px; font: 800 1rem "Segoe UI", sans-serif; background: linear-gradient(135deg, #22c55e, #16a34a); color: #fff; cursor: pointer; }
      .gz-upd .later { margin-top: 8px; background: none; border: none; color: #9ea2d4; font: 600 0.9rem "Segoe UI", sans-serif; cursor: pointer; padding: 8px; }
      .gz-upd .tip { font-size: 0.75rem; color: #7d81b8; margin-top: 6px; }`;
    document.head.appendChild(css);
    const notes = (v.notes || []).map((n) => `<li>${esc(n)}</li>`).join("");
    const wrap = document.createElement("div");
    wrap.className = "gz-upd-bg";
    wrap.innerHTML = `
      <div class="gz-upd">
        <div class="ico">🎉</div>
        <h3>Naya update aaya!</h3>
        <div class="ver">Aapka version ${esc(info.version)} → naya ${esc(v.versionName)}</div>
        ${notes ? `<ul>${notes}</ul>` : ""}
        <button class="go">⬇️ Update karo</button>
        <button class="later">Baad mein</button>
        <div class="tip">Download ke baad file kholo aur "Update" dabao — aapka progress safe rahega</div>
      </div>`;
    document.body.appendChild(wrap);
    wrap.querySelector(".go").onclick = () => {
      // Bahar ka link: Capacitor ise app ke bahar Chrome mein kholta hai, wahan APK download hota hai
      wrap.remove();
      location.href = v.apk;
    };
    wrap.querySelector(".later").onclick = () => {
      localStorage.setItem("gz_update_later", JSON.stringify({ code: v.versionCode, at: Date.now() }));
      wrap.remove();
    };
  }

  // Splash aur login ke baad dikhe
  setTimeout(() => check().catch(() => {}), 2500);
})();
