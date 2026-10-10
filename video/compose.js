/* Thunder Stallion explainer — a 60s timeline rendered frame by frame.
   Every visual is a function of time t (seconds), so render(t) is deterministic.
   URL params: set=desktop|mobile, w, h, base=<assets folder URL>. Targets come from window.TARGETS. */

const Q = new URLSearchParams(location.search);
const OW = +(Q.get("w") || 1920), OH = +(Q.get("h") || 1080); // output frame
const FRAME = Q.get("frame") === "iphone"; // play the scenes on an iPhone 12 Pro screen
// iPhone 12 Pro screen is 390x844pt; at 2x it is 780x1688 inside a 1080x1920 frame
const W = FRAME ? 780 : OW, H = FRAME ? 1688 : OH;
const SET = Q.get("set") || "desktop";
const BASE = Q.get("base") || `assets/${SET}/`;
const P = H > W; // portrait
const DPR = SET === "mobile" ? 3 : 2;
const TG = window.TARGETS || {};
const DURATION = 60;

const stage = document.getElementById("stage");
stage.style.width = W + "px";
stage.style.height = H + "px";

/* ───────── iPhone 12 Pro frame (frame=iphone) ───────── */
const outer = {};
if (FRAME) {
  const canvas = document.createElement("div"); canvas.id = "canvas";
  canvas.style.cssText = `position:relative;width:${OW}px;height:${OH}px;overflow:hidden;background:#07080c;perspective:2400px`;
  document.body.insertBefore(canvas, stage);
  outer.bg = document.createElement("div"); outer.bg.className = "layer"; canvas.appendChild(outer.bg);
  outer.grid = document.createElement("div"); outer.grid.className = "abs"; outer.grid.id = "grid"; outer.bg.appendChild(outer.grid);
  outer.glow = document.createElement("div"); outer.glow.className = "abs";
  outer.glow.style.cssText = "inset:0;background:radial-gradient(42% 30% at 50% 50%, rgb(255 210 63 / .28), transparent 70%), radial-gradient(60% 40% at 50% 100%, rgb(91 140 255 / .18), transparent 70%)";
  outer.bg.appendChild(outer.glow);
  const mask = document.createElement("div"); mask.className = "abs"; mask.style.cssText = "inset:0;background:radial-gradient(90% 60% at 50% 50%, transparent 30%, #07080c 90%)"; outer.bg.appendChild(mask);
  const BZ = 22; // bezel
  const dev = document.createElement("div"); dev.className = "abs device";
  dev.style.cssText = `width:${W + BZ * 2}px;height:${H + BZ * 2}px;border-radius:${95 + BZ}px;background:#050505;` +
    "box-shadow:0 0 0 7px #4a4c50, 0 0 0 9px #25262a, 0 0 0 10px #6b6d72, 0 60px 140px -30px rgb(0 0 0 / .9), 0 0 120px 10px rgb(255 210 63 / .18);";
  canvas.appendChild(dev);
  // side buttons: silent switch + volume (left), power (right)
  for (const [side, top, h] of [["left", 250, 70], ["left", 360, 130], ["left", 520, 130], ["right", 420, 200]]) {
    const b = document.createElement("div"); b.className = "abs";
    b.style.cssText = `width:9px;height:${h}px;top:${top}px;${side}:-17px;left:${side === "left" ? -17 : W + BZ * 2 + 8}px;border-radius:4px;background:linear-gradient(90deg,#2b2c30,#6b6d72,#2b2c30)`;
    dev.appendChild(b);
  }
  const screen = document.createElement("div"); screen.className = "abs";
  screen.style.cssText = `left:${BZ}px;top:${BZ}px;width:${W}px;height:${H}px;border-radius:95px;overflow:hidden;background:#07080c;isolation:isolate`;
  dev.appendChild(screen);
  screen.appendChild(stage);
  // notch
  const notch = document.createElement("div"); notch.className = "abs";
  notch.style.cssText = `left:${(W - 330) / 2}px;top:-2px;width:330px;height:64px;background:#050505;border-radius:0 0 38px 38px;z-index:50`;
  screen.appendChild(notch);
  const cam = document.createElement("div"); cam.className = "abs"; cam.style.cssText = `left:${W / 2 + 70}px;top:18px;width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 40% 40%,#1d2a4a,#050505 60%);z-index:51`; screen.appendChild(cam);
  const spk = document.createElement("div"); spk.className = "abs"; spk.style.cssText = `left:${W / 2 - 50}px;top:12px;width:100px;height:9px;border-radius:5px;background:#1a1a1c;z-index:51`; screen.appendChild(spk);
  // iOS status bar
  const sb = document.createElement("div"); sb.className = "abs";
  sb.style.cssText = `left:0;top:0;width:${W}px;height:92px;z-index:49;color:#fff;font:600 32px -apple-system,"SF Pro Text","Inter",system-ui,sans-serif;background:linear-gradient(#07080c,rgba(7,8,12,0))`;
  sb.innerHTML = `<span style="position:absolute;left:78px;top:24px;letter-spacing:.5px">9:41</span>
    <svg style="position:absolute;right:150px;top:30px" width="36" height="24" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" fill="#fff"/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="#fff"/><rect x="10" y="3" width="3" height="9" rx="1" fill="#fff"/><rect x="15" y="0" width="3" height="12" rx="1" fill="#fff"/></svg>
    <svg style="position:absolute;right:104px;top:29px" width="34" height="26" viewBox="0 0 17 13"><path d="M8.5 12.5 L5.6 9.3 A4.2 4.2 0 0 1 11.4 9.3 Z M8.5 3.5 A8.8 8.8 0 0 1 14.7 6 L13.1 7.7 A6.6 6.6 0 0 0 3.9 7.7 L2.3 6 A8.8 8.8 0 0 1 8.5 3.5 Z M8.5 0 A12.6 12.6 0 0 1 17 3.4 L15.4 5 A10.4 10.4 0 0 0 1.6 5 L0 3.4 A12.6 12.6 0 0 1 8.5 0 Z" fill="#fff"/></svg>
    <svg style="position:absolute;right:44px;top:28px" width="52" height="26" viewBox="0 0 26 13"><rect x=".5" y=".5" width="22" height="12" rx="3.5" fill="none" stroke="#fff" stroke-opacity=".5"/><rect x="2" y="2" width="17" height="9" rx="2" fill="#fff"/><rect x="23.5" y="4" width="2" height="5" rx="1" fill="#fff" fill-opacity=".5"/></svg>`;
  screen.appendChild(sb);
  // home indicator
  const hi = document.createElement("div"); hi.className = "abs"; hi.style.cssText = `left:${(W - 270) / 2}px;top:${H - 22}px;width:270px;height:10px;border-radius:5px;background:rgb(255 255 255 / .85);z-index:49`; screen.appendChild(hi);
  outer.dev = dev; outer.canvas = canvas; outer.BZ = BZ;
}

