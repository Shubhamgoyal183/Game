// Saare games ki list. Naya game add karna ho toh yahan ek entry jodo
// aur games/<folder>/index.html banao.
// twoPlayer: true = 2 Player mode hai · cat: action | puzzle | classic
const GAMES = [
  { title: "Car Racing", desc: "Highway par traffic se bacho, brake lagao, coins uthao!", url: "games/car/index.html", emoji: "🏎️", color: "linear-gradient(135deg, #ef4444, #7f1d1d)", twoPlayer: true, cat: "action" },
  { title: "Bike Racing", desc: "3D sadak, mod aur pahaad. Time khatam hone se pehle checkpoint!", url: "games/bike/index.html", emoji: "🏍️", color: "linear-gradient(135deg, #0ea5e9, #1e3a8a)", cat: "action" },
  { title: "Zombie Survival", desc: "Zombies ki waves se bacho, power-ups uthao!", url: "games/zombie/index.html", emoji: "🧟", color: "linear-gradient(135deg, #4d7c0f, #1a2e05)", cat: "action" },
  { title: "Tank Battle", desc: "Goliyaan deewar se lautti hain! Computer ya dost se ladho", url: "games/tank/index.html", emoji: "🪖", color: "linear-gradient(135deg, #a16207, #422006)", twoPlayer: true, cat: "action" },
  { title: "Traffic Dodge", desc: "Murgi ko sadak, nadi aur railway paar karao!", url: "games/dodge/index.html", emoji: "🐔", color: "linear-gradient(135deg, #84cc16, #3f6212)", cat: "action" },
  { title: "Ninja Jump", desc: "Deewaron par kudo, kaanton aur shuriken se bacho", url: "games/ninja/index.html", emoji: "🥷", color: "linear-gradient(135deg, #f97316, #1e1b4b)", cat: "action" },
  { title: "Platform Jumper", desc: "Platforms par uchhal ke aasmaan tak jaao!", url: "games/jumper/index.html", emoji: "🦘", color: "linear-gradient(135deg, #60a5fa, #a3e635)", cat: "action" },
  { title: "Archery", desc: "Hawa dekho, kheencho aur bullseye maaro!", url: "games/archery/index.html", emoji: "🏹", color: "linear-gradient(135deg, #22c55e, #0369a1)", twoPlayer: true, cat: "action" },
  { title: "Flappy Bird", desc: "Tap karke udo, pipes se bacho!", url: "games/flappy/index.html", emoji: "🐤", color: "linear-gradient(135deg, #4ec0ca, #2a8f99)", cat: "action" },
  { title: "Pong", desc: "Classic paddle game. Ek hi phone par dost ke saath!", url: "games/pong/index.html", emoji: "🏓", color: "linear-gradient(135deg, #3b82f6, #1e40af)", twoPlayer: true, cat: "action" },
  { title: "Snake", desc: "Khana khao, lamba bano, deewar se bacho!", url: "games/snake/index.html", emoji: "🐍", color: "linear-gradient(135deg, #5fbf5f, #2f7a2f)", cat: "action" },
  { title: "Whack-a-Mole", desc: "30 second mein jitne mole maar sako!", url: "games/whack/index.html", emoji: "🔨🐹", color: "linear-gradient(135deg, #84cc16, #4d7c0f)", twoPlayer: true, cat: "action" },
  { title: "Reaction Duel", desc: "Kaun sabse tez? Green dekhte hi tap karo!", url: "games/reaction/index.html", emoji: "⚡", color: "linear-gradient(135deg, #16a34a, #b91c1c)", twoPlayer: true, cat: "action" },
  { title: "Candy Match", desc: "3 candies milao, levels paar karo!", url: "games/candy/index.html", emoji: "🍬", color: "linear-gradient(135deg, #ec4899, #7e22ce)", cat: "puzzle" },
  { title: "Jigsaw Puzzle", desc: "Tukde jodo, apni photo se bhi puzzle banao!", url: "games/jigsaw/index.html", emoji: "🧩", color: "linear-gradient(135deg, #f59e0b, #7c3aed)", cat: "puzzle" },
  { title: "2048", desc: "Same number milao aur 2048 tak pahuncho", url: "games/2048/index.html", emoji: "🔢", color: "linear-gradient(135deg, #edc22e, #c4931a)", cat: "puzzle" },
  { title: "Minesweeper", desc: "Numbers padho, mines se bacho!", url: "games/mines/index.html", emoji: "💣", color: "linear-gradient(135deg, #64748b, #1e293b)", cat: "puzzle" },
  { title: "Memory Cards", desc: "Cards palto aur jodiyaan dhoondho", url: "games/memory/index.html", emoji: "🃏", color: "linear-gradient(135deg, #ec4899, #9d174d)", twoPlayer: true, cat: "puzzle" },
  { title: "Simon Says", desc: "Rangon ka pattern yaad rakho aur dohraao", url: "games/simon/index.html", emoji: "🔴🟢", color: "linear-gradient(135deg, #f43f5e, #3b82f6)", twoPlayer: true, cat: "puzzle" },
  { title: "Guess the Number", desc: "Socha hua number kam chances mein dhoondho", url: "games/guess/index.html", emoji: "❓", color: "linear-gradient(135deg, #f59e0b, #b45309)", cat: "puzzle" },
  { title: "Connect Four", desc: "Line mein 4 discs lagao, computer ya dost ke saath", url: "games/connect4/index.html", emoji: "🔴🟡", color: "linear-gradient(135deg, #2b4fd8, #172f8f)", twoPlayer: true, cat: "classic" },
  { title: "Tic Tac Toe", desc: "Computer ya dost ke saath X-O khelo", url: "games/tictactoe/index.html", emoji: "❌⭕", color: "linear-gradient(135deg, #7b5cff, #4a2fbf)", twoPlayer: true, cat: "classic" },
  { title: "Rock Paper Scissors", desc: "Computer ya dost ko haraa sakte ho?", url: "games/rps/index.html", emoji: "✊✋✌️", color: "linear-gradient(135deg, #ff7a59, #c2412a)", twoPlayer: true, cat: "classic" },
];

