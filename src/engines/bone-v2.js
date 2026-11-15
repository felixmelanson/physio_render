// @ts-nocheck
/* REVISION.md v2 assets. The originals in bone.js stay untouched; everything here registers under a new key.
   - osteocyte-v2: buildOsteoV2 (dense, hair-thin, near-straight processes, elongated body) embedded in a
     lens-shaped lacuna with canaliculi; four states at one scale: loaded, unloaded, apoptotic, perilacunar remodelling
   - CTX-I (crimson, from cathepsin K) and ICTP (bronze, from MMPs) glyphs, plus cathepsin K, MMP and TRAP
   - resorptionV2 and the osteoclast scenes rebuilt on it, so the two-enzyme story shows inside the resorption itself */
import { E, NP, registerSpecimen, isDark } from './atlas.js';
import { th, thLine, dom, rod, bilayer, shape, loopT } from './kit.js';
import { withPalettes } from './semantic.js';
import { caWaves, drawBone, bay, drawOsteoclast, osteoclastIsoPts, OC, OC_NUCLEI } from './bone.js';

const { TAU, clamp, lerp, sstep, ease, hash, mix, rgb, Cell, Br, evalBr, addStrand, lab, circle, gTNF, GLYPHS } = E;
const L = (c, s, x, y, o = {}) => lab(c, s, x, y, { mono: true, size: 6.2, ...o });
const ink = col => rgb(thLine(col));