/* ───────── helpers ───────── */
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, p) => a + (b - a) * p;
const E = {
  lin: (x) => x,
  out: (x) => 1 - (1 - x) ** 3,
  in: (x) => x ** 3,
  io: (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2),
  back: (x) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2; },
};
/** keyframes: [[time, value], ...], eased per segment */
function kf(t, frames, ease = E.io) {
  if (t <= frames[0][0]) return frames[0][1];
  for (let i = 0; i < frames.length - 1; i++) {
    const [t0, v0] = frames[i], [t1, v1, e] = frames[i + 1];
    if (t <= t1) return lerp(v0, v1, (e || ease)(prog(t, t0, t1)));
  }
  return frames[frames.length - 1][1];
}
/** scene visibility with fades */
const vis = (t, a, b, fi = 0.35, fo = 0.35) => Math.min(prog(t, a, a + fi), 1 - prog(t, b - fo, b));

function el(tag, cls = "abs", parent = stage) {
  const e = document.createElement(tag);
  e.className = cls;
  parent.appendChild(e);
  return e;
}
const sizes = {};
function img(name, parent, cls = "abs") {
  const i = el("img", cls, parent);
  i.src = name.includes(".") ? BASE + name : `${BASE}${name}.png`;
  i.onload = () => {
    const d = name.includes(".") ? 1 : DPR;
    sizes[name] = { w: i.naturalWidth / d, h: i.naturalHeight / d };
    i.style.width = sizes[name].w + "px";
    i.style.height = sizes[name].h + "px";
  };
  i._name = name;
  return i;
}
const sz = (e) => sizes[e._name] || { w: 1, h: 1 };
/** place element (unscaled size w,h) centred at (cx,cy) */
function put(e, { cx = W / 2, cy = H / 2, w, h, s = 1, o = 1, rx = 0, ry = 0, rz = 0, blur = 0 }) {
  const size = w ? { w, h } : sz(e);
  e.style.transform = `translate3d(${cx - size.w / 2}px, ${cy - size.h / 2}px, 0) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`;
  e.style.opacity = o;
  e.style.filter = blur ? `blur(${blur}px)` : "";
  e.style.display = o <= 0.001 ? "none" : "";
}
/** point inside an element placed with put(): fraction (fx,fy) → stage coords */
function at(cx, cy, size, s, fx, fy) {
  return [cx + (fx - 0.5) * size.w * s, cy + (fy - 0.5) * size.h * s];
}
const tgCenter = (key) => { const b = TG[key]; return b ? [b.x + b.w / 2, b.y + b.h / 2] : [0.5, 0.5]; };
const fitS = (size, maxW, maxH) => Math.min(maxW / size.w, maxH / size.h);

/* ───────── backdrop ───────── */
const bg = el("div", "layer");
const aur = [
  ["rgb(255 210 63 / .16)", "22% 20%"], ["rgb(91 140 255 / .20)", "80% 12%"], ["rgb(138 61 255 / .12)", "60% 85%"],
].map(([c, p]) => { const a = el("div", "aurora abs", bg); a.style.background = `radial-gradient(36% 30% at ${p}, ${c}, transparent 70%)`; return a; });
const grid = el("div", "abs", bg); grid.id = "grid";
const floor = el("div", "abs", bg); floor.id = "floor";
el("div", "abs", bg).id = "grid-mask";

