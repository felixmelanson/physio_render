import { LOOKS, paintLook } from './looks.js';
import { withClay, claySuspend } from './clay.js';
// @ts-nocheck
/* Drawing engine lifted verbatim from atlas-bone.html (procedural arbors, molecule glyphs,
   bone & marrow cells). Only the atlas UI, trabecular/cortical studies and the DOM wiring
   are left out. Every function draws onto the 2D context it is given. */
'use strict';

const TAU = Math.PI*2;
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


// Light specimen palette; the source's cell-specific tints are retained.
const TP = {
 astro:{rim:[73,147,126],body:[167,215,193],fil:[245,255,238],nuc:[72,128,106]},
 micro:{rim:[110,153,101],body:[189,214,164],fil:[244,255,224],nuc:[102,143,87]},
 neuron:{rim:[100,153,178],body:[179,211,223],fil:[247,254,255],nuc:[91,142,165]},
 oligo:{rim:[145,132,183],body:[206,198,229],fil:[244,238,255],nuc:[135,121,171]},
 endo:{rim:[148,171,165],body:[215,226,220],fil:[245,252,246],nuc:[142,166,156]}
};
const CORAL={rim:[199,127,105],body:[239,191,172],fil:[255,243,223],nuc:[182,112,89]};
const GRAYP={rim:[175,178,164],body:[221,222,208],fil:[249,249,235],nuc:[156,163,146]};
const palMix=(p,q,t)=>({rim:mix(p.rim,q.rim,t),body:mix(p.body,q.body,t),fil:mix(p.fil,q.fil,t),nuc:mix(p.nuc,q.nuc,t)});

/* ---------------------------------------------------------------------
   RENDER STYLES (added). Every membrane in the engine (cells, bone shapes,
   tubes) is painted here: `path(ex)` builds the outline grown by ex px.
   'atlas' is the original look; the others follow the Piezo1 lab's ink /
   clay / glass / wire treatments.
   --------------------------------------------------------------------- */
let STYLE = 'atlas', DARK = false;
/* Evidence treatment (REVISION.md §1): one rule for every membrane. EVID = { fill, dash } while a specimen draws. */
const EVIDENCE = { literature: { fill: .7, dash: null }, hypothesis: { fill: .35, dash: [3.2, 2.4] } };
let EVID = null, EVID_K0 = 1;
/** Outline a membrane at full opacity, solid or dashed, over its faded fill. */
function evidenceOutline(c, path, ex, pal) {
  const m = c.getTransform(), k = Math.hypot(m.a, m.b) || 1, u = EVID_K0 / k;
  c.save(); c.globalAlpha = Math.min(1, c.globalAlpha / EVID.fill);
  c.setLineDash(EVID.dash ? EVID.dash.map(d => d * u) : []); c.lineWidth = Math.max(.8 * u, ex * .55); c.lineJoin = 'round';
  c.strokeStyle = rgb(DARK ? mix(pal.rim, [255, 255, 255], .25) : mix(pal.rim, [0, 0, 0], .15));
  path(ex * .45); c.stroke(); c.restore();
}
const inkOf = pal => DARK ? mix(pal.rim, [255, 255, 255], .2) : mix(pal.rim, [0, 0, 0], .55);
function paintMembrane(c, path, ex, pal, g0, g1, gk, band = .9) {
  paintStyled(c, path, ex, pal, g0, g1, gk, band);
  if (EVID) evidenceOutline(c, path, ex, pal);
}
function paintStyled(c, path, ex, pal, g0, g1, gk, band) {
  if (LOOKS.includes(STYLE)) {
    const shp = { fill: e => { path(e); c.fill(); }, clip: (dx, dy) => { c.translate(dx, dy); path(0); c.translate(-dx, -dy); c.clip(); } };
    paintLook(c, shp, STYLE, pal, DARK, { ex, a: band, R: g1 || 30 });
    return;
  }
  const grad = (from, to) => {
    if (!g1) return rgb(to);
    const g = c.createRadialGradient(0, 0, g0, 0, 0, g1); g.addColorStop(0, rgb(from)); g.addColorStop(1, rgb(to)); return g;
  };
  if (STYLE === 'ink') {
    path(ex * 1.2); c.fillStyle = rgb(inkOf(pal)); c.fill();
    path(0); c.fillStyle = rgb(DARK ? mix(pal.body, [0, 0, 0], .55) : pal.body); c.fill();
  } else if (STYLE === 'clay') { claySuspend(() => {
    c.save(); c.shadowColor = DARK ? 'rgba(0,0,0,.9)' : 'rgba(20,32,44,.32)'; c.shadowBlur = 9; c.shadowOffsetY = 4;
    path(ex * .6); c.fillStyle = rgb(mix(pal.body, pal.rim, .55)); c.fill(); c.restore();
    path(0);
    const g = c.createLinearGradient(-g1 * .25 - 10, -g1 * .25 - 10, g1 * .25 + 10, g1 * .25 + 10);
    g.addColorStop(0, rgb(mix(pal.body, [255, 255, 255], .35))); g.addColorStop(1, rgb(mix(pal.body, pal.rim, .3)));
    c.fillStyle = g; c.fill();
  }); } else if (STYLE === 'glass') {
    path(ex); c.fillStyle = rgb(pal.rim, .55); c.fill();
    path(0);
    const R = g1 || 30, g = c.createRadialGradient(-R * .08, -R * .1, 0, 0, 0, R * .5);
    g.addColorStop(0, `rgba(255,255,255,${DARK ? .35 : .8})`); g.addColorStop(.45, rgb(pal.body, .45)); g.addColorStop(1, rgb(pal.body, .28));
    c.fillStyle = g; c.fill();
  } else if (STYLE === 'wire') {
    path(ex); c.fillStyle = rgb(DARK ? mix(pal.rim, [255, 255, 255], .3) : pal.rim); c.fill();
    path(0); c.fillStyle = DARK ? '#000' : '#fff'; c.fill();
  } else {
    path(ex); c.fillStyle = rgb(pal.rim); c.fill();
    path(0); c.fillStyle = grad(mix(pal.body, pal.rim, gk), pal.body); c.fill();
  }
}
const PC={il1:[205,162,66],tnf:[150,129,191],c1q:[147,170,74],other:[164,174,158],lps:[179,176,141],ab:[143,160,143],tox:[206,137,108],gray:[164,174,157]};
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

/* ---------------- builders ---------------- */
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

