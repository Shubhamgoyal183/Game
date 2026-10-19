// Chhote shared helpers jo har game use kar sakta hai.
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem("gamezone_" + key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem("gamezone_" + key, JSON.stringify(value)); } catch { /* ignore */ }
  },
};

// Phone/tablet (touch) hai ya mouse wala laptop
const IS_TOUCH = !window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// WebAudio se chhoti awaazein (koi sound file nahi chahiye)
const sound = (() => {
  let ac = null;
  function ctx() {
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
    } catch { ac = null; }
    return ac;
  }
  function beep(freq, dur = 0.08, type = "square", vol = 0.06, slideTo) {
    const a = ctx();
    if (!a) return;
    const t = a.currentTime, o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + dur);
  }
  return { beep, unlock: ctx };
})();

// Canvas ko box ke andar fit karo. Game hamesha W x H "logical" units mein draw karta hai.
function fitCanvas(canvas, ctx, box, W, H) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const scale = Math.min(box.clientWidth / W, box.clientHeight / H);
  const cw = Math.max(1, Math.floor(W * scale)), ch = Math.max(1, Math.floor(H * scale));
  canvas.style.width = cw + "px";
  canvas.style.height = ch + "px";
  canvas.width = Math.floor(cw * dpr);
  canvas.height = Math.floor(ch * dpr);
  ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  return scale;
}

// Screen bharne wala fit: game ki duniya kam se kam minW x minH rehti hai, aur jo taraf
// screen mein jagah bachi ho (phone seedha = upar-neeche, laptop = side mein) us taraf maxW/maxH tak badh jaati hai.
function fitCanvasFill(canvas, ctx, box, minW, minH, maxW = minW, maxH = minH) {
  const bw = Math.max(1, box.clientWidth), bh = Math.max(1, box.clientHeight);
  const s = Math.min(bw / minW, bh / minH);
  const W = Math.round(Math.min(maxW, Math.max(minW, bw / s)));
  const H = Math.round(Math.min(maxH, Math.max(minH, bh / s)));
  fitCanvas(canvas, ctx, box, W, H);
  return { W, H };
}

// Phone seedha (portrait) pakda hai?
const isPortrait = (box) => box.clientHeight > box.clientWidth * 1.1;

// Pointer event ko canvas ke logical coordinates mein badlo
function canvasPoint(canvas, e, W, H) {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
}

// Popup dikhao (page mein #modal, #mTitle, #mText, #mBtn hone chahiye)
function showModal(title, text, btnText, onClick) {
  document.getElementById("mTitle").textContent = title;
  document.getElementById("mText").textContent = text;
  const btn = document.getElementById("mBtn");
  btn.textContent = btnText;
  btn.onclick = () => { hideModal(); onClick && onClick(); };
  document.getElementById("modal").classList.add("show");
}
function hideModal() {
  document.getElementById("modal").classList.remove("show");
}