const BOLTS = [
  { view: "0 0 160 520", d: ["M118 0 L96 70 L112 78 L72 170 L94 178 L50 290 L70 298 L28 420 L46 428 L20 520", "M94 178 L130 230 L120 236 L150 300", "M50 290 L18 330 L28 336 L4 380"], pos: P ? [0.62, 0.0, 0.42] : [0.78, -0.02, 0.62] },
  { view: "0 0 140 420", d: ["M30 0 L52 80 L36 86 L70 190 L50 196 L88 300 L70 306 L100 420", "M50 196 L20 250 L30 256 L8 310"], pos: P ? [0.04, 0.02, 0.34] : [0.05, 0.03, 0.5] },
  { view: "0 0 120 340", d: ["M80 0 L60 60 L74 66 L44 150 L62 156 L30 250 L46 256 L24 340", "M62 156 L96 200 L88 206 L112 250"], pos: P ? [0.66, 0.55, 0.28] : [0.6, 0.45, 0.4], blue: true },
];
const boltEls = BOLTS.map((b) => {
  const [, , vw, vh] = b.view.split(" ").map(Number);
  const hpx = b.pos[2] * H, wpx = (hpx * vw) / vh;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", b.view);
  svg.setAttribute("class", `bolt abs${b.blue ? " blue" : ""}`);
  svg.style.width = wpx + "px"; svg.style.height = hpx + "px";
  svg.style.transform = `translate(${b.pos[0] * W}px, ${b.pos[1] * H}px)`;
  const paths = [];
  for (const cls of ["glow", "core"]) for (const d of b.d) {
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", d); p.setAttribute("class", cls); svg.appendChild(p); paths.push(p);
  }
  bg.appendChild(svg);
  return { svg, paths };
});
const flash = el("div", "abs", stage); flash.id = "flash";
const outerBolts = [];
if (FRAME) {
  const OB = [
    { b: BOLTS[0], x: 0.80, y: -0.02, h: 0.42 }, { b: BOLTS[1], x: 0.02, y: 0.05, h: 0.36 }, { b: BOLTS[2], x: 0.86, y: 0.56, h: 0.3 },
  ];
  for (const o of OB) {
    const [, , vw, vh] = o.b.view.split(" ").map(Number);
    const hpx = o.h * OH, wpx = (hpx * vw) / vh;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", o.b.view); svg.setAttribute("class", `bolt abs${o.b.blue ? " blue" : ""}`);
    svg.style.width = wpx + "px"; svg.style.height = hpx + "px";
    svg.style.transform = `translate(${o.x * OW}px, ${o.y * OH}px)`;
    const paths = [];
    for (const cls of ["glow", "core"]) for (const d of o.b.d) {
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", d); p.setAttribute("class", cls); svg.appendChild(p); paths.push(p);
    }
    outer.bg.appendChild(svg);
    outerBolts.push({ svg, paths });
  }
}

// [time, boltIndex]
const STRIKES = [[0.3, 0], [0.95, 1], [1.6, 2], [3.95, 0], [10.0, 1], [18.0, 2], [24.0, 0], [30.0, 1], [36.4, 2], [46.0, 0], [51.4, 2], [53.1, 0], [53.25, 1], [54.3, 1], [55.0, 2], [55.6, 0], [57.6, 1]];
function strikeLevel(age) {
  if (age < 0 || age > 0.75) return 0;
  if (age < 0.12) return 1;
  if (age < 0.2) return 0.3;
  if (age < 0.3) return 1;
  return 1 - (age - 0.3) / 0.45;
}
function renderBackdrop(t) {
  aur.forEach((a, i) => { const k = t * (0.08 + i * 0.03) + i * 2; a.style.transform = `translate3d(${Math.sin(k) * 5}%, ${Math.cos(k * 1.3) * 4}%, 0) scale(${1 + Math.sin(k * 0.7) * 0.06})`; });
  grid.style.transform = `translate3d(${-(t * 12) % 56}px, ${-(t * 18) % 56}px, 0)`;
  floor.style.backgroundPosition = `0 ${(t * 22) % 64}px`;
  let fl = 0;
  [...boltEls, ...outerBolts].forEach((b, j) => {
    const i = j % boltEls.length;
    let lvl = 0, draw = 0;
    for (const [ts, bi] of STRIKES) if (bi === i) { const age = t - ts; const l = strikeLevel(age); if (l > lvl) { lvl = l; draw = prog(age, 0, 0.12); } }
    b.svg.style.opacity = lvl;
    b.paths.forEach((p) => p.setAttribute("stroke-dashoffset", 900 * (1 - draw)));
    fl = Math.max(fl, lvl);
  });
  flash.style.opacity = fl * 0.9;
  if (FRAME) {
    outer.grid.style.transform = `translate3d(${-(t * 10) % 56}px, ${-(t * 16) % 56}px, 0)`;
    outer.glow.style.opacity = 0.75 + 0.25 * Math.sin(t * 1.2) + fl * 0.6;
    // phone floats gently and tilts a little
    const x = (OW - (W + outer.BZ * 2)) / 2, y = (OH - (H + outer.BZ * 2)) / 2;
    const intro = E.out(prog(t, 0, 1.2));
    outer.dev.style.transform = `translate3d(${x}px, ${y + Math.sin(t * 0.8) * 8 + (1 - intro) * 120}px, 0) rotateX(${Math.sin(t * 0.5) * 2 + (1 - intro) * 18}deg) rotateY(${Math.sin(t * 0.37) * 3}deg) scale(${lerp(0.92, 1, intro)})`;
    outer.dev.style.opacity = intro;
  }
}

/* ───────── scene containers ───────── */
const scenes = [];
function scene(t0, t1, build) {
  const root = el("div", "layer");
  const s = { ...build(root), t0, t1, root };
  scenes.push(s);
  return s;
}

