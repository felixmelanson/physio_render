// @ts-nocheck
import { withClay } from './clay.js';
/* Lab equipment and cell engine lifted verbatim from astrocyte_anim (js/core/*, plus the
   tilted petri dish, immunopanning plate, nAb well, dose wells and spin filter from js/scenes).
   The original draws on a global `ctx`; setCtx() points it at the canvas being drawn. */
let ctx = null;
export function setCtx(c) { ctx = c; }
const RENDER_MODE = true;
/* ===== js/core/math.js ===== */
// Small math, random number and colour helpers used everywhere.
const W = 1920, H = 1080, TAU = Math.PI * 2;

const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const sstep = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const ease = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const eOut = t => { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
const bump = (t, a, b, c, d) => seg(t, a, b) * (1 - seg(t, c, d));
function rng(seed) { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const angd = (a, b) => { const d = a - b; return Math.atan2(Math.sin(d), Math.cos(d)); };

/* ===== js/core/theme.js ===== */
// Colours and light/dark theme.
// Resting/healthy = teal (tinted by cell type), activated/toxic = coral,
// blocked/absent = dashed gray, IL-1α amber, TNF violet, C1q chartreuse.
// Two palettes, same semantics. Light colours are darkened / saturated for white:
// glyphs and cell rims ≥ 3:1 against #fff, text ≥ 4.5:1.
const PALETTES = {
  dark: {
    tp: {
      astro:  { rim: [104, 222, 204], body: [22, 100, 97],  fil: [186, 255, 240], nuc: [9, 44, 47] },
      micro:  { rim: [126, 228, 176], body: [24, 100, 78],  fil: [190, 255, 222], nuc: [9, 46, 37] },
      neuron: { rim: [108, 198, 234], body: [20, 80, 108],  fil: [182, 232, 255], nuc: [9, 38, 56] },
      oligo:  { rim: [144, 166, 236], body: [36, 56, 112],  fil: [205, 215, 255], nuc: [17, 25, 58] },
      endo:   { rim: [166, 180, 196], body: [50, 60, 74],   fil: [210, 220, 232], nuc: [25, 31, 41] },
    },
    coral: { rim: [255, 144, 120], body: [124, 46, 40], fil: [255, 208, 192], nuc: [56, 19, 17] },
    grayp: { rim: [116, 124, 134], body: [36, 40, 46], fil: [150, 158, 168], nuc: [22, 24, 28] },
    pc: { il1: [246, 186, 68], tnf: [166, 134, 255], c1q: [186, 228, 90], other: [116, 124, 134], lps: [232, 226, 204], ab: [226, 234, 244], tox: [255, 136, 110], gray: [124, 132, 142] },
    col: { text: [224, 232, 238], dim: [128, 142, 154], teal: [104, 222, 204], coral: [255, 144, 120], bg: [0, 0, 0], ink: [236, 242, 246], foot: [112, 126, 138], legend: [190, 202, 212] },
    ui: {
      cellMix: .32, dish: [15, 24, 31], dishHi: .045, dishLo: .3, plate: [17, 27, 35], serum: [34, 29, 20], shadow: [0, 0, 0], shadowK: 1,
      rim: [196, 214, 228], rimA: 1, glassA: .08, glare: 1, lumen: [9, 13, 18], drop: [226, 236, 242], serumDrop: [226, 206, 150], punct: [226, 250, 255],
      casp: [255, 184, 80], caspText: [255, 190, 110], midSurv: [230, 200, 170], pill: [7, 11, 15], pillA: .72, bracket: [170, 182, 194],
      heat0: [28, 34, 42], heatNeg: [46, 150, 168], heatPos: [255, 122, 96], row: [196, 206, 214], rowA1: [236, 210, 200], gene: [176, 188, 198],
      grpPan: [196, 206, 214], grpA2: [110, 132, 162], aqpDot: [238, 244, 255], small: [170, 205, 230], filtrate: [120, 160, 190], liqMix: 0,
      gridPos: [170, 235, 222], grid: [200, 214, 228], gridA: 1, neuropil: [120, 190, 200],
    },
  },
  light: {
    tp: {
      astro:  { rim: [0, 128, 116],  body: [208, 240, 234], fil: [0, 104, 94],   nuc: [112, 176, 166] },
      micro:  { rim: [16, 128, 80],  body: [210, 240, 222], fil: [10, 100, 62],  nuc: [116, 178, 140] },
      neuron: { rim: [0, 108, 160],  body: [206, 232, 246], fil: [0, 86, 130],   nuc: [110, 160, 196] },
      oligo:  { rim: [72, 88, 184],  body: [222, 226, 248], fil: [56, 70, 160],  nuc: [150, 160, 214] },
      endo:   { rim: [100, 112, 126], body: [226, 230, 236], fil: [90, 100, 114], nuc: [160, 168, 180] },
    },
    coral: { rim: [204, 66, 44], body: [252, 220, 212], fil: [176, 50, 30], nuc: [226, 140, 122] },
    grayp: { rim: [118, 126, 136], body: [234, 236, 239], fil: [128, 136, 146], nuc: [184, 190, 198] },
    pc: { il1: [184, 118, 0], tnf: [110, 76, 214], c1q: [96, 136, 0], other: [124, 132, 142], lps: [128, 104, 56], ab: [62, 76, 96], tox: [206, 66, 42], gray: [140, 148, 158] },
    col: { text: [22, 30, 38], dim: [86, 98, 110], teal: [0, 120, 108], coral: [190, 58, 36], bg: [255, 255, 255], ink: [20, 28, 36], foot: [104, 116, 128], legend: [62, 74, 86] },
    ui: {
      cellMix: .1, dish: [234, 239, 243], dishHi: .55, dishLo: .035, plate: [230, 236, 241], serum: [247, 236, 210], shadow: [30, 50, 70], shadowK: .22,
      rim: [104, 124, 140], rimA: 1.8, glassA: .14, glare: 0, lumen: [238, 242, 246], drop: [70, 130, 180], serumDrop: [196, 146, 40], punct: [0, 96, 128],
      casp: [240, 150, 30], caspText: [176, 100, 0], midSurv: [168, 100, 30], pill: [255, 255, 255], pillA: .88, bracket: [86, 98, 110],
      heat0: [238, 241, 244], heatNeg: [40, 130, 150], heatPos: [214, 72, 48], row: [52, 62, 72], rowA1: [170, 56, 34], gene: [76, 88, 100],
      grpPan: [44, 52, 60], grpA2: [76, 100, 138], aqpDot: [24, 60, 150], small: [50, 100, 150], filtrate: [90, 140, 180], liqMix: .55,
      gridPos: [0, 120, 108], grid: [70, 90, 108], gridA: 1.6, neuropil: [40, 110, 120],
    },
  },
};

// THEME is a runtime setting toggled from the viewer UI (mode 'light' | 'dark'). light = the
// palette the frame being drawn uses; app.js sets it per frame.
const THEME = { mode: 'light', light: true };
function setThemeMode(mode) { THEME.mode = mode === 'dark' ? 'dark' : 'light'; }
const PAL = () => THEME.light ? PALETTES.light : PALETTES.dark;
const themed = key => new Proxy({}, { get: (_, p) => PAL()[key][p] });
// these read the active palette on every access, so cells/glyphs follow the theme per frame
const TP = themed('tp'), CORAL = themed('coral'), GRAYP = themed('grayp'), PC = themed('pc'), COL = themed('col'), UI = themed('ui');
const palMix = (p, q, t) => ({ rim: mix(p.rim, q.rim, t), body: mix(p.body, q.body, t), fil: mix(p.fil, q.fil, t), nuc: mix(p.nuc, q.nuc, t) });
const fg = (a = 1) => rgb(PAL().col.ink, a);                       // foreground strokes/fills (near-white on dark, near-black on light)
const shade = (a = 1) => rgb(UI.shadow, a * UI.shadowK);            // drop shadows
const liqC = c => mix(c, [255, 255, 255], UI.liqMix);               // medium colour in tubes / tips
// Avenir Next (macOS) to match the slides: Medium 500 for body text, Demi Bold 600 / Bold 700 for headings.
const FONT = '"Avenir Next","Avenir","Helvetica Neue",Helvetica,Arial,sans-serif';

// Text drawing. o.halo adds a soft outline so text stays readable over cells.
function txt(s, x, y, o = {}) {
  const a = o.a ?? 1; if (a <= 0.004 || !s) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.font = `${o.it ? 'italic ' : ''}${o.w || 500} ${o.size || 20}px ${FONT}`;
  ctx.fillStyle = rgb(o.col || COL.text);
  ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'alphabetic';
  if ('letterSpacing' in ctx) ctx.letterSpacing = (o.ls || 0) + 'px';
  if (o.rot) { ctx.translate(x, y); ctx.rotate(o.rot); x = 0; y = 0; }
  if (o.halo) { ctx.lineJoin = 'round'; ctx.strokeStyle = rgb(COL.bg, .85); ctx.lineWidth = o.halo; ctx.strokeText(s, x, y); }
  ctx.fillText(s, x, y);
  ctx.restore();
}
// Slide heading: left-aligned title + optional sub-line. Copy lives on each STEPS entry (app.js).
// Hidden in video renders (?render=1): the titles are set on the slide itself.
const TITLE_X = 80, TITLE_Y = 92;
function caption(s, a) { if (!s || RENDER_MODE) return; txt(s, TITLE_X, TITLE_Y, { a, size: 36, w: 600, col: COL.text, halo: 8 }); }
function subcap(s, a) { if (!s || RENDER_MODE) return; txt(s, TITLE_X, TITLE_Y + 38, { a, size: 21, w: 500, col: COL.dim, halo: 6 }); }

/* ===== js/core/arbor.js ===== */
// Cell process (branch) geometry. Each process is a Br, recomputed every frame
// so processes can wave, grow out and retract smoothly.
class Br {
  constructor(o) {
    this.ang = 0; this.len = 10; this.w0 = 2; this.w1 = 1; this.curv = 0; this.ph = 0; this.freq = .6; this.amp = .1;
    this.at = 1; this.rA = 2; this.rB = 3; this.mEnd = 1; this.sA = 0; this.sB = .01; this.kink = 0; this.kf = 6;
    this.dyn = 0; this.dynF = .3; this.kind = 'd'; this.kids = [];
    Object.assign(this, o);
  }
  ext(P) {
    let m = lerp(1, this.mEnd, sstep(seg(P.r, this.rA, this.rB)));
    if (P.sprout < 1) m *= sstep(seg(P.sprout, this.sA, this.sB));
    if (this.dyn) m *= 1 + this.dyn * Math.sin(P.t * this.dynF + this.ph);
    return m;
  }
}
function evalBr(b, x, y, dir, P, out, parentM) {
  let m = b.ext(P);
  if (parentM !== undefined) m *= sstep((parentM - b.at) / .12);
  const L = b.len * m * P.lenK;
  if (L < .7) return;
  const n = Math.max(3, Math.min(b.kind === 'ax' ? 44 : 16, Math.ceil(L / 6)));
  const pts = new Array((n + 1) * 2), ws = new Array(n + 1), angs = new Array(n + 1);
  let px = x, py = y; const ds = L / n, a0 = dir + b.ang, wk = P.waveK;
  for (let i = 0; i <= n; i++) {
    const sf = (i / n) * m;
    const ang = a0 + b.curv * sf + wk * b.amp * Math.sin(P.t * b.freq + b.ph - sf * 3) * sf + b.kink * Math.sin(sf * b.kf + b.ph * 1.7);
    if (i > 0) { px += Math.cos(ang) * ds; py += Math.sin(ang) * ds; }
    pts[i * 2] = px; pts[i * 2 + 1] = py; angs[i] = ang;
    let w = lerp(b.w0, b.w1, sf);
    if (b.wf) w = b.wf(sf, w, P);
    if (P.bead > 0 && (b.kind === 'd' || b.kind === 'ax')) w *= 1 + P.bead * (1.1 * Math.max(0, Math.sin(sf * b.len * .5 + b.ph)) - .4);
    ws[i] = w;
  }
  out.push({ pts, ws, b, n, m });
  for (const k of b.kids) {
    let idx;
    if (k.at >= 1) idx = n; else { if (k.at > m) continue; idx = Math.round(k.at / m * n); }
    evalBr(k, pts[idx * 2], pts[idx * 2 + 1], angs[idx], P, out, k.at < 1 ? m : undefined);
  }
}
function smoothTo(c, xs, ys, rev) {
  const n = xs.length - 1;
  if (!rev) { for (let i = 1; i < n; i++) c.quadraticCurveTo(xs[i], ys[i], (xs[i] + xs[i + 1]) / 2, (ys[i] + ys[i + 1]) / 2); c.lineTo(xs[n], ys[n]); }
  else { c.lineTo(xs[n], ys[n]); for (let i = n - 1; i > 0; i--) c.quadraticCurveTo(xs[i], ys[i], (xs[i] + xs[i - 1]) / 2, (ys[i] + ys[i - 1]) / 2); c.lineTo(xs[0], ys[0]); }
}
// Tapered, round-capped membrane outline for one process (consistent winding → clean unions)
function addStrand(c, s, ex) {
  const p = s.pts, w = s.ws, n = s.n;
  const lx = [], ly = [], rx = [], ry = [];
  let nx0 = 0, ny0 = 0, nxn = 0, nyn = 0;
  for (let i = 0; i <= n; i++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(n, i + 1);
    let dx = p[i1 * 2] - p[i0 * 2], dy = p[i1 * 2 + 1] - p[i0 * 2 + 1];
    const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const hw = w[i] * .5 + ex, nx = -dy, ny = dx;
    lx.push(p[i * 2] + nx * hw); ly.push(p[i * 2 + 1] + ny * hw);
    rx.push(p[i * 2] - nx * hw); ry.push(p[i * 2 + 1] - ny * hw);
    if (i === 0) { nx0 = nx; ny0 = ny; } if (i === n) { nxn = nx; nyn = ny; }
  }
  c.moveTo(lx[0], ly[0]); smoothTo(c, lx, ly, false);
  const an = Math.atan2(nyn, nxn); c.arc(p[n * 2], p[n * 2 + 1], w[n] * .5 + ex, an, an - Math.PI, true);
  smoothTo(c, rx, ry, true);
  const a0 = Math.atan2(ny0, nx0); c.arc(p[0], p[1], w[0] * .5 + ex, a0 + Math.PI, a0, true);
  c.lineTo(lx[0], ly[0]);
}
// Apoptotic fragmentation of neurites
function addFrag(c, s, ex, frag) {
  const n = s.n, p = s.pts, w = s.ws, ch = 3;
  for (let i = 0; i < n; i += ch) {
    const j = Math.min(n, i + ch); if (j - i < 1) break;
    if (hash(s.b.id * 3.17 + i * 1.91) < frag * .5) continue;
    const cx = (p[i * 2] + p[j * 2]) / 2, cy = (p[i * 2 + 1] + p[j * 2 + 1]) / 2, k = 1 - .55 * frag;
    const pts = [], ws = [];
    for (let q = i; q <= j; q++) { pts.push(cx + (p[q * 2] - cx) * k, cy + (p[q * 2 + 1] - cy) * k); ws.push(w[q]); }
    addStrand(c, { pts, ws, n: j - i }, ex);
  }
}
const SOMA_N = 52, SOMA_C = [], SOMA_S = [];
for (let i = 0; i <= SOMA_N; i++) { SOMA_C.push(Math.cos(-i / SOMA_N * TAU)); SOMA_S.push(Math.sin(-i / SOMA_N * TAU)); }
function addSoma(c, R0, fn, el, ex) {
  const N = SOMA_N;
  if (typeof fn === 'function') { const v = new Float32Array(N + 1); for (let i = 0; i <= N; i++) v[i] = fn(-i / N * TAU); fn = v; }
  for (let i = 0; i <= N; i++) {
    const r = R0 * fn[i] + ex;
    const x = SOMA_C[i] * r * el, y = SOMA_S[i] * r;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.closePath();
}

/* ===== js/core/builders.js ===== */
// Builds the process layout for each cell type (astrocyte, microglia, neuron).
function addTw(b, R, n, sk) {
  for (let j = 0; j < n; j++) {
    const rA = R() * .12;
    b.kids.push(new Br({ at: .22 + R() * .6, ang: (R() < .5 ? -1 : 1) * (.7 + R() * .6), len: (5 + R() * 9) * sk, w0: 1.6, w1: .55, curv: (R() - .5) * 1.4, ph: R() * TAU, freq: .8, amp: .3, kind: 't', rA, rB: rA + .25, mEnd: 0, sA: .6, sB: 1 }));
  }
}
// Astrocyte: 6 primaries (Ext. Data Fig. 5: ~5.5), 4 bifurcate → 10 terminals.
// A1: 4 primaries retract fully, 2 survivors shorten, keep their fork → 2 primaries / 4 terminals.
function buildAstro(R, o) {
  const tissue = !!o.tissue, n = tissue ? 8 : 6, prims = [], base = o.base ?? R() * TAU, L = o.len || 40, W0 = o.w0 || (tissue ? 6.4 : 7.4);
  const surv = [0, 3], bif = tissue ? [0, 1, 2, 3, 4, 5, 6, 7] : [0, 1, 3, 4], order = tissue ? [1, 4, 2, 5, 6, 7] : [1, 4, 2, 5];
  let efIdx = -1;
  if (o.endfoot) { let best = 9; for (let i = 0; i < n; i++) { const d = Math.abs(angd(base + i * TAU / n, o.efAng)); if (d < best && !surv.includes(i)) { best = d; efIdx = i; } } }
  for (let i = 0; i < n; i++) {
    const ang = base + i * TAU / n + (R() - .5) * .5;
    const S = surv.includes(i), B = bif.includes(i);
    const len = L * (.8 + R() * .45) * (tissue ? .82 : 1), w0 = W0 * (.85 + R() * .3);
    const b = new Br({ ang, len, w0, w1: B ? w0 * .46 : 1.0, curv: (R() - .5) * .7, ph: R() * TAU, freq: .45 + R() * .35, amp: .16, kind: 'p', sA: 0, sB: .4 + R() * .12 });
    if (S) { b.rA = .3; b.rB = .95; b.mEnd = .66; } else { const k = Math.max(0, order.indexOf(i)); b.rA = .04 + k * (tissue ? .08 : .11); b.rB = b.rA + .4; b.mEnd = 0; }
    if (i === efIdx) {           // perivascular endfoot
      b.ang = o.efAng; b.len = o.efLen; b.curv = 0; b.amp = .03; b.w1 = 2.6; b.endfoot = true; b.kink = .05; b.kf = 4;
      b.wf = (sf, w) => sf > .9 ? w + Math.pow((sf - .9) / .1, 1.5) * 3 : w;
      for (const sg of [-1, 1]) b.kids.push(new Br({ at: 1, ang: sg * (1.45 + R() * .15), len: 11 + R() * 7, w0: 5, w1: 3.2, curv: -sg * .3, amp: 0, kind: 'k', rA: b.rA, rB: b.rB, mEnd: 0, sA: .8, sB: 1 }));
      addTw(b, R, 2, 1); prims.push(b); continue;
    }
    if (B) for (const sg of [-1, 1]) {
      const k = new Br({ ang: sg * (.3 + R() * .32), len: len * (.55 + R() * .3), w0: b.w1, w1: .85, curv: sg * R() * .5, ph: R() * TAU, freq: .55 + R() * .4, amp: .22, kind: 'k', sA: .38, sB: .82 + R() * .12 });
      if (S) { k.rA = .2; k.rB = .9; k.mEnd = .72; } else { k.rA = Math.max(0, b.rA - .04); k.rB = b.rA + .2; k.mEnd = 0; }
      if (tissue) addTw(k, R, 3, .9);
      b.kids.push(k);
    }
    addTw(b, R, tissue ? 4 : 3, 1);
    prims.push(b);
  }
  return prims;
}
// Microglia: small soma, fine highly ramified tortuous processes; amoeboid on activation.
function buildMicro(R, o) {
  const n = 4 + (R() < .55 ? 1 : 0), prims = [], base = R() * TAU, L = o.len || 16;
  const rec = (p, depth) => {
    if (depth > 3) return;
    const nk = depth < 3 ? 2 : (R() < .55 ? 2 : 1);
    for (let k = 0; k < nk; k++) {
      const sg = (k === 0 ? 1 : -1) * (R() < .5 ? 1 : -1);
      const c = new Br({ at: k === 0 ? 1 : .35 + R() * .4, ang: sg * (.3 + R() * .55), len: p.len * (.6 + R() * .25), w0: Math.max(.6, p.w1 * .95), w1: Math.max(.5, p.w1 * .6), curv: (R() - .5), kink: .15 + R() * .2, kf: 5 + R() * 7, ph: R() * TAU, freq: .35 + R() * .35, amp: .3, kind: 'k', dyn: .08, dynF: .25 + R() * .4, rA: Math.max(0, p.rA - .12 - R() * .05), rB: p.rA + .18, mEnd: 0, sA: .25 + depth * .15, sB: .55 + depth * .14 });
      p.kids.push(c); rec(c, depth + 1);
    }
  };
  for (let i = 0; i < n; i++) {
    const b = new Br({ ang: base + i * TAU / n + (R() - .5) * .9, len: L * (.8 + R() * .5), w0: 2.8, w1: 1.5, curv: (R() - .5) * .8, kink: .15 + R() * .12, kf: 4 + R() * 5, ph: R() * TAU, freq: .3 + R() * .3, amp: .2, kind: 'p', dyn: .05, dynF: .2 + R() * .3, rA: .25 + R() * .15, rB: .75 + R() * .2, mEnd: .3, sA: 0, sB: .35, wf: (sf, w, P) => w * (1 + 1.7 * P.r * (1 - sf * .6)) });
    rec(b, 1); prims.push(b);
  }
  return prims;
}
function addP(b, R) { b.puncta = []; const n = 2 + Math.floor(R() * 3); for (let i = 0; i < n; i++) b.puncta.push({ f: .2 + R() * .75, side: R() < .5 ? -1 : 1, tau: .02 + R() * .26 }); }
// Neuron: RGC (multipolar, long axon + growth cone) or cortical pyramidal (o.pyr).
function buildNeuron(R, o) {
  const prims = [], axA = o.axAng ?? R() * TAU, nd = 5, simple = !!o.simple;
  const addD = (p, depth) => {
    if (depth > (simple ? 1 : 2)) return;
    for (const sg of [-1, 1]) {
      const c = new Br({ at: 1, ang: sg * (.28 + R() * .35), len: p.len * (.7 + R() * .2), w0: p.w1, w1: Math.max(.7, p.w1 * .6), curv: sg * (R() - .3) * .5, ph: R() * TAU, freq: .25, amp: .05, kind: 'd', sA: .3 + depth * .2, sB: .65 + depth * .15 });
      addP(c, R); p.kids.push(c); addD(c, depth + 1);
    }
  };
  const basal = [-1.3, -.5, .5, 1.3];
  for (let i = 0; i < nd; i++) {
    let ang, len = (o.len || 22) * (.8 + R() * .4), w0 = 4.2;
    if (o.pyr) { if (i === 0) { ang = axA + Math.PI; len *= 2.6; w0 = 5.8; } else ang = axA + basal[i - 1] + (R() - .5) * .3; }
    else ang = axA + Math.PI + (i - (nd - 1) / 2) * (TAU * .74 / nd) + (R() - .5) * .35;
    const b = new Br({ ang, len, w0, w1: w0 * .55, curv: (R() - .5) * .5, ph: R() * TAU, freq: .25, amp: .05, kind: 'd', sA: 0, sB: .35 });
    if (o.pyr && i === 0) addTw(b, R, 3, 1.4);
    addP(b, R); addD(b, 1); prims.push(b);
  }
  const axLen = o.axLen || 170;
  const ax = new Br({ ang: axA, len: axLen, w0: 3.6, w1: 1.3, curv: (R() - .5) * .7, kink: .05, kf: 3, ph: R() * TAU, freq: .15, amp: .03, kind: 'ax', sA: .15, sB: 1, wf: (sf, w) => sf < .06 ? lerp(3.6, 1.35, sf / .06) : 1.35 });
  if (!o.pyr) for (let k = 0; k < 5; k++) ax.kids.push(new Br({ at: 1, ang: (k - 2) * .38, len: 5 + R() * 5, w0: 1.2, w1: .4, curv: (R() - .5), ph: R() * TAU, freq: 1.2, amp: .4, kind: 'gc', sA: .85, sB: 1 }));
  prims.push(ax);
  return prims;
}

/* ===== js/core/cell.js ===== */
// Cell: draws one animated cell (soma, processes, and its reactive / dying states).
let CID = 0;
class Cell {
  constructor(type, x, y, seed, sc = 1, o = {}) {
    this.type = type; this.x = x; this.y = y; this.sc = sc; this.o = o; this.id = ++CID;
    const R = rng(seed * 7919 + 13);
    this.ph = R() * TAU; this.drift = o.drift ?? 7;
    this.harm = [0, 1, 2].map(() => ({ k: 2 + Math.floor(R() * 3), a: .03 + R() * .05, p: R() * TAU, f: .2 + R() * .3 }));
    if (type === 'astro') { this.R0 = o.R0 || 13; this.prims = buildAstro(R, o); }
    else if (type === 'micro') { this.R0 = o.R0 || 6.2; this.prims = buildMicro(R, o); this.elong = 1.35; }
    else if (type === 'neuron') { this.R0 = o.R0 || (o.pyr ? 11.5 : 11); this.prims = buildNeuron(R, o); this.apA = (o.axAng ?? 0) + Math.PI; }
    else if (type === 'oligo') { this.R0 = 8.5; this.buildOligo(R, o); }
    this.nuc = [(R() - .5) * this.R0 * .22, (R() - .5) * this.R0 * .22, R() * TAU];
    let id = 0; const tag = b => { b.id = this.id * 1000 + (id++); b.kids.forEach(tag); }; this.prims.forEach(tag);
  }
  buildOligo(R, o) {
    this.prims = []; this.sheaths = [];
    const n = o.nSheath || 4, A = o.axAng ?? R() * Math.PI, ax = [Math.cos(A), Math.sin(A)], nm = [-ax[1], ax[0]];
    const offs = [-54, -24, 26, 56];
    for (let i = 0; i < n; i++) {
      const d = offs[i % 4] + (R() - .5) * 10, along = (R() - .5) * 110;
      const cx = nm[0] * d + ax[0] * along, cy = nm[1] * d + ax[1] * along, len = 44 + R() * 44;
      this.sheaths.push({ cx, cy, A: A + (R() - .5) * .1, len });
      const pa = Math.atan2(cy, cx), pl = Math.hypot(cx, cy) - this.R0 * .45, cv = (R() - .5) * .9;
      this.prims.push(new Br({ ang: pa - cv / 2, len: pl * 1.03, w0: 2.0, w1: 1.1, curv: cv, ph: R() * TAU, freq: .3, amp: .02, kind: 'p', sA: 0, sB: .5 }));
    }
  }
  somaFn(P, ms, r, pyk, d) {
    const t = P.t, h = this.harm, R0 = this.R0, ty = this.type;
    return th => {
      let f = 1;
      for (const q of h) f += q.a * Math.sin(q.k * th + q.p + t * q.f * .5);
      for (const [a, m, w] of ms) { const dd = angd(th, a); f += (w / R0) * .7 * m * Math.exp(-dd * dd / .12); }
      if (ty === 'micro' && r > 0) f += r * (.11 * Math.sin(7 * th + t * 1.3) + .07 * Math.sin(11 * th - t * 1.7));
      if (ty === 'neuron') {
        if (this.o.pyr) { const c = Math.max(0, Math.cos(th - this.apA)); f += .5 * c * c * c; }
        if (pyk > 0) f += pyk * .09 * Math.sin(13 * th + d * 9) + pyk * .06 * Math.sin(19 * th);
      }
      return f;
    };
  }
  draw(c, P) {
    const r = P.r || 0, d = P.d || 0, t = P.t, a = P.a ?? 1;
    if (a <= .004) return;
    const ty = this.type;
    const mot = ty === 'astro' ? 1 - .75 * r : ty === 'micro' ? 1 - .6 * r : 1;   // A1: ~75% less motile
    const dr = this.drift * mot * (1 - d);
    const dx = dr * (Math.sin(t * .11 + this.ph) + .5 * Math.sin(t * .23 + this.ph * 2)), dy = dr * (Math.cos(t * .09 + this.ph * 1.3) + .5 * Math.sin(t * .19 + this.ph));
    c.save(); c.translate(this.x + dx, this.y + dy); c.scale(this.sc, this.sc); c.globalAlpha *= a;
    const bead = sstep(seg(d, .3, .6)), frag = sstep(seg(d, .5, .85)), pyk = sstep(seg(d, .55, .9)), eth = sstep(seg(d, .66, .92));
    const casp = sstep(seg(d, .18, .42)) * (1 - .55 * sstep(seg(d, .8, 1)));
    const Pp = { t, r, sprout: P.sprout ?? 1, lenK: 1 - .22 * frag, waveK: (ty === 'astro' ? 1 - .7 * r : 1) * (1 - d), bead, d };
    const strands = [], ms = [];
    const R0base = this.R0;
    for (const b of this.prims) {
      const sx = Math.cos(b.ang) * R0base * .45, sy = Math.sin(b.ang) * R0base * .45;
      evalBr(b, sx, sy, 0, Pp, strands);
      if (b.kind !== 'ax' && ty !== 'oligo') ms.push([b.ang, b.ext(Pp), b.w0]);
    }
    let pal = this.o.pal || TP[ty];
    const ct = P.colR ?? sstep(seg(r, .05, .6)); if (ct > 0) pal = palMix(pal, CORAL, ct);
    const gt = sstep(seg(d, .5, .95)); if (gt > 0) pal = palMix(pal, GRAYP, gt * .85);
    const spr = P.sprout ?? 1;
    const R0 = R0base * (1 - .3 * pyk) * (ty === 'micro' ? 1 + .8 * r : 1) * (ty === 'astro' ? 1 - .06 * r : 1) * (P.somaK || 1) * (spr < 1 ? lerp(.8, 1, spr) : 1);
    const fn0 = this.somaFn(Pp, ms, r, pyk, d), fn = new Float32Array(SOMA_N + 1);
    for (let i = 0; i <= SOMA_N; i++) fn[i] = fn0(-i / SOMA_N * TAU);
    const rimW = Math.min(2.4, 1.4 / this.sc);
    const el = ty === 'micro' ? lerp(this.elong, 1.05, r) : 1;
    const body = ex => {
      c.beginPath(); addSoma(c, R0, fn, el, ex);
      for (const s of strands) { if (frag > 0 && s.b.kind !== 'p' || frag > 0 && ty === 'neuron') addFrag(c, s, ex, frag); else addStrand(c, s, ex); }
      if (this.sheaths && spr > .05) for (const sh of this.sheaths) {      // myelin sheaths retract with the processes
        const L = sh.len * spr, hx = Math.cos(sh.A) * L / 2, hy = Math.sin(sh.A) * L / 2;
        addStrand(c, { pts: [sh.cx - hx, sh.cy - hy, sh.cx + hx, sh.cy + hy], ws: [5.6, 5.6], n: 1 }, ex);
      }
    };
    if (P.dashed) {
      body(0); c.setLineDash([4 / this.sc, 4 / this.sc]); c.lineWidth = 1.3 / this.sc; c.strokeStyle = rgb(GRAYP.rim, .8); c.stroke(); c.restore(); return;
    }
    body(rimW); c.fillStyle = rgb(pal.rim); c.fill();
    body(0);
    const g = c.createRadialGradient(0, 0, R0 * .2, 0, 0, R0 * 5.5);
    g.addColorStop(0, rgb(mix(pal.body, pal.rim, UI.cellMix))); g.addColorStop(1, rgb(pal.body));
    c.fillStyle = g; c.fill();

    c.lineCap = 'round'; c.lineJoin = 'round';
    if (ty === 'astro') {
      // GFAP cytoskeleton: brightens ~3x as the cell becomes reactive (Fig. 1g)
      const ga = Math.min(1, .2 * (1 + 2 * r)) * (P.gK ?? 1);
      c.strokeStyle = rgb(pal.fil, ga);
      for (const s of strands) {
        if (s.b.kind === 't') continue;
        const p = s.pts, n = s.n;
        c.lineWidth = Math.max(.45, (s.ws[0] + s.ws[n]) * .15 * (1 + .5 * r));
        c.beginPath(); c.moveTo(p[0], p[1]);
        for (let i = 1; i < n; i++) c.quadraticCurveTo(p[i * 2], p[i * 2 + 1], (p[i * 2] + p[i * 2 + 2]) / 2, (p[i * 2 + 1] + p[i * 2 + 3]) / 2);
        c.lineTo(p[n * 2], p[n * 2 + 1]); c.stroke();
      }
      c.lineWidth = .75 * (1 + .5 * r);
      for (const s of strands) if (s.b.kind === 'p') {
        const p = s.pts, a0 = Math.atan2(p[1], p[0]);
        c.beginPath(); c.moveTo(Math.cos(a0 + 1) * R0 * .5, Math.sin(a0 + 1) * R0 * .5);
        c.quadraticCurveTo(Math.cos(a0) * R0 * .75, Math.sin(a0) * R0 * .75, p[0], p[1]); c.stroke();
      }
      this.nucleus(c, R0, pal, .5, .4, 0);
    } else if (ty === 'micro') {
      c.save(); c.scale(el, 1); this.nucleus(c, R0, pal, .62, .4, 0); c.restore();
      if (r > .2) { c.fillStyle = rgb(pal.fil, .5 * r); for (let k = 0; k < 7; k++) { const an = k * 2.4 + this.ph, rr = R0 * (.55 + .25 * hash(k + this.id)); c.beginPath(); c.arc(Math.cos(an) * rr * el, Math.sin(an) * rr, .9, 0, TAU); c.fill(); } }
    } else if (ty === 'neuron') {
      // synapse puncta (wink out first)
      if (!P.noPuncta) for (const s of strands) {
        const b = s.b; if (!b.puncta) continue;
        for (const q of b.puncta) {
          if (q.f > s.m) continue;
          const pa = 1 - sstep(seg(d, q.tau, q.tau + .035)); if (pa <= 0) continue;
          const fl = Math.exp(-Math.pow((d - q.tau) / .02, 2)) * (d > 0 ? 1 : 0);
          const fi = q.f / s.m * s.n, i0 = Math.min(s.n - 1, Math.floor(fi)), u = fi - i0, p = s.pts;
          const x = lerp(p[i0 * 2], p[i0 * 2 + 2], u), y = lerp(p[i0 * 2 + 1], p[i0 * 2 + 3], u);
          const dx2 = p[i0 * 2 + 2] - p[i0 * 2], dy2 = p[i0 * 2 + 3] - p[i0 * 2 + 1], dl = Math.hypot(dx2, dy2) || 1;
          const off = s.ws[i0] * .5 + 1.2;
          const px = x - dy2 / dl * off * q.side, py = y + dx2 / dl * off * q.side;
          c.fillStyle = rgb(UI.punct, .9 * pa * a); c.beginPath(); c.arc(px, py, (1.5 + 1.6 * fl) / Math.sqrt(this.sc), 0, TAU); c.fill();
        }
      }
      if (casp > 0) {     // caspase-2/3 activation
        const cg = c.createRadialGradient(0, 0, 0, 0, 0, R0 * 1.25);
        const pul = .85 + .15 * Math.sin(t * 3);
        cg.addColorStop(0, rgb(UI.casp, .8 * casp * pul)); cg.addColorStop(1, rgb(UI.casp, 0));
        c.fillStyle = cg; c.beginPath(); c.arc(0, 0, R0 * 1.25, 0, TAU); c.fill();
      }
      this.nucleus(c, R0, pal, .52, .48, eth);
    } else {
      if (this.sheaths && spr > .05) { c.strokeStyle = rgb(pal.fil, .35); c.lineWidth = .8; for (const sh of this.sheaths) { const hx = Math.cos(sh.A) * Math.max(0, sh.len * spr / 2 - 3), hy = Math.sin(sh.A) * Math.max(0, sh.len * spr / 2 - 3); c.beginPath(); c.moveTo(sh.cx - hx, sh.cy - hy); c.lineTo(sh.cx + hx, sh.cy + hy); c.stroke(); } }
      this.nucleus(c, R0, pal, .5, .45, 0);
    }
    c.restore();
  }
  nucleus(c, R0, pal, rx, ry, eth) {
    const [ox, oy, rot] = this.nuc;
    const k = 1 - .38 * eth;
    c.beginPath(); c.ellipse(ox * (1 - eth), oy * (1 - eth), R0 * rx * k, R0 * ry * k, rot, 0, TAU);
    if (eth > 0) {
      c.fillStyle = rgb(mix(pal.nuc, [238, 44, 66], eth)); c.fill();
      c.strokeStyle = rgb([255, 90, 100], .35 * eth); c.lineWidth = 2.2; c.stroke();
    } else {
      c.fillStyle = rgb(pal.nuc, .92); c.fill();
      c.strokeStyle = rgb(pal.rim, .22); c.lineWidth = .7; c.stroke();
      if (this.type === 'neuron') { c.fillStyle = rgb(pal.fil, .55); c.beginPath(); c.arc(ox + R0 * .12, oy - R0 * .08, R0 * .1, 0, TAU); c.fill(); }
    }
  }
}

/* ===== js/core/round.js ===== */
// Round cells after dissociation, before they are plated.
const RND = { astro: { R: 9.5, stubs: 4, sw: .24, sa: .32 }, micro: { R: 6.2, stubs: 6, sw: .16, sa: .5 }, oligo: { R: 7.6, stubs: 3, sw: .18, sa: .3 }, neuron: { R: 8.6, stubs: 1, sw: .14, sa: 1.1 }, endo: { R: 8.5, stubs: 0 } };
class Round {
  constructor(type, seed) {
    const R = rng(seed); this.type = type; const P = RND[type];
    this.R0 = P.R * (.9 + R() * .2); this.st = [];
    for (let i = 0; i < P.stubs; i++) this.st.push({ a: R() * TAU, w: P.sw * (.7 + R() * .6), h: P.sa * (.7 + R() * .6) });
    this.h = [0, 1].map(() => ({ k: 2 + ((R() * 3) | 0), a: .05 + R() * .05, p: R() * TAU }));
    this.rot = R() * TAU; this.no = [(R() - .5) * .3, (R() - .5) * .3];
  }
  draw(c, x, y, t, o = {}) {
    const a = o.a ?? 1; if (a <= .004) return;
    const pal = TP[this.type], b = o.b || 0, R0 = this.R0 * (o.s || 1) * (1 + .1 * b);
    c.save(); c.translate(x, y); c.rotate(this.rot + t * .04 * (1 - b)); c.globalAlpha *= a;
    if (this.type === 'endo') c.scale(1.6, .62);
    const fn = th => { let f = 1; for (const q of this.h) f += q.a * Math.sin(q.k * th + q.p + t * .6); for (const s of this.st) { const d = angd(th, s.a); f += s.h * Math.exp(-d * d / (s.w * s.w)); } return f; };
    c.beginPath(); addSoma(c, R0, fn, 1, 1.4); c.fillStyle = rgb(pal.rim); c.fill();
    c.beginPath(); addSoma(c, R0, fn, 1, 0);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, R0 * 1.3); g.addColorStop(0, rgb(mix(pal.body, pal.rim, UI.cellMix + .03))); g.addColorStop(1, rgb(pal.body)); c.fillStyle = g; c.fill();
    c.beginPath(); c.ellipse(this.no[0] * R0, this.no[1] * R0, R0 * .5, R0 * .42, 0, 0, TAU); c.fillStyle = rgb(pal.nuc, .9); c.fill();
    if (b > 0) { c.setLineDash([2, 2.5]); c.strokeStyle = rgb(pal.rim, .55 * b); c.lineWidth = 1; c.beginPath(); c.arc(0, 0, R0 * 1.45, 0, TAU); c.stroke(); }
    c.restore();
  }
}

/* ===== js/core/glyphs.js ===== */
// Drawings of the molecules: IL-1α, TNF, C1q, LPS, antibodies.
function gIL1(c, s, a, col = PC.il1) {       // IL-1α: β-trefoil fold
  c.fillStyle = rgb(col, a); c.beginPath();
  for (let k = 0; k < 3; k++) { const an = k * TAU / 3 - Math.PI / 2, x = Math.cos(an) * s * .28, y = Math.sin(an) * s * .28; c.moveTo(x + s * .36, y); c.arc(x, y, s * .36, 0, TAU); }
  c.fill(); c.strokeStyle = rgb(mix(col, [0, 0, 0], .55), a * .7); c.lineWidth = .8; c.stroke();
}
function gTNF(c, s, a, col = PC.tnf) {       // TNF: homotrimer
  for (let k = 0; k < 3; k++) {
    const an = k * TAU / 3 - Math.PI / 2; c.save(); c.rotate(an); c.translate(s * .25, 0);
    c.beginPath(); c.ellipse(0, 0, s * .4, s * .23, 0, 0, TAU); c.fillStyle = rgb(col, a); c.fill();
    c.strokeStyle = rgb(mix(col, [0, 0, 0], .55), a * .7); c.lineWidth = .8; c.stroke(); c.restore();
  }
}
function gC1q(c, s, a, col = PC.c1q) {       // C1q: "bouquet of tulips", collagen stalk + 6 globular heads
  c.strokeStyle = rgb(col, a); c.fillStyle = rgb(col, a); c.lineCap = 'round';
  c.lineWidth = s * .15; c.beginPath(); c.moveTo(0, s * .55); c.lineTo(0, s * .05); c.stroke();
  c.lineWidth = s * .07;
  const heads = [];
  for (let k = 0; k < 6; k++) {
    const an = -Math.PI / 2 + (k - 2.5) * .34, hx = Math.cos(an) * s * .62, hy = s * .05 + Math.sin(an) * s * .62;
    c.beginPath(); c.moveTo(0, s * .05); c.quadraticCurveTo(Math.cos(an) * s * .22, s * .05 + Math.sin(an) * s * .32, hx, hy); c.stroke(); heads.push([hx, hy]);
  }
  for (const [hx, hy] of heads) { c.beginPath(); c.arc(hx, hy, s * .14, 0, TAU); c.fill(); }
}
function gLPS(c, s, a) {                     // LPS: lipid A (acyl chains) + core + O-antigen chain
  const col = rgb(PC.lps, a); c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round';
  c.beginPath(); c.arc(-s * .12, s * .2, s * .11, 0, TAU); c.arc(s * .12, s * .2, s * .11, 0, TAU); c.fill();
  c.lineWidth = s * .05;
  for (let k = 0; k < 4; k++) { const x = -s * .2 + k * s * .133; c.beginPath(); c.moveTo(x, s * .3); c.lineTo(x + (k % 2 ? 1 : -1) * s * .03, s * .62); c.stroke(); }
  let x = 0, y = s * .1;
  for (let k = 0; k < 5; k++) { const nx = x + Math.sin(k * .9) * s * .1, ny = y - s * .16; c.lineWidth = s * .04; c.beginPath(); c.moveTo(x, y); c.lineTo(nx, ny); c.stroke(); c.beginPath(); c.arc(nx, ny, s * .072, 0, TAU); c.fill(); x = nx; y = ny; }
}
function gAb(c, s, a, col = PC.ab) {         // IgG: Fc stem + 2 Fab arms (heavy) + light chains
  c.lineCap = 'round';
  const dom = (x0, y0, x1, y1) => { const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, gx = (x1 - x0) * .07, gy = (y1 - y0) * .07; c.beginPath(); c.moveTo(x0, y0); c.lineTo(mx - gx, my - gy); c.moveTo(mx + gx, my + gy); c.lineTo(x1, y1); c.stroke(); };
  c.strokeStyle = rgb(col, a); c.lineWidth = s * .15;
  dom(0, s * .06, 0, s * .6); dom(-s * .05, -s * .02, -s * .4, -s * .45); dom(s * .05, -s * .02, s * .4, -s * .45);
  c.lineWidth = s * .065; c.strokeStyle = rgb(col, a * .7);
  c.beginPath(); c.moveTo(-s * .2, -s * .0); c.lineTo(-s * .53, -s * .38); c.moveTo(s * .2, 0); c.lineTo(s * .53, -s * .38); c.stroke();
}
function gOther(c, s, a) { c.fillStyle = rgb(PC.other, a * .9); c.beginPath(); c.ellipse(0, 0, s * .3, s * .22, 0, 0, TAU); c.fill(); }
function gTox(c, s, a) { c.fillStyle = rgb(PC.tox, a); c.beginPath(); for (let k = 0; k < 6; k++) { const an = k * TAU / 6, r = s * (.28 + .1 * Math.sin(k * 2.3)); k ? c.lineTo(Math.cos(an) * r, Math.sin(an) * r) : c.moveTo(r, 0); } c.closePath(); c.fill(); }
function gBound(c, base, s, a) {             // neutralized cytokine: gray + dashed + IgG attached
  const g = mix(PC[base], PC.gray, .68);            // hue still hints which cytokine was caught
  c.save(); c.translate(0, -s * .18);
  if (base === 'il1') gIL1(c, s * .9, a, g); else if (base === 'tnf') gTNF(c, s * .9, a, g); else gC1q(c, s * 1.15, a, g);
  c.setLineDash([2.2, 2.2]); c.strokeStyle = rgb(PC.gray, a * .6); c.lineWidth = .9; c.beginPath(); c.arc(0, 0, s * .66, 0, TAU); c.stroke(); c.setLineDash([]);
  c.restore();
  const S = s * 1.25; c.save(); c.translate(0, s * .3 + S * .45); gAb(c, S, a); c.restore();   // Fab arms cradle the ligand
}
function glyph(c, type, x, y, s, rot, a) {
  if (a <= .01) return;
  c.save(); c.translate(x, y); c.rotate(rot);
  switch (type) {
    case 'il1': gIL1(c, s, a); break; case 'tnf': gTNF(c, s, a); break; case 'c1q': gC1q(c, s * 1.35, a); break;
    case 'lps': gLPS(c, s * 1.1, a); break; case 'other': gOther(c, s, a); break; case 'tox': gTox(c, s, a); break;
    case 'ab': gAb(c, s * 1.2, a); break;
    case 'il1b': gBound(c, 'il1', s, a); break; case 'tnfb': gBound(c, 'tnf', s, a); break; case 'c1qb': gBound(c, 'c1q', s, a); break;
  }
  c.restore();
}
const GSIZE = { il1: 11, tnf: 12, c1q: 13, other: 9, lps: 12, tox: 11, ab: 13, il1b: 11, tnfb: 12, c1qb: 12 };

/* ===== js/core/fields.js ===== */
// Clouds of drifting molecules (cytokines, LPS, etc.). Positions depend only on time.
class Field {
  constructor(seed, spec, rad) {
    const R = rng(seed); this.ps = []; this.rad = rad;
    for (const [type, n] of spec) for (let i = 0; i < n; i++) {
      const a = R() * TAU, rr = Math.sqrt(R()) * rad;
      this.ps.push({ type, bx: Math.cos(a) * rr, by: Math.sin(a) * rr, p1: R() * TAU, p2: R() * TAU, f1: .25 + R() * .35, f2: .2 + R() * .3, st: R(), rot: R() * TAU, sz: .85 + R() * .3, src: (R() * 1000) | 0, i: this.ps.length });
    }
    for (let i = this.ps.length - 1; i > 0; i--) { const j = (R() * (i + 1)) | 0; [this.ps[i], this.ps[j]] = [this.ps[j], this.ps[i]]; }
  }
  pos(p, t, o = {}) {
    const wa = o.wander ?? 1;
    const wx = (Math.sin(t * p.f1 + p.p1) * 8 + Math.sin(t * p.f2 * 1.9 + p.p2) * 4) * wa, wy = (Math.cos(t * p.f1 * 1.1 + p.p2) * 8 + Math.cos(t * p.f2 * 1.6 + p.p1) * 4) * wa;
    let x = p.bx * (o.sq || 1) + wx, y = p.by * (o.sq || 1) + wy, vis = 1;
    if (o.t0 !== undefined) {
      const age = t - (o.t0 + p.st * (o.stag || 0)); if (age < 0) return null;
      const k = eOut(age / (o.spread || 1.8)); const [ox, oy] = o.origin(p);
      x = lerp(ox, x, k); y = lerp(oy, y, k); vis = clamp(age / .25);
    }
    const rr = Math.hypot(x, y), lim = this.rad + 8; if (rr > lim) { x *= lim / rr; y *= lim / rr; }
    return [x, y, vis];
  }
  draw(c, t, o = {}) {
    const a = o.a ?? 1; if (a <= .005) return;
    for (const p of this.ps) {
      if (o.filter && !o.filter(p)) continue;
      const q = this.pos(p, t, o); if (!q) continue;
      let al = a * q[2] * (o.typeA ? (o.typeA[p.type] ?? 1) : 1);
      glyph(c, p.type, q[0], q[1], GSIZE[p.type] * p.sz * (o.scale || 1), p.rot + t * .25 * (p.f1 - .4), al);
    }
  }
}

/* ===== js/core/hardware.js ===== */
// Lab equipment: dishes, pipettes, tubes, clocks, and the arcs pipettes travel along.
function drawDish(x, y, r, o = {}) {
  const a = o.a ?? 1; if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a;
  if (o.dashed) { ctx.setLineDash([8, 8]); ctx.strokeStyle = rgb(GRAYP.rim, .7); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore(); return; }
  const sh = ctx.createRadialGradient(x, y + 8, r * .92, x, y + 8, r * 1.13);
  sh.addColorStop(0, shade(.55)); sh.addColorStop(1, shade(0));
  ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(x, y + 8, r * 1.13, 0, TAU); ctx.fill();
  const tint = o.tint || UI.dish;
  const g = ctx.createRadialGradient(x - r * .25, y - r * .3, r * .05, x, y, r);
  g.addColorStop(0, rgb(mix(tint, [255, 255, 255], UI.dishHi))); g.addColorStop(1, rgb(mix(tint, [0, 0, 0], UI.dishLo)));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.restore();
}
function drawDishRim(x, y, r, o = {}) {
  const a = o.a ?? 1; if (a <= .004 || o.dashed) return;
  ctx.save(); ctx.globalAlpha *= a;
  const hl = o.hl || 0, hc = o.hlCol || COL.ink, ra = UI.rimA, gl = UI.glare;
  ctx.strokeStyle = rgb(mix(UI.rim, hc, hl), Math.min(1, (.36 + .3 * hl) * ra)); ctx.lineWidth = 2.2 + hl; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = rgb(UI.rim, .13 * ra); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r - 7, 0, TAU); ctx.stroke();
  ctx.strokeStyle = `rgba(255,255,255,${.16 * gl})`; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y, r - 3.5, 3.6, 4.3); ctx.stroke();
  ctx.strokeStyle = `rgba(255,255,255,${.07 * gl})`; ctx.beginPath(); ctx.arc(x, y, r - 3.5, .5, .9); ctx.stroke();
  ctx.restore();
}
function clipCircle(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip(); }

