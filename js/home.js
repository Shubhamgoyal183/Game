// Home page: spotlight, favourites, recently played, filters, search
(() => {
  const CATS = { action: "🏃 Action", puzzle: "🧠 Puzzle", classic: "🎲 Classic" };
  const $ = (id) => document.getElementById(id);
  const idOf = (g) => g.url.split("/")[1];
  GAMES.forEach((g) => (g.id = idOf(g)));
  const byId = Object.fromEntries(GAMES.map((g) => [g.id, g]));

  const load = (k, d) => { try { return JSON.parse(localStorage.getItem("gamezone_" + k)) ?? d; } catch { return d; } };
  const save = (k, v) => { try { localStorage.setItem("gamezone_" + k, JSON.stringify(v)); } catch { /* ignore */ } };

  let favs = load("favs", []);
  let recent = load("recent", []).filter((id) => byId[id]);
  let filter = load("filter", "all");
  if (!["all", "2p", "new", "fav", ...Object.keys(CATS)].includes(filter)) filter = "all";

  // ---------- Cards ----------
  function card(g, small = false) {
    const fav = favs.includes(g.id);
    return `
      <article class="card${small ? " small" : ""}" style="--g:${g.color}">
        <a class="card-link" href="${g.url}" data-id="${g.id}">
          <div class="thumb">
            <span class="emoji">${g.emoji}</span>
            <div class="badges">
              ${g.isNew ? '<span class="badge new">NEW</span>' : ""}
              ${g.twoPlayer ? '<span class="badge duo">👥 2P</span>' : ""}
            </div>
          </div>
          <div class="info">
            <h3>${g.title}</h3>
            ${small ? "" : `<p>${g.desc}</p>`}
            <span class="tag">${CATS[g.cat]}</span>
          </div>
        </a>
        <button class="fav${fav ? " on" : ""}" data-fav="${g.id}" aria-label="Favourite" title="Favourite">${fav ? "❤️" : "🤍"}</button>
      </article>`;
  }

  const row = (title, list, extra = "") =>
    list.length ? `<section class="shelf"><div class="shelf-head"><h2>${title}</h2>${extra}</div><div class="scroller">${list.map((g) => card(g, true)).join("")}</div></section>` : "";
  const grid = (title, list, sub = "") =>
    `<section class="block"><div class="shelf-head"><h2>${title}</h2><span class="count">${sub || list.length + " games"}</span></div><div class="grid">${list.map((g) => card(g)).join("")}</div></section>`;

  // ---------- Spotlight (roz naya game) ----------
  function spotlight() {
    const day = Math.floor(Date.now() / 86400000);
    const g = GAMES[(day * 7 + 3) % GAMES.length];
    $("spot").style.setProperty("--g", g.color);
    $("spot").innerHTML = `
      <div class="spot-text">
        <span class="kicker">⭐ Aaj ka game</span>
        <h2>${g.title}</h2>
        <p>${g.desc}</p>
        <div class="spot-actions">
          <a class="btn-play" href="${g.url}" data-id="${g.id}">▶ Abhi khelo</a>
          <button class="btn-ghost" id="randomBtn">🎲 Koi bhi game</button>
        </div>
      </div>
      <div class="spot-art"><span>${g.emoji}</span></div>`;
    $("randomBtn").addEventListener("click", () => {
      const r = GAMES[Math.floor(Math.random() * GAMES.length)];
      remember(r.id);
      location.href = r.url;
    });
  }

  // ---------- Main list ----------
  function render() {
    const q = $("search").value.trim().toLowerCase();
    const match = (g) => !q || (g.title + " " + g.desc + " " + CATS[g.cat]).toLowerCase().includes(q);
    let html = "";
    if (q) {
      const list = GAMES.filter(match);
      html = list.length ? grid(`🔍 "${q}"`, list) : `<p class="empty">Koi game nahi mila 😕<br><small>Kuch aur likh ke dekho</small></p>`;
    } else if (filter === "all") {
      html += row("⏱ Phir se khelo", recent.map((id) => byId[id]).slice(0, 10), recent.length ? `<button class="link" id="clearRecent">Saaf karo</button>` : "");
      html += row("❤️ Aapke favourites", favs.map((id) => byId[id]).filter(Boolean));
      html += row("🆕 Naye games", GAMES.filter((g) => g.isNew));
      html += grid("👥 Dost ke saath khelo", GAMES.filter((g) => g.twoPlayer), "Ek hi phone / laptop par");
      for (const [k, name] of Object.entries(CATS)) html += grid(name, GAMES.filter((g) => g.cat === k));
    } else if (filter === "fav") {
      const list = favs.map((id) => byId[id]).filter(Boolean);
      html = list.length ? grid("❤️ Favourites", list) : `<p class="empty">Abhi koi favourite nahi 🤍<br><small>Kisi bhi game ke 🤍 par tap karo</small></p>`;
    } else if (filter === "2p") html = grid("👥 2 Player games", GAMES.filter((g) => g.twoPlayer));
    else if (filter === "new") html = grid("🆕 Naye games", GAMES.filter((g) => g.isNew));
    else html = grid(CATS[filter], GAMES.filter((g) => g.cat === filter));
    $("content").innerHTML = html;
    const clr = $("clearRecent");
    if (clr) clr.addEventListener("click", () => { recent = []; save("recent", recent); render(); });
  }

  function renderTabs() {
    const counts = {
      all: GAMES.length, "2p": GAMES.filter((g) => g.twoPlayer).length, new: GAMES.filter((g) => g.isNew).length, fav: favs.length,
      ...Object.fromEntries(Object.keys(CATS).map((k) => [k, GAMES.filter((g) => g.cat === k).length])),
    };
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.toggle("active", t.dataset.filter === filter);
      t.querySelector("b").textContent = counts[t.dataset.filter];
    });
    $("statGames").textContent = GAMES.length;
    $("stat2p").textContent = counts["2p"];
  }

  function remember(id) {
    recent = [id, ...recent.filter((x) => x !== id)].slice(0, 12);
    save("recent", recent);
  }

  // ---------- Events ----------
  document.addEventListener("click", (e) => {
    const favBtn = e.target.closest("[data-fav]");
    if (favBtn) {
      e.preventDefault();
      const id = favBtn.dataset.fav;
      favs = favs.includes(id) ? favs.filter((x) => x !== id) : [id, ...favs];
      save("favs", favs);
      renderTabs();
      render();
      return;
    }
    const link = e.target.closest("a[data-id]");
    if (link) remember(link.dataset.id);
  });
  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => {
    filter = t.dataset.filter;
    save("filter", filter);
    $("search").value = "";
    renderTabs();
    render();
    $("tabs").scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  $("search").addEventListener("input", render);
  window.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== $("search")) { e.preventDefault(); $("search").focus(); }
    if (e.key === "Escape") { $("search").value = ""; $("search").blur(); render(); }
  });

  spotlight();
  renderTabs();
  render();
})();