function matches(g, filter, q) {
  if (filter === "2p" && !g.twoPlayer) return false;
  if (["action", "puzzle", "classic"].includes(filter) && g.cat !== filter) return false;
  if (q && !(g.title + " " + g.desc).toLowerCase().includes(q)) return false;
  return true;
}

function renderGames() {
  const grid = document.getElementById("game-grid");
  const q = document.getElementById("search").value.trim().toLowerCase();
  const list = GAMES.filter((g) => matches(g, currentFilter, q));
  grid.innerHTML = list.length
    ? list.map((g) => `
    <a class="card" href="${g.url}">
      <div class="thumb" style="background:${g.color}">
        ${g.twoPlayer ? '<span class="badge">👥 2 Player</span>' : ""}
        ${g.emoji}
      </div>
      <div class="info">
        <h3>${g.title}</h3>
        <p>${g.desc}</p>
        <span class="play">▶ Play</span>
      </div>
    </a>`).join("")
    : `<p class="empty">Koi game nahi mila 😕</p>`;
  document.getElementById("game-count").textContent = `${list.length} games`;
}

let currentFilter = "all";
try { currentFilter = localStorage.getItem("gamezone_filter") || "all"; } catch { /* ignore */ }
if (!document.querySelector(`.filter[data-filter="${currentFilter}"]`)) currentFilter = "all";

document.querySelectorAll(".filter").forEach((btn) => {
  btn.classList.toggle("active", btn.dataset.filter === currentFilter);
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    try { localStorage.setItem("gamezone_filter", currentFilter); } catch { /* ignore */ }
    document.querySelectorAll(".filter").forEach((b) => b.classList.toggle("active", b === btn));
    renderGames();
  });
});
document.getElementById("search").addEventListener("input", renderGames);

renderGames();