function drawPipette(x, y, fill, liq, dots, a = 1, low = 0) {
  if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a;
  if (low > 0) {            // contact shadow on the dish
    const sg = ctx.createRadialGradient(x + 16, y + 12, 0, x + 16, y + 12, 26);
    sg.addColorStop(0, shade(.45 * low)); sg.addColorStop(1, shade(0));
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(x + 16, y + 12, 26, 0, TAU); ctx.fill();
  }
  ctx.translate(x, y);
  const tipL = 150, wT = 17, wB = 3.4;
  const cone = () => { ctx.beginPath(); ctx.moveTo(-wB / 2, 0); ctx.lineTo(-wT / 2, -tipL); ctx.lineTo(wT / 2, -tipL); ctx.lineTo(wB / 2, 0); ctx.closePath(); };
  cone(); ctx.fillStyle = rgb(UI.rim, UI.glassA); ctx.fill();
  if (fill > 0) {
    ctx.save(); cone(); ctx.clip();
    const h = fill * tipL * .72;
    ctx.fillStyle = rgb(liqC(liq), .6); ctx.fillRect(-12, -h, 24, h);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-12, -h, 24, 1.2);
    if (dots) for (let i = 0; i < dots.length; i++) { const yy = -(i + .5) / dots.length * h * .95, xx = Math.sin(i * 2.7) * (1.5 + (-yy / tipL) * 5); ctx.fillStyle = rgb(PC[dots[i]], .95); ctx.beginPath(); ctx.arc(xx, yy, 1.7, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  cone(); ctx.strokeStyle = rgb(UI.rim, Math.min(1, .55 * UI.rimA)); ctx.lineWidth = 1.2; ctx.stroke();
  ctx.strokeStyle = `rgba(255,255,255,${.18 * UI.glare})`; ctx.beginPath(); ctx.moveTo(-wT / 2 + 3, -tipL + 4); ctx.lineTo(-wB / 2 + .6, -8); ctx.stroke();
  // collar
  ctx.fillStyle = 'rgb(150,160,170)'; rr(-12, -tipL - 16, 24, 16, 3); ctx.fill();
  // shaft
  const sx = -17, sw = 34, top = -tipL - 16 - 210;
  const g = ctx.createLinearGradient(sx, 0, sx + sw, 0);
  g.addColorStop(0, 'rgb(58,66,76)'); g.addColorStop(.35, 'rgb(150,160,172)'); g.addColorStop(.55, 'rgb(120,130,142)'); g.addColorStop(1, 'rgb(52,58,68)');
  ctx.fillStyle = g; rr(sx, top, sw, 210, 9); ctx.fill();
  ctx.fillStyle = 'rgb(70,78,88)'; rr(sx + 26, top + 40, 14, 90, 4); ctx.fill();            // tip ejector
  ctx.fillStyle = 'rgb(180,188,198)'; rr(-9, top - 34, 18, 34, 4); ctx.fill();              // plunger
  ctx.restore();
}
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

function drawTube(x, y, o = {}) {          // 1.5 ml microcentrifuge tube; (x,y) = liquid level point
  const a = o.a ?? 1; if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); const sc = o.s || 1; ctx.scale(sc, sc);
  const body = () => { ctx.beginPath(); ctx.moveTo(-17, -46); ctx.lineTo(17, -46); ctx.lineTo(15, 8); ctx.quadraticCurveTo(10, 46, 0, 50); ctx.quadraticCurveTo(-10, 46, -15, 8); ctx.closePath(); };
  body(); ctx.fillStyle = rgb(UI.rim, UI.glassA * .9); ctx.fill();
  ctx.save(); body(); ctx.clip(); ctx.fillStyle = rgb(liqC(o.liq || [60, 80, 96]), .55); ctx.fillRect(-20, -12, 40, 70);
  if (o.dots) o.dots.forEach((d, i) => { ctx.fillStyle = rgb(PC[d], .95); ctx.beginPath(); ctx.arc(-8 + (i * 7.3) % 16, 0 + (i * 11.7) % 34, 1.8, 0, TAU); ctx.fill(); });
  ctx.restore();
  body(); ctx.strokeStyle = rgb(UI.rim, Math.min(1, .55 * UI.rimA)); ctx.lineWidth = 1.3; ctx.stroke();
  ctx.fillStyle = rgb(UI.rim, .25 * UI.rimA); rr(-20, -52, 40, 7, 2); ctx.fill();
  ctx.strokeStyle = rgb(UI.rim, Math.min(1, .45 * UI.rimA)); ctx.beginPath(); ctx.ellipse(-34, -56, 15, 5, -.35, 0, TAU); ctx.stroke();  // open cap
  ctx.restore();
  if (o.label) txt(o.label, x, y + 78 * (o.s || 1), { a: a, size: o.lsz || 16 * (o.s || 1), align: 'center', col: o.labCol || COL.text, w: 500 });
  if (o.label2) txt(o.label2, x, y + 98 * (o.s || 1), { a: a * .9, size: 14 * (o.s || 1), align: 'center', col: COL.dim });
}
function drawClock(x, y, prog, a) {
  if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.strokeStyle = fg(.13); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 14, 0, TAU); ctx.stroke();
  ctx.strokeStyle = fg(.85); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y, 14, -Math.PI / 2, -Math.PI / 2 + TAU * prog); ctx.stroke();
  ctx.restore();
  txt(`${Math.round(prog * 24)} h`, x + 24, y + 6, { a, size: 17, w: 500, col: COL.text });
}
function hopArc(x0, y0, x1, y1, lift, prog, ok, a) {
  if (a <= .004 || prog <= 0) return;
  const cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - lift, N = 40, M = Math.max(1, Math.round(N * prog));
  const P = u => [(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * cx + u * u * x1, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * cy + u * u * y1];
  ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'round';
  ctx.strokeStyle = ok ? fg(.6) : rgb(GRAYP.rim, .85); ctx.lineWidth = 2;
  if (!ok) ctx.setLineDash([7, 7]);
  ctx.beginPath(); for (let i = 0; i <= M; i++) { const [x, y] = P(i / N); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.setLineDash([]);
  if (prog >= 1) {
    const [ex, ey] = P(1), [px, py] = P(.96), an = Math.atan2(ey - py, ex - px);
    ctx.fillStyle = ok ? fg(.8) : rgb(GRAYP.rim, .9);
    ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - Math.cos(an - .4) * 12, ey - Math.sin(an - .4) * 12); ctx.lineTo(ex - Math.cos(an + .4) * 12, ey - Math.sin(an + .4) * 12); ctx.closePath(); ctx.fill();
    if (!ok) { const [mx, my] = P(.5); ctx.strokeStyle = rgb(GRAYP.rim, 1); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(mx - 8, my - 8); ctx.lineTo(mx + 8, my + 8); ctx.moveTo(mx + 8, my - 8); ctx.lineTo(mx - 8, my + 8); ctx.stroke(); }
  }
  ctx.restore();
}
// pipette choreography: aspirate at src, carry, dispense at dst. Returns pose.
function hopPose(t, src, dst, sp = 1) {
  const T = [0, .8, 1.2, 1.9, 2.3, 3.5, 3.9, 4.6, 5.0, 5.8].map(v => v * sp);
  if (t < 0 || t > T[9]) return null;
  const up = 70, dn = 18;
  const P = [[src.x, -60], [src.x, src.y - up], [src.x, src.y - dn], [src.x, src.y - dn], [src.x, src.y - up], [dst.x, dst.y - up], [dst.x, dst.y - dn], [dst.x, dst.y - dn], [dst.x, dst.y - up], [dst.x, -60]];
  let i = 0; while (i < 8 && t > T[i + 1]) i++;
  const u = ease(seg(t, T[i], T[i + 1]));
  let x = lerp(P[i][0], P[i + 1][0], u), y = lerp(P[i][1], P[i + 1][1], u);
  if (i === 4) y -= Math.sin(u * Math.PI) * (dst.lift || 90);
  if (i === 0 || i === 8) y = lerp(P[i][1], P[i + 1][1], i === 0 ? eOut(seg(t, T[i], T[i + 1])) : u);
  const fill = t < T[2] ? 0 : t < T[3] ? ease(seg(t, T[2], T[3])) : t < T[6] ? 1 : t < T[7] ? 1 - ease(seg(t, T[6], T[7])) : 0;
  const near = i <= 3 ? src : dst;
  const low = clamp((y - (near.y - up)) / (up - dn));
  return { x, y, fill, low };
}
const HOPD = 3.9;   // dispense onset within a hop (×sp)

/* ===== js/scenes/actors.js ===== */
// Cultured cells shared by scene 2 (purified cultures) and scene 4 (the relay).
const DR = 200, DY = 440, DX = { M: 360, A: 960, N: 1560 };
const MIC = [[-95, -70], [30, -118], [118, -40], [-18, 10], [-120, 60], [70, 95], [-25, 130]].map((p, i) => new Cell('micro', p[0], p[1], 300 + i * 11, 1.05, { len: 17, drift: 6 }));
const AST = [[-78, -66], [84, -74], [-72, 84], [92, 78]].map((p, i) => new Cell('astro', p[0], p[1], 410 + i * 23, .98, { drift: 9 }));
const RGC = [[-92, -86, .9], [88, -104, 2.2], [-98, 76, -.7], [96, 64, 3.6], [0, -8, 1.4]].map((p, i) => new Cell('neuron', p[0], p[1], 520 + i * 7, .9, { axAng: p[2], axLen: 175, drift: 2 }));

/* ===== js/scenes/scene3.js: tiltDish ===== */
const TILT = .9;                          // radians at tilt = 1 (about 52 degrees)
const tiltK = tilt => Math.cos(TILT * tilt), tiltWall = (r, tilt) => r * .34 * Math.sin(TILT * tilt);
function tiltDish(x, y, r, tilt, a, tint, content, o = {}) {     // o.hl / o.hlCol: tint the rim (e.g. a highlighted dish)
  if (a <= .004) return;
  const ky = tiltK(tilt), H = tiltWall(r, tilt), ry = r * ky, fy = y + H, b = ease(seg(tilt, 0, .3));
  const ri = r - 7, rin = ri * ky, light = THEME.light;
  ctx.save(); ctx.globalAlpha *= a;
  if (b < 1) {                                          // the flat dish while the tilt is just starting
    ctx.save(); ctx.globalAlpha *= 1 - b; ctx.translate(x, fy); ctx.scale(1, ky); drawDish(0, 0, r, { tint }); ctx.restore();
  }
  if (b > 0) {
    ctx.save(); ctx.globalAlpha *= b;
    const sh = ctx.createRadialGradient(x, fy + 10, ry * .9, x, fy + 10, ry * 1.2);           // shadow on the table
    sh.addColorStop(0, shade(.45)); sh.addColorStop(1, shade(0));
    ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(x, fy + 10, r * 1.2, ry * 1.2, 0, 0, TAU); ctx.fill();
    // far inside wall: between the rim's back arc and the floor's back edge
    const bw = ctx.createLinearGradient(0, y - ry, 0, fy);
    bw.addColorStop(0, rgb(mix(tint, [110, 126, 142], .22), .9)); bw.addColorStop(1, rgb(mix(tint, [255, 255, 255], .25), .9));
    ctx.beginPath(); ctx.ellipse(x, y, r, ry, 0, Math.PI, TAU, false); ctx.lineTo(x + ri, fy); ctx.ellipse(x, fy, ri, rin, 0, TAU, Math.PI, true); ctx.closePath();
    ctx.fillStyle = bw; ctx.fill();
    // floor with the medium on it
    ctx.save(); ctx.translate(x, fy); ctx.scale(1, ky);
    const g = ctx.createRadialGradient(-ri * .25, -ri * .3, ri * .05, 0, 0, ri);
    g.addColorStop(0, rgb(mix(tint, [255, 255, 255], UI.dishHi))); g.addColorStop(1, rgb(mix(tint, [0, 0, 0], UI.dishLo)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, ri, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgb(UI.rim, .4 * UI.rimA); ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
    ctx.restore();
  }
  // cells: on the floor, squashed with the view
  ctx.save(); ctx.translate(x, fy); ctx.scale(1, ky); clipCircle(0, 0, r - 8); content(); ctx.restore();
  if (b > 0) {
    ctx.save(); ctx.globalAlpha *= b;
    // front glass wall, with the medium showing through it
    const fw = ctx.createLinearGradient(0, y + ry, 0, fy + ry);
    fw.addColorStop(0, rgb(mix(tint, [255, 255, 255], .5), .3)); fw.addColorStop(1, rgb(mix(tint, [90, 130, 170], .3), .5));
    const wall = () => { ctx.moveTo(x - r, y); ctx.lineTo(x - r, fy); ctx.ellipse(x, fy, r, ry, 0, Math.PI, 0, true); ctx.lineTo(x + r, y); };
    ctx.beginPath(); wall(); ctx.ellipse(x, y, r, ry, 0, 0, Math.PI, false); ctx.closePath(); ctx.fillStyle = fw; ctx.fill();
    ctx.strokeStyle = rgb(UI.rim, Math.min(1, .7 * UI.rimA)); ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.beginPath(); wall(); ctx.stroke();
    // the rim: outline, pale band, inner line
    ctx.beginPath(); ctx.ellipse(x, y, r, ry, 0, 0, TAU);
    ctx.strokeStyle = rgb(mix(UI.rim, o.hlCol || UI.rim, o.hl || 0), Math.min(1, (.75 + .25 * (o.hl || 0)) * UI.rimA)); ctx.lineWidth = 12 + 2 * (o.hl || 0); ctx.stroke();
    ctx.strokeStyle = light ? 'rgba(255,255,255,.96)' : 'rgba(210,225,238,.28)'; ctx.lineWidth = 8; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y, r - 8, ry * (r - 8) / r, 0, 0, TAU); ctx.strokeStyle = rgb(UI.rim, .5 * UI.rimA); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
  if (b < 1) { ctx.save(); ctx.globalAlpha *= 1 - b; ctx.translate(x, fy); ctx.scale(1, ky); drawDishRim(0, 0, r); ctx.restore(); }
  ctx.restore();
}

const AST3b = [[-100, -84], [104, -92], [-92, 104], [112, 96]].map((p, i) => new Cell('astro', p[0], p[1], 640 + i * 5, 1.2, { drift: 9 }));
/* ===== js/scenes/scene2.js: drawPlate ===== */
const KEPT = () => COL.coral;
function drawPlate(x, y, r, o = {}) {
  const a = o.a ?? 1; if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a;
  drawDish(x, y, r, { tint: UI.plate });
  ctx.save(); clipCircle(x, y, r - 6);
  ctx.strokeStyle = o.pos ? rgb(KEPT(), .2 * UI.gridA) : rgb(UI.grid, .12 * UI.gridA); ctx.fillStyle = rgb(UI.grid, .14 * UI.gridA); ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gy = -r; gy <= r; gy += 14) for (let gx = -r; gx <= r; gx += 14) {
    const px = x + gx + ((Math.round(gy / 14)) % 2 ? 7 : 0), py = y + gy;
    if (o.kind === 'lectin') { ctx.moveTo(px + 1.3, py); ctx.arc(px, py, 1.3, 0, TAU); }
    else { ctx.moveTo(px, py + 3); ctx.lineTo(px, py); ctx.lineTo(px - 2.4, py - 2.6); ctx.moveTo(px, py); ctx.lineTo(px + 2.4, py - 2.6); }
  }
  o.kind === 'lectin' ? ctx.fill() : ctx.stroke();
  ctx.restore();
  drawDishRim(x, y, r, { hl: o.hl || 0, hlCol: THEME.light ? COL.dim : COL.ink });
  if (o.sweep > 0) {            // the kept plate is circled: an orange ring drawn clockwise from the top
    ctx.strokeStyle = rgb(KEPT()); ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * o.sweep); ctx.stroke();
  }
  ctx.restore();
}

/* ===== js/scenes/scene4.js: wells, nAb well, filter ===== */
const MINI_A = new Cell('astro', 0, 0, 411, .3, { drift: 0 });
const MINI_N = new Cell('neuron', 0, 0, 522, .28, { axAng: .6, axLen: 120, drift: 0 });
// dose-response wells: 20 RGCs each; survivors 20/19/11/0 ≈ 100/97/55/2 %
const DOSES = [{ d: '0', s: '~100%', n: 20 }, { d: '1', s: '~97%', n: 19 }, { d: '15', s: '~55%', n: 11 }, { d: '50', s: '~2%', n: 0 }];
const WELLS = DOSES.map((D, w) => { const R = rng(900 + w), cells = []; for (let i = 0; i < 20; i++) { const a = R() * TAU, r = Math.sqrt(R()) * 66; cells.push({ c: new Cell('neuron', Math.cos(a) * r, Math.sin(a) * r, 2000 + w * 50 + i, .26, { axAng: R() * TAU, axLen: 70, simple: true, drift: 0 }), dies: false, st: R() }); } const idx = cells.map((_, i) => i).sort(() => 0).slice(0, 20 - D.n); idx.forEach(i => cells[i].dies = true); return cells; });

const FR = 176;
const F = {
  lpsA: new Field(11, [['lps', 16]], FR), lpsM: new Field(12, [['lps', 16]], FR),
  mcm: new Field(13, [['il1', 9], ['tnf', 9], ['c1q', 7], ['other', 22]], FR),
  mcmA: new Field(14, [['il1', 9], ['tnf', 9], ['c1q', 7], ['other', 22]], FR),
  restM: new Field(15, [['other', 12]], FR), restA: new Field(16, [['other', 10]], FR),
  cyto: new Field(17, [['il1', 10], ['tnf', 10], ['c1q', 8]], FR),
  cytoN: new Field(18, [['il1', 10], ['tnf', 10], ['c1q', 8]], FR),
  well: new Field(19, [['il1', 4], ['tnf', 4], ['c1q', 3], ['other', 8]], 50),
  nabA: new Field(20, [['il1b', 7], ['tnfb', 7], ['c1qb', 6], ['other', 18]], FR),
  acm: new Field(21, [['tox', 26], ['other', 18], ['il1', 3], ['tnf', 3], ['c1q', 3]], FR),
  concN: new Field(22, [['tox', 34], ['other', 16], ['tnf', 4], ['c1q', 4]], FR),
  mcmN: new Field(23, [['il1', 9], ['tnf', 9], ['c1q', 7], ['other', 22]], FR),
};
// molecule dots in tips / tubes, as PC keys so they follow the theme
const DOTS = { mcm: ['il1', 'tnf', 'other', 'c1q', 'other', 'il1', 'tnf', 'other', 'c1q', 'other'], lps: Array(8).fill('lps'), cyto: ['il1', 'tnf', 'c1q', 'il1', 'tnf', 'c1q', 'il1', 'tnf'], rest: Array(5).fill('other'), nab: ['gray', 'ab', 'other', 'gray', 'ab', 'other', 'gray', 'ab'], acm: ['tox', 'other', 'tox', 'tox', 'other', 'tox', 'other', 'tox'], conc: Array(12).fill(0).map((_, i) => i % 3 ? 'tox' : 'other') };
const LIQ = {   // dark-theme medium colours; liqC() lightens them for the light theme
  mcm: [58, 72, 84], lps: [70, 76, 80], cyto: [66, 72, 70], rest: [52, 64, 74], acm: [92, 64, 62], conc: [120, 70, 64] };

const RT = 1.08;                                   // tilt, in tiltDish units (about 56 degrees)
const rKy = () => tiltK(RT), rWall = r => tiltWall(r, RT), rRy = r => r * rKy();
const DYR = 350, FY = DYR + rWall(DR);
function pill(x, y, res, a, center) {
  if (a <= .004) return;
  const good = res === 'No change' || res === 'Survival', col = good ? COL.teal : COL.coral;
  ctx.save(); ctx.globalAlpha *= a; ctx.font = `700 24px ${FONT}`;
  const w = ctx.measureText(res).width + 36, h = 34, px = center ? x - w / 2 : x;
  rr(px, y - h + 8, w, h, h / 2);
  if (good) { ctx.fillStyle = rgb(COL.bg); ctx.fill(); ctx.strokeStyle = rgb(col); ctx.lineWidth = 2.4; ctx.stroke(); } else { ctx.fillStyle = rgb(col); ctx.fill(); }
  ctx.restore();
  txt(res, px + w / 2, y, { a, size: 24, w: 700, align: 'center', col: good ? col : [255, 255, 255] });
}
function drawWells(t, gt, a) {
  // four dose wells in one row where the RGC dish was: dose above, survival printed plainly underneath
  const wr = 72, ry = rRy(wr), Hw = rWall(wr), fy = FY, sc = seg(t, 5.5, 6.3) * a;
  [0, 1, 2, 3].forEach(w => {
    const x = 1320 + w * 160;
    tiltDish(x, fy - Hw, wr, RT, a, UI.dish, () => {
      ctx.scale(wr / 90, wr / 90);
      WELLS[w].forEach(q => q.c.draw(ctx, { t: gt, d: q.dies ? ease(seg(t, 1.3 + q.st * 1.5, 4.8 + q.st * 1.5)) : 0, noPuncta: true }));
    });
    const D = DOSES[w];
    txt(D.d + ' µg/ml', x, fy - Hw - ry - 14, { a, size: 24, w: 600, align: 'center' });
    txt(D.s, x, fy + ry + 46, { a: sc, size: 34, w: 700, align: 'center', col: D.n > 15 ? COL.teal : D.n > 5 ? UI.midSurv : COL.coral });
  });
}
function drawNabWell(x, y, r, t, gt, W_) {
  const a = W_.a;
  ctx.save(); ctx.globalAlpha *= a;
  tiltDish(x, y - rWall(r), r, RT, 1, UI.dish, () => {
  const f = F.well, o = { t0: W_.td, origin: () => [0, -18], stag: .4, wander: .6 };
  const cyt = f.ps.filter(p => p.type !== 'other');
  for (const p of f.ps) {
    const q = f.pos(p, gt - (gt - t) * 0, o.t0 !== undefined ? { ...o, t0: W_.td - t + gt } : o); if (!q) continue;
    const ci = cyt.indexOf(p);
    let bnd = 0, abPos = null;
    if (ci >= 0) {
      const t0 = W_.tb + ci * .12, u = ease(seg(t, t0, t0 + 1.1));
      bnd = seg(t, t0 + .9, t0 + 1.2);
      const S = 15, tip = [-.4 * S, -.45 * S], hx = q[0] - tip[0] + p.sz * 2, hy = q[1] - tip[1] + GSIZE[p.type] * .5;
      const sx = (ci - 5) * 14, sy = -r - 30;
      if (u > 0) abPos = [lerp(sx, hx, u), lerp(sy, hy, u)];
    }
    const type = bnd > .5 ? p.type + 'b' : p.type;
    glyph(ctx, bnd > .5 ? p.type + 'b' : p.type, q[0], q[1], GSIZE[p.type] * p.sz * .9, p.rot, q[2]);
    if (abPos && bnd <= .5) { ctx.save(); ctx.translate(abPos[0], abPos[1]); gAb(ctx, 15, 1); ctx.restore(); }
  }
  });
  ctx.restore();
  txt('+ anti-IL-1α / TNF / C1q', x, y - rWall(r) - rRy(r) - 16, { a: a * seg(t, W_.tb - .4, W_.tb + .3), size: 22, align: 'center', col: COL.legend });
}
function drawFilter(x, y, F_, gt) {
  const a = F_.a; if (a <= .004) return;
  ctx.save(); ctx.globalAlpha *= a;
  const spinJ = F_.spin ? Math.sin(gt * 40) * .8 * F_.spin : 0;
  ctx.translate(x + spinJ, y);
  const top = -72, mem = 52, bot = 112, w = 30, wi = 22;
  // outer tube
  ctx.beginPath(); ctx.moveTo(-w, top); ctx.lineTo(w, top); ctx.lineTo(w, bot - 20); ctx.quadraticCurveTo(w, bot, 0, bot); ctx.quadraticCurveTo(-w, bot, -w, bot - 20); ctx.closePath();
  ctx.fillStyle = rgb(UI.rim, UI.glassA * .6); ctx.fill(); ctx.strokeStyle = rgb(UI.rim, Math.min(1, .5 * UI.rimA)); ctx.lineWidth = 1.3; ctx.stroke();
  // filtrate (below membrane) rises
  const fl = F_.conc * (bot - mem - 16);
  ctx.save(); ctx.beginPath(); ctx.rect(-w + 1, bot - 4 - fl, 2 * w - 2, fl + 4); ctx.clip();
  ctx.fillStyle = rgb(UI.filtrate, .25); ctx.beginPath(); ctx.moveTo(-w + 1, mem); ctx.lineTo(w - 1, mem); ctx.lineTo(w - 1, bot - 20); ctx.quadraticCurveTo(w - 1, bot - 1, 0, bot - 1); ctx.quadraticCurveTo(-w + 1, bot - 1, -w + 1, bot - 20); ctx.closePath(); ctx.fill(); ctx.restore();
  // insert
  ctx.strokeStyle = rgb(UI.rim, Math.min(1, .4 * UI.rimA)); ctx.beginPath(); ctx.moveTo(-wi, top); ctx.lineTo(-wi, mem); ctx.moveTo(wi, top); ctx.lineTo(wi, mem); ctx.stroke();
  // retentate
  const lvl0 = mem - top - 20, lvl = F_.fill * lerp(lvl0, 7, F_.conc);
  if (lvl > 0) {
    ctx.fillStyle = rgb(liqC(mix([92, 64, 62], [150, 70, 60], F_.conc)), .6); ctx.fillRect(-wi + 1, mem - lvl, 2 * wi - 2, lvl);
    const R = rng(77);
    for (let i = 0; i < 26; i++) { const px = (R() - .5) * (2 * wi - 8), py = mem - R() * lvl * .92; const tox = R() < .65; ctx.fillStyle = rgb(tox ? PC.tox : PC.other, F_.fill); ctx.beginPath(); ctx.arc(px, py, tox ? 2.1 : 1.6, 0, TAU); ctx.fill(); }
  }
  // small molecules pass the 30 kDa membrane
  if (F_.spin > 0) { for (let i = 0; i < 12; i++) { const u = ((gt * .9 + i / 12) % 1); ctx.fillStyle = rgb(UI.small, .8 * F_.spin * Math.sin(u * Math.PI)); ctx.beginPath(); ctx.arc(((i * 7.1) % 36) - 18, lerp(mem - 18, mem + 34, u), 1, 0, TAU); ctx.fill(); }
    // IL-1α (~18 kDa) also passes the membrane; TNF trimer (~52 kDa) and C1q (~460 kDa) are retained
    for (let j = 0; j < 2; j++) { const u = (gt * .38 + j * .5) % 1; if (u < .6) { const v = u / .6; glyph(ctx, 'il1', j ? 7 : -8, lerp(mem - 22, mem + 30, v), 7, gt * .8 + j, F_.spin * Math.sin(v * Math.PI)); } } }
  ctx.setLineDash([3, 2]); ctx.strokeStyle = fg(.85); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-wi, mem); ctx.lineTo(wi, mem); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
  if (F_.spin > 0) { ctx.save(); ctx.globalAlpha *= a * F_.spin; ctx.translate(x + w + 26, y - 10); ctx.rotate(gt * 6); ctx.strokeStyle = fg(.8); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 11, 0, 4.6); ctx.stroke(); ctx.fillStyle = fg(.8); ctx.beginPath(); ctx.moveTo(11 * Math.cos(4.6) + 4, 11 * Math.sin(4.6) + 4); ctx.lineTo(11 * Math.cos(4.6) - 5, 11 * Math.sin(4.6) + 1); ctx.lineTo(11 * Math.cos(4.6) + 1, 11 * Math.sin(4.6) - 6); ctx.fill(); ctx.restore(); }
}

