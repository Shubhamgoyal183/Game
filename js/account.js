// Splash screen + Login / Signup / Google / Logout + Cloud save (sirf home page par chalta hai)
(() => {
  const cfg = window.GZ_FIREBASE_CONFIG || {};
  const configured = !!(cfg.apiKey && cfg.projectId);
  const native = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  const PREFIX = "gamezone_";
  const OWNER = "gz_owner"; // kis account ka data is phone mein hai (sync nahi hota)
  const GUEST = "gz_guest";

  const ls = {
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
    del: (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
  };
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  let fb = null, user = null, lastSync = null, syncing = false;

  // ================= UI banao =================
  document.body.insertAdjacentHTML("beforeend", `
    <div class="gz-splash" id="gzSplash">
      <div class="gz-splash-inner">
        <img src="icons/icon-512.png" alt="">
        <h1>Game <span>Zone</span></h1>
        <p>by Shubham Goyal</p>
        <div class="gz-loader"><i></i><i></i><i></i></div>
      </div>
      <small>31+ games · Mobile + Laptop</small>
    </div>

    <div class="gz-auth" id="gzAuth" hidden>
      <div class="gz-auth-card">
        <img class="gz-auth-logo" src="icons/icon-192.png" alt="">
        <h2>Game Zone mein swagat hai! 🎮</h2>
        <p class="gz-auth-sub">Login karo — aapke scores aur progress cloud par save rahenge</p>
        <div class="gz-tabs">
          <button class="gz-tab active" data-tab="login">Login</button>
          <button class="gz-tab" data-tab="signup">Naya account</button>
        </div>
        <form id="gzForm" novalidate>
          <label class="gz-field" id="gzNameRow" hidden><span>👤</span><input id="gzName" placeholder="Aapka naam" autocomplete="name" maxlength="30"></label>
          <label class="gz-field"><span>✉️</span><input id="gzEmail" type="email" placeholder="Email" autocomplete="email" inputmode="email"></label>
          <label class="gz-field"><span>🔒</span><input id="gzPass" type="password" placeholder="Password (kam se kam 6 akshar)" autocomplete="current-password"><button type="button" class="gz-eye" id="gzEye" aria-label="Password dikhao">👁</button></label>
          <p class="gz-msg" id="gzMsg"></p>
          <button class="gz-btn primary" id="gzSubmit" type="submit">Login karo</button>
          <button class="gz-link" id="gzForgot" type="button">Password bhool gaye?</button>
        </form>
        <div class="gz-or"><span>ya</span></div>
        <button class="gz-btn google" id="gzGoogle" type="button"><b>G</b> Google se continue karo</button>
        <button class="gz-btn ghost" id="gzGuest" type="button">👤 Bina login ke khelo (Guest)</button>
        <p class="gz-setup" id="gzSetup" hidden>⚙️ Login abhi setup nahi hua hai (Firebase settings baaki). Tab tak Guest mode mein khelo.</p>
      </div>
    </div>

    <div class="gz-sheet-bg" id="gzSheetBg" hidden></div>
    <div class="gz-sheet" id="gzSheet" hidden></div>
  `);

  const $ = (id) => document.getElementById(id);
  const header = document.querySelector(".site-header");
  const avatarBtn = document.createElement("button");
  avatarBtn.className = "gz-avatar-btn";
  avatarBtn.setAttribute("aria-label", "Profile");
  header.appendChild(avatarBtn);

  // ================= Splash =================
  const splashStart = performance.now();
  const firstOpen = !sessionStorage.getItem("gz_splashed");
  if (!firstOpen) $("gzSplash").remove();
  let splashGone = !firstOpen;
  function hideSplash() {
    if (splashGone) return;
    splashGone = true;
    sessionStorage.setItem("gz_splashed", "1");
    const wait = Math.max(0, 1300 - (performance.now() - splashStart)); // logo thodi der dikhe
    setTimeout(() => {
      const s = $("gzSplash");
      s.classList.add("out");
      setTimeout(() => s.remove(), 500);
    }, wait);
  }
  // Native splash hata do (app mein)
  if (native) {
    const P = window.Capacitor.Plugins;
    P.SplashScreen && P.SplashScreen.hide().catch(() => {});
    P.StatusBar && P.StatusBar.setBackgroundColor({ color: "#0b0c1d" }).catch(() => {});
  }

  // ================= Avatar / profile =================
  const nameOf = (u) => (u && (u.displayName || (u.email || "").split("@")[0])) || "Guest";
  function avatarHTML(u, big) {
    if (u && u.photoURL) return `<img src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer">`;
    const n = nameOf(u);
    return `<span>${esc(u ? n[0].toUpperCase() : "👤")}</span>`;
  }
  function renderAvatar() {
    avatarBtn.innerHTML = avatarHTML(user);
    avatarBtn.classList.toggle("guest", !user);
    avatarBtn.title = user ? nameOf(user) : "Login karo";
  }

  function openSheet() {
    const games = (() => { try { return JSON.parse(ls.get("gamezone_recent")) || []; } catch { return []; } })().length;
    const favs = (() => { try { return JSON.parse(ls.get("gamezone_favs")) || []; } catch { return []; } })().length;
    const keys = Object.keys(snapshot()).length;
    $("gzSheet").innerHTML = user ? `
      <div class="gz-grab"></div>
      <div class="gz-profile">
        <div class="gz-avatar big">${avatarHTML(user)}</div>
        <h3>${esc(nameOf(user))}</h3>
        <p>${esc(user.email || "")}</p>
      </div>
      <div class="gz-stats">
        <div><b>${games}</b><span>Haal ke games</span></div>
        <div><b>${favs}</b><span>Favourites</span></div>
        <div><b>${keys}</b><span>Saved records</span></div>
      </div>
      <p class="gz-sync" id="gzSyncTxt">☁️ ${lastSync ? "Cloud par save: " + new Date(lastSync).toLocaleTimeString() : "Cloud se jud raha hai..."}</p>
      <button class="gz-btn primary" id="gzSyncNow">☁️ Abhi save karo</button>
      <button class="gz-btn danger" id="gzLogout">🚪 Logout</button>
      <div class="gz-ver"><span id="gzVer">📱 App</span><button class="gz-link" id="gzUpd" type="button">🔄 Update check karo</button></div>
      <p class="gz-foot">Game Zone by Shubham Goyal</p>
    ` : `
      <div class="gz-grab"></div>
      <div class="gz-profile">
        <div class="gz-avatar big guest">${avatarHTML(null)}</div>
        <h3>Guest</h3>
        <p>Abhi progress sirf is phone mein save hai</p>
      </div>
      <button class="gz-btn primary" id="gzLoginNow">🔑 Login / Naya account</button>
      <div class="gz-ver"><span id="gzVer">📱 App</span><button class="gz-link" id="gzUpd" type="button">🔄 Update check karo</button></div>
      <p class="gz-foot">Login karne par aapka guest progress bhi account mein jud jayega</p>
    `;
    $("gzSheet").hidden = $("gzSheetBg").hidden = false;
    // Version aur update button (sirf Android app mein)
    if (window.GZUpdate) {
      GZUpdate.version().then((v) => { if (v && $("gzVer")) $("gzVer").textContent = `📱 Version ${v}`; });
      $("gzUpd").onclick = () => { $("gzUpd").textContent = "⏳ Check ho raha hai..."; GZUpdate.check().finally(() => { closeSheet(); }); };
    } else document.querySelectorAll(".gz-ver").forEach((e) => e.remove());
    requestAnimationFrame(() => document.body.classList.add("gz-sheet-open"));
    if (user) {
      $("gzSyncNow").onclick = async () => { $("gzSyncTxt").textContent = "☁️ Save ho raha hai..."; await push(true); };
      $("gzLogout").onclick = logout;
    } else {
      $("gzLoginNow").onclick = () => { closeSheet(); showAuth(); };
    }
  }
  function closeSheet() {
    document.body.classList.remove("gz-sheet-open");
    setTimeout(() => ($("gzSheet").hidden = $("gzSheetBg").hidden = true), 250);
  }
  avatarBtn.onclick = openSheet;
  $("gzSheetBg").onclick = closeSheet;

  // ================= Auth screen =================
  let tab = "login";
  function setTab(t) {
    tab = t;
    document.querySelectorAll(".gz-tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === t));
    $("gzNameRow").hidden = t !== "signup";
    $("gzSubmit").textContent = t === "signup" ? "Account banao" : "Login karo";
    $("gzForgot").hidden = t === "signup";
    $("gzPass").autocomplete = t === "signup" ? "new-password" : "current-password";
    msg("");
  }
  document.querySelectorAll(".gz-tab").forEach((b) => (b.onclick = () => setTab(b.dataset.tab)));
  $("gzEye").onclick = () => { const p = $("gzPass"); p.type = p.type === "password" ? "text" : "password"; };

  function showAuth() {
    $("gzAuth").hidden = false;
    document.body.classList.add("gz-locked");
    $("gzSetup").hidden = configured;
    if (!configured) ["gzSubmit", "gzGoogle", "gzForgot"].forEach((id) => ($(id).disabled = true));
  }
  function hideAuth() {
    $("gzAuth").hidden = true;
    document.body.classList.remove("gz-locked");
  }
  function msg(t, ok) {
    $("gzMsg").textContent = t;
    $("gzMsg").className = "gz-msg" + (ok ? " ok" : "");
  }
  function busy(on) {
    ["gzSubmit", "gzGoogle", "gzGuest"].forEach((id) => ($(id).disabled = on || (!configured && id !== "gzGuest")));
    $("gzSubmit").classList.toggle("loading", on);
  }

  const ERRORS = {
    "auth/invalid-email": "Email sahi nahi hai",
    "auth/missing-password": "Password likho",
    "auth/user-not-found": "Is email ka koi account nahi hai — 'Naya account' banao",
    "auth/wrong-password": "Password galat hai",
    "auth/invalid-credential": "Email ya password galat hai",
    "auth/email-already-in-use": "Is email se account pehle se hai — Login karo",
    "auth/weak-password": "Password kam se kam 6 akshar ka rakho",
    "auth/network-request-failed": "Internet nahi hai — net on karke try karo",
    "auth/too-many-requests": "Bahut baar try kiya — thodi der baad karo",
    "auth/popup-closed-by-user": "Google login band kar diya gaya",
    "auth/operation-not-allowed": "Ye login tarika Firebase mein chalu nahi hai",
  };
  const errText = (e) => ERRORS[e && e.code] || (e && String(e.code).startsWith("auth/api-key") ? "Firebase settings galat hain (firebase-config.js check karo)" : "") || (e && e.message && /cancel/i.test(e.message) ? "Google login cancel ho gaya" : "Kuch gadbad hui — phir try karo");

  $("gzForm").onsubmit = async (e) => {
    e.preventDefault();
    if (!fb) return;
    const email = $("gzEmail").value.trim(), pass = $("gzPass").value, name = $("gzName").value.trim();
    if (tab === "signup" && !name) return msg("Apna naam likho");
    busy(true);
    msg("");
    try {
      if (tab === "signup") {
        const cred = await GZFire.createUserWithEmailAndPassword(fb.auth, email, pass);
        await GZFire.updateProfile(cred.user, { displayName: name });
        // Login ka baaki kaam onAuthStateChanged karta hai; naam baad mein set hua, isliye avatar dobara banao
        renderAvatar();
        push();
      } else {
        await GZFire.signInWithEmailAndPassword(fb.auth, email, pass);
      }
    } catch (err) {
      msg(errText(err));
    }
    busy(false);
  };

  $("gzForgot").onclick = async () => {
    const email = $("gzEmail").value.trim();
    if (!email) return msg("Pehle upar apna email likho");
    try {
      await GZFire.sendPasswordResetEmail(fb.auth, email);
      msg("✅ Password reset ka link email par bhej diya", true);
    } catch (err) { msg(errText(err)); }
  };

  $("gzGoogle").onclick = async () => {
    if (!fb) return;
    busy(true);
    msg("");
    try {
      if (native) {
        // Android: native Google login, phir Firebase mein usi token se sign-in
        if (!window.Capacitor.isPluginAvailable || !window.Capacitor.isPluginAvailable("FirebaseAuthentication")) {
          msg("Google login ka setup abhi baaki hai — tab tak Email se login karo");
          busy(false);
          return;
        }
        const res = await window.Capacitor.Plugins.FirebaseAuthentication.signInWithGoogle();
        const cred = GZFire.GoogleAuthProvider.credential(res.credential && res.credential.idToken);
        await GZFire.signInWithCredential(fb.auth, cred);
      } else {
        await GZFire.signInWithPopup(fb.auth, new GZFire.GoogleAuthProvider());
      }
    } catch (err) {
      msg(errText(err));
    }
    busy(false);
  };

  $("gzGuest").onclick = () => {
    ls.set(GUEST, "1");
    hideAuth();
  };

  // ================= Cloud save =================
  function snapshot() {
    const o = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(PREFIX)) o[k.slice(PREFIX.length)] = localStorage.getItem(k);
      }
    } catch { /* ignore */ }
    return o;
  }

  async function pull() {
    // Is phone mein kisi aur account ka data ho toh pehle saaf karo; guest ka data account mein jud jaata hai
    const owner = ls.get(OWNER);
    if (owner && owner !== user.uid) clearLocal();
    const snap = await GZFire.getDoc(GZFire.doc(fb.db, "users", user.uid));
    let changed = false;
    if (snap.exists()) {
      const p = snap.data().progress || {};
      for (const [k, v] of Object.entries(p)) {
        if (ls.get(PREFIX + k) !== v) { ls.set(PREFIX + k, v); changed = true; }
      }
    }
    ls.set(OWNER, user.uid);
    return changed;
  }

  async function push(showResult) {
    if (!user || !fb || syncing) return;
    syncing = true;
    try {
      await GZFire.setDoc(GZFire.doc(fb.db, "users", user.uid), {
        name: nameOf(user),
        email: user.email || "",
        progress: snapshot(),
        updatedAt: GZFire.serverTimestamp(),
      }, { merge: true });
      lastSync = Date.now();
      if (showResult && $("gzSyncTxt")) $("gzSyncTxt").textContent = "✅ Cloud par save ho gaya: " + new Date(lastSync).toLocaleTimeString();
    } catch (e) {
      if (showResult && $("gzSyncTxt")) $("gzSyncTxt").textContent = "⚠️ Save nahi hua — internet check karo";
    }
    syncing = false;
  }

  function clearLocal() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(PREFIX)) keys.push(k); }
      keys.forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
  }

  async function onLogin(isNew) {
    hideAuth();
    ls.del(GUEST);
    renderAvatar();
    toast(`👋 Namaste, ${nameOf(user)}!`);
    try {
      const changed = await pull();
      await push();
      // Cloud se naya data aaya toh home dobara dikhao (favourites / recent update)
      if (changed && !sessionStorage.getItem("gz_reloaded_" + user.uid)) {
        sessionStorage.setItem("gz_reloaded_" + user.uid, "1");
        location.reload();
      }
    } catch { toast("⚠️ Cloud se nahi jud paye — progress phone mein safe hai"); }
  }

  async function logout() {
    closeSheet();
    await push();
    try {
      if (native && window.Capacitor.isPluginAvailable && window.Capacitor.isPluginAvailable("FirebaseAuthentication")) await window.Capacitor.Plugins.FirebaseAuthentication.signOut().catch(() => {});
      await GZFire.signOut(fb.auth);
    } catch { /* ignore */ }
    clearLocal(); // agla user is phone par aaye toh pichhle ka data na dikhe
    ls.del(OWNER);
    sessionStorage.clear();
    sessionStorage.setItem("gz_splashed", "1");
    location.reload();
  }

  function toast(t) {
    const el = document.createElement("div");
    el.className = "gz-toast";
    el.textContent = t;
    document.body.appendChild(el);
    setTimeout(() => el.classList.add("out"), 2200);
    setTimeout(() => el.remove(), 2700);
  }

  // Home par wapas aate hi / app band karte waqt cloud par save
  document.addEventListener("visibilitychange", () => { if (document.hidden) push(); });
  window.addEventListener("pagehide", () => push());

  // ================= Start =================
  renderAvatar();
  if (!configured) {
    hideSplash();
    if (!ls.get(GUEST)) showAuth();
    return;
  }
  try {
    fb = GZFire.init(cfg, { native });
  } catch (e) {
    hideSplash();
    if (!ls.get(GUEST)) showAuth();
    return;
  }
  let first = true;
  GZFire.onAuthStateChanged(fb.auth, (u) => {
    const was = user;
    user = u;
    renderAvatar();
    if (first) {
      first = false;
      hideSplash();
      if (u) {
        hideAuth();
        if (!sessionStorage.getItem("gz_pulled_" + u.uid)) {
          // App khulne par ek baar cloud se data lao
          sessionStorage.setItem("gz_pulled_" + u.uid, "1");
          pull().then((ch) => { push(); if (ch && !sessionStorage.getItem("gz_reloaded_" + u.uid)) { sessionStorage.setItem("gz_reloaded_" + u.uid, "1"); location.reload(); } }).catch(() => {});
        } else {
          // Game se wapas aaye: sirf naya score cloud par bhejo, page dikhne ke baad (lag na ho)
          setTimeout(() => push(), 1500);
        }
      }
      else if (!ls.get(GUEST)) showAuth();
      return;
    }
    if (u && (!was || was.uid !== u.uid)) onLogin(false);
  });
  // Internet na ho toh Firebase der laga sakta hai — splash zyada der na ruke
  setTimeout(hideSplash, 3500);
})();