/* cursor + click ripples */
const cursor = el("div", "abs"); cursor.id = "cursor";
cursor.innerHTML = '<svg viewBox="0 0 24 24" width="34" height="34"><path d="M3 2 L3 20 L8 15 L11.5 22 L14.5 20.6 L11 13.8 L18 13.8 Z" fill="#fff" stroke="#07080c" stroke-width="1.4" stroke-linejoin="round"/></svg>';
const ripples = [el("div", "abs ripple"), el("div", "abs ripple")];
if (FRAME) cursor.innerHTML = '<div style="width:64px;height:64px;margin:-18px 0 0 -26px;border-radius:50%;background:rgb(255 255 255 / .28);border:3px solid rgb(255 255 255 / .85);box-shadow:0 0 20px rgb(0 0 0 / .4)"></div>';
let cur = null; const clicks = [];

/* ───────── layout sizes ───────── */
const PANEL = P ? { w: W * 0.9, h: H * 0.8 } : { w: Math.min(1520, W * 0.8), h: H * 0.84 };

/** a website window: nav on top, scrollable content below */
function panel(root, content) {
  const box = el("div", "abs panel", root);
  box.style.width = PANEL.w + "px"; box.style.height = PANEL.h + "px";
  const nav = img("nav", box, "abs");
  const view = el("div", "abs", box); view.style.overflow = "hidden"; view.style.width = PANEL.w + "px";
  const c = img(content, view, "abs");
  return { box, nav, view, c };
}
function layoutPanel(p, scroll) {
  const n = sz(p.nav), ns = PANEL.w / n.w, navH = n.h * ns;
  p.nav.style.transformOrigin = "0 0"; p.nav.style.transform = `scale(${ns})`;
  const c = sz(p.c), cs = (PANEL.w - (P ? 24 : 48)) / c.w;
  p.view.style.top = navH + "px"; p.view.style.height = PANEL.h - navH + "px";
  p.c.style.transformOrigin = "0 0";
  const maxScroll = Math.max(0, c.h * cs - (PANEL.h - navH) + 24);
  p.c.style.transform = `translate3d(${P ? 12 : 24}px, ${12 - scroll * maxScroll}px, 0) scale(${cs})`;
  return { navH, cs, maxScroll, cOffX: P ? 12 : 24 };
}

/* ───────── scenes ───────── */
// S1 — intro: lightning, logo slams in
const sIntro = scene(0, 4.2, (root) => ({ logo: img("logo.jpg", root, "abs") }));
sIntro.logo.id = "logo";

// S2 — the live board
const sBoard = scene(3.9, 10.2, (root) => ({ p: panel(root, "board-home"), halo: el("div", "abs halo", root) }));

// S3 — trenches, hottest, search
const sTrench = scene(10, 13.3, (root) => ({ p: panel(root, "trenches") }));
const sHot = scene(13.1, 15.8, (root) => ({ i: img("hottest", root, "abs shadowed") }));
const sSearch = scene(15.6, 18.2, (root) => ({ a: img("search-trending", root, "abs shadowed"), b: img("search-results", root, "abs shadowed") }));

// S4 — community votes
const sVote = scene(18, 24.2, (root) => ({ hot: img("hotspot", root, "abs shadowed"), a: img("coin-head", root, "abs shadowed"), b: img("coin-head-voted", root, "abs shadowed"), halo: el("div", "abs halo", root) }));

// S5 — free listing with auto-fill
const sSubmit = scene(24, 30.2, (root) => {
  const a = img("submit-empty", root, "abs shadowed"), b = img("submit-filled", root, "abs shadowed");
  return { a, b };
});

// S6 — Thunder Trend tiers, gold ticker / elite rows, profiles
const sTiers = scene(30, 36.7, (root) => ({ cards: [1, 2, 3, 4, 5].map((n) => img(`tier-${n}`, root, "abs shadowed")), halo: el("div", "abs halo", root) }));
const sRows = scene(36.5, 40.7, (root) => {
  const win = el("div", "abs panel", root); win.style.overflow = "hidden";
  const b = img("board-home", win, "abs");
  const sweep = el("div", "sweep", win);
  const halo = el("div", "abs halo", root);
  const spot = img("spotlight", root, "abs shadowed");
  return { win, b, sweep, halo, spot };
});
const sProfiles = scene(40.5, 46.2, (root) => ({ free: img("profile-free", root, "abs shadowed"), elite: img("profile-elite", root, "abs shadowed"), halo: el("div", "abs halo", root) }));

// S7 — checkout → admin activates → token goes live
const sCheckout = scene(46, 50.6, (root) => ({ a: img("checkout", root, "abs shadowed"), b: img("order-ok", root, "abs shadowed") }));
const sAdmin = scene(50.4, 52.4, (root) => ({ a: img("admin-orders", root, "abs shadowed panel") }));
const sLive = scene(52.2, 54.5, (root) => {
  const win = el("div", "abs panel", root); win.style.overflow = "hidden";
  const before = img("board-before", win, "abs"), after = img("board-after", win, "abs");
  const row = img("row-heehaw", win, "abs");
  const halo = el("div", "abs halo", root);
  return { win, before, after, row, halo };
});

// S8 — outro
const sOutro = scene(54.2, 60.01, (root) => ({ logo: img("logo.jpg", root, "abs") }));
sOutro.logo.id = "logo";
const fade = el("div", "abs", stage); fade.id = "fade";
el("div", "abs", stage).id = "vignette";
stage.appendChild(cursor); ripples.forEach((r) => stage.appendChild(r));

/* ───────── per-scene render ───────── */
function logoAt(e, t, t0) {
  const L = Math.min(W, H) * (P ? 0.78 : 0.62);
  const s = kf(t, [[t0, 1.45], [t0 + 0.7, 1, E.back], [t0 + 2.4, 1.05, E.lin]]);
  const o = prog(t, t0, t0 + 0.25);
  put(e, { w: L, h: L, s, o, blur: (1 - prog(t, t0, t0 + 0.4)) * 14 });
  e.style.width = L + "px"; e.style.height = L + "px";
}

