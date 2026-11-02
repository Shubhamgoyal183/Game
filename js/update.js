// App khulte hi GitHub par naya version check karo; mile toh "Naya update aaya" dikhao.
// version.json build script (app/scripts/build-apk.js) se banti hai aur GitHub par push hoti hai.
(() => {
  const C = window.Capacitor;
  if (!C || !C.isNativePlatform || !C.isNativePlatform()) return; // sirf Android app mein
  const URL_JSON = "https://raw.githubusercontent.com/Shubhamgoyal183/Game/main/version.json";
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // manual = profile se "Update check karo" dabaya (tab har haal mein jawab do)
  async function check(manual) {
    if (!C.isPluginAvailable("App")) return manual && say("⚠️ Update check is version mein nahi chalta");
    const info = await C.Plugins.App.getInfo(); // { version: "1.2.0", build: "4" }
    let v;
    try {
      const res = await fetch(URL_JSON + "?t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error(res.status);
      v = await res.json();
    } catch (e) {
      return manual && say("⚠️ Check nahi ho paya — internet on karke try karo");
    }
    localStorage.setItem("gz_update_last", String(Date.now()));
    if (!(v.versionCode > +info.build)) return manual && say(`✅ Aap latest version ${info.version} par ho`);
    // "Baad mein" dabaya tha toh usi version ke liye 1 din tak khud se mat dikhao
    const later = JSON.parse(localStorage.getItem("gz_update_later") || "{}");
    if (!manual && later.code === v.versionCode && Date.now() - later.at < 86400000) return;
    show(v, info);
  }

  function say(t) {
    const el = document.createElement("div");
    el.className = "gz-toast";
    el.textContent = t;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("out"), 2600);
    setTimeout(() => el.remove(), 3100);
  }

  // Profile sheet se use karne ke liye
  window.GZUpdate = {
    check: () => check(true).catch(() => say("⚠️ Check nahi ho paya")),
    version: async () => (C.isPluginAvailable("App") ? (await C.Plugins.App.getInfo()).version : ""),
  };

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

  // Har baar app kholne par (zyada se zyada har 30 minute mein ek baar), splash ke baad
  const lastCheck = +localStorage.getItem("gz_update_last") || 0;
  if (Date.now() - lastCheck > 30 * 60 * 1000) setTimeout(() => check(false).catch(() => {}), 2500);
  // App background se wapas aaye tab bhi
  if (C.isPluginAvailable("App") && C.Plugins.App.addListener) C.Plugins.App.addListener("resume", () => {
    if (Date.now() - (+localStorage.getItem("gz_update_last") || 0) > 30 * 60 * 1000) check(false).catch(() => {});
  });
})();