/* =====================================================================
   PROPS: each one is drawn around (0, 0) in design pixels inside `box`.
   t = seconds since the page started, looped where a prop has a sequence.
   ===================================================================== */
const loop = (t, len) => ((t % len) + len) % len;
const dishCells = (cells, r, o) => () => { ctx.scale(r / DR, r / DR); cells.forEach(c => c.draw(ctx, o)); };
const PROPS = {
  'petri-astro': { box: [560, 420], draw: t => tiltDish(0, -40, 240, 1, 1, UI.dish, () => { ctx.scale(1.1 * 240 / 270, 1.1 * 240 / 270); AST3b.forEach(c => c.draw(ctx, { t, r: 0 })); }) },
  'petri-serum': { box: [560, 420], draw: t => tiltDish(0, -40, 240, 1, 1, UI.serum, dishCells(AST, 240, { t, r: .45, colR: 0 })) },
  'petri-tilt': { box: [560, 440], draw: t => { const m = .5 - .5 * Math.cos(loop(t, 10) / 10 * TAU); tiltDish(0, -40 * m, 240, m, 1, UI.dish, () => { ctx.scale(1.1 * 240 / 270, 1.1 * 240 / 270); AST3b.forEach(c => c.draw(ctx, { t, r: 0 })); }); } },
  'petri-micro': { box: [560, 420], draw: t => tiltDish(0, -40, 240, 1, 1, UI.dish, dishCells(MIC, 240, { t, r: 0 })) },
  'petri-micro-lps': { box: [560, 420], draw: t => tiltDish(0, -40, 240, 1, 1, UI.dish, () => { ctx.scale(240 / DR, 240 / DR); F.mcm.draw(ctx, t); MIC.forEach(c => c.draw(ctx, { t, r: 1 })); }) },
  'petri-a1': { box: [560, 420], draw: t => tiltDish(0, -40, 240, 1, 1, UI.dish, () => { ctx.scale(240 / DR, 240 / DR); F.acm.draw(ctx, t); AST.forEach(c => c.draw(ctx, { t, r: 1 })); }) },
  'petri-rgc': { box: [560, 420], draw: t => tiltDish(0, -40, 240, 1, 1, UI.dish, dishCells(RGC, 240, { t })) },
  'petri-rgc-dying': { box: [560, 420], draw: t => { const d = ease(seg(loop(t, 12), 1, 8)); tiltDish(0, -40, 240, 1, 1, UI.dish, () => { ctx.scale(240 / DR, 240 / DR); F.concN.draw(ctx, t, { a: .8 }); RGC.forEach(c => c.draw(ctx, { t, d })); }); } },
  'dish-flat': { box: [480, 480], draw: t => { drawDish(0, 0, 210); ctx.save(); clipCircle(0, 0, 202); ctx.scale(210 / DR, 210 / DR); AST.forEach(c => c.draw(ctx, { t, r: 0 })); ctx.restore(); drawDishRim(0, 0, 210); } },
  'plate-lectin': { box: [400, 400], draw: () => drawPlate(0, 0, 170, { kind: 'lectin' }) },
  'plate-antibody': { box: [400, 400], draw: () => drawPlate(0, 0, 170, {}) },
  'plate-kept': { box: [400, 400], draw: t => drawPlate(0, 0, 170, { pos: true, sweep: ease(seg(loop(t, 6), .5, 2.5)) }) },
  'pipette': { box: [220, 500], draw: t => { const u = loop(t, 6), fill = u < 3 ? ease(seg(u, .5, 2)) : 1 - ease(seg(u, 3.5, 5)); drawPipette(0, 210, fill, LIQ.mcm, DOTS.mcm, 1, 0); } },
  'tube': { box: [200, 220], draw: () => drawTube(10, 10, { liq: LIQ.mcm, dots: DOTS.mcm, s: 1.4 }) },
  'tube-acm': { box: [200, 220], draw: () => drawTube(10, 10, { liq: LIQ.acm, dots: DOTS.acm, s: 1.4 }) },
  'clock': { box: [150, 70], draw: t => drawClock(-22, 0, ease(seg(loop(t, 5), .3, 4.3)), 1) },
  'nab-well': { box: [380, 320], draw: t => { const u = loop(t, 10); drawNabWell(0, 40, 110, u, t, { a: 1, td: .2, tb: 2.5 }); } },
  'dose-wells': { box: [660, 300], draw: t => { ctx.save(); ctx.translate(-1560, -FY + 10); drawWells(loop(t, 10), t, 1); ctx.restore(); } },
  'spin-filter': { box: [200, 240], draw: t => { const u = loop(t, 9); drawFilter(-14, -10, { a: 1, fill: 1, conc: ease(seg(u, 1, 7)), spin: seg(u, .5, 1) * (1 - seg(u, 7, 7.5)) }, t); } },
  'round-cells': { box: [360, 120], draw: t => ['astro', 'micro', 'oligo', 'neuron', 'endo'].forEach((k, i) => (ROUNDS[k] || (ROUNDS[k] = new Round(k, 50 + i * 7))).draw(ctx, -140 + i * 70, 0, t, { s: 2.2 })) },
};
const ROUNDS = {};
export const PROP_KEYS = Object.keys(PROPS);
/* Colour slots are paths into the active (light or dark) palette, e.g. 'tp.astro.rim', 'ui.dish'. */
function resolve(path) {
  const parts = path.split('.'); let o = PAL()[parts[0]];
  for (let i = 1; i < parts.length - 1; i++) o = o?.[parts[i]];
  return o ? [o, parts[parts.length - 1]] : null;
}
export function getColor(path, dark = false) { THEME.light = !dark; const r = resolve(path); return r ? r[0][r[1]] : null; }
/** Draw prop `key` at time t into a w×h CSS-pixel area. o: { dark, colors } */
export function drawProp(c, key, t, w, h, o = {}) {
  const p = PROPS[key]; if (!p) return;
  setCtx(c); THEME.light = !o.dark;
  const undo = [];
  if (o.colors) for (const [path, v] of Object.entries(o.colors)) {
    const r = resolve(path); if (!r || !v) continue;
    undo.push([r[0], r[1], r[0][r[1]]]); r[0][r[1]] = v;
  }
  const sc = Math.min(w / p.box[0], h / p.box[1]) * .92;
  c.save(); c.translate(w / 2, h / 2); c.scale(sc, sc);
  try { o.style === 'clay' ? withClay(c, !!o.dark, () => p.draw(t)) : p.draw(t); } finally { c.restore(); for (let i = undo.length - 1; i >= 0; i--) undo[i][0][undo[i][1]] = undo[i][2]; }
}