const R = {
  intro(s, t) {
    logoAt(s.logo, t, 1.55);
    if (t > 3.6) { const p = E.in(prog(t, 3.6, 4.2)); put(s.logo, { w: Math.min(W, H) * (P ? 0.78 : 0.62), h: Math.min(W, H) * (P ? 0.78 : 0.62), s: 1.05 + p * 1.4, o: 1 - p, blur: p * 10 }); }
  },
  board(s, t) {
    const enter = E.out(prog(t, 3.9, 5.0));
    const scroll = kf(t, [[5.4, 0], [10.2, 0.32]], E.io);
    const L = layoutPanel(s.p, scroll);
    const drift = Math.sin(t * 0.6) * 2;
    put(s.p.box, { w: PANEL.w, h: PANEL.h, cy: H / 2 + (1 - enter) * 140, s: lerp(0.8, 1, enter), rx: lerp(26, 0, enter) + drift * 0.3, ry: lerp(-16, 0, enter) + drift, o: 1 });
    // halo around the boosted top row, early in the scene
    const r = TG["board-home.row1"]; const c = sz(s.p.c);
    if (r) {
      const o = Math.min(prog(t, 5.3, 5.7), 1 - prog(t, 7.0, 7.5)) * enter;
      const x0 = W / 2 - PANEL.w / 2 + L.cOffX + r.x * c.w * L.cs, y0 = H / 2 - PANEL.h / 2 + L.navH + 12 - scroll * L.maxScroll + r.y * c.h * L.cs;
      put(s.halo, { cx: x0 + (r.w * c.w * L.cs) / 2, cy: y0 + (r.h * c.h * L.cs) / 2, w: r.w * c.w * L.cs + 16, h: r.h * c.h * L.cs + 12, o: o * (0.7 + 0.3 * Math.sin(t * 9)) });
    }
  },
  trench(s, t) {
    const enter = E.out(prog(t, 10, 10.9));
    layoutPanel(s.p, kf(t, [[10.6, 0], [13.3, 0.25]]));
    put(s.p.box, { w: PANEL.w, h: PANEL.h, cx: W / 2 + (1 - enter) * W * 0.4, ry: lerp(-24, 0, enter), s: lerp(0.9, 1, enter) });
  },
  hot(s, t) {
    const z = sz(s.i), base = fitS(z, W * 0.88, H * 0.8);
    const enter = E.back(prog(t, 13.1, 13.8));
    put(s.i, { s: base * lerp(0.86, 1, enter) * kf(t, [[13.8, 1], [15.8, 1.04]], E.lin), rx: lerp(18, 0, E.out(prog(t, 13.1, 13.8))) });
  },
  search(s, t) {
    const za = sz(s.a), zb = sz(s.b);
    const sa = fitS(za, W * 0.82, H * 0.82), sb = Math.min(fitS(zb, W * 0.82, H * 0.6), sa * 1.05);
    const enter = E.back(prog(t, 15.6, 16.2));
    const swap = prog(t, 16.7, 16.95);
    const topY = H / 2 - (za.h * sa) / 2;
    put(s.a, { s: sa * lerp(0.82, 1, enter), o: 1 - swap });
    put(s.b, { cy: topY + (zb.h * sb) / 2, s: sb, o: swap });
    // cursor taps the first result
    const [fx, fy] = [0.5, 0.62];
    const [x, y] = at(W / 2, topY + (zb.h * sb) / 2, zb, sb, fx, fy);
    cur = { x: kf(t, [[16.9, W * 0.85], [17.5, x]]), y: kf(t, [[16.9, H * 0.9], [17.5, y]]), o: Math.min(prog(t, 16.9, 17.1), 1 - prog(t, 17.9, 18.1)) };
    clicks.push({ t: 17.6, x, y });
  },
  vote(s, t) {
    const za = sz(s.a), zh = sz(s.hot);
    const sa = P ? fitS(za, W * 0.9, H * 0.42) : fitS(za, W * 0.86, H * 0.34);
    const sh = P ? fitS(zh, W * 0.9, H * 0.38) : fitS(zh, W * 0.5, H * 0.5);
    const ya = P ? H * 0.28 : H * 0.27, yh = P ? H * 0.72 : H * 0.7;
    const enter = E.out(prog(t, 18, 18.8)), enter2 = E.out(prog(t, 18.4, 19.2));
    const swap = prog(t, 20.85, 21.05);
    put(s.a, { cy: ya + (1 - enter) * 80, s: sa, o: 1 - swap });
    put(s.b, { cy: ya, s: sa, o: swap });
    put(s.hot, { cy: yh + (1 - enter2) * 120, s: sh * lerp(0.92, 1, enter2) * (1 + 0.03 * prog(t, 21.2, 22.2)) });
    const [vx, vy] = tgCenter("coin-head.vote");
    const [x, y] = at(W / 2, ya, za, sa, vx, vy);
    cur = { x: kf(t, [[19.4, W * 0.7], [20.6, x]]), y: kf(t, [[19.4, H * 0.95], [20.6, y]]), o: Math.min(prog(t, 19.4, 19.6), 1 - prog(t, 21.6, 21.9)) };
    clicks.push({ t: 20.8, x, y });
    const ho = Math.min(prog(t, 21.3, 21.7), 1 - prog(t, 23.4, 23.9));
    put(s.halo, { cy: yh, w: zh.w * sh * (1 + 0.03 * prog(t, 21.2, 22.2)) + 10, h: zh.h * sh * (1 + 0.03 * prog(t, 21.2, 22.2)) + 10, o: ho * (0.65 + 0.35 * Math.sin(t * 8)) });
  },
  submit(s, t) {
    const z = sz(s.a), zf = sz(s.b);
    const base = P ? fitS(z, W * 0.86, H * 2) : fitS(z, W * 0.6, H * 2);
    // camera: start on the contract field, then pull back down the filled form
    const zi = P ? 1.08 : 1.25; // a narrow phone screen can't take as much zoom
    const zoom = kf(t, [[24, zi], [26.2, zi], [28.2, P ? 0.98 : 1]]);
    const focusY = kf(t, [[24, 0.12], [26.2, 0.12], [30.2, 0.62]]);
    const s1 = base * zoom;
    const cy = H / 2 - (focusY - 0.5) * z.h * s1;
    const enter = E.out(prog(t, 24, 24.8));
    put(s.a, { cy: cy + (1 - enter) * 120, s: s1, o: 1 });
    const wipe = prog(t, 26.25, 27.4);
    put(s.b, { cy: cy - ((z.h - zf.h) / 2) * s1, s: s1, o: wipe > 0 ? 1 : 0 });
    s.b.style.clipPath = `inset(0 0 ${(1 - E.io(wipe)) * 100}% 0)`;
    const [ax, ay] = tgCenter("submit-empty.autofill");
    const [x, y] = at(W / 2, cy, z, s1, ax, ay);
    cur = { x: kf(t, [[25.0, W * 0.2], [25.9, x]]), y: kf(t, [[25.0, H * 0.85], [25.9, y]]), o: Math.min(prog(t, 25.0, 25.2), 1 - prog(t, 26.6, 26.9)) };
    clicks.push({ t: 26.05, x, y });
  },
  tiers(s, t) {
    const n = s.cards.length;
    if (!P) {
      const z = sz(s.cards[0]), sc = fitS(z, (W * 0.9 - 4 * 26) / 5, H * 0.74);
      const gap = z.w * sc + 26;
      s.cards.forEach((c, i) => {
        const e = E.back(prog(t, 30.1 + i * 0.18, 30.9 + i * 0.18));
        const lift = (i === 2 ? Math.min(prog(t, 33.0, 33.4), 1 - prog(t, 34.3, 34.7)) : 0) + (i === 4 ? prog(t, 34.6, 35.0) : 0);
        put(c, { cx: W / 2 + (i - 2) * gap, cy: H / 2 + (1 - e) * H * 0.7 - lift * 24 + Math.sin(t * 1.4 + i) * 4, s: sc * (1 + lift * 0.06), rx: (1 - e) * -40, o: prog(t, 30.1 + i * 0.18, 30.4 + i * 0.18) });
      });
      // halo follows the highlighted card
      const which = t < 34.5 ? 2 : 4;
      const hz = z.w * sc * 1.06, hh = z.h * sc * 1.06;
      const ho = which === 2 ? Math.min(prog(t, 33.0, 33.4), 1 - prog(t, 34.3, 34.6)) : prog(t, 34.6, 35.0);
      put(s.halo, { cx: W / 2 + (which - 2) * gap, cy: H / 2 - 24, w: hz, h: hh, o: ho * (0.7 + 0.3 * Math.sin(t * 7)) });
      // cursor taps Tier 5 "Get started"
      const [gx, gy] = tgCenter("tier-5.cta");
      const [x, y] = at(W / 2 + 2 * gap, H / 2 - 24, z, sc * 1.06, gx, gy);
      cur = { x: kf(t, [[35.2, W * 0.7], [35.9, x]]), y: kf(t, [[35.2, H * 1.02], [35.9, y]]), o: Math.min(prog(t, 35.2, 35.4), 1 - prog(t, 36.3, 36.6)) };
      clicks.push({ t: 36.0, x, y });
    } else {
      // portrait: cards deal in one after another, earlier cards step back
      const z = sz(s.cards[0]), sc = fitS(z, W * 0.86, H * 0.66);
      s.cards.forEach((c, i) => {
        const t0 = 30.1 + i * 1.15, e = E.back(prog(t, t0, t0 + 0.6));
        const behind = clamp((t - (t0 + 1.15)) / 1.15, 0, n - 1 - i);
        put(c, { cy: H * 0.52 + (1 - e) * H * 0.8 - behind * 70, s: sc * (1 - behind * 0.07), o: prog(t, t0, t0 + 0.2) * (1 - Math.min(behind, 3) * 0.22), rx: (1 - e) * -30 });
        c.style.zIndex = 10 + i;
      });
      put(s.halo, { cy: H * 0.52, w: z.w * sc + 12, h: z.h * sc + 12, o: prog(t, 34.8, 35.2) * (0.7 + 0.3 * Math.sin(t * 7)) });
      s.halo.style.zIndex = 30;
      const [gx, gy] = tgCenter("tier-5.cta");
      const [x, y] = at(W / 2, H * 0.52, z, sc, gx, gy);
      cur = { x: kf(t, [[35.4, W * 0.8], [36.0, x]]), y: kf(t, [[35.4, H * 1.02], [36.0, y]]), o: Math.min(prog(t, 35.4, 35.6), 1 - prog(t, 36.4, 36.6)) };
      clicks.push({ t: 36.1, x, y });
    }
  },
  rows(s, t) {
    // zoom into the top of the live board: Elite frame + gold Thunder Ticker rows
    const z = sz(s.b), r1 = TG["board-home.row1"], r2 = TG["board-home.row2"] || r1;
    const rowH = r1 ? r1.h * z.h : 60, top = r1 ? r1.y * z.h - 8 : 0;
    const winW = P ? W * 0.94 : W * 0.86, sc = winW / z.w, winH = rowH * (P ? 4.2 : 3.2) * sc;
    const enter = E.out(prog(t, 36.5, 37.3));
    const cy = P ? H * 0.36 : H * 0.4;
    s.win.style.width = winW + "px"; s.win.style.height = winH + "px";
    put(s.win, { w: winW, h: winH, cy: cy + (1 - enter) * 100, s: lerp(0.9, 1, enter) * kf(t, [[37.3, 1], [40.7, 1.04]], E.lin), rx: lerp(20, 0, enter) });
    s.b.style.transformOrigin = "0 0";
    s.b.style.transform = `translate3d(0, ${-top * sc}px, 0) scale(${sc})`;
    // light sweep across the rows (gold shimmer)
    const sp = (t - 37.2) % 1.6 / 1.6;
    s.sweep.style.left = lerp(-30, 110, sp) + "%";
    s.sweep.style.opacity = t > 37.2 ? 1 : 0;
    // pulsing halo on the Elite row
    put(s.halo, { cy: cy - winH / 2 + (8 + rowH / 2) * sc + (1 - enter) * 100, w: winW + 10, h: rowH * sc + 8, o: Math.min(prog(t, 37.4, 37.8), 1 - prog(t, 40.2, 40.6)) * (0.6 + 0.4 * Math.sin(t * 8)) });
    // front-page spotlight card rises in
    const zs = sz(s.spot), ss = fitS(zs, P ? W * 0.9 : W * 0.5, H * 0.3);
    const e2 = E.back(prog(t, 38.4, 39.1));
    put(s.spot, { cy: (P ? H * 0.72 : H * 0.78) + (1 - e2) * 160, s: ss * lerp(0.85, 1, e2), o: prog(t, 38.4, 38.7) });
    void r2;
  },
  profiles(s, t) {
    const zf = sz(s.free), ze = sz(s.elite);
    if (P) {
      const sc = fitS(zf, W * 0.62, H * 0.42);
      const e1 = E.out(prog(t, 40.5, 41.3)), e2 = E.out(prog(t, 40.8, 41.6)), push = E.io(prog(t, 43.2, 45.6));
      put(s.free, { cx: W * 0.36, cy: H * 0.27 + (1 - e1) * 160, s: sc * (1 - push * 0.1), o: prog(t, 40.5, 40.8) * (1 - push * 0.5) });
      put(s.elite, { cx: W * 0.6, cy: H * 0.68 + (1 - e2) * 160 - push * H * 0.08, s: sc * (1 + push * 0.22), o: prog(t, 40.8, 41.1) });
      s.elite.style.zIndex = 5;
      put(s.halo, { cx: W * 0.6, cy: H * 0.68 - push * H * 0.08, w: ze.w * sc * (1 + push * 0.22) + 10, h: ze.h * sc * (1 + push * 0.22) + 10, o: prog(t, 42.0, 42.6) * (0.6 + 0.4 * Math.sin(t * 6)) });
      s.halo.style.zIndex = 6;
      return;
    }
    const sc = P ? fitS(zf, W * 0.44, H * 0.7) : fitS(zf, W * 0.3, H * 0.86);
    const e1 = E.out(prog(t, 40.5, 41.3)), e2 = E.out(prog(t, 40.8, 41.6));
    const push = E.io(prog(t, 43.2, 45.6));
    const gap = (P ? W * 0.25 : W * 0.17);
    put(s.free, { cx: W / 2 - gap - push * gap * 0.4, cy: H / 2 + (1 - e1) * 160, s: sc * (1 - push * 0.08), o: prog(t, 40.5, 40.8) * (1 - push * 0.55), ry: 8 * push });
    put(s.elite, { cx: W / 2 + gap - push * gap * 0.6, cy: H / 2 + (1 - e2) * 160, s: sc * (1 + push * 0.14), o: prog(t, 40.8, 41.1) });
    s.elite.style.zIndex = 5;
    put(s.halo, { cx: W / 2 + gap - push * gap * 0.6, cy: H / 2, w: ze.w * sc * (1 + push * 0.14) + 10, h: ze.h * sc * (1 + push * 0.14) + 10, o: prog(t, 42.0, 42.6) * (0.6 + 0.4 * Math.sin(t * 6)) });
    s.halo.style.zIndex = 6;
  },
  checkout(s, t) {
    const za = sz(s.a), zb = sz(s.b);
    const sa = fitS(za, P ? W * 0.9 : W * 0.5, H * 0.88), sb = Math.min(fitS(zb, P ? W * 0.9 : W * 0.5, H * 0.6), sa * 1.15);
    const enter = E.back(prog(t, 46, 46.6));
    const swap = prog(t, 49.1, 49.35);
    put(s.a, { s: sa * lerp(0.85, 1, enter) * (1 - swap * 0.05), o: (1 - swap) * prog(t, 46, 46.2) });
    put(s.b, { s: sb * lerp(0.8, 1, E.back(prog(t, 49.1, 49.6))), o: swap });
    const [bx, by] = tgCenter("checkout.submit");
    const [x, y] = at(W / 2, H / 2, za, sa, bx, by);
    cur = { x: kf(t, [[47.6, W * 0.85], [48.7, x]]), y: kf(t, [[47.6, H * 0.4], [48.7, y]]), o: Math.min(prog(t, 47.6, 47.8), 1 - prog(t, 49.3, 49.5)) };
    clicks.push({ t: 48.95, x, y });
  },
  admin(s, t) {
    const z = sz(s.a), sc = fitS(z, W * 0.92, H * 0.5);
    const enter = E.out(prog(t, 50.4, 51.0));
    put(s.a, { cy: H / 2 + (1 - enter) * 80, s: sc * lerp(0.92, 1, enter), rx: lerp(25, 0, enter) });
    const [ax, ay] = tgCenter("admin-orders.activate");
    const [x, y] = at(W / 2, H / 2, z, sc, ax, ay);
    cur = { x: kf(t, [[50.6, W * 0.5], [51.25, x]]), y: kf(t, [[50.6, H * 0.85], [51.25, y]]), o: Math.min(prog(t, 50.6, 50.8), 1 - prog(t, 51.8, 52.1)) };
    clicks.push({ t: 51.4, x, y });
  },
  live(s, t) {
    const zb = sz(s.before), r1 = TG["board-after.row1"], r2 = TG["board-after.row2"];
    const rowH = r1 && r2 ? (r2.y - r1.y) * zb.h : 62, top = r1 ? r1.y * zb.h - 8 : 0;
    const winW = P ? W * 0.94 : W * 0.86, sc = winW / zb.w, winH = rowH * (P ? 6 : 5) * sc;
    const enter = E.out(prog(t, 52.2, 52.6));
    s.win.style.width = winW + "px"; s.win.style.height = winH + "px";
    put(s.win, { w: winW, h: winH, s: lerp(0.92, 1, enter) });
    // rows shift down one slot while the new token flies up into #1
    const p = E.back(prog(t, 52.5, 53.1));
    for (const e of [s.before, s.after]) e.style.transformOrigin = "0 0";
    s.before.style.transform = `translate3d(0, ${(-top + rowH * p) * sc}px, 0) scale(${sc})`;
    const done = prog(t, 53.1, 53.25);
    s.before.style.opacity = 1 - done;
    s.after.style.transform = `translate3d(0, ${-top * sc}px, 0) scale(${sc})`;
    s.after.style.opacity = done;
    const zr = sz(s.row);
    s.row.style.transformOrigin = "0 0";
    s.row.style.transform = `translate3d(0, ${(8 + lerp(winH / sc + 40, 0, p)) * sc}px, 0) scale(${sc * (1 + 0.04 * Math.sin(Math.PI * clamp(p)))})`;
    s.row.style.opacity = (1 - done) * prog(t, 52.45, 52.6);
    s.row.style.width = zr.w + "px";
    put(s.halo, { cy: H / 2 - winH / 2 + (8 + rowH / 2) * sc, w: winW + 12, h: rowH * sc + 10, o: Math.min(prog(t, 53.1, 53.3), 1 - prog(t, 54.1, 54.4)) * (0.6 + 0.4 * Math.sin(t * 10)) });
  },
  outro(s, t) {
    logoAt(s.logo, t, 54.75);
  },
};
const ORDER = [[sIntro, "intro"], [sBoard, "board"], [sTrench, "trench"], [sHot, "hot"], [sSearch, "search"], [sVote, "vote"], [sSubmit, "submit"], [sTiers, "tiers"], [sRows, "rows"], [sProfiles, "profiles"], [sCheckout, "checkout"], [sAdmin, "admin"], [sLive, "live"], [sOutro, "outro"]];