/* ---------------- Cell ---------------- */
let CID = 0;
class Cell {
  constructor(type, x, y, seed, sc = 1, o = {}) {
    this.type = type; this.x = x; this.y = y; this.sc = sc; this.o = o; this.id = ++CID;
    const R = rng(seed * 7919 + 13);
    this.ph = R() * TAU; this.drift = o.drift ?? 7;
    this.harm = [0, 1, 2].map(() => ({ k: 2 + Math.floor(R() * 3), a: .03 + R() * .05, p: R() * TAU, f: .2 + R() * .3 }));
    if (o.build) { this.R0 = o.R0 || 10; this.prims = o.build(R, o); this.elong = o.elong || 1; }
    else if (type === 'astro') { this.R0 = o.R0 || 13; this.prims = buildAstro(R, o); }
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
    const gt = sstep(seg(d, .5, .95)); if (gt > 0 && !P.noGray) pal = palMix(pal, GRAYP, gt * .85);
    const spr = P.sprout ?? 1;
    const R0 = R0base * (1 - .3 * pyk) * (ty === 'micro' ? 1 + .8 * r : 1) * (ty === 'astro' ? 1 - .06 * r : 1) * (P.somaK || 1) * (spr < 1 ? lerp(.8, 1, spr) : 1);
    const fn0 = this.somaFn(Pp, ms, r, pyk, d), fn = new Float32Array(SOMA_N + 1);
    for (let i = 0; i <= SOMA_N; i++) fn[i] = fn0(-i / SOMA_N * TAU);
    const rimW = Math.min(2.4, 1.4 / this.sc);
    const el = ty === 'micro' ? lerp(this.elong, 1.05, r) : (this.elong || 1);
    const body = ex => {
      c.beginPath(); addSoma(c, R0, fn, el, ex);
      for (const s of strands) { if (frag > 0 && s.b.kind !== 'p' || frag > 0 && ty === 'neuron') addFrag(c, s, ex, frag); else addStrand(c, s, ex); }
      if (this.sheaths) for (const sh of this.sheaths) {
        const hx = Math.cos(sh.A) * sh.len / 2, hy = Math.sin(sh.A) * sh.len / 2;
        addStrand(c, { pts: [sh.cx - hx, sh.cy - hy, sh.cx + hx, sh.cy + hy], ws: [5.6, 5.6], n: 1 }, ex);
      }
    };
    if (P.dashed) {
      body(0); c.setLineDash([4 / this.sc, 4 / this.sc]); c.lineWidth = 1.3 / this.sc; c.strokeStyle = rgb(GRAYP.rim, .8); c.stroke(); c.restore(); return;
    }
    if (P.lcn) {   // pericellular / canalicular space: around the body by lcn, around each process in proportion to its width
      c.beginPath(); addSoma(c, R0, fn, el, rimW + P.lcn);
      const k = P.lcnK ?? 1.1;
      for (const s of strands) addStrand(c, { pts: s.pts, ws: s.ws.map(w => w * (1 + k)), n: s.n }, rimW + .4);
      c.fillStyle = typeof P.lcnCol === 'function' ? P.lcnCol(c, R0) : (P.lcnCol || rgb(pal.fil, .5)); c.fill();
    }
    paintMembrane(c, body, rimW, pal, R0 * .2, R0 * 5.5, .32, 1.05);

    c.lineCap = 'round'; c.lineJoin = 'round';
    if (ty === 'astro' || this.o.build) {
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
      if (el !== 1) { c.save(); c.scale(el, 1); this.nucleus(c, R0, pal, .5, .4, this.o.build ? eth : 0); c.restore(); }
      else this.nucleus(c, R0, pal, .5, .4, this.o.build ? eth : 0);
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
          c.fillStyle = rgb([226, 250, 255], .9 * pa * a); c.beginPath(); c.arc(px, py, (1.5 + 1.6 * fl) / Math.sqrt(this.sc), 0, TAU); c.fill();
        }
      }
      if (casp > 0) {     // caspase-2/3 activation
        const cg = c.createRadialGradient(0, 0, 0, 0, 0, R0 * 1.25);
        const pul = .85 + .15 * Math.sin(t * 3);
        cg.addColorStop(0, rgb([255, 184, 80], .8 * casp * pul)); cg.addColorStop(1, rgb([255, 184, 80], 0));
        c.fillStyle = cg; c.beginPath(); c.arc(0, 0, R0 * 1.25, 0, TAU); c.fill();
      }
      this.nucleus(c, R0, pal, .52, .48, eth);
    } else {
      if (this.sheaths) { c.strokeStyle = rgb(pal.fil, .35); c.lineWidth = .8; for (const sh of this.sheaths) { const hx = Math.cos(sh.A) * (sh.len / 2 - 3), hy = Math.sin(sh.A) * (sh.len / 2 - 3); c.beginPath(); c.moveTo(sh.cx - hx, sh.cy - hy); c.lineTo(sh.cx + hx, sh.cy + hy); c.stroke(); } }
      this.nucleus(c, R0, pal, .5, .45, 0);
    }
    if (P.onStrands) P.onStrands(c, strands, R0, el, pal);
    c.restore();
  }
  nucleus(c, R0, pal, rx, ry, eth) {
    const [ox, oy, rot] = this.nuc;
    const k = 1 - .38 * eth;
    c.beginPath(); c.ellipse(ox * (1 - eth), oy * (1 - eth), R0 * rx * k, R0 * ry * k, rot, 0, TAU);
    if (eth > 0) {
      c.fillStyle = rgb(mix(pal.nuc, this.o.pykCol || [238, 44, 66], eth)); c.fill();
      c.strokeStyle = rgb(this.o.pykGlow || [255, 90, 100], .35 * eth); c.lineWidth = 2.2; c.stroke();
    } else {
      c.fillStyle = rgb(pal.nuc, .92); c.fill();
      c.strokeStyle = rgb(pal.rim, .22); c.lineWidth = .7; c.stroke();
      if (this.type === 'neuron') { c.fillStyle = rgb(pal.fil, .55); c.beginPath(); c.arc(ox + R0 * .12, oy - R0 * .08, R0 * .1, 0, TAU); c.fill(); }
    }
  }
}

/* ---------------- dissociated (round) cells ---------------- */
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
    const g = c.createRadialGradient(0, 0, 0, 0, 0, R0 * 1.3); g.addColorStop(0, rgb(mix(pal.body, pal.rim, .35))); g.addColorStop(1, rgb(pal.body)); c.fillStyle = g; c.fill();
    c.beginPath(); c.ellipse(this.no[0] * R0, this.no[1] * R0, R0 * .5, R0 * .42, 0, 0, TAU); c.fillStyle = rgb(pal.nuc, .9); c.fill();
    if (b > 0) { c.setLineDash([2, 2.5]); c.strokeStyle = rgb(pal.rim, .55 * b); c.lineWidth = 1; c.beginPath(); c.arc(0, 0, R0 * 1.45, 0, TAU); c.stroke(); }
    c.restore();
  }
}

