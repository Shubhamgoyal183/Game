(() => {
  "use strict";

  // ---------- Setup ----------
  // Game ek fixed "logical" size par chalta hai aur screen ke hisaab se scale hota hai,
  // isliye mobile aur laptop dono par same gameplay milta hai.
  const W = 360;
  const H = 640;
  const GROUND_H = 90;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const muteBtn = document.getElementById("muteBtn");

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
    const cssW = Math.floor(W * scale);
    const cssH = Math.floor(H * scale);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  // ---------- Tuning ----------
  const GRAVITY = 1500;      // px/s²
  const FLAP_VY = -430;      // px/s
  const MAX_FALL = 650;
  const PIPE_W = 62;
  const PIPE_GAP = 160;
  const PIPE_SPACING = 215;
  const BASE_SPEED = 150;
  const MAX_SPEED = 230;
  const BIRD_X = 100;
  const BIRD_R = 15;

  // ---------- Storage ----------
  const BEST_KEY = "gamezone_flappy_best";
  const MUTE_KEY = "gamezone_flappy_muted";
  function load(key, fallback) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : v; }
    catch { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, value); } catch { /* ignore */ }
  }

  // ---------- Sound (WebAudio, koi file nahi chahiye) ----------
  let audioCtx = null;
  let muted = load(MUTE_KEY, "0") === "1";
  muteBtn.textContent = muted ? "🔇" : "🔊";

  function beep(freq, duration, type = "square", vol = 0.08, slideTo) {
    if (muted) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + duration);
    } catch { /* audio unavailable */ }
  }
  const sfx = {
    flap: () => beep(520, 0.09, "square", 0.05, 760),
    score: () => { beep(880, 0.08, "sine", 0.08); setTimeout(() => beep(1320, 0.12, "sine", 0.08), 70); },
    hit: () => beep(200, 0.3, "sawtooth", 0.09, 60),
  };

  muteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    muted = !muted;
    save(MUTE_KEY, muted ? "1" : "0");
    muteBtn.textContent = muted ? "🔇" : "🔊";
    muteBtn.blur(); // taaki Space dabane par dobara mute toggle na ho
  });
  muteBtn.addEventListener("pointerdown", (e) => e.stopPropagation());

  // ---------- State ----------
  let state = "ready"; // ready | play | over
  let bird, pipes, score, best, speed, groundX, overAt, flashT, time;
  best = parseInt(load(BEST_KEY, "0"), 10) || 0;

  const clouds = Array.from({ length: 5 }, (_, i) => ({
    x: i * 90 + Math.random() * 40,
    y: 40 + Math.random() * 220,
    s: 0.6 + Math.random() * 0.7,
  }));

  function reset() {
    bird = { y: H * 0.42, vy: 0, rot: 0, wing: 0 };
    pipes = [];
    score = 0;
    speed = BASE_SPEED;
    groundX = 0;
    flashT = 0;
    time = 0;
    state = "ready";
  }

  function spawnPipe(x) {
    const minTop = 70;
    const maxTop = H - GROUND_H - PIPE_GAP - 70;
    const top = minTop + Math.random() * (maxTop - minTop);
    pipes.push({ x, top, passed: false });
  }

  function flap() {
    if (state === "ready") {
      state = "play";
      spawnPipe(W + 60);
    }
    if (state === "play") {
      bird.vy = FLAP_VY;
      sfx.flap();
    } else if (state === "over" && performance.now() - overAt > 600) {
      reset();
    }
  }

  function gameOver() {
    if (state === "over") return;
    state = "over";
    overAt = performance.now();
    flashT = 1;
    sfx.hit();
    if (score > best) {
      best = score;
      save(BEST_KEY, String(best));
    }
  }

  // ---------- Input ----------
  canvas.addEventListener("pointerdown", (e) => { e.preventDefault(); flap(); });
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW" || e.code === "Enter") {
      e.preventDefault();
      if (!e.repeat) flap();
    }
  });

  // ---------- Update ----------
  function circleRect(cx, cy, r, rx, ry, rw, rh) {
    const nx = Math.max(rx, Math.min(cx, rx + rw));
    const ny = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nx, dy = cy - ny;
    return dx * dx + dy * dy < r * r;
  }

  function update(dt) {
    time += dt;
    flashT = Math.max(0, flashT - dt * 3);

    if (state !== "over") {
      groundX = (groundX - speed * dt) % 24;
      for (const c of clouds) {
        c.x -= speed * 0.15 * c.s * dt;
        if (c.x < -80) { c.x = W + 40; c.y = 40 + Math.random() * 220; }
      }
    }

    if (state === "ready") {
      bird.y = H * 0.42 + Math.sin(time * 4) * 8;
      bird.wing += dt * 10;
      bird.rot = 0;
      return;
    }

    // Bird physics (game over ke baad bhi gir ke zameen tak jaata hai)
    bird.vy = Math.min(bird.vy + GRAVITY * dt, MAX_FALL);
    bird.y += bird.vy * dt;
    const targetRot = Math.max(-0.45, Math.min(1.4, bird.vy / 450));
    bird.rot += (targetRot - bird.rot) * Math.min(1, dt * 12);
    if (state === "play") bird.wing += dt * (bird.vy < 0 ? 22 : 10);

    const groundY = H - GROUND_H;
    if (bird.y + BIRD_R >= groundY) {
      bird.y = groundY - BIRD_R;
      bird.vy = 0;
      gameOver();
    }
    if (bird.y - BIRD_R < 0) {
      bird.y = BIRD_R;
      bird.vy = 0;
    }

    if (state !== "play") return;

    speed = Math.min(MAX_SPEED, BASE_SPEED + score * 2.5);

    for (const p of pipes) {
      p.x -= speed * dt;
      if (!p.passed && p.x + PIPE_W < BIRD_X) {
        p.passed = true;
        score++;
        sfx.score();
      }
      const hitR = BIRD_R - 2; // thoda forgiving hitbox
      if (
        circleRect(BIRD_X, bird.y, hitR, p.x, 0, PIPE_W, p.top) ||
        circleRect(BIRD_X, bird.y, hitR, p.x, p.top + PIPE_GAP, PIPE_W, H)
      ) {
        gameOver();
      }
    }

    if (pipes.length && pipes[0].x < -PIPE_W) pipes.shift();
    const last = pipes[pipes.length - 1];
    if (last && last.x < W - PIPE_SPACING) spawnPipe(last.x + PIPE_SPACING);
  }

  // ---------- Draw ----------
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#4ec0ca");
    g.addColorStop(1, "#bdeef2");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Clouds
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (const c of clouds) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, 18 * c.s, 0, Math.PI * 2);
      ctx.arc(c.x + 20 * c.s, c.y - 8 * c.s, 22 * c.s, 0, Math.PI * 2);
      ctx.arc(c.x + 42 * c.s, c.y, 17 * c.s, 0, Math.PI * 2);
      ctx.fill();
    }

    // Distant city/bushes
    ctx.fillStyle = "#8fd6a0";
    const baseY = H - GROUND_H;
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    for (let x = 0; x <= W; x += 30) {
      ctx.quadraticCurveTo(x + 15, baseY - 38 - (x % 60 ? 0 : 10), x + 30, baseY);
    }
    ctx.fill();
  }

  function drawPipe(x, y, h, flip) {
    const lip = 26;
    const g = ctx.createLinearGradient(x, 0, x + PIPE_W, 0);
    g.addColorStop(0, "#5cbf2a");
    g.addColorStop(0.5, "#9ee35a");
    g.addColorStop(1, "#4a9a22");
    ctx.fillStyle = g;
    ctx.strokeStyle = "#2f5e14";
    ctx.lineWidth = 2;
    ctx.fillRect(x + 3, y, PIPE_W - 6, h);
    ctx.strokeRect(x + 3, y, PIPE_W - 6, h);
    const lipY = flip ? y + h - lip : y;
    ctx.fillRect(x - 2, lipY, PIPE_W + 4, lip);
    ctx.strokeRect(x - 2, lipY, PIPE_W + 4, lip);
  }

  function drawPipes() {
    for (const p of pipes) {
      drawPipe(p.x, 0, p.top, true);
      const by = p.top + PIPE_GAP;
      drawPipe(p.x, by, H - GROUND_H - by, false);
    }
  }

  function drawGround() {
    const y = H - GROUND_H;
    ctx.fillStyle = "#ded895";
    ctx.fillRect(0, y, W, GROUND_H);
    ctx.fillStyle = "#73bf2e";
    ctx.fillRect(0, y, W, 14);
    ctx.fillStyle = "#5ea524";
    for (let x = groundX; x < W; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, y + 14);
      ctx.lineTo(x + 12, y + 14);
      ctx.lineTo(x + 6, y + 4);
      ctx.fill();
    }
    ctx.fillStyle = "#543847";
    ctx.fillRect(0, y, W, 2);
  }

  function drawBird() {
    ctx.save();
    ctx.translate(BIRD_X, bird.y);
    ctx.rotate(bird.rot);

    // Body
    ctx.fillStyle = "#ffd23f";
    ctx.strokeStyle = "#5a3a12";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_R + 3, BIRD_R, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Belly
    ctx.fillStyle = "#fff1b8";
    ctx.beginPath();
    ctx.ellipse(-2, 6, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing
    const flapY = Math.sin(bird.wing) * 5;
    ctx.fillStyle = "#f5a623";
    ctx.beginPath();
    ctx.ellipse(-7, 2 + flapY * 0.6, 9, 5 + Math.abs(flapY) * 0.3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eye
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(7, -6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(9, -6, 2.6, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = "#ff6b3d";
    ctx.beginPath();
    ctx.moveTo(14, -1);
    ctx.lineTo(25, 3);
    ctx.lineTo(14, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  function text(str, x, y, size, color = "#fff", align = "center") {
    ctx.font = `800 ${size}px "Segoe UI", system-ui, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = size / 6;
    ctx.strokeStyle = "#2b1b0e";
    ctx.strokeText(str, x, y);
    ctx.fillStyle = color;
    ctx.fillText(str, x, y);
  }

  function medalFor(s) {
    if (s >= 40) return { name: "Platinum", color: "#e5e4e2" };
    if (s >= 30) return { name: "Gold", color: "#ffd700" };
    if (s >= 20) return { name: "Silver", color: "#c0c0c0" };
    if (s >= 10) return { name: "Bronze", color: "#cd7f32" };
    return null;
  }

  function drawUI() {
    if (state === "play") {
      text(String(score), W / 2, 70, 52);
    }

    if (state === "ready") {
      text("Flappy Bird", W / 2, 140, 44, "#ffd23f");
      text("Game Zone by Shubham Goyal", W / 2, 182, 16, "#fff");
      const pulse = 1 + Math.sin(time * 5) * 0.05;
      ctx.save();
      ctx.translate(W / 2, 400);
      ctx.scale(pulse, pulse);
      text("Tap / Space dabao", 0, 0, 24);
      ctx.restore();
      if (best > 0) text(`Best: ${best}`, W / 2, 445, 20, "#fff1b8");
    }

    if (state === "over") {
      text("Game Over", W / 2, 150, 44, "#ff6b3d");

      const px = 50, py = 200, pw = W - 100, ph = 170;
      ctx.fillStyle = "#ded895";
      ctx.strokeStyle = "#543847";
      ctx.lineWidth = 3;
      roundRect(px, py, pw, ph, 14);
      ctx.fill();
      ctx.stroke();

      const medal = medalFor(score);
      ctx.fillStyle = medal ? medal.color : "#c9c18a";
      ctx.beginPath();
      ctx.arc(px + 58, py + 85, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (medal) {
        ctx.font = '700 12px "Segoe UI", sans-serif';
        ctx.fillStyle = "#543847";
        ctx.textAlign = "center";
        ctx.fillText(medal.name, px + 58, py + 135);
      }

      ctx.font = '700 15px "Segoe UI", sans-serif';
      ctx.fillStyle = "#e86a3a";
      ctx.textAlign = "right";
      ctx.fillText("SCORE", px + pw - 20, py + 36);
      ctx.fillText("BEST", px + pw - 20, py + 100);
      text(String(score), px + pw - 20, py + 64, 30, "#fff", "right");
      text(String(best), px + pw - 20, py + 128, 30, "#fff", "right");

      if (score > 0 && score === best) {
        ctx.fillStyle = "#ff3d3d";
        roundRect(px + pw - 120, py + 90, 42, 18, 4);
        ctx.fill();
        ctx.font = '700 11px "Segoe UI", sans-serif';
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.fillText("NEW", px + pw - 99, py + 100);
      }

      if (performance.now() - overAt > 600) {
        text("Dobara khelne ke liye Tap karo", W / 2, 420, 19);
      }
    }

    if (flashT > 0) {
      ctx.fillStyle = `rgba(255,255,255,${flashT * 0.8})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function draw() {
    drawBackground();
    drawPipes();
    drawGround();
    drawBird();
    drawUI();
  }

  // ---------- Loop ----------
  let last = performance.now();
  function loop(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30); // tab switch par jump nahi hoga
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  document.addEventListener("visibilitychange", () => { last = performance.now(); });

  reset();
  requestAnimationFrame(loop);
})();