/* ================================================================ glyphs */
/** CTX-I: two short α1 C-telopeptide stubs tied by a crosslink. Compact ladder, crimson (cathepsin K's colour). */
function gCTX(c, s, a = 1) {
  if (a <= .01) return;
  const P = NP.ctxV2; c.save(); c.globalAlpha *= a; c.lineCap = 'round'; c.lineJoin = 'round';
  for (const [y0, dir] of [[-s * .19, 1], [s * .19, -1]]) {
    const p = []; for (let k = 0; k < 4; k++) p.push(-s * .4 + k * s * .27, y0 + dir * Math.sin(k * 1.3) * s * .05);
    c.beginPath(); c.moveTo(p[0], p[1]); for (let k = 1; k < 4; k++) c.lineTo(p[k * 2], p[k * 2 + 1]);
    c.lineWidth = s * .11; c.strokeStyle = ink(P.rim); c.stroke();
    for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(p[k * 2], p[k * 2 + 1], s * .11, 0, TAU); c.fillStyle = rgb(P.body); c.fill(); c.lineWidth = Math.max(.4, s * .045); c.strokeStyle = ink(P.rim); c.stroke(); }
  }
  c.beginPath(); c.moveTo(-s * .13, -s * .15); c.lineTo(-s * .13, s * .15); c.lineWidth = s * .1; c.strokeStyle = ink(P.nuc); c.stroke();   // pyridinoline crosslink
  c.restore();
}
/** ICTP: a longer helical stub with three chains and a trivalent crosslink knot. Rod-and-knot, bronze (MMPs' colour). */
function gICTP(c, s, a = 1) {
  if (a <= .01) return;
  const P = NP.ictpV2, Lr = s * 1.3, x0 = -Lr * .5, xe = x0 + Lr * .7; c.save(); c.globalAlpha *= a; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x0, 0); c.lineTo(xe, 0); c.lineWidth = s * .36; c.strokeStyle = ink(P.rim); c.stroke(); c.lineWidth = s * .25; c.strokeStyle = rgb(P.body); c.stroke();
  c.lineWidth = Math.max(.4, s * .05); c.strokeStyle = ink(P.rim);
  for (let k = 0; k < 3; k++) { c.beginPath(); for (let i = 0; i <= 14; i++) { const u = i / 14, x = lerp(x0, xe, u), y = Math.sin(u * TAU * 2.2 + k * TAU / 3) * s * .1; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
  c.lineWidth = s * .09;
  for (const dy of [-1, 1]) { c.beginPath(); c.moveTo(xe, dy * s * .06); c.quadraticCurveTo(xe + s * .2, dy * s * .2, x0 + Lr, dy * s * .14); c.strokeStyle = ink(P.rim); c.stroke(); }
  c.beginPath(); c.arc(xe + s * .12, 0, s * .12, 0, TAU); c.fillStyle = rgb(P.nuc); c.fill();
  c.restore();
}
/** Cathepsin K: papain-like fold, two lobes with the active-site cleft between them. */
function gCatK(c, s, a = 1) {
  if (a <= .01) return;
  const P = NP.catkV2; c.save(); c.globalAlpha *= a;
  dom(c, -s * .2, 0, s * .27, s * .33, .25, P, Math.max(.4, s * .05)); dom(c, s * .2, 0, s * .27, s * .33, -.25, P, Math.max(.4, s * .05));
  c.beginPath(); c.moveTo(-s * .07, -s * .34); c.lineTo(0, -s * .02); c.lineTo(s * .07, -s * .34); c.lineWidth = Math.max(.4, s * .06); c.strokeStyle = ink(P.nuc); c.stroke();
  c.restore();
}
/** MMP: catalytic domain with a bright zinc in the cleft, linker, four-bladed hemopexin domain. */
function gMMP(c, s, a = 1, t = 0) {
  if (a <= .01) return;
  const P = NP.mmpV2, Z = NP.zincV2, ex = Math.max(.4, s * .04); c.save(); c.globalAlpha *= a;
  c.beginPath(); c.moveTo(-s * .1, s * .04); c.quadraticCurveTo(s * .05, s * .16, s * .2, s * .04); c.lineWidth = Math.max(.5, s * .07); c.strokeStyle = ink(P.rim); c.lineCap = 'round'; c.stroke();
  for (let k = 0; k < 4; k++) { const an = k * TAU / 4 + .4; dom(c, s * .4 + Math.cos(an) * s * .12, Math.sin(an) * s * .12, s * .12, s * .075, an, P, ex); }
  dom(c, -s * .3, 0, s * .29, s * .24, -.2, P, ex);
  const zx = -s * .3, zy = -s * .06, pul = .75 + .25 * Math.sin(t * 2.2);
  const g = c.createRadialGradient(zx, zy, 0, zx, zy, s * .22); g.addColorStop(0, rgb(Z.fil, .9 * pul)); g.addColorStop(1, rgb(Z.body, 0));
  c.fillStyle = g; c.beginPath(); c.arc(zx, zy, s * .22, 0, TAU); c.fill();
  c.beginPath(); c.arc(zx, zy, s * .075, 0, TAU); c.fillStyle = rgb(Z.fil); c.fill(); c.lineWidth = Math.max(.3, s * .03); c.strokeStyle = rgb(Z.rim); c.stroke();
  c.restore();
}
/** TRAP: a small binuclear-iron phosphatase, neutral plum. */
function gTRAP(c, s, a = 1) {
  if (a <= .01) return;
  const P = NP.trapV2; c.save(); c.globalAlpha *= a;
  dom(c, 0, 0, s * .36, s * .28, .3, P, Math.max(.4, s * .05));
  for (const dx of [-1, 1]) { c.beginPath(); c.arc(dx * s * .08, -s * .02, s * .06, 0, TAU); c.fillStyle = rgb(P.nuc); c.fill(); }
  c.restore();
}
/** Sclerostin: cystine knot with three loops, two long and one short. */
function gSost(c, s, a = 1) {
  if (a <= .01) return;
  const P = NP.sostV2; c.save(); c.globalAlpha *= a; c.lineCap = 'round';
  for (const [an, len] of [[-.55, .55], [.5, .5], [2.7, .32]]) {
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(Math.cos(an + .45) * s * len * .6, Math.sin(an + .45) * s * len * .6, Math.cos(an) * s * len, Math.sin(an) * s * len);
    c.lineWidth = s * .26 + .9; c.strokeStyle = ink(P.rim); c.stroke(); c.lineWidth = s * .26; c.strokeStyle = rgb(P.body); c.stroke();
  }
  c.beginPath(); c.arc(0, 0, s * .15, 0, TAU); c.fillStyle = rgb(P.nuc); c.fill();
  c.restore();
}
Object.assign(GLYPHS, { ctx: gCTX, ictp: gICTP, catk: gCatK, mmp: gMMP, trap: gTRAP, sost: gSost });
const at = (c, x, y, rot, fn) => { c.save(); c.translate(x, y); c.rotate(rot); fn(); c.restore(); };

/* ================================================================ osteocyte v2 */
/**
 * 36 to 48 hair-thin, near-uniform processes that leave the body straight and radially and fork, if at all,
 * only distally where they meet neighbours. No twigs. Longer across the lamellae (the flanks) and toward the
 * bone surface (−y), shortest from the poles of the elongated body.
 */
function buildOsteoV2(R, o) {
  const n = o.n || 42, Ln = o.len || 40, prims = [];
  for (let i = 0; i < n; i++) {
    const ang = (i + (R() - .5) * .7) / n * TAU, flank = Math.abs(Math.sin(ang)), up = Math.max(0, -Math.sin(ang));
    const len = Ln * (.62 + R() * .3) * (.8 + .3 * flank + .18 * up);
    const b = new Br({ ang, len, w0: .95 + R() * .15, w1: .55, curv: (R() - .5) * .35, ph: R() * TAU, freq: .16 + R() * .1, amp: .02, kind: 'p', sA: 0, sB: .5 + R() * .1 });
    b.rA = R() * .35; b.rB = b.rA + .3; b.mEnd = .1 + R() * .14;
    if (R() < .45) {
      const k = new Br({ at: .75 + R() * .15, ang: (R() < .5 ? -1 : 1) * (.22 + R() * .3), len: len * (.2 + R() * .18), w0: .7, w1: .5, curv: (R() - .5) * .3, ph: R() * TAU, freq: .2, amp: .02, kind: 'k', sA: .7, sB: 1 });
      k.rA = b.rA; k.rB = b.rA + .15; k.mEnd = 0; b.kids.push(k);
    }
    prims.push(b);
  }
  return prims;
}
const OCY_SC = 1.6;   // built larger and drawn smaller: the membrane outline (fixed at 1.4 / sc) stays hair-thin
const ocyV2 = (seed, o = {}) => new Cell('osteo', 0, 0, seed, OCY_SC, { build: buildOsteoV2, pal: NP.osteocyteV2, R0: 7, elong: 2, drift: .12, ...o });

/**
 * The fixed geometry a cell sits in: canaliculi (the processes at full length, static, carried on past the
 * tips toward the neighbours by `ext` of their length) and a lens-shaped lacuna sized to hug the body as it breathes.
 */
function geom(cell, ext = .6) {
  cell._g = cell._g || {};
  if (cell._g[ext]) return cell._g[ext];
  const R0 = cell.R0, el = cell.elong, P = { t: 0, r: 0, sprout: 1, lenK: 1, waveK: 0, bead: 0, d: 0 }, strands = [];
  for (const b of cell.prims) evalBr(b, Math.cos(b.ang) * R0 * .45, Math.sin(b.ang) * R0 * .45, 0, P, strands);
  for (const s of strands) {
    const n = s.n, p = s.pts, dx = p[n * 2] - p[n * 2 - 2], dy = p[n * 2 + 1] - p[n * 2 - 1], d = Math.hypot(dx, dy) || 1;
    const Lx = s.b.len * (s.b.kind === 'p' ? ext : ext * .66), k = Math.max(2, Math.ceil(Lx / 6));
    for (let i = 1; i <= k; i++) { p.push(p[n * 2] + dx / d * Lx * i / k, p[n * 2 + 1] + dy / d * Lx * i / k); s.ws.push(s.ws[n]); }
    s.n = n + k;
  }
  const ms = cell.prims.map(b => [b.ang, 1, b.w0]), pts = [];
  for (let ti = 0; ti < 24; ti++) {
    const fn = cell.somaFn({ t: ti * 3.1 }, ms, 0, 0, 0);
    for (let i = 0; i < 72; i++) { const a = i / 72 * TAU, r = R0 * fn(a) + 1.7; pts.push([Math.cos(a) * r * el, Math.sin(a) * r]); }
  }
  const A = Math.max(...pts.map(p => Math.abs(p[0]))) + 3;
  const B = Math.max(...pts.map(([x, y]) => (Math.abs(y) + 1.6) / (1 - (x / A) ** 2)));
  return cell._g[ext] = { strands, A, B };
}
/** Lens: two parabolic faces meeting in points, long axis along the lamellae. rag roughens the margin. */
function lens(c, A, B, ex = 0, rag = 0, seed = 0) {
  for (let i = 0; i <= 72; i++) {
    const p = -i / 72 * TAU, s = Math.sin(p), k = 1 + rag * (.5 * Math.sin(p * 7 + seed) + .3 * Math.sin(p * 13 + seed * 2.3) + .2 * Math.sin(p * 23 + seed * .7));
    const x = (A + ex) * Math.cos(p) * k, y = (B + ex) * s * Math.abs(s) * k;
    i ? c.lineTo(x, y) : c.moveTo(x, y);
  }
  c.closePath();
}
/** The mineral edge of every lacuna and canaliculus: in the dark theme a shadow, not a highlight. */
const edgeCol = () => rgb(isDark() ? mix(th(NP.matrixV2.body), [0, 0, 0], .55) : mix(NP.matrixV2.rim, NP.matrixV2.nuc, .35));
/** Lacunocanalicular fluid, as lcnCol in bone.js but opaque over the mineral. moving: a band travels out and back. */
function fluid(c, R0, t, mode) {
  const base = th(NP.matrixV2.body), F = NP.fluidV2, fb = th(F.body, .55), ff = th(F.fil, .55);
  if (mode === 'empty') return rgb(mix(base, th([250, 250, 248], .5), .55));
  if (mode === 'flat') return rgb(mix(base, ff, .45));
  const g = c.createRadialGradient(0, 0, R0 * .6, 0, 0, R0 * 10);
  if (mode === 'moving') {
    const u = .5 + .5 * Math.sin(t * .9), m = .15 + .6 * u;
    g.addColorStop(0, rgb(mix(base, fb, .6))); g.addColorStop(Math.max(0, m - .14), rgb(mix(base, ff, .55)));
    g.addColorStop(m, rgb(mix(base, mix(fb, th(F.rim, .5), .35), .95))); g.addColorStop(Math.min(1, m + .14), rgb(mix(base, ff, .55)));
    g.addColorStop(1, rgb(mix(base, ff, .5)));
  } else { g.addColorStop(0, rgb(mix(base, fb, .45))); g.addColorStop(1, rgb(mix(base, ff, .4))); }
  return g;
}
/** A point u (0…1) along a strand's points. */
function along(s, u) {
  const fi = clamp(u) * s.n, i0 = Math.min(s.n - 1, Math.floor(fi)), q = fi - i0, p = s.pts;
  return [lerp(p[i0 * 2], p[i0 * 2 + 2], q), lerp(p[i0 * 2 + 1], p[i0 * 2 + 3], q)];
}
/** Something carried outward in the canalicular fluid: every `every`-th process, offset n0. */
function alongCanals(g, t, every, n0, draw, speed = .08) {
  g.strands.forEach((s, i) => {
    if (s.b.kind !== 'p' || i % every !== n0) return;
    const u = loopT(t * speed + hash(i * 1.7), 1), [x, y] = along(s, .22 + u * .74);
    draw(x, y, Math.sin(u * Math.PI), i);
  });
}
/** A mineral patch with lamellae running along the cells' long axis. Leaves the patch clipped; caller restores. */
function matrixPatch(c, x, y, w, h, r = 10) {
  const M = NP.matrixV2;
  c.fillStyle = rgb(th(M.body)); c.beginPath(); c.roundRect(x, y, w, h, r); c.fill();
  c.save(); c.beginPath(); c.roundRect(x, y, w, h, r); c.clip();
  c.strokeStyle = isDark() ? rgb(th(M.fil, .45), .9) : rgb(M.fil, .9); c.lineWidth = .6;
  for (let k = 0; k * 6.5 < h + 6; k++) { c.beginPath(); for (let xx = x - 2; xx <= x + w + 2; xx += 5) { const yy = y + 3 + k * 6.5 + 1.1 * Math.sin(xx * .045 + k * 1.3); xx === x - 2 ? c.moveTo(xx, yy) : c.lineTo(xx, yy); } c.stroke(); }
}

const PLR_LAC = { lacK: 1.28, lacKy: 1.5, rag: .055, seed: 1.7, gap: .6 };
const RANKL_COL = () => mix(NP.ranklV2.body, NP.ranklV2.rim, .55);
const PYK = { pykCol: [34, 30, 44], pykGlow: [34, 30, 44] };     // pyknosis is hyperchromatic: dark and condensed, never red
/**
 * Osteocytes sharing one lacunocanalicular system. nodes: [{ cell, x, y, st }] at scale S;
 * links: [[i, j, sag]] are shared canaliculi between node centres.
 *  loaded:    fluid moving in the canaliculi, Ca²⁺ transients, sclerostin low
 *  unloaded:  fluid static, sclerostin and RANKL up, morphology intact
 *  apoptotic: condensed dark nucleus, retracted processes, empty canaliculi, apoptotic bodies, ATP released (pannexin-1)
 *  viable:    a surviving neighbour of a dying cell: intact, fluid static, sending RANKL out along the canaliculi
 *  plr:       alive and busy, enlarged ragged lacuna, eroded perilacunar halo, MMP-13/14, cathepsin K, TRAP and H⁺ inside its own lacuna
 *  plain:     fluid moving, nothing else (for small cells inside scenes)
 */
function ocyNetwork(c, nodes, links, S, t, o = {}) {
  const px = o.px ?? 1 / S, ext = o.ext ?? .6, tt = t * 1.4, gk = o.glyphK ?? 1;   // glyphK: signal glyphs larger when the cells are drawn small   // px: one screen pixel in cell units
  const local = (n, f) => { c.save(); c.translate(n.x, n.y); c.scale(S, S); f(n, geom(n.cell, ext)); c.restore(); };
  const lacPath = (n, g, ex) => {
    const L_ = n.st === 'plr' ? PLR_LAC : {}, gap = L_.gap ?? .22, rim = 1.4 / n.cell.sc;
    c.beginPath(); lens(c, g.A * (L_.lacK || 1), g.B * (L_.lacKy || L_.lacK || 1), ex, L_.rag || 0, L_.seed || 0);
    for (const s of g.strands) addStrand(c, s, rim + gap + ex);
  };
  const linkStrands = links.map(([a, b, sag = 0]) => {
    const A = nodes[a], B = nodes[b], dx = (B.x - A.x) / S, dy = (B.y - A.y) / S, pts = [], ws = [], n = 12;
    for (let i = 0; i <= n; i++) { const u = i / n; pts.push(dx * u - dy * sag * Math.sin(u * Math.PI), dy * u + dx * sag * Math.sin(u * Math.PI)); ws.push(.95); }
    return { a, b, s: { pts, ws, n } };
  });
  const linkPath = (L_, ex) => { c.beginPath(); addStrand(c, L_.s, 1.4 / nodes[L_.a].cell.sc + .22 + ex); };

  // perilacunar halos (demineralised matrix is osteoid-coloured, because that is what it now is)
  for (const n of nodes) if (n.st === 'plr') local(n, (n, g) => {
    const O = NP.osteoidV2;
    c.beginPath(); lens(c, g.A * 1.62, g.B * 2.05, 0, .09, 3.1);
    c.fillStyle = rgb(mix(th(NP.matrixV2.body), th(O.body), .7)); c.fill();
    c.setLineDash([2 * px, 1.6 * px]); c.lineWidth = .7 * px; c.strokeStyle = rgb(thLine(O.rim), .8); c.stroke(); c.setLineDash([]);
  });
  // mineral edges, then contents: the dying cell last, so its emptiness reads over anything crossing it
  c.fillStyle = edgeCol();
  for (const n of nodes) local(n, (n, g) => { lacPath(n, g, .5 * px); c.fillStyle = edgeCol(); c.fill(); });
  for (const L_ of linkStrands) local(nodes[L_.a], () => { linkPath(L_, .5 * px); c.fillStyle = edgeCol(); c.fill(); });
  for (const L_ of linkStrands) local(nodes[L_.a], () => { linkPath(L_, 0); c.fillStyle = fluid(c, 0, t, 'flat'); c.fill(); });
  const order = [...nodes].sort((p, q) => (p.st === 'apoptotic') - (q.st === 'apoptotic'));
  for (const n of order) local(n, (n, g) => {
    lacPath(n, g, 0);
    c.fillStyle = fluid(c, n.cell.R0, t, n.st === 'apoptotic' ? 'empty' : n.st === 'unloaded' || n.st === 'viable' ? 'static' : 'moving'); c.fill();
  });

  // cells
  for (const n of nodes) local(n, (n, g) => {
    const k = n.cell.sc;
    c.save(); c.scale(1 / k, 1 / k);
    if (n.st === 'apoptotic') {                  // any cell can die: apoptotic palette, dark pyknotic nucleus
      const o0 = n.cell.o; n.cell.o = { ...o0, pal: NP.osteocyteApoV2, ...PYK };
      try { n.cell.draw(c, { t: tt, r: .75, d: .8, colR: 0, noGray: true, gK: .3 }); } finally { n.cell.o = o0; }
    }
    else n.cell.draw(c, { t: tt, gK: .35, onStrands: n.st === 'loaded' ? caWaves(t) : undefined });
    c.restore();
  });

  // what each cell is doing
  for (const n of nodes) local(n, (n, g) => {
    if (n.st === 'loaded') alongCanals(g, t, 15, 4, (x, y, a) => at(c, x, y, 0, () => gSost(c, 5.5, a * .4)));
    if (n.st === 'unloaded') {
      alongCanals(g, t, 4, 0, (x, y, a, i) => at(c, x, y, i, () => gSost(c, 5.5, a)));
      alongCanals(g, t, 4, 2, (x, y, a, i) => at(c, x, y, i, () => gTNF(c, 5.5, a * .95, RANKL_COL())), .06);
    }
    if (n.st === 'viable') alongCanals(g, t, 3, 1, (x, y, a, i) => at(c, x, y, i, () => gTNF(c, 6 * gk, a, RANKL_COL())), .07);
    if (n.st === 'apoptotic') {
      const P = NP.osteocyteApoV2;              // apoptotic bodies shed into the lacuna
      [[.74, -.06, 1.9], [-.72, .1, 1.6], [.5, .42, 1.2]].forEach(([fx, fy, r], i) => circle(c, fx * g.A + Math.sin(t * .3 + i) * .4, fy * g.B, r * Math.sqrt(gk), rgb(P.body), rgb(P.rim, .9)));
      alongCanals(g, t, 7, 3, (x, y, a) => circle(c, x, y, 1.5 * gk, rgb(NP.casp3V2.body, a), rgb(NP.casp3V2.rim, a)), .1);   // ATP leaking out through pannexin-1
    }
    if (n.st === 'plr') {
      const A = g.A * PLR_LAC.lacK, B = g.B * PLR_LAC.lacKy, spot = (ph, k) => [Math.cos(ph) * A * k, Math.sin(ph) * Math.abs(Math.sin(ph)) * B * k];
      [[1.15, gCatK], [-1.2, gMMP], [2.1, gTRAP], [-2.0, gCatK], [.5, gMMP], [-2.55, gMMP], [-.6, null], [2.6, null]].forEach(([ph, fn], i) => {
        const w = .5 + .5 * Math.sin(t * .8 + i * 1.9), [sx, sy] = spot(ph + Math.sin(t * .25 + i) * .06, .86);
        if (fn) at(c, sx, sy, i * .9, () => fn(c, fn === gMMP ? 7 : 5.4, .6 + .4 * w, t));
        else lab(c, 'H⁺', sx, sy, { size: 4.6, color: rgb(thLine(NP.osteoclastV2.rim)), alpha: .35 + .6 * w, always: true });
      });
    }
  });
  // ATP from a dying cell travels the shared canaliculus to its neighbour
  for (const L_ of linkStrands) {
    const [A, B] = [nodes[L_.a], nodes[L_.b]];
    if (A.st !== 'apoptotic' && B.st !== 'apoptotic') continue;
    const fwd = A.st === 'apoptotic';
    local(A, () => { for (let j = 0; j < 3; j++) { const u = loopT(t * .09 + j / 3, 1), [x, y] = along(L_.s, fwd ? .2 + .6 * u : .8 - .6 * u); circle(c, x, y, 1.6 * gk, rgb(NP.casp3V2.body, Math.sin(u * Math.PI)), rgb(NP.casp3V2.rim, Math.sin(u * Math.PI))); } });
  }
}
/** Single-cell convenience. */
const ocyState = (c, x, y, S, cell, st, t) => ocyNetwork(c, [{ cell, x, y, st }], [], S, t);

const OCY_V2 = {
  loaded: ocyV2(8723), unloaded: ocyV2(8731),
  apoptotic: ocyV2(8749, { pal: NP.osteocyteApoV2, ...PYK }),
  neighbour: ocyV2(8777),
  plr: ocyV2(8761),
};
const OCY_S = .55;                                 // one scale for every state: osteocytes do not shrink when loaded
const OCY_PANELS = [
  [4, 6, 'LOADED · FLOW · Ca²⁺', () => NP.fluidV2.rim, (c, x, y, t) => ocyState(c, x, y, OCY_S, OCY_V2.loaded, 'loaded', t)],
  [133, 6, 'UNLOADED · SOST ↑ RANKL ↑', () => NP.sostV2.rim, (c, x, y, t) => ocyState(c, x, y, OCY_S, OCY_V2.unloaded, 'unloaded', t)],
  [4, 114, 'APOPTOTIC + VIABLE NEIGHBOUR', () => NP.casp3V2.rim, (c, x, y, t) => {
    ocyNetwork(c, [{ cell: OCY_V2.apoptotic, x: x - 24, y: y + 3, st: 'apoptotic' }, { cell: OCY_V2.neighbour, x: x + 33, y: y - 4, st: 'viable' }], [[0, 1, .08]], OCY_S, t, { ext: .35 });
    L(c, 'ATP', x + 4, y - 9, { size: 4.4, color: ink(NP.casp3V2.rim) });
    L(c, 'RANKL', x + 44, y - 36, { size: 4.4, color: ink(NP.ranklV2.rim) });
  }],
  [133, 114, 'PERILACUNAR REMODELLING', () => NP.mmpV2.rim, (c, x, y, t) => {
    ocyState(c, x, y, OCY_S, OCY_V2.plr, 'plr', t);
    L(c, 'MMP-13/14 INSIDE ITS OWN LACUNA', x, y + 39, { size: 4.4, color: ink(NP.mmpV2.rim) });
  }],
];
registerSpecimen('osteocyte-v2', 222, (c, t) => {
  const W = 123, H = 92;
  for (const [x, y, label, col, draw] of OCY_PANELS) {
    matrixPatch(c, x, y, W, H);
    draw(c, x + W / 2, y + H / 2, t);
    c.restore();
    L(c, label, x + W / 2, y + H + 8, { size: 5.8, color: ink(col()) });
  }
});

/**
 * A dying osteocyte and its viable neighbours (the thick-strut case): the dying cell releases apoptotic bodies and
 * ATP; the survivors around it upregulate RANKL and send it out along the shared canaliculi. With no neighbours
 * (the thin-strut case) nobody is left to run that local response.
 */
const DEATH = { dying: ocyV2(8749, { pal: NP.osteocyteApoV2, ...PYK }), left: ocyV2(8791), right: ocyV2(8803) };
export function deathScene(c, t, cx, cy, S, withNeighbours = true) {
  const nodes = [{ cell: DEATH.dying, x: cx, y: cy, st: 'apoptotic' }], links = [];
  if (withNeighbours) {
    nodes.push({ cell: DEATH.left, x: cx - 76 * S / .62, y: cy - 6, st: 'viable' }, { cell: DEATH.right, x: cx + 78 * S / .62, y: cy + 7, st: 'viable' });
    links.push([0, 1, -.06], [0, 2, .07]);
  }
  ocyNetwork(c, nodes, links, S, t, { ext: .35 });
}
registerSpecimen('osteocyte-death', 186, (c, t) => {
  matrixPatch(c, 4, 6, 252, 154, 12);
  deathScene(c, t, 130, 84, .62, true);
  c.restore();
  L(c, 'APOPTOTIC · ATP · APOPTOTIC BODIES', 130, 168, { size: 5.8, color: ink(NP.casp3V2.rim) });
  L(c, 'VIABLE · RANKL', 50, 178, { size: 5.8, color: ink(NP.ranklV2.rim) }); L(c, 'VIABLE · RANKL', 210, 178, { size: 5.8, color: ink(NP.ranklV2.rim) });
});

/* ================================================================ resorption, v2 */
const SCENE_PALS = ['NP.matrix', 'NP.osteoid', 'NP.osteoclast', 'NP.pi', 'NP.osteocyte', 'NP.fluid'];
const LAC_V2 = [0, 1, 2, 3].map(i => ocyV2(9100 + i * 13, { n: 36 }));
function lacunarV2(c, t, shift, ys) {
  LAC_V2.forEach((cell, i) => {
    const x = loopT(i * 78 + 30 - shift, 312) - 26, y = ys + (i % 2) * 13 + hash(i) * 4;
    ocyState(c, x, y, .26, cell, 'plain', t);
  });
}
/**
 * What resorption releases. As resorption() in bone.js, except: cathepsin K (crimson) is secreted into the lacuna,
 * and the collagen fragment is a CTX-I glyph in cathepsin K's crimson, leaving by transcytosis through the cell.
 */
function resorptionV2(c, t, xc, half, H, surf) {
  const base = (surf(xc - half) + surf(xc + half)) / 2, pal = NP.osteoclast;
  for (let i = 0; i < 9; i++) {
    const u = loopT(t * .55 + hash(i * 5.3), 1), x = xc + (hash(i * 2.9) - .5) * half * 1.25;
    lab(c, 'H⁺', x, lerp(surf(x) - 7, surf(x) - 2, u), { size: 4.6, color: rgb(pal.rim), alpha: Math.sin(u * Math.PI), always: true });
  }
  for (let i = 0; i < 6; i++) {
    const u = loopT(t * .2 + i / 6, 1), x = xc + (hash(i * 6.1) - .5) * half * 1.15, f = surf(x);
    at(c, x + Math.sin(u * 5 + i) * 1.2, lerp(f - H * .3, f - 4, ease(u)), i, () => gCatK(c, 4.2, Math.sin(u * Math.PI) * .95));
  }
  for (let i = 0; i < 6; i++) {
    const u = loopT(t * .3 + hash(i * 8.1), 1), x = xc + (hash(i * 4.4) - .3) * half, y = surf(x) - 1 - u * 5;
    c.save(); c.translate(x, y); c.rotate(i + u * 2); c.globalAlpha *= (1 - u) * .9;
    c.beginPath(); c.moveTo(-1.6, -.8); c.lineTo(1.2, -1.2); c.lineTo(1.5, 1); c.lineTo(-1, 1.3); c.closePath(); c.fillStyle = rgb(th(NP.matrix.fil)); c.fill(); c.restore();
  }
  for (let i = 0; i < 14; i++) {
    const u = loopT(t * .14 + hash(i * 3.1), 1), x = xc + (hash(i * 7.7) - .5) * half * 1.2, floor = surf(x), kind = i % 3;
    let px, py, a, inCell = false;
    if (u < .3) { const v = u / .3; px = x; py = floor - 2 - v * 4; a = sstep(v * 3); }
    else if (u < .78) { const v = ease((u - .3) / .48); px = lerp(x, xc + (x - xc) * .5, v) + Math.sin(v * 6 + i) * 1.5; py = lerp(floor - 7, base - H * .88, v); a = 1; inCell = true; }
    else { const v = (u - .78) / .22; px = xc + (x - xc) * .5 + v * 8 * Math.sign(x - xc || 1); py = base - H * .95 - v * 22; a = 1 - v; }
    if (inCell) { circle(c, px, py, 2.6, rgb(pal.fil, .95), rgb(pal.rim, .5)); circle(c, px, py, 1, rgb(kind === 1 ? NP.pi.rim : kind === 0 ? NP.ca.rim : NP.ctxV2.rim, .95)); }
    else if (kind === 2) at(c, px, py, i * .7, () => gCTX(c, 6.4, a));
    else E.glyph(c, kind ? 'pi' : 'ca', px, py, 4.6, 0, a);
  }
}
/**
 * The other route: in the trench the osteoclast has already left, MMPs (bronze, zinc lit) clean up the
 * demineralised collagen and ICTP leaves sideways into the remodelling compartment, never through the cell.
 */
function trenchMMP(c, t, shift, surf, x1) {
  for (let i = 0; i < 3; i++) {
    const x = -6 + loopT(i * 34 + 14 - shift, x1 + 6), edge = sstep((x + 6) / 14) * sstep((x1 - x) / 14), f = surf(x);
    at(c, x, f - 3.2, -.15 + .1 * Math.sin(t * .5 + i), () => gMMP(c, 9, edge, t + i));
    for (let j = 0; j < 2; j++) {
      const u = loopT(t * .1 + i * .37 + j * .5, 1);
      at(c, x - 2 - u * 16, f - 6 - u * 34, -.4 + u * .8 + j, () => gICTP(c, 7.2, edge * Math.sin(u * Math.PI) * .95));
    }
  }
}

registerSpecimen('osteoclast-scene-v2', 200, (c, t) => withPalettes(SCENE_PALS, () => {
  const { y0, xc, half, H, v, dm } = OC, shift = v * t;
  const carved = x => sstep((xc + 28 - x) / 66);
  const surf = x => y0 + dm * (.7 + .3 * bay(x + shift)) * carved(x);
  drawBone(c, surf, y0, shift);
  lacunarV2(c, t, shift, 168);
  trenchMMP(c, t, shift, surf, xc - half - 4);
  drawOsteoclast(c, t, xc, half, H, surf);
  resorptionV2(c, t, xc, half, H, surf);
  L(c, 'RESORPTION TRENCH', 52, 152, { size: 6.4 });
  L(c, 'REVERSAL · MMP → ICTP', 46, 72, { size: 6.2, color: ink(NP.mmpV2.rim) });
  L(c, 'CATHEPSIN K → CTX-I', 148, 22, { size: 6.2, color: ink(NP.catkV2.rim) });
  L(c, 'SEALING ZONE', 222, 100, { size: 6.4 }); E.line(c, 214, 104, xc + half - 3, y0 - 3, '#c6b98f', .6);
  L(c, 'RUFFLED BORDER', 148, 190, { size: 6.4 }); E.line(c, 148, 184, 150, surf(150) + 2, '#c6b98f', .6);
}));

registerSpecimen('osteoclast-b-v2', 200, (c, t) => withPalettes(SCENE_PALS, () => {
  const y0 = 134, xc = 130, half = 82, H = 94;
  const pit = x => { const u = (x - xc) / (half + 4); return Math.abs(u) < 1 ? 18 * Math.pow(1 - u * u, .8) * (.82 + .18 * bay(x * 1.4)) : 0; };
  const surf = x => y0 + pit(x);
  drawBone(c, surf, y0, 0);
  lacunarV2(c, 0, 40, 180);
  drawOsteoclast(c, t, xc, half, H, surf);
  resorptionV2(c, t, xc, half, H, surf);
  L(c, 'RUFFLED BORDER', 130, 196, { size: 6.6 });
  L(c, 'SEALING ZONE', 34, 124, { size: 6.4 }); L(c, 'HOWSHIP’S LACUNA', 214, 160, { size: 6.4 });
  L(c, 'CATHEPSIN K → CTX-I', 130, 12, { size: 6.2, color: ink(NP.catkV2.rim) });
}));

/** The isolated osteoclast, with cathepsin K in crimson and RANKL pulled clear of the cell's rust. */
registerSpecimen('osteoclast-v2', 200, (c, t) => withPalettes(['NP.osteoclast', 'NP.rank', 'NP.rankl'], () => {
  const P = NP.osteoclast, cx = 130, cy = 132;
  for (let i = 0; i < 12; i++) {
    const u = loopT(t * .3 + hash(i * 3.7), 1), x = cx - 76 + (i + .5) * 152 / 12;
    if (i % 3) lab(c, 'H⁺', x, cy + 34 + u * 26, { size: 5.4, color: rgb(P.rim), alpha: Math.sin(u * Math.PI) * .9, always: true });
    else at(c, x, cy + 36 + u * 24, i, () => gCatK(c, 7, Math.sin(u * Math.PI)));
  }
  shape(c, cx, cy, osteoclastIsoPts(t), P, 90, 1.8);
  c.save(); c.translate(cx, cy);
  for (let i = 0; i < 10; i++) circle(c, (hash(i * 3.3) - .5) * 130, -10 - hash(i * 5.1) * 50, 2.2, rgb(P.fil, .8), rgb(P.rim, .3));
  OC_NUCLEI.forEach(([x, y], i) => {
    const nx = x + Math.sin(t * .35 + i) * .8, ny = y + Math.cos(t * .3 + i * 2) * .6;
    c.beginPath(); c.ellipse(nx, ny, 11.5, 8, (i % 2 ? .12 : -.1), 0, TAU); c.fillStyle = rgb(P.nuc, .92); c.fill();
    c.strokeStyle = rgb(P.rim, .22); c.lineWidth = .7; c.stroke();
  });
  [[.3, 0], [.66, .5]].forEach(([a, ph]) => {
    const an = a * Math.PI, br = 1 + .018 * Math.sin(t * .8);
    const bx = 84 * Math.cos(an), by = -12 - 80 * br * Math.pow(Math.sin(an), .8);
    const nl = Math.hypot(bx, by + 30), ux = bx / nl, uy = (by + 30) / nl;
    for (let j = 0; j < 4; j++) dom(c, bx + ux * (4 + j * 6), by + uy * (4 + j * 6), 2.8, 3.6, Math.atan2(uy, ux) - Math.PI / 2, NP.rank, .6);
    const d = loopT(t / 7 + ph, 1), dock = ease(clamp(d / .35)) * (1 - ease(clamp((d - .75) / .25)));
    c.save(); c.globalAlpha *= Math.min(1, dock * 1.5 + .25);
    c.translate(bx + ux * (30 + (1 - dock) * 22), by + uy * (30 + (1 - dock) * 22));
    gTNF(c, 12, 1, mix(NP.rankl.body, NP.rankl.rim, .55)); c.restore();
  });
  c.restore();
  L(c, 'MULTINUCLEATED', 130, 18, { size: 6.6 }); L(c, 'RANK · RANKL', 40, 40, { size: 6.4 });
  L(c, 'RUFFLED BORDER', 216, 186, { size: 6.4 }); L(c, 'H⁺ · CATHEPSIN K', 52, 194, { size: 6.2, color: ink(NP.catkV2.rim) });
}));
/* ================================================================ fragment and enzyme tiles */
registerSpecimen('ctx1-v2', 145, (c, t) => {
  at(c, 130 + Math.sin(t * .3) * 2, 66 + Math.cos(t * .4) * 1.5, -.12 + Math.sin(t * .25) * .04, () => gCTX(c, 64, 1));
  at(c, 54, 40, .3, () => gCatK(c, 26, .9));
  L(c, 'CATHEPSIN K', 54, 64, { size: 5.6, color: ink(NP.catkV2.rim) });
  L(c, 'CTX-I · C-TELOPEPTIDE · CROSSLINKED', 130, 132, { size: 6.4 });
});
registerSpecimen('ictp', 145, (c, t) => {
  at(c, 130 + Math.sin(t * .3) * 2, 56 + Math.cos(t * .4) * 1.5, -.1 + Math.sin(t * .25) * .04, () => gICTP(c, 58, 1));
  at(c, 214, 32, -.3, () => gMMP(c, 30, .9, t));
  L(c, 'MMP', 214, 50, { size: 5.6, color: ink(NP.mmpV2.rim) });
  // the point of the pair: still distinct at the size they appear in scenes
  at(c, 104, 104, 0, () => gCTX(c, 10, 1)); L(c, 'CTX-I', 104, 115, { size: 5, color: ink(NP.catkV2.rim) });
  at(c, 156, 104, 0, () => gICTP(c, 10, 1)); L(c, 'ICTP', 156, 115, { size: 5, color: ink(NP.mmpV2.rim) });
  L(c, 'ICTP · HELICAL STUB + CROSSLINK', 130, 134, { size: 6.4 });
});
registerSpecimen('mmp', 180, (c, t) => {
  at(c, 70 + Math.sin(t * .35) * 3, 78 + Math.cos(t * .3) * 2, -.2 + Math.sin(t * .25) * .08, () => gMMP(c, 64, 1, t));
  L(c, 'Zn²⁺', 44, 52, { size: 5.6, color: ink(NP.zincV2.rim) });
  bilayer(c, 128, 138, 254);
  const x = 196, sway = Math.sin(t * .4) * 2;
  rod(c, x, 126, x, 145, 4.2, NP.mmpV2);                                                             // transmembrane helix
  c.beginPath(); c.moveTo(x, 126); c.quadraticCurveTo(x + sway, 112, x + sway * 1.5, 100); c.lineWidth = 1.1; c.strokeStyle = ink(NP.mmpV2.rim); c.stroke();   // stalk
  at(c, x + sway * 1.5, 84, -Math.PI / 2 + .12 + sway * .02, () => gMMP(c, 50, 1, t + 1));
  L(c, 'MMP-13 · SOLUBLE', 70, 132, { size: 6.2 });
  L(c, 'MMP-14 · MEMBRANE-TETHERED', 196, 166, { size: 6.2 });
});

/* shared with strut.js */
export { ocyV2, ocyNetwork, geom, edgeCol, fluid, PYK, RANKL_COL, gSost, gMMP, gCatK, gCTX, gICTP, at };