/* =====================================================================
   MOLECULE GLYPHS
   ===================================================================== */
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
function gC1q(c, s, a, col = PC.c1q) {       // C1q: "bouquet of tulips" — collagen stalk + 6 globular heads
  const ink = rgb(mix(col, [0, 0, 0], .55), a * .7), ow = 1.6;   // outline: stroke wider in ink first, then the colour
  c.lineCap = 'round'; c.fillStyle = rgb(col, a);
  const heads = [];
  for (let k = 0; k < 6; k++) { const an = -Math.PI / 2 + (k - 2.5) * .34; heads.push([an, Math.cos(an) * s * .62, s * .05 + Math.sin(an) * s * .62]); }
  const stems = () => { c.beginPath(); c.moveTo(0, s * .55); c.lineTo(0, s * .05); };
  const arms = () => { c.beginPath(); for (const [an, hx, hy] of heads) { c.moveTo(0, s * .05); c.quadraticCurveTo(Math.cos(an) * s * .22, s * .05 + Math.sin(an) * s * .32, hx, hy); } };
  c.strokeStyle = ink; c.lineWidth = s * .15 + ow; stems(); c.stroke(); c.lineWidth = s * .07 + ow; arms(); c.stroke();
  c.strokeStyle = rgb(col, a); c.lineWidth = s * .15; stems(); c.stroke(); c.lineWidth = s * .07; arms(); c.stroke();
  for (const [, hx, hy] of heads) { c.beginPath(); c.arc(hx, hy, s * .14, 0, TAU); c.fill(); c.strokeStyle = ink; c.lineWidth = .8; c.stroke(); }
}
function gLPS(c, s, a) {                     // LPS: lipid A (acyl chains) + core + O-antigen chain
  const col = rgb(PC.lps, a), ink = rgb(mix(PC.lps, [0, 0, 0], .55), a * .7), ow = 1.6;
  c.lineCap = 'round';
  const chains = () => { c.beginPath(); for (let k = 0; k < 4; k++) { const x = -s * .2 + k * s * .133; c.moveTo(x, s * .3); c.lineTo(x + (k % 2 ? 1 : -1) * s * .03, s * .62); } };
  const sugars = []; let x = 0, y = s * .1;
  for (let k = 0; k < 5; k++) { const nx = x + Math.sin(k * .9) * s * .1, ny = y - s * .16; sugars.push([x, y, nx, ny]); x = nx; y = ny; }
  const links = () => { c.beginPath(); for (const [x0, y0, x1, y1] of sugars) { c.moveTo(x0, y0); c.lineTo(x1, y1); } };
  c.strokeStyle = ink; c.lineWidth = s * .05 + ow; chains(); c.stroke(); c.lineWidth = s * .04 + ow; links(); c.stroke();
  c.strokeStyle = col; c.lineWidth = s * .05; chains(); c.stroke(); c.lineWidth = s * .04; links(); c.stroke();
  c.fillStyle = col; c.strokeStyle = ink; c.lineWidth = .8;
  c.beginPath(); c.arc(-s * .12, s * .2, s * .11, 0, TAU); c.arc(s * .12, s * .2, s * .11, 0, TAU); c.fill(); c.stroke();
  for (const [, , nx, ny] of sugars) { c.beginPath(); c.arc(nx, ny, s * .072, 0, TAU); c.fill(); c.stroke(); }
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
const GLYPHS = {};   // added molecule glyphs register here: GLYPHS[type] = (c, size, alpha) => …
function glyph(c, type, x, y, s, rot, a) {
  if (a <= .01) return;
  c.save(); c.translate(x, y); c.rotate(rot);
  switch (type) {
    case 'il1': gIL1(c, s, a); break; case 'tnf': gTNF(c, s, a); break; case 'c1q': gC1q(c, s * 1.35, a); break;
    case 'lps': gLPS(c, s * 1.1, a); break; case 'other': gOther(c, s, a); break; case 'tox': gTox(c, s, a); break;
    case 'ab': gAb(c, s * 1.2, a); break;
    case 'il1b': gBound(c, 'il1', s, a); break; case 'tnfb': gBound(c, 'tnf', s, a); break; case 'c1qb': gBound(c, 'c1q', s, a); break;
    default: if (GLYPHS[type]) GLYPHS[type](c, s, a);
  }
  c.restore();
}
const GSIZE = { il1: 11, tnf: 12, c1q: 13, other: 9, lps: 12, tox: 11, ab: 13, il1b: 11, tnfb: 12, c1qb: 12 };


/* ---- specimen composition (from the atlas) ---- */

const actors = {
 astro:new Cell('astro',0,0,777,1,{drift:2.5,len:37}),
 astroA:new Cell('astro',0,0,778,1,{drift:2.5,len:38}),
 astroS:new Cell('astro',0,0,640,1,{drift:2,len:37}),
 micro:new Cell('micro',0,0,311,1,{drift:2.2,len:16}),
 microA:new Cell('micro',0,0,322,1,{drift:2,len:17}),
 neuron:new Cell('neuron',0,0,522,1,{drift:1.2,axAng:2.7,axLen:100,len:21}),
 pyr:new Cell('neuron',0,0,533,1,{drift:1,axAng:Math.PI/2,axLen:89,pyr:true,len:17}),
 dying:new Cell('neuron',0,0,540,1,{drift:0,axAng:.45,axLen:95,len:20}),
 oligo:new Cell('oligo',0,0,617,1,{drift:1,nSheath:4,axAng:-.2}),
};
const rounds = {micro:new Round('micro',52),astro:new Round('astro',71),endo:new Round('endo',57),oligo:new Round('oligo',61)};

const BONE_KEYS = new Set(['osteocyte','osteoblast','msc','adipocyte','osteoclast','opg','rankl','sclerostin','catk','ctx1','piezo1','lrp56','casr','integrin','cx43']);
let labelsOn = true;
export function setLabels(on) { labelsOn = !!on; }
function cellAt(c,actor,x,y,scale,t,p={}){c.save();c.translate(x,y);c.scale(scale,scale);actor.draw(c,{t:t*1.8,...p});c.restore();}
function lab(c,text,x,y,o={}){if(!labelsOn&&!o.always)return;c.save();c.fillStyle=o.color||'#9aa58d';c.font=`${o.weight||400} ${o.size||7.5}px ${o.mono?'"Plex Mono",monospace':'"DM Sans",Arial,sans-serif'}`;c.textAlign=o.align||'center';c.textBaseline='middle';if(o.alpha!==undefined)c.globalAlpha=o.alpha;c.fillText(text,x,y);c.restore();}
function line(c,x0,y0,x1,y1,col='#dbe3d2',width=.8){c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.strokeStyle=col;c.lineWidth=width;c.stroke();}
function circle(c,x,y,r,col,stroke){c.beginPath();c.arc(x,y,r,0,TAU);if(col){c.fillStyle=col;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=.8;c.stroke();}}
function pillPath(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r);}
function renderSpecimen(c,key,t,h){
 if(REG[key]){REG[key].fn(c,t,h);return;}
 if(BONE_KEYS.has(key)){renderBone(c,key,t,h);return;}
 if(key.startsWith('gene:')){drawGene(c,t,key.split(':')[2]);return;}
 if(key==='astro'){
  cellAt(c,actors.astro,88,90,.96,t,{r:0});
  cellAt(c,actors.astroA,205,60,1.08,t,{r:1});
  cellAt(c,actors.astroS,201,150,.52,t,{r:.45,colR:0});
  lab(c,'RESTING',83,178,{mono:true});lab(c,'A1',237,115,{color:'#bb8168',mono:true});lab(c,'SERUM',201,183,{mono:true,size:6.8});
  return;
 }
 if(key==='micro'){
  cellAt(c,actors.micro,87,91,1.72,t,{r:0});
  cellAt(c,actors.microA,203,91,2.14,t,{r:1});
  for(let i=0;i<3;i++){const a=t*.35+i*TAU/3;glyph(c,['il1','tnf','c1q'][i],204+Math.cos(a)*32,92+Math.sin(a)*35,7,a,.45);}
  lab(c,'RAMIFIED',86,178,{mono:true});lab(c,'ACTIVATED',204,153,{mono:true,color:'#bb8168',size:6.8});
  return;
 }
 if(key==='neuron'){
  cellAt(c,actors.neuron,98,97,.82,t);
  cellAt(c,actors.pyr,203,90,.58,t);
  lab(c,'RGC',80,178,{mono:true});lab(c,'PYRAMIDAL',202,178,{mono:true,size:6.8});
  return;
 }
 if(key==='oligo'){
  c.save();c.translate(130,92);c.rotate(-.2);
  for(let j of [-1,1]){line(c,-104,j*34,104,j*34,'#b8cbd8',1.3);const x=((t*21+(j+1)*75)%200)-100;circle(c,x,j*34,1.7,'#e6f4ff');}
  c.restore();
  cellAt(c,actors.oligo,132,88,1.12,t);
  lab(c,'MYELIN SHEATHS',136,177,{mono:true});
  return;
 }
 if(key==='endo'){drawVesselSpec(c,t);return;}
 if(['il1','tnf','c1q','lps','unknown','other'].includes(key)){
  const type=key==='unknown'?'tox':key;
  const col=PC[type],x=130+Math.sin(t*.55+1)*4,y=70+Math.cos(t*.65)*4;
  circle(c,130,71,36,rgb(col,.065));
  c.save();c.setLineDash([1.5,5]);c.strokeStyle=rgb(col,.15);c.lineWidth=.7;c.beginPath();c.arc(130,71,49,0,TAU);c.stroke();c.restore();
  const sizes={il1:44,tnf:45,c1q:39,lps:40,tox:60,other:63};
  glyph(c,type,x,y,sizes[type],Math.sin(t*.3)*.12+(key==='tnf'?t*.06:0),1);
  glyph(c,type,65+Math.sin(t*.42+3)*6,41+Math.cos(t*.5)*7,13,-.5+t*.08,.22);
  glyph(c,type,194+Math.sin(t*.4)*6,102+Math.cos(t*.55+1)*7,10,t*.1+1,.23);
  if(key==='unknown')lab(c,'?',130,y+.2,{size:15,color:'#fff1e7',weight:500,always:true});
  return;
 }
 if(key==='nabs'){
  glyph(c,'ab',39,62+Math.sin(t*.65)*5,30,Math.sin(t*.3)*.1,1);
  ['il1b','tnfb','c1qb'].forEach((type,i)=>glyph(c,type,102+i*58,56+Math.sin(t*.7+i)*5,21,Math.sin(t*.4+i)*.08,1));
  ['IgG','IL-1α','TNF','C1q'].forEach((s,i)=>lab(c,s,[39,102,160,218][i],118,{mono:true,size:8}));
  return;
 }
 if(['lectin','secondary','cd45','o4','itgb5'].includes(key)){drawPanning(c,key,t);return;}
 if(key==='hbegf'){
  circle(c,130,66,35,'#edf3e5');
  c.save();c.translate(130+Math.sin(t*.5)*4,65+Math.cos(t*.6)*4);c.rotate(Math.sin(t*.3)*.12);
  const pts=[[-22,-3],[-10,-18],[10,-18],[24,0],[9,18],[-11,13]];
  pts.forEach((p,i)=>{const q=pts[(i+1)%pts.length];line(c,p[0],p[1],q[0],q[1],'#b8c89c',2.8)});
  pts.forEach((p,i)=>{circle(c,p[0],p[1],8+(i%2)*2,'#b4c890','#829f63');circle(c,p[0]-2,p[1]-2,2.2,'#eaf2d8');});
  c.restore();lab(c,'SCHEMATIC PROTEIN',130,120,{mono:true,size:7});return;
 }
 if(key==='serum'){
  c.save();c.translate(130,68+Math.sin(t*.6)*4);
  const g=c.createLinearGradient(-23,-33,25,35);g.addColorStop(0,'#eeddae');g.addColorStop(1,'#d3ba73');
  c.beginPath();c.moveTo(0,-43);c.bezierCurveTo(4,-25,32,1,29,18);c.bezierCurveTo(24,47,-26,48,-29,19);c.bezierCurveTo(-33,1,-5,-25,0,-43);c.closePath();c.fillStyle=g;c.fill();c.strokeStyle='#c9b77e';c.lineWidth=1;c.stroke();
  c.beginPath();c.ellipse(-12,12,5,11,-.35,0,TAU);c.fillStyle='#f9f1d9';c.globalAlpha=.65;c.fill();c.restore();
  for(let i=0;i<3;i++)circle(c,77+i*51+Math.sin(t*.5+i)*4,113+Math.cos(t*.4+i)*5,1.4,'#d8cfae');
  return;
 }
 if(key==='aqp4'){drawAQP(c,t);return;}
 if(key==='gfap'){
  cellAt(c,actors.astro,79,67,.72,t,{r:0,gK:2});cellAt(c,actors.astroA,190,67,1.15,t,{r:1,gK:1.55});
  lab(c,'RESTING',73,137,{mono:true,size:7});lab(c,'REACTIVE',194,137,{mono:true,size:7,color:'#bc866d'});return;
 }
 if(key==='caspase'){
  cellAt(c,actors.dying,154,70,.9,t,{d:.62+.1*Math.sin(t*.3)});
  const pulse=.6+.3*Math.sin(t*1.2);circle(c,71,57,16,`rgba(222,174,86,${.09+pulse*.04})`);
  for(let i=0;i<2;i++){const x=54+i*36,y=57+Math.sin(t*.7+i)*6;circle(c,x,y,11,'#e6c881','#c2a461');lab(c,String(i+2),x,y,{size:9,color:'#a88b4e',always:true});}
  line(c,94,60,120,67,'#d8caa6');lab(c,'APOPTOTIC ACTIVITY',129,132,{mono:true,size:7});return;
 }
 if(key==='tlr4'){drawTLR(c,t);return;}
 if(key==='myelin'){drawMyelin(c,t);return;}
 if(key==='synapse'){
  cellAt(c,actors.neuron,140,65,1.08,t,{d:.1+.06*Math.sin(t*.45)});
  lab(c,'SYNAPTIC PUNCTA',137,132,{mono:true,size:7});return;
 }
}
function drawVesselSpec(c,t){
 c.save();c.translate(130,97);c.rotate(-.28);
 const path=()=>{c.beginPath();c.moveTo(-116,0);c.bezierCurveTo(-50,-9,48,9,116,0);};
 path();c.strokeStyle='#aebebd';c.lineWidth=47;c.stroke();path();c.strokeStyle='#e0e7e2';c.lineWidth=44;c.stroke();path();c.strokeStyle='#f8faf6';c.lineWidth=32;c.stroke();
 for(let i=0;i<6;i++){let x=-98+i*39;const s=i%2?1:-1; c.beginPath();c.ellipse(x,s*19,12,3.5,.04,0,TAU);c.fillStyle='#9aaca8';c.fill();}
 for(let i=0;i<5;i++){const x=((t*13+i*51)%254)-127;circle(c,x,Math.sin(i*3)*6,1.6,'#c5d2ce');}
 c.restore();
 lab(c,'VESSEL WALL',69,37,{mono:true,size:7});line(c,79,46,88,65,'#becbb9');lab(c,'LUMEN',199,152,{mono:true,size:7});line(c,192,143,182,122,'#becbb9');
}
function drawPanning(c,key,t){
 pillPath(c,30,95,200,17,6);c.fillStyle=key==='itgb5'?'#eef5e7':'#f0f3ed';c.fill();line(c,34,96,226,96,'#d7e0ce',1);
 for(let i=0;i<13;i++){const x=38+i*15.2;if(key==='lectin')circle(c,x,94,1.9,'#a4b48e');else{c.save();c.translate(x,96);gAb(c,10,.8,key==='itgb5'?[136,166,112]:[170,185,155]);c.restore();}}
 const ty=key==='o4'?'oligo':key==='itgb5'?'astro':key==='lectin'?'endo':'micro';
 for(let i=0;i<3;i++){
  const x=82+i*49+Math.sin(t*.37+i)*1.6,y=74+Math.sin(t*.65+i*1.8)*2;
  rounds[ty].draw(c,x,y,t,{s:1.38,b:.65});
 }
 lab(c,key==='itgb5'?'POSITIVE SELECTION':'NEGATIVE SELECTION',130,128,{mono:true,size:7});
}
function drawAQP(c,t){
 const vx=98,vy=88,vr=31;
 circle(c,vx,vy,vr+3,'#f9fbf6','#aabbb8');circle(c,vx,vy,vr-3,'#edf2ec','#dce4d8');
 c.beginPath();c.arc(vx,vy,vr+11,-3.5,-.03);c.strokeStyle='#72a58e';c.lineWidth=12;c.lineCap='round';c.stroke();c.strokeStyle='#c5e1cf';c.lineWidth=8;c.stroke();
 c.beginPath();c.moveTo(122,51);c.quadraticCurveTo(160,43,188,30);c.strokeStyle='#72a58e';c.lineWidth=9;c.stroke();c.strokeStyle='#c5e1cf';c.lineWidth=6;c.stroke();
 circle(c,192,29,13,'#bcdbc7','#72a58e');c.beginPath();c.ellipse(193,29,6,5,.5,0,TAU);c.fillStyle='#6f9e82';c.fill();
 for(let i=0;i<31;i++){
  const an=-3.4+(i/30)*3.3,u=(t*.065+i*.031)%1;
  let home=[vx+Math.cos(an)*42,vy+Math.sin(an)*42],dest=[183+Math.sin(i*3)*8,34+Math.cos(i*2)*7];
  const travel=sstep(seg(u,.22,.85));const x=lerp(home[0],dest[0],travel),y=lerp(home[1],dest[1],travel);
  circle(c,x,y,1.55,'#f9fcf4','#98b1a8');
 }
 lab(c,'AQP4',199,90,{mono:true,size:8});line(c,184,84,168,58,'#b7c5aa');lab(c,'ASTROCYTIC ENDFOOT',109,133,{mono:true,size:7});
}
function drawTLR(c,t){
 for(let j=0;j<2;j++){
  const y=89+j*8;line(c,37,y,223,y,'#cbd9bf',1.3);
  for(let i=0;i<23;i++){circle(c,40+i*8,y,2.2,j?'#d6e0cb':'#dce6d0');}
 }
 for(let j=0;j<2;j++){
  c.save();c.translate(123+j*19,91);c.rotate((j?1:-1)*.05);
  c.beginPath();c.moveTo(0,20);c.lineTo(0,-12);c.quadraticCurveTo((j?1:-1)*22,-25,(j?1:-1)*14,-49);c.strokeStyle='#8fa97a';c.lineCap='round';c.lineWidth=8;c.stroke();
  c.strokeStyle='#c7d8b3';c.lineWidth=4;c.stroke();c.restore();
 }
 glyph(c,'lps',79+Math.sin(t*.5)*4,50+Math.cos(t*.7)*4,22,-.1,1);
 lab(c,'RECEPTOR SCHEMATIC',133,131,{mono:true,size:7});
}
function drawMyelin(c,t){
 const y=83;line(c,27,y,237,y,'#82a8bb',2.2);
 for(let i=0;i<4;i++){
  const x=38+i*50;pillPath(c,x,y-7,40,14,6);c.fillStyle='#c3bedf';c.fill();c.strokeStyle='#9e95c0';c.lineWidth=1;c.stroke();line(c,x+4,y-2,x+35,y-2,'#e5e0f1',1);
  const sx=128,sy=36;c.beginPath();c.moveTo(sx,sy);c.quadraticCurveTo(lerp(sx,x+21,.45),66,x+21,y-8);c.strokeStyle='#b3abd1';c.lineWidth=1.7;c.stroke();
 }
 circle(c,128,31,9,'#cbc5e5','#9f95c2');circle(c,128,31,4,'#9d94ba');
 const x=27+(t*34)%210;circle(c,x,y,2.2,'#edf8ff');circle(c,x-6,y,1.1,'#b4d0df');
 lab(c,'AXON',38,114,{mono:true,size:7});lab(c,'MYELIN',200,115,{mono:true,size:7});
}
function drawGene(c,t,gi){
 const col=gi==='1'?'#c58d73':gi==='2'?'#9d9fbc':'#91aa8b';
 for(let i=0;i<35;i++){
  const x=30+i*6,theta=i*.34-t*.6,ya=68+Math.sin(theta)*27,yb=68-Math.sin(theta)*27;
  line(c,x,ya,x,yb,'#dce4d3',1.2);circle(c,x,ya,2.6,col);circle(c,x,yb,2.6,'#cbd8be');
 }
 lab(c,'TRANSCRIPT READOUT · SCHEMATIC',130,128,{mono:true,size:7});
}