function render(t) {
  renderBackdrop(t);
  cur = null; clicks.length = 0;
  for (const [s, name] of ORDER) {
    const o = vis(t, s.t0, s.t1, s === sIntro ? 0.01 : 0.35, s === sOutro ? 0.01 : 0.35);
    s.root.style.display = o <= 0 ? "none" : "";
    s.root.style.opacity = o;
    if (o > 0) R[name](s, t);
  }
  if (cur && cur.o > 0) { cursor.style.display = ""; cursor.style.opacity = cur.o; cursor.style.transform = `translate3d(${cur.x - 6}px, ${cur.y - 4}px, 0)`; }
  else cursor.style.display = "none";
  ripples.forEach((r) => (r.style.display = "none"));
  clicks.filter((c) => t >= c.t && t < c.t + 0.6).slice(0, 2).forEach((c, i) => {
    const age = (t - c.t) / 0.6, r = ripples[i];
    r.style.display = ""; r.style.opacity = 1 - age;
    r.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) scale(${0.3 + age * 1.2})`;
  });
  // press-in on the cursor at click time
  if (cur) for (const c of clicks) if (t >= c.t && t < c.t + 0.15) cursor.style.transform += " scale(0.85)";
  fade.style.opacity = prog(t, 59.0, 60);
  if (FRAME) outer.canvas.style.opacity = 1 - prog(t, 59.0, 60);
}

window.DURATION = DURATION;
window.render = render;
const imgs = [...document.images];
Promise.all(imgs.map((i) => (i.complete ? Promise.resolve() : new Promise((r) => { i.onloadend = r; i.addEventListener("load", r); i.addEventListener("error", r); }))))
  .then(() => new Promise((r) => setTimeout(r, 50)))
  .then(() => { render(0); window.READY = true; });