const BP = {
 osteocyte:TP.astro,
 osteoblast:{rim:[123,155,100],body:[202,220,174],fil:[246,253,231],nuc:[112,145,89]},
 msc:TP.oligo,
 adipocyte:{rim:[184,163,108],body:[234,224,182],fil:[255,251,226],nuc:[156,137,85]},
 osteoclast:{rim:[196,118,94],body:[240,199,178],fil:[255,243,231],nuc:[178,102,80]},
 opg:{rim:[111,151,129],body:[176,204,182],fil:[231,243,219],nuc:[108,145,117]},
 rankl:{rim:[186,122,103],body:[221,157,132],fil:[250,222,197],nuc:[167,112,91]},
 sost:{rim:[144,125,175],body:[190,171,211],fil:[242,232,249],nuc:[129,111,160]},
 piezo:{rim:[111,148,167],body:[174,203,215],fil:[233,245,246],nuc:[95,129,148]},
 lrp:{rim:[141,157,100],body:[202,213,159],fil:[244,248,221],nuc:[128,147,87]},
 casr:{rim:[134,125,165],body:[188,181,211],fil:[239,234,248],nuc:[120,110,151]},
 integrin:TP.astro,
 cx43:{rim:[102,145,139],body:[176,207,193],fil:[234,247,233],nuc:[89,128,122]},
 matrix:{rim:[168,160,148],body:[209,203,192],fil:[218,212,202],nuc:[146,138,126]}
};
let activityCues=true, strutThickness=1;
function bonePulse(t,ph=0){return activityCues? .5+.5*Math.sin(t*.34+ph):0;}
function tagBoneBranches(cell){let n=0;const tag=b=>{b.id=cell.id*1000+n++;b.kids.forEach(tag);};cell.prims.forEach(tag);return cell;}
function makeOsteocyte(seed){
 // Astrocyte-like arbor: same smooth tapered engine, but finer, longer, calmer
 // dendrites — the osteocyte’s many slender processes without the jaggedness.
 const cell=new Cell('astro',0,0,seed,1,{drift:.28,R0:8.6,pal:BP.osteocyte,tissue:true,len:36,w0:2.5});
 const calm=b=>{b.amp*=.38;b.freq*=.55;b.kids.forEach(calm);};
 cell.prims.forEach(calm);
 return cell;
}
function makeMSC(seed){
 const R=rng(seed),cell=new Cell('astro',0,0,seed,1,{drift:.65,R0:12,pal:BP.msc});cell.prims=[];
 for(let i=0;i<2;i++){
  const b=new Br({ang:i*Math.PI-.23,len:62+R()*8,w0:12,w1:.65,curv:(R()-.5)*.35,ph:R()*TAU,freq:.36,amp:.055,kind:'p'});
  for(let j=0;j<2;j++)b.kids.push(new Br({at:.31+j*.26,ang:(j?1:-1)*(i?-.7:.7),len:16+R()*9,w0:2.2,w1:.5,curv:(R()-.5)*.35,ph:R()*TAU,freq:.44,amp:.07,kind:'k'}));
  cell.prims.push(b);
 }
 return tagBoneBranches(cell);
}
const BONE_ACTORS={osteocyte:makeOsteocyte(8723),osteocyte2:makeOsteocyte(8731),msc:makeMSC(8849)};
function fillBoneShape(c,shape,pal,ex=1.25){
 paintMembrane(c,e=>{c.beginPath();shape(e);},ex,pal,3,65,.20);
}
function boneStrands(cell,t=0){
 const out=[],P={t:t*1.8,r:0,sprout:1,lenK:1,waveK:1,bead:0,d:0};
 for(const b of cell.prims)evalBr(b,Math.cos(b.ang)*cell.R0*.45,Math.sin(b.ang)*cell.R0*.45,0,P,out);
 return out;
}
function boneTube(c,pts,widths,pal,ex=1.15){
 const s={pts,ws:widths,n:widths.length-1};
 paintMembrane(c,e=>{c.beginPath();addStrand(c,s,e);},ex,pal,0,0,0);
}
function boneStroke(c,draw,pal,width=4){
 c.lineCap='round';c.lineJoin='round';c.beginPath();draw(c);c.strokeStyle=rgb(pal.rim);c.lineWidth=width+1.6;c.stroke();c.beginPath();draw(c);c.strokeStyle=rgb(pal.body);c.lineWidth=width;c.stroke();
}
function boneEllipse(c,x,y,rx,ry,rot,pal,ex=.9){
 c.save();c.translate(x,y);c.rotate(rot);fillBoneShape(c,e=>{c.ellipse(0,0,rx+e,ry+e,0,0,TAU);},pal,ex);c.restore();
}
function boneMembrane(c,y,x0=47,x1=213){
 c.save();c.fillStyle='#f0f3e9';c.fillRect(x0,y-3,x1-x0,12);
 for(let j=0;j<2;j++){line(c,x0,y+j*6,x1,y+j*6,'#d1dcc4',.8);for(let x=x0+3;x<x1-2;x+=7)circle(c,x,y+j*6,1.55,'#d8e2cd');}c.restore();
}
function drawOsteocyte(c,t,x=130,y=96,sc=1.05,context=true,actor=BONE_ACTORS.osteocyte){
 c.save();c.translate(x,y);c.scale(sc,sc);
 if(context){
  c.save();c.beginPath();c.ellipse(0,0,98,77,-.1,0,TAU);c.clip();
  const g=c.createRadialGradient(0,0,8,0,0,101);g.addColorStop(0,'#f6f1e0');g.addColorStop(1,'#fbfaf4');c.fillStyle=g;c.fillRect(-104,-82,208,164);
  for(let j=-2;j<=2;j++){c.beginPath();c.moveTo(-104,j*26-6);c.bezierCurveTo(-30,j*26-14,26,j*26+10,104,j*26-4);c.lineWidth=.7;c.strokeStyle='#e9dfbf';c.stroke();}c.restore();
 }
 // Canaliculi surround the original mathematical processes; they are not dendrites.
 const ss=boneStrands(actor,t);
 c.beginPath();for(const s of ss)addStrand(c,s,2.15);c.fillStyle='#ddcfaa';c.fill();
 c.beginPath();for(const s of ss)addStrand(c,s,1.4);c.fillStyle='#fbfcf6';c.fill();
 c.beginPath();c.ellipse(0,0,22.5,16.3,-.12,0,TAU);c.fillStyle='#fcfdf8';c.fill();c.strokeStyle='#d5c59a';c.lineWidth=.9;c.stroke();
 actor.draw(c,{t:t*1.8,r:0,colR:0,gK:1.25});
 const p=bonePulse(t,.5);if(p>.1){c.save();c.globalAlpha=.04*p;circle(c,0,0,12,'#4b9d8c');c.restore();}
 c.restore();
}
function drawOsteoblast(c,x,y,sc,t,seed=0){
 const ph=seed*1.7,p=bonePulse(t,ph),pal=palMix(BP.osteoblast,{rim:[106,150,105],body:[186,217,165],fil:BP.osteoblast.fil,nuc:BP.osteoblast.nuc},p*.35);
 c.save();c.translate(x,y);c.scale(sc,sc);
 const shape=ex=>{const R=21+ex;for(let i=0;i<=64;i++){const a=-i/64*TAU,ca=Math.cos(a),sa=Math.sin(a),u=(Math.sign(ca)*Math.pow(Math.abs(ca),.58)),v=(Math.sign(sa)*Math.pow(Math.abs(sa),.58));const wx=1+.012*Math.sin(t*.65+ph+a*3);const xx=u*R*.88*wx,yy=v*R; i?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.closePath();};
 fillBoneShape(c,shape,pal,1.25);
 c.beginPath();c.ellipse(.6,-1.7,7.6,8.6,.12,0,TAU);c.fillStyle=rgb(pal.nuc,.85);c.fill();c.strokeStyle=rgb(pal.rim,.25);c.lineWidth=.7;c.stroke();
 c.strokeStyle=rgb(pal.fil,.8);c.lineWidth=.8;
 for(let i=0;i<3;i++){c.beginPath();c.moveTo(-12,9+i*2.8);c.quadraticCurveTo(0,6+i*3,12,10+i*2.7);c.stroke();}
 for(let i=0;i<5;i++)circle(c,-11+i*5.1,17+Math.sin(i*3+ph)*1.1,.7,'#f1f7df');c.restore();
}
// Osteoclast: dome-shaped multinucleated resorber over a ruffled border.
// Bone faces +y; the cell sits in a scalloped resorption pit (Howship's lacuna).
function drawOsteoclast(c,t,x=0,y=0,sc=1,seed=0){
 const pal=BP.osteoclast,ph=seed*1.9,p=bonePulse(t,ph);
 c.save();c.translate(x,y+Math.sin(t*.42+ph)*1.2);c.scale(sc,sc);
 // Ruffled border: deeply undulating membrane band over the bone
 c.beginPath();
 const x0=-20.5,x1=20.5,base=13,N=9;
 c.moveTo(x0,base);
 for(let k=0;k<N;k++){
  const xa=x0+(x1-x0)*k/N,xb=x0+(x1-x0)*(k+1)/N,xm=(xa+xb)/2;
  const amp=4.6+1.5*Math.sin(t*.75+k*1.42+ph);
  c.quadraticCurveTo(xm,base+amp,xb,base);
 }
 c.lineTo(x1,base+2.5);c.quadraticCurveTo(0,base+6.5,x0,base+2.5);c.closePath();
 c.fillStyle=rgb(pal.body);c.fill();c.strokeStyle=rgb(pal.rim);c.lineWidth=1;c.stroke();
 // Dome body (dome-shaped, slightly irregular contour)
 c.beginPath();
 c.moveTo(-20.8,14);
 c.arc(0,2,24,2.618,6.807,false);
 c.closePath();
 const g=c.createRadialGradient(-6,-8,4,0,0,26);g.addColorStop(0,rgb(mix(pal.body,[255,246,236],.4)));g.addColorStop(1,rgb(pal.body));
 c.fillStyle=g;c.fill();c.strokeStyle=rgb(pal.rim);c.lineWidth=1.1;c.stroke();
 // Sealing (clear) zone: organelle-free actin-rich ring at the ruffle base
 c.beginPath();c.moveTo(-20.6,11.6);c.quadraticCurveTo(0,14.4,20.6,11.6);
 c.strokeStyle='rgba(255,241,229,.9)';c.lineWidth=2.6;c.stroke();
 // Horseshoe-arranged nuclei (multinucleated)
 [[-11.5,-2,.3],[11.5,-2,-.3],[-5,-11.5,.5],[5,-11.5,-.5]].forEach(([nx,ny,rot])=>{
  c.save();c.translate(nx,ny);c.rotate(rot);
  c.beginPath();c.ellipse(0,0,4.7,3.5,0,0,TAU);c.fillStyle=rgb(pal.nuc,.92);c.fill();c.strokeStyle=rgb(pal.rim,.3);c.lineWidth=.6;c.stroke();
  c.beginPath();c.ellipse(-1.1,-.9,1.8,1.2,-.3,0,TAU);c.fillStyle='rgba(255,255,255,.28)';c.fill();
  c.restore();
 });
 // Foamy vacuoles (vesicle-rich cytoplasm)
 for(let i=0;i<6;i++){const a=i*2.399+ph,r=9+(i%3)*4.2;circle(c,Math.cos(a)*r,Math.sin(a)*r*.7-2,1.1+(i%3)*.5,'rgba(255,252,246,.8)');}
 // Resorption cue: acid front + drifting protons into the pit
 if(p>0){
  c.beginPath();c.ellipse(0,19.5,18,5,0,0,TAU);c.fillStyle=`rgba(201,116,84,${.07+p*.09})`;c.fill();
  for(let i=0;i<4;i++){const u=(t*.16+i*.25)%1;circle(c,-12+i*8+Math.sin(i*2.7)*2,15.5+u*11,1,`rgba(196,106,74,${Math.sin(u*Math.PI)*.55})`);}
 }
 c.restore();
}
function drawMarrowAdipocyte(c,t,x=130,y=93,sc=1){
 c.save();c.translate(x,y);c.scale(sc,sc);
 const r=42+.24*Math.sin(t*.45),pal=BP.adipocyte;
 const fn=th=>1+.025*Math.sin(th*3+.5)+.012*Math.sin(th*5+t*.25);
 fillBoneShape(c,ex=>addSoma(c,r,fn,1,ex),pal,1.2);
 c.beginPath();c.ellipse(-2,-1,r-6.5,r-6.7,-.04,0,TAU);
 const g=c.createRadialGradient(-7,-7,4,0,0,42);g.addColorStop(0,'#f7efd4');g.addColorStop(1,rgb(mix([236,222,168],[230,210,148],bonePulse(t,2)*.16)));c.fillStyle=g;c.fill();c.strokeStyle='#ddcd97';c.lineWidth=.7;c.stroke();
 c.beginPath();c.ellipse(36.5,3.5,3.7,10,-.1,0,TAU);c.fillStyle=rgb(pal.nuc,.9);c.fill();
 c.beginPath();c.ellipse(-15,-15,6,11,.65,0,TAU);c.fillStyle='rgba(255,254,244,.28)';c.fill();c.restore();
}
function drawBoneMSCs(c,t){
 c.save();c.translate(130,99);c.rotate(-.25);c.scale(1.03,.67);BONE_ACTORS.msc.draw(c,{t:t*1.6,r:0,gK:1.1});c.restore();
 lab(c,'CULTURED SPINDLE FORM',130,184,{mono:true,size:7});
}
function drawSixPropeller(c,x,y,r,pal,t=0,blades=6){
 c.save();c.translate(x,y);
 for(let k=0;k<blades;k++){const a=k*TAU/blades; c.save();c.rotate(a);boneEllipse(c,r*.42,0,r*.56,r*.23,.2,pal,.55);c.restore();}
 circle(c,0,0,r*.24,rgb(mix(pal.body,pal.fil,.25)),rgb(pal.rim,.55));c.restore();
}
function drawRANKL(c,x,y,s,t,pal=BP.rankl){
 c.save();c.translate(x,y);c.rotate(Math.sin(t*.26)*.055);c.scale(s,s);
 for(let k=0;k<3;k++){c.save();c.rotate(k*TAU/3-Math.PI/2);boneEllipse(c,12.5,0,20,12.1,.13,pal,.9);c.beginPath();c.moveTo(6,-4);c.quadraticCurveTo(14,-6,22,0);c.strokeStyle=rgb(pal.fil,.4);c.lineWidth=.65;c.stroke();c.restore();}
 c.restore();
}
function drawOPG(c,t){
 const p=bonePulse(t,1),pal=BP.opg;
 c.save();c.translate(130,77+Math.sin(t*.3)*1.6);
 for(let side of [-1,1]){
  const centers=[];
  for(let i=0;i<4;i++)centers.push([side*(12+i*5.5+Math.sin(t*.27)*.5),10-i*14]);
  boneStroke(c,cc=>{cc.moveTo(side*5,32);cc.bezierCurveTo(side*11,20,side*18,-1,side*30,-34);},pal,6);
  centers.forEach((q,i)=>boneEllipse(c,q[0],q[1],4.5,7.7,side*.21,pal,.7));
  boneEllipse(c,side*5,24,6,8,-side*.12,pal,.8);
 }
 line(c,-4,30,4,30,'#bead77',1.5);circle(c,0,31.3,1.2,'#cbb980');
 c.restore();
 // A small bound-ligand cue, not an antibody conversion or a measured binding trace.
 const q=activityCues?sstep(p):0;
 drawRANKL(c,130,35-12*(1-q),.36,t,palMix(BP.rankl,GRAYP,q*.45));
 lab(c,'SOLUBLE DIMER',130,136,{mono:true,size:7});
}
function drawSclerostin(c,t){
 const pal=BP.sost,p=activityCues?Math.sin(t*.55)*2:0;
 c.save();c.translate(132,73);
 const fingers=[cc=>{cc.moveTo(-3,-5);cc.bezierCurveTo(13,-25,41,-31,45,-17);cc.bezierCurveTo(45,-7,18,-5,-3,-5);},cc=>{cc.moveTo(-1,6);cc.bezierCurveTo(21,7,43,6,41,18);cc.bezierCurveTo(38,28,12,24,-1,6);},cc=>{cc.moveTo(-8,-5);cc.bezierCurveTo(-31,-22-p,-45,-3,-32,11+p);cc.bezierCurveTo(-22,22+p,-8,10,-8,2);}];
 fingers.forEach((fn,i)=>boneStroke(c,fn,pal,i===2?3.5:4));
 boneEllipse(c,-3,0,10,7,-.12,pal,.9);
 const tails=[cc=>{cc.moveTo(-2,-6);cc.bezierCurveTo(0,-19,10,-15,12,-31);},cc=>{cc.moveTo(4,6);cc.bezierCurveTo(13,22,28,32,43,29);}];
 tails.forEach(fn=>boneStroke(c,fn,{rim:[180,161,202],body:[218,204,230]},1.2));
 for(let i=0;i<3;i++){const yy=-3+i*3;line(c,-7,yy,3,yy+3,'#b7a779',.85);}
 c.restore();lab(c,'3 LOOPS · CYSTINE KNOT',130,137,{mono:true,size:7});
}
function drawCatK(c,t){
 const p=bonePulse(t,.8),pal=palMix(CORAL,{rim:[190,120,87],body:[236,180,145],fil:CORAL.fil,nuc:CORAL.nuc},p*.3);
 c.save();c.translate(124,73);c.rotate(Math.PI/2);
 const shape=ex=>{
  c.moveTo(5,-2-ex*.2);c.bezierCurveTo(-2,-15,-2,-30-ex,-18,-31-ex);c.bezierCurveTo(-48-ex,-30,-44-ex,20,-21,29+ex);c.bezierCurveTo(-9,35+ex,13,30+ex,28,19+ex);c.bezierCurveTo(46+ex,4,35+ex,-23,22,-27-ex);c.bezierCurveTo(15,-29-ex,12,-12-ex,5,-2-ex*.2);c.closePath();
 };
 fillBoneShape(c,shape,pal,1.2);
 c.beginPath();c.moveTo(4,-1);c.quadraticCurveTo(0,12,1,23);c.strokeStyle=rgb(pal.rim,.3);c.lineWidth=.85;c.stroke();
 circle(c,5,-1,2.2,'#e1bf70');circle(c,5,-1,6,`rgba(224,181,89,${.03+.1*p})`);
 c.restore();
 for(let j=0;j<2;j++){
  const dx=activityCues?p*4:0;
  c.beginPath();for(let i=0;i<8;i++){const x=153+i*4.9+dx,y=76+j*4+Math.sin(i*.7+t*.3)*1.3;i?c.lineTo(x,y):c.moveTo(x,y);}c.lineWidth=1.25;c.strokeStyle=j?'#d5c3a1':'#bfb19b';c.stroke();
 }
 lab(c,'ACTIVE-SITE CLEFT',130,137,{mono:true,size:7});
}
function drawCTX(c,t){
 const p=bonePulse(t,1.4),pal={rim:[159,151,128],body:[211,201,171],fil:[248,242,218],nuc:[141,134,114]};
 c.save();c.translate(129,75);c.rotate(-.16+Math.sin(t*.25)*.035);
 for(let j=0;j<2;j++){
  const pts=[];for(let i=0;i<8;i++)pts.push(-34+i*9.5,j*11-6+Math.sin(i*.65+j)*5+(j?1:-1)*p*1.3);
  boneTube(c,pts,Array(8).fill(2.5),pal,.65);
  for(let i=0;i<8;i++)circle(c,pts[2*i],pts[2*i+1],2.25,rgb(mix(pal.body,pal.rim,.09)),rgb(pal.rim,.5));
 }
 line(c,-8,-3,-10,11,'#bdab76',1.8);
 // Detached short end; no atomistic sequence or triple-helix geometry is implied.
 boneTube(c,[42+p*6,-3,50+p*6,-6,58+p*6,-5],[2.2,2.2,1.6],pal,.65);
 c.restore();lab(c,'C-TERMINAL FRAGMENT',130,137,{mono:true,size:7});
}
function drawPiezo(c,t){
 // Real architecture (Ge 2015; Guo & Mackinnon 2016): three BROAD, curved
 // wing-like blades sweeping around a central cap that encloses the pore,
 // with beam-like segments bridging each blade to the cap. Top view.
 const pal=BP.piezo,p=bonePulse(t,.2);
 c.save();c.translate(130,82);
 const beams=[];
 for(let k=0;k<3;k++){
  const b=k*TAU/3+Math.PI/2+.12;
  beams.push([Math.cos(b)*15,Math.sin(b)*15,Math.cos(b)*27,Math.sin(b)*27]);
 }
 for(const bm of beams)boneTube(c,[bm[0],bm[1],bm[2],bm[3]],[5,5.6],{rim:mix(pal.rim,pal.body,.25),body:pal.body},.8);
 const blades=[];
 for(let k=0;k<3;k++){
  const A=k*TAU/3+Math.PI/2;
  const pts=[],ws=[],m=26;
  for(let i=0;i<=m;i++){
   const u=i/m;
   const a=A+0.12+u*1.86-p*.028*Math.sin(u*3.1+k*2);           // ~106° swept wing
   const r=(13+42*Math.pow(u,.92))*(1+p*.02*Math.sin(u*2.2));
   pts.push(Math.cos(a)*r,Math.sin(a)*r);
   ws.push(3.4+15.5*Math.pow(Math.sin(Math.PI*Math.min(1,u*1.04)),.62)*(1+p*.05*Math.sin(u*2.6+k*2)));
  }
  blades.push({pts,ws,n:m});
 }
 c.beginPath();for(const s of blades)addStrand(c,s,1.4);c.fillStyle=rgb(pal.rim);c.fill();
 c.beginPath();for(const s of blades)addStrand(c,s,0);c.fillStyle=rgb(pal.body);c.fill();
 for(const s of blades){   // faint fold lines along each wing (repeated TM units)
  for(const f of [-.5,0,.5]){
   c.beginPath();
   for(let i=3;i<=s.n-3;i++){
    const j=Math.max(0,i-1),j2=Math.min(s.n,i+1);
    const dx=s.pts[j2*2]-s.pts[j*2],dy=s.pts[j2*2+1]-s.pts[j*2+1],l=Math.hypot(dx,dy)||1;
    const xx=s.pts[i*2]-dy/l*s.ws[i]*f,yy=s.pts[i*2+1]+dx/l*s.ws[i]*f;
    i===3?c.moveTo(xx,yy):c.lineTo(xx,yy);
   }
   c.strokeStyle=rgb(pal.fil,.5);c.lineWidth=.7;c.stroke();
  }
 }
 // Central cap with the ion-conducting pore
 circle(c,0,0,15.5,rgb(pal.rim));circle(c,0,0,13.5,rgb(pal.body));
 circle(c,0,0,5.2+p*.8,'#f6faf4',rgb(pal.rim,.7));
 circle(c,.6,-.2,1.4,`rgba(186,155,76,${p*.4})`);
 c.restore();lab(c,'TOP VIEW · 3 BLADES · CENTRAL CAP',130,165,{mono:true,size:7});
}
function drawLRP(c,t){
 const pal=BP.lrp,p=bonePulse(t,2.4),centers=[[111,34],[141,57],[116,82],[143,107]].map((a,i)=>[a[0]+(i<3?Math.sin(t*.28+i)*.7:0),a[1]]);
 boneMembrane(c,139,53,207);
 boneStroke(c,cc=>{cc.moveTo(143,152);cc.lineTo(143,118);for(let i=3;i>=0;i--){const q=centers[i];cc.lineTo(q[0],q[1]);}},pal,3);
 centers.forEach((q,i)=>{drawSixPropeller(c,q[0],q[1],12.8,pal);if(i<3){const z=centers[i+1];boneEllipse(c,lerp(q[0],z[0],.58),lerp(q[1],z[1],.58),3.2,4.7,.6,pal,.6);}});
 for(let i=0;i<3;i++)boneEllipse(c,143,123+i*5.8,3.4,2.25,0,pal,.6);
 lab(c,'4 PROPELLER–EGF PAIRS',130,167,{mono:true,size:6.7});
}
// One toothed flytrap lobe of the CaSR VFT module. s=-1 upper jaw, +1 lower.
// Origin = hinge point; the cleft runs along y=0 and the teeth reach across it.
function flytrapJaw(c,pal,s){
 c.beginPath();c.moveTo(0,0);
 if(s<0){
  c.bezierCurveTo(-7,-4,-9,-14,-3,-19);
  c.bezierCurveTo(2,-23,11,-20,14,-12);
  c.bezierCurveTo(16,-7,14,-3,11,-1);
  c.quadraticCurveTo(4,-2.6,0,0);
 }else{
  c.bezierCurveTo(-6,3.5,-8,12,-2.5,16.5);
  c.bezierCurveTo(2,20,10,17.5,12.5,10.5);
  c.bezierCurveTo(14,6,13,2.5,10,1);
  c.quadraticCurveTo(4,2.2,0,0);
 }
 c.closePath();
 c.fillStyle=rgb(pal.body);c.fill();c.strokeStyle=rgb(pal.rim);c.lineWidth=1.1;c.stroke();
 c.beginPath();
 if(s<0){c.moveTo(-2,-4);c.bezierCurveTo(-5,-8,-5,-13,-1,-16);}
 else{c.moveTo(-2,3.5);c.bezierCurveTo(-4.5,7,-4.5,11.5,-1,14.5);}
 c.strokeStyle=rgb(pal.fil,.65);c.lineWidth=.8;c.stroke();
 const yb=s*.9,yt=-s*2.1;
 for(const tx of [-7.5,-3.5,1,5.5]){
  c.beginPath();c.moveTo(tx-1.6,yb);c.lineTo(tx,yt);c.lineTo(tx+1.6,yb);c.closePath();
  c.fillStyle=rgb(pal.body);c.fill();c.strokeStyle=rgb(pal.rim,.8);c.lineWidth=.7;c.stroke();
 }
}
function drawCaSR(c,t){
 const pal=BP.casr,p=bonePulse(t,1.6);
 boneMembrane(c,129,48,212);
 const close=.09+p*.15;   // lobe closure (illustrative cue for the real ~29° LB2 rotation)
 for(let side of [-1,1]){
  const x=130+side*(24-p*1.2),cy=76;
  // Seven-transmembrane bundle, retained as a schematic seven-helix comb.
  for(let i=0;i<7;i++){const xx=x-9.5+i*3.1;boneTube(c,[xx,112,xx+side*.4,129],[1.7,1.7],{rim:[157,149,181],body:[202,195,221]},.45);}
  // Cysteine-rich domain: small bead chain between VFT and TMD.
  for(let i=0;i<3;i++)boneEllipse(c,x+Math.sin(i*1.2+side*2)*1.8,96+i*6.5,3.6,3.1,0,pal,.6);
  // Bilobed Venus-flytrap module: two toothed jaws hinged at the outer side.
  c.save();c.translate(x,cy);
  if(side>0)c.scale(-1,1);   // right subunit mirrors the trap; the dimer compactes on closure
  c.save();c.translate(-13,0);c.rotate(close);flytrapJaw(c,pal,-1);c.restore();
  c.save();c.translate(-13,0);c.rotate(-close*.55);flytrapJaw(c,pal,1);c.restore();
  circle(c,-13,0,2.7,rgb(pal.body),rgb(pal.rim,.8));   // hinge joint
  c.restore();
  circle(c,x+2,76,2.1,`rgba(205,171,80,${.55+p*.4})`); // Ca²⁺ held in the cleft
 }
 const ix=196+Math.sin(t*.3)*1.2,iy=38+Math.cos(t*.31)*1.2;
 circle(c,ix,iy,2.4,'#d4b878');lab(c,'Ca²⁺',211,38,{size:7,color:'#b09a64'});
 lab(c,'VFT DIMER · PAIRED 7-TM',130,168,{mono:true,size:6.7});
}
function drawIntegrin(c,t){
 const p=bonePulse(t,.6),aPal=BP.integrin,bPal=BP.casr;boneMembrane(c,133,48,212);
 const head={x:111+p*10,y:49-p*7};
 const chains=[{x:121,dx:-12,pal:aPal},{x:142,dx:8,pal:bPal}];
 chains.forEach((d,i)=>{
  const pts=[d.x,148,d.x,124,d.x+d.dx,103,d.x+d.dx-7+p*4,80,head.x+i*19,head.y+12];
  boneTube(c,pts,[3.7,4.5,5.9,6.6,8.1],d.pal,1);
  for(let j=1;j<=3;j++)boneEllipse(c,pts[j*2],pts[j*2+1],4.9,6.6,(i?1:-1)*.2,d.pal,.7);
 });
 drawSixPropeller(c,head.x,head.y,13.6,aPal,0,7);boneEllipse(c,head.x+21,head.y+3,11.2,12.1,.15,bPal,.8);
 lab(c,'α',119,156,{size:8,color:'#82a393'});lab(c,'β',145,156,{size:8,color:'#a497bc'});lab(c,'HINGED α / β HETERODIMER',130,172,{mono:true,size:6.7});
}
function drawCx43(c,t){
 const pal=BP.cx43,p=bonePulse(t,2.7);boneMembrane(c,59,47,166);boneMembrane(c,106,47,166);
 // Side-view cutaway: three visible front columns, other subunits are behind.
 for(let j=0;j<3;j++){
  const x=93+j*13;boneTube(c,[x,49,x-1,68,x+2,81],[6.8,7.3,5.8],pal,1);
  boneTube(c,[x+2,82,x-1,99,x,123],[5.8,7.3,6.8],pal,1);
 }
 pillPath(c,109,47,8.3,78,3);c.fillStyle='#f3f9ef';c.fill();
 const u=(t*.16)%1;if(activityCues)circle(c,113,52+u*67,1.65,`rgba(169,150,97,${Math.sin(u*Math.PI)*.75})`);
 circle(c,113,82,3.2-p*.55,'#eff6eb');
 // Top view: the count is explicit, rather than a generic many-petalled pore.
 c.save();c.translate(207,58);for(let k=0;k<6;k++){const a=k*TAU/6;boneEllipse(c,Math.cos(a)*13,Math.sin(a)*13,5.2,8.1,a,pal,.6);}circle(c,0,0,6.7,'#fbfdf8',rgb(pal.rim,.5));c.restore();
 lab(c,'TOP VIEW',207,91,{mono:true,size:6});lab(c,'2 × 6 CONNEXINS',130,165,{mono:true,size:7});
}
function renderBone(c,key,t,h){
 if(key==='osteocyte'){
  drawOsteocyte(c,t,130,94,1.02,true);
  lab(c,'LACUNA',203,48,{mono:true,size:7});line(c,187,51,149,82,'#c6b98f',.65);
  lab(c,'CANALICULI',63,174,{mono:true,size:7});line(c,75,166,95,141,'#c6b98f',.65);return;
 }
 if(key==='osteoblast'){
  c.save();c.beginPath();c.moveTo(35,127);c.quadraticCurveTo(130,126,225,130);c.lineTo(225,147);c.quadraticCurveTo(130,144,35,145);c.closePath();c.fillStyle='#f2e7c7';c.fill();line(c,36,128,225,131,'#c7b788',.9);c.strokeStyle='#e1d0a5';c.lineWidth=.6;c.beginPath();c.moveTo(36,137);c.quadraticCurveTo(130,135,225,140);c.stroke();c.restore();
  for(let i=0;i<3;i++)drawOsteoblast(c,75+i*54,103.5+i*.4,1.16,t,i+2);
  if(activityCues)for(let i=0;i<7;i++){const u=(t*.13+i/7)%1,x=68+i*20;circle(c,x,125+u*13,.85,`rgba(173,163,99,${Math.sin(u*Math.PI)*.5})`);}
  lab(c,'OSTEOID SEAM',130,174,{mono:true,size:7});return;
 }
 if(key==='osteoclast'){
  // Bone slab with a scalloped resorption pit (Howship's lacuna)
  c.save();
  c.beginPath();
  c.moveTo(22,118);c.lineTo(74,118);
  c.quadraticCurveTo(110,146,146,118);
  c.lineTo(238,118);c.lineTo(238,158);c.lineTo(22,158);c.closePath();
  c.fillStyle=rgb(BP.matrix.body);c.fill();c.strokeStyle=rgb(BP.matrix.rim);c.lineWidth=1.3;c.stroke();
  for(let i=0;i<4;i++){
   c.beginPath();
   for(let x=26;x<236;x+=8){
    const dip=Math.max(0,1-Math.abs(x-110)/40)*(146-122)*.55;
    const y=126+i*7.5+Math.sin(x*.14+i)*1.6+dip;
    x===26?c.moveTo(x,y):c.lineTo(x,y);
   }
   c.strokeStyle='#e6d7ab';c.lineWidth=.7;c.stroke();
  }
  c.restore();
  drawOsteoclast(c,t,110,110,1.06,3);
  if(activityCues)lab(c,'H⁺',152,142,{size:6.5,color:'#a8624a',always:true});
  lab(c,'HOWSHIP’S LACUNA · RESORPTION PIT',110,182,{mono:true,size:7});
  lab(c,'RUFFLED BORDER',44,86,{mono:true,size:7});line(c,58,82,88,116,'#c6b98f',.65);
  lab(c,'SEALING ZONE',205,84,{mono:true,size:7});line(c,196,88,142,118,'#c6b98f',.65);
  return;
 }
 if(key==='msc'){drawBoneMSCs(c,t);return;}
 if(key==='adipocyte'){
  drawMarrowAdipocyte(c,t,129,95,1.28);
  lab(c,'LIPID DROPLET',83,174,{mono:true,size:7});line(c,93,164,113,120,'#ccb986',.65);
  lab(c,'NUCLEUS',205,133,{mono:true,size:7});line(c,189,126,177,107,'#ccb986',.65);return;
 }
 if(key==='opg'){drawOPG(c,t);return;}
 if(key==='rankl'){drawRANKL(c,130+Math.sin(t*.3)*1.5,73+Math.cos(t*.4)*1.5,1.17,t);lab(c,'TRIMERIC LIGAND DOMAIN',130,137,{mono:true,size:6.8});return;}
 if(key==='sclerostin'){drawSclerostin(c,t);return;}
 if(key==='catk'){drawCatK(c,t);return;}
 if(key==='ctx1'){drawCTX(c,t);return;}
 if(key==='piezo1'){drawPiezo(c,t);return;}
 if(key==='lrp56'){drawLRP(c,t);return;}
 if(key==='casr'){drawCaSR(c,t);return;}
 if(key==='integrin'){drawIntegrin(c,t);return;}
 if(key==='cx43'){drawCx43(c,t);return;}
}



/* ---- public API ---- */
export { activityCues };
export function setActivityCues(on) { activityCues = !!on; }
const DESIGN_H = k => REG[k] ? REG[k].h :
  ['osteocyte','osteoblast','msc','adipocyte','osteoclast'].includes(k) ? 200 :
  ['astro','micro','neuron','oligo','endo'].includes(k) ? 190 : 145;
/* Colour slots are paths into the engine's palettes, e.g. 'TP.astro.rim', 'CORAL.body', 'PC.il1'. */
/* ---- extension API: bone.js / molecules.js register specimens and palettes here ---- */
export const NP = {};                     // palettes for added specimens (colour-editable as 'NP.<name>.<field>')
const REG = {};
export function registerSpecimen(key, h, fn) { REG[key] = { h, fn }; }
/** Draw a registered or built-in specimen in design coordinates (used by the v2 recolour wrappers). */
export function renderOriginal(c, key, t, h) { renderSpecimen(c, key, t, h); }
export const specimenHeight = k => DESIGN_H(k);
export const isDark = () => DARK;
export const getStyle = () => STYLE;
export const labelsShown = () => labelsOn;
export const E = { TAU, clamp, lerp, seg, sstep, ease, eOut, bump, rng, hash, mix, rgb, angd, Cell, Br, evalBr, addStrand, addSoma, addTw, paintMembrane, palMix, lab, line, circle, pillPath, glyph, GLYPHS, gIL1, gTNF, gAb, PC, TP, CORAL, GRAYP, BP, NP };
const ROOTS = { TP, CORAL, GRAYP, PC, BP, NP };
function resolve(path) {
  const parts = path.split('.'); let o = ROOTS[parts[0]];
  for (let i = 1; i < parts.length - 1; i++) o = o?.[parts[i]];
  return o ? [o, parts[parts.length - 1]] : null;
}
export function getColor(path) { const r = resolve(path); return r ? r[0][r[1]] : null; }
/** Run fn with some palette colours swapped (rgb arrays), restoring them afterwards. */
function withColors(colors, fn) {
  const undo = [];
  if (colors) for (const [path, v] of Object.entries(colors)) {
    const r = resolve(path); if (!r || !v) continue;
    undo.push([r[0], r[1], r[0][r[1]]]); r[0][r[1]] = v;
  }
  try { fn(); } finally { for (let i = undo.length - 1; i >= 0; i--) undo[i][0][undo[i][1]] = undo[i][2]; }
}
/** Draw specimen `key` at time t into a w×h CSS-pixel area. o: { style, dark, colors } */
export function drawSpecimen(c, key, t, w, h, o = {}) {
  const designH = DESIGN_H(key);
  const sc = Math.min(w / 260, h / designH);
  STYLE = o.style || 'atlas'; DARK = !!o.dark; EVID = EVIDENCE[o.evidence] || null;
  c.save(); c.translate(w / 2, h / 2); c.scale(sc, sc); c.translate(-130, -designH / 2);
  { const m = c.getTransform(); EVID_K0 = Math.hypot(m.a, m.b) || 1; }
  if (EVID) c.globalAlpha *= EVID.fill;
  try { withColors(o.colors, () => STYLE === 'clay' ? withClay(c, DARK, () => renderSpecimen(c, key, t, designH)) : renderSpecimen(c, key, t, designH)); }
  finally { c.restore(); STYLE = 'atlas'; EVID = null; }
}
