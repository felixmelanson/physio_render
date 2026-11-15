// @ts-nocheck
/* Bone cells, rebuilt on the atlas engine.
   - Osteocyte: the astrocyte arbor engine with a bone-specific builder (resting / loaded / apoptotic)
   - Osteoclast: resorbing a trench as the bone slides beneath it
   - Osteoblast: laying down osteoid that mineralizes; one cell per cycle is buried and becomes an osteocyte
   - Remodeling: the two together, a basic multicellular unit (BMU)
   All shapes paint through paintMembrane, so render styles, the theme and colour edits apply. */
import { E, NP, registerSpecimen } from './atlas.js';
import { th, thLine, polyPath, shape, ion, dom, loopT } from './kit.js';

const { TAU, clamp, lerp, sstep, ease, hash, mix, rgb, Cell, Br, lab, line, circle, BP, GLYPHS, gTNF } = E;

/* ---------------------------------------------------------------- palettes */
Object.assign(NP, {
  osteocyte: { rim: [70, 128, 150], body: [182, 216, 226], fil: [238, 250, 255], nuc: [70, 120, 140] },
  osteoblast: { rim: [82, 122, 170], body: [196, 216, 240], fil: [244, 248, 255], nuc: [96, 134, 180] },
  osteoclast: { rim: [184, 100, 74], body: [244, 198, 174], fil: [255, 241, 230], nuc: [172, 108, 86] },
  matrix: { rim: [172, 154, 114], body: [238, 228, 202], fil: [214, 199, 160], nuc: [150, 128, 88] },
  osteoid: { rim: [190, 160, 104], body: [251, 241, 214], fil: [222, 198, 146], nuc: [178, 146, 92] },
  signal: { rim: [212, 146, 38], body: [250, 204, 108], fil: [255, 244, 214], nuc: [190, 120, 20] },
});

/* ---------------------------------------------------------------- osteocyte arbor */
/** Many slender, branching dendrites; longer and more numerous toward the bone surface (−y). */
function buildOsteo(R, o) {
  const n = o.n || 12, prims = [], L = o.len || 42;
  for (let i = 0; i < n; i++) {
    const ang = i / n * TAU + (R() - .5) * .4;
    const up = Math.max(0, -Math.sin(ang));
    const len = L * (.55 + R() * .3 + up * .55);
    const b = new Br({ ang, len, w0: 2.6 + R() * 1.1, w1: .65, curv: (R() - .5) * .9, ph: R() * TAU, freq: .22 + R() * .18, amp: .07, kind: 'p', sA: 0, sB: .45 + R() * .1 });
    b.rA = R() * .45; b.rB = b.rA + .35; b.mEnd = i % 3 === 0 ? .45 : .06;
    const forks = 1 + (R() < .55 + up * .3 ? 1 : 0);
    for (let j = 0; j < forks; j++) {
      const k = new Br({ at: .3 + R() * .45, ang: (R() < .5 ? -1 : 1) * (.35 + R() * .55), len: len * (.32 + R() * .3), w0: 1.4, w1: .5, curv: (R() - .5) * 1, ph: R() * TAU, freq: .3, amp: .1, kind: 'k', sA: .35, sB: .8 });
      k.rA = Math.max(0, b.rA - .05); k.rB = b.rA + .2; k.mEnd = 0;
      if (R() < .55) k.kids.push(new Br({ at: .6, ang: (R() < .5 ? -1 : 1) * (.5 + R() * .4), len: 5 + R() * 7, w0: .85, w1: .4, curv: (R() - .5), ph: R() * TAU, freq: .4, amp: .14, kind: 't', sA: .6, sB: 1 }));
      b.kids.push(k);
    }
    prims.push(b);
  }
  return prims;
}
const osteocyte = (seed, sc = 1, o = {}) => new Cell('osteo', 0, 0, seed, sc, { build: buildOsteo, pal: NP.osteocyte, R0: 7.6, elong: 1.55, drift: .5, ...o });

/**
 * The lacunocanalicular space around the body and processes, filled with interstitial fluid. Under load the fluid
 * moves: a soft band of deeper blue travels out along the canalicular sleeves and back as the load reverses.
 */
let FLOW_T = 0;
const lcnCol = () => (c, R0) => {
  const F = NP.fluid, u = .5 + .5 * Math.sin(FLOW_T * .9), r0 = R0 * .6, r1 = R0 * 10, m = .15 + .6 * u;
  const g = c.createRadialGradient(0, 0, r0, 0, 0, r1);
  g.addColorStop(0, rgb(th(F.body, .55), .7));
  g.addColorStop(Math.max(0, m - .14), rgb(th(F.fil, .55), .55));
  g.addColorStop(m, rgb(th(F.body, .45), .9));
  g.addColorStop(Math.min(1, m + .14), rgb(th(F.fil, .55), .55));
  g.addColorStop(1, rgb(th(F.fil, .55), .5));
  return g;
};
/** Draw a Cell at (x, y). */
function drawCell(c, cell, x, y, P) { c.save(); c.translate(x, y); cell.draw(c, P); c.restore(); }

/** Ca²⁺ waves running out along the dendrites, with a pulsing glow in the cell body. */
const caWaves = t => (c, strands, R0) => {
  const pulse = .5 + .5 * Math.sin(t * 1.5), S = NP.ca;
  const g = c.createRadialGradient(0, 0, 0, 0, 0, R0 * 2.4);
  g.addColorStop(0, rgb(S.body, .7 * pulse)); g.addColorStop(1, rgb(S.body, 0));
  c.fillStyle = g; c.beginPath(); c.arc(0, 0, R0 * 2.4, 0, TAU); c.fill();
  for (const s of strands) {
    if (s.b.kind === 't') continue;
    const u = loopT(t * .42 + hash(s.b.id % 997) * .35, 1), fi = u * s.n, i0 = Math.min(s.n - 1, Math.floor(fi)), f = fi - i0, p = s.pts;
    circle(c, lerp(p[i0 * 2], p[i0 * 2 + 2], f), lerp(p[i0 * 2 + 1], p[i0 * 2 + 3], f), 2.1, rgb(S.body, Math.sin(u * Math.PI)), rgb(S.rim, Math.sin(u * Math.PI) * .8));
  }
};

Object.assign(NP, {
  apoptotic: { rim: [70, 74, 78], body: [124, 128, 132], fil: [168, 172, 176], nuc: [46, 48, 52] },
  fluid: { rim: [46, 140, 196], body: [150, 206, 236], fil: [230, 246, 255], nuc: [30, 110, 170] },
});

/**
 * Load-induced fluid shear in the lacunocanalicular network: interstitial fluid oscillates along the
 * canaliculi as the bone is loaded and unloaded. Chevrons ride back and forth along each process,
 * pointing with the flow and fading as it reverses.
 */
const SHEAR_W = .9;
const shearAt = t => ({ disp: Math.sin(t * SHEAR_W), vel: Math.cos(t * SHEAR_W) });
function chevron(c, x, y, ang, sz, col) {
  c.beginPath(); c.moveTo(x - Math.cos(ang - .55) * sz, y - Math.sin(ang - .55) * sz); c.lineTo(x, y);
  c.lineTo(x - Math.cos(ang + .55) * sz, y - Math.sin(ang + .55) * sz); c.strokeStyle = col; c.stroke();
}
/** Fluid shear is carried by the sleeve fill itself (see lcnCol); nothing is drawn over the cells. */
const shearFlow = () => () => {};
const both = (...fs) => (...args) => fs.forEach(f => f(...args));

/** Three states in the astrocyte tile's layout: resting, loaded (Ca²⁺ + shear), apoptotic (dark grey). */
function osteocyteStates(c, t, cells, o = {}) {
  FLOW_T = t;
  const tt = t * 1.4, lc = lcnCol(), lcn = o.lcn ?? 2.8;
  drawCell(c, cells.rest, 88, 92, { t: tt, lcn, lcnCol: lc, gK: .8, onStrands: shearFlow(t, o.sz ?? 2.6, lcn) });
  drawCell(c, cells.load, 207, 54, { t: tt, lcn, lcnCol: lc, gK: .8, onStrands: both(caWaves(t), shearFlow(t, (o.sz ?? 2.6) * 1.2, lcn)) });
  drawCell(c, cells.apo, 202, 150, { t: tt, r: .62 + .04 * Math.sin(t * .3), colR: 0, d: .32, noGray: true, lcn: lcn * .8, lcnCol: lc });
  for (let i = 0; i < 3; i++) {                     // apoptotic osteocytes release RANKL
    const u = loopT(t * .12 + i / 3, 1), an = -2.4 + i * .9;
    c.save(); c.translate(205 + Math.cos(an) * (10 + u * 30), 148 + Math.sin(an) * (10 + u * 26)); c.rotate(u * 2 + i);
    gTNF(c, 9, Math.sin(u * Math.PI) * .9, BP.rankl.body); c.restore();
  }
  lab(c, 'RESTING · SHEAR', 84, 180, { mono: true }); lab(c, 'LOADED · Ca²⁺', 207, 104, { mono: true, size: 6.8, color: rgb(NP.ca.rim) });
  lab(c, 'APOPTOTIC · RETRACTED', 205, 184, { mono: true, size: 6.8, color: '#7d8186' });
}
/** Version A: literally the atlas astrocytes (same seeds, same arbors), recoloured as osteocytes. */
const astroOcy = (seed, sc, o = {}) => new Cell('astro', 0, 0, seed, sc, { drift: 2.2, len: 37, pal: NP.osteocyte, ...o });
const OCY_A = { rest: astroOcy(777, .96), load: astroOcy(778, .62), apo: astroOcy(640, .5, { pal: NP.apoptotic }) };
/** Version B: the slender bone builder. */
const OCY_B = { rest: osteocyte(8723, 1), load: osteocyte(8731, .66), apo: osteocyte(8749, .5, { pal: NP.apoptotic }) };
registerSpecimen('osteocyte', 190, (c, t) => osteocyteStates(c, t, OCY_A, { lcn: 3.2, sz: 4.4 }));
registerSpecimen('osteocyte-b', 190, (c, t) => osteocyteStates(c, t, OCY_B, { sz: 3.6 }));

/** Version C: a lacunocanalicular network under cyclic load; fluid shear runs through the shared canaliculi. */
const NET = [[64, 112, 8811], [140, 78, 8812], [206, 128, 8813]].map(([x, y, sd]) => ({ x, y, cell: osteocyte(sd, .62, { drift: .2 }) }));
registerSpecimen('osteocyte-network', 200, (c, t) => {
  FLOW_T = t;
  const M = NP.matrix, { disp, vel } = shearAt(t), load = Math.max(0, -Math.sin(t * SHEAR_W - Math.PI / 2));
  c.fillStyle = rgb(th(mix(M.body, [255, 255, 255], .2))); c.beginPath(); c.roundRect(6, 30, 248, 162, 14); c.fill();
  c.save(); c.beginPath(); c.roundRect(6, 30, 248, 162, 14); c.clip();
  c.strokeStyle = rgb(thLine(M.fil), .8); c.lineWidth = .7;
  for (let k = 0; k < 13; k++) { c.beginPath(); for (let x = 0; x <= 260; x += 6) { const y = 36 + k * 12.5 + 2 * Math.sin(x * .03 + k) + load * 1.4 * Math.sin(x * .02); x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
  // shared canaliculi between neighbours, with the fluid moving through them
  const links = [[0, 1], [1, 2], [0, 2]];
  for (const [a, b] of links) {
    const A = NET[a], B = NET[b], mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2 + (a === 0 && b === 2 ? 24 : -8);
    c.strokeStyle = rgb(th(NP.fluid.body, .55), .8); c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(A.x, A.y); c.quadraticCurveTo(mx, my, B.x, B.y); c.stroke();
    c.strokeStyle = rgb(NP.osteocyte.rim, .7); c.lineWidth = 1; c.stroke();
    const u = .5 + .5 * disp, gl = c.createLinearGradient(A.x, A.y, B.x, B.y);
    gl.addColorStop(0, rgb(th(NP.fluid.fil, .55), 0)); gl.addColorStop(Math.max(0, u - .2), rgb(th(NP.fluid.fil, .55), 0));
    gl.addColorStop(u, rgb(th(NP.fluid.rim, .4), .55)); gl.addColorStop(Math.min(1, u + .2), rgb(th(NP.fluid.fil, .55), 0)); gl.addColorStop(1, rgb(th(NP.fluid.fil, .55), 0));
    c.strokeStyle = gl; c.lineWidth = 4.4; c.beginPath(); c.moveTo(A.x, A.y); c.quadraticCurveTo(mx, my, B.x, B.y); c.stroke();
  }
  NET.forEach(n => drawCell(c, n.cell, n.x, n.y, { t: t * 1.3, lcn: 3.4, lcnCol: lcnCol(), gK: .7, onStrands: shearFlow(t, 3.4, 3.4) }));
  c.restore();
  // the load that drives the flow
  for (let k = 0; k < 3; k++) {
    const x = 70 + k * 60, y = 10 + load * 8;
    c.strokeStyle = rgb(thLine(M.nuc), .35 + .6 * load); c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y - 8); c.lineTo(x, y + 6); c.stroke();
    chevron(c, x, y + 7, Math.PI / 2, 4, rgb(thLine(M.nuc), .35 + .6 * load));
  }
  lab(c, load > .5 ? 'LOADING' : 'UNLOADING', 226, 14, { mono: true, size: 6.6 });
  lab(c, 'LACUNOCANALICULAR FLUID SHEAR', 130, 198, { mono: true, size: 6.6, color: rgb(NP.fluid.rim) });
});

/* ---------------------------------------------------------------- bone matrix */
/** Old (lamellar) bone below the surface function, with lamellae that scroll with the bone. */
function slabPath(c, surf, x0 = -8, x1 = 268, yb = 208) {
  c.beginPath(); c.moveTo(x0, yb); for (let x = x0; x <= x1; x += 2) c.lineTo(x, surf(x)); c.lineTo(x1, yb); c.closePath();
}
function drawBone(c, surf, y0, shift, o = {}) {
  const M = NP.matrix;
  slabPath(c, surf);
  const g = c.createLinearGradient(0, y0, 0, 200);
  g.addColorStop(0, rgb(th(mix(M.body, [255, 255, 255], .3)))); g.addColorStop(1, rgb(th(M.body)));
  c.fillStyle = g; c.fill();
  c.save(); slabPath(c, o.clip || surf); c.clip();
  c.lineWidth = .7; c.strokeStyle = rgb(thLine(M.fil), .95);
  for (let k = 0; k < 12; k++) {
    c.beginPath();
    for (let x = -8; x <= 268; x += 5) {
      const b = x + shift, y = y0 + 4 + k * 7.2 + 1.8 * Math.sin(b * .035 + k * 1.7) + .7 * Math.sin(b * .1 + k);
      x === -8 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.stroke();
  }
  c.restore();
  c.beginPath(); for (let x = -8; x <= 268; x += 2) { const y = surf(x); x === -8 ? c.moveTo(x, y) : c.lineTo(x, y); }
  c.strokeStyle = rgb(thLine(M.rim)); c.lineWidth = 1.2; c.stroke();
}

/** Osteocytes in their lacunae, travelling with the bone. */
const LACUNAR = [0, 1, 2, 3].map(i => osteocyte(9100 + i * 13, .23, { drift: .2 }));
function lacunarOsteocytes(c, t, shift, ys) {
  LACUNAR.forEach((cell, i) => {
    const x = loopT(i * 78 + 30 - shift, 312) - 26, y = ys + (i % 2) * 13 + hash(i) * 4;
    drawCell(c, cell, x, y, { t: t * 1.2, lcn: 3, lcnCol: lcnCol(), gK: .6 });
  });
}

/* ---------------------------------------------------------------- osteoclast */
/** Dome over a ruffled border, sealed to the bone at both edges. surf(x) is the bone surface under it. */
function osteoclastPts(xc, half, H, surf, t) {
  const xl = xc - half, xr = xc + half, yl = surf(xl), yr = surf(xr), pts = [], k = half / 48;
  const pulse = 1 + .07 * Math.sin(t * 1.25);                       // the bell contracts and relaxes
  for (let i = 0; i <= 34; i++) {
    const a = i / 34 * Math.PI, x = xc + half * Math.cos(a) * (1 - .03 * (pulse - 1) * 10 * Math.sin(a)), yb = lerp(yr, yl, i / 34) - 1.5;
    const wob = 1 + .03 * Math.sin(3 * a + t * .9) + .02 * Math.sin(5 * a - t * 1.3);
    pts.push(x, yb - H * Math.pow(Math.sin(a), .62) * wob * pulse);
  }
  // ruffled border: long finger-like membrane folds hanging into the resorption lacuna
  const N = Math.max(6, Math.round(half / 5.4)), M = N * 14, a0 = .1, a1 = .9, G = H * .38;
  for (let i = 1; i < M; i++) {
    const u = i / M, x0 = xl + u * 2 * half, mid = Math.sin(Math.PI * u);
    const roof = surf(x0) - 1.1 - G * Math.pow(mid, .75);
    let y = roof, x = x0;
    if (u > a0 && u < a1) {
      const w = (u - a0) / (a1 - a0) * N, f = Math.floor(w), v = w - f;
      const prot = v < .72 ? Math.pow(Math.sin(Math.PI * v / .72), .55) : 0;
      const len = (G - 3) * (.72 + .22 * Math.sin(t * 1.9 + f * 1.7)) * Math.min(1, mid * 1.5);
      y = roof + prot * len; x = x0 + Math.sin(t * 1.6 + f * 1.1) * 1.8 * k * prot;
    }
    pts.push(x, y);
  }
  return pts;
}
const NUCLEI = [[-26, -.62], [-9, -.78], [10, -.8], [26, -.66], [0, -.56], [-17, -.5], [18, -.5]];
function drawOsteoclast(c, t, xc, half, H, surf) {
  const pal = NP.osteoclast, base = (surf(xc - half) + surf(xc + half)) / 2, ox = xc, oy = base - H * .45;
  const pts = osteoclastPts(xc, half, H, surf, t).map((v, i) => i % 2 ? v - oy : v - ox);
  shape(c, ox, oy, pts, pal, H * .9, 1.4);
  const k = half / 48;
  c.save(); c.translate(xc, base);
  // lysosomes / foamy vacuoles
  for (let i = 0; i < 9; i++) { const x = (hash(i * 3.3) - .5) * half * 1.2, y = -H * (.42 + hash(i * 5.1) * .16); circle(c, x, y, 1.6 * k, rgb(pal.fil, .85), rgb(pal.rim, .35)); }
  // several nuclei, clustered away from the bone
  NUCLEI.forEach(([x, y], i) => {
    const nx = x * k + Math.sin(t * .4 + i) * .6, ny = y * H + Math.cos(t * .35 + i) * .5;
    c.beginPath(); c.ellipse(nx, ny, 7.2 * k, 5.8 * k, i * .5, 0, TAU); c.fillStyle = rgb(pal.nuc, .9); c.fill();
    c.strokeStyle = rgb(mix(pal.nuc, [0, 0, 0], .3), .5); c.lineWidth = .7; c.stroke();
    circle(c, nx - 2 * k, ny - 1.6 * k, 1.1 * k, rgb(pal.fil, .5));
  });
  c.restore();
  // sealing zone: the actin ring of podosomes where the cell grips the bone
  for (const side of [-1, 1]) for (let j = 0; j < 4; j++) {
    const x = xc + side * (half - 3.5 - j * 2.6);
    circle(c, x, surf(x) - 2.2, 1.15 * k, rgb(mix(pal.rim, [0, 0, 0], .25), .8));
  }
}
/** What resorption releases: H⁺ in, Ca²⁺ / Pi / collagen fragments out by transcytosis through the cell. */
function resorption(c, t, xc, half, H, surf) {
  const base = (surf(xc - half) + surf(xc + half)) / 2, pal = NP.osteoclast;
  for (let i = 0; i < 9; i++) {           // protons pumped into the resorption lacuna
    const u = loopT(t * .55 + hash(i * 5.3), 1), x = xc + (hash(i * 2.9) - .5) * half * 1.25;
    lab(c, 'H⁺', x, lerp(surf(x) - 7, surf(x) - 2, u), { size: 4.6, color: rgb(pal.rim), alpha: Math.sin(u * Math.PI), always: true });
  }
  for (let i = 0; i < 6; i++) {            // matrix crumbs lifting from the pit floor
    const u = loopT(t * .3 + hash(i * 8.1), 1), x = xc + (hash(i * 4.4) - .3) * half;
    const y = surf(x) - 1 - u * 5;
    c.save(); c.translate(x, y); c.rotate(i + u * 2); c.globalAlpha *= (1 - u) * .9;
    c.beginPath(); c.moveTo(-1.6, -.8); c.lineTo(1.2, -1.2); c.lineTo(1.5, 1); c.lineTo(-1, 1.3); c.closePath(); c.fillStyle = rgb(th(NP.matrix.fil)); c.fill(); c.restore();
  }
  for (let i = 0; i < 14; i++) {
    const u = loopT(t * .14 + hash(i * 3.1), 1), x = xc + (hash(i * 7.7) - .5) * half * 1.2, floor = surf(x), kind = i % 3;
    let px, py, a, inCell = false;
    if (u < .3) { const v = u / .3; px = x; py = floor - 2 - v * 4; a = sstep(v * 3); }
    else if (u < .78) { const v = ease((u - .3) / .48); px = lerp(x, xc + (x - xc) * .5, v) + Math.sin(v * 6 + i) * 1.5; py = lerp(floor - 7, base - H * .88, v); a = 1; inCell = true; }
    else { const v = (u - .78) / .22; px = xc + (x - xc) * .5 + v * 8 * Math.sign(x - xc || 1); py = base - H * .95 - v * 22; a = 1 - v; }
    if (inCell) { circle(c, px, py, 2.4, rgb(pal.fil, .95), rgb(pal.rim, .5)); circle(c, px, py, .9, rgb(kind === 1 ? NP.pi.rim : kind === 0 ? NP.ca.rim : NP.matrix.rim, .9)); }
    else if (kind === 2) {                // collagen fragment (CTX-type telopeptide)
      c.save(); c.translate(px, py); c.rotate(i); c.globalAlpha *= a; c.strokeStyle = rgb(thLine(NP.matrix.rim)); c.lineWidth = .9; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-3, 0); c.quadraticCurveTo(-1, -1.6, 0, 0); c.quadraticCurveTo(1, 1.6, 3, 0); c.stroke(); c.restore();
    } else ion(c, px, py, 2, kind ? NP.pi : NP.ca, '', a);
  }
}

const OC = { y0: 120, xc: 148, half: 52, H: 62, v: 5, dm: 16 };
const bay = b => { const P = 24, u = loopT(b, P) / P * 2 - 1; return Math.sqrt(Math.max(0, 1 - u * u)); };   // Howship's scallops

registerSpecimen('osteoclast-scene', 200, (c, t) => {
  const { y0, xc, half, H, v, dm } = OC, shift = v * t;
  const carved = x => sstep((xc + 28 - x) / 66);
  const surf = x => y0 + dm * (.7 + .3 * bay(x + shift)) * carved(x);
  drawBone(c, surf, y0, shift);
  lacunarOsteocytes(c, t, shift, 168);
  drawOsteoclast(c, t, xc, half, H, surf);
  resorption(c, t, xc, half, H, surf);
  lab(c, 'RESORPTION TRENCH', 52, 106, { mono: true, size: 6.6 });
  lab(c, 'SEALING ZONE', 222, 100, { mono: true, size: 6.6 }); line(c, 214, 104, xc + half - 3, y0 - 3, '#c6b98f', .6);
  lab(c, 'RUFFLED BORDER', 148, 190, { mono: true, size: 6.6 }); line(c, 148, 184, 150, surf(150) + 2, '#c6b98f', .6);
});

/* ---------------------------------------------------------------- osteoblast */
/** Rounded cuboid (the catalogue shape), base on the bone, centred at the origin. */
function osteoblastPts(w, h, t, seed, p = 7) {
  const pts = [];
  for (let i = 0; i < 40; i++) {
    const a = i / 40 * TAU, ca = Math.cos(a), sa = Math.sin(a);
    let x = w / 2 * Math.sign(ca) * Math.pow(Math.abs(ca), 2 / p), y = h / 2 * Math.sign(sa) * Math.pow(Math.abs(sa), 2 / p);
    if (y < 0) y *= 1.02 + .03 * (1 - Math.abs(ca));
    const wob = 1 + .016 * Math.sin(2 * a + t * .8 + seed) + .01 * Math.sin(3 * a - t * .6 + seed * 2);
    pts.push(x * wob, y * wob);
  }
  return pts;
}
/** One osteoblast standing on the surface at (x, y), rotated to the surface normal. Polarized: nucleus away from bone, Golgi below it. */
function drawOsteoblast(c, t, x, y, w, h, rot, seed, a = 1, secrete = true, o = {}) {
  if (a <= .01) return;
  const pal = NP.osteoblast;
  c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha *= a;
  shape(c, 0, -h / 2, osteoblastPts(w, h, t, seed, o.p), pal, h * .8, 1.3);
  c.translate(0, -h / 2);
  if (h < 16) { c.beginPath(); c.ellipse(0, 0, w * .2, h * .28, 0, 0, TAU); c.fillStyle = rgb(pal.nuc, .9); c.fill(); c.restore(); return; }
  for (let j = 0; j < 3; j++) {           // rough ER
    c.beginPath(); c.moveTo(-w * .4, -h * .05 + j * 3); c.quadraticCurveTo(-w * .3, -h * .12 + j * 3, -w * .22, -h * .02 + j * 3);
    c.moveTo(w * .4, -h * .05 + j * 3); c.quadraticCurveTo(w * .3, -h * .12 + j * 3, w * .22, -h * .02 + j * 3);
    c.strokeStyle = rgb(pal.rim, .25); c.lineWidth = .6; c.stroke();
  }
  c.strokeStyle = rgb(pal.fil, .95); c.lineWidth = 1.1; c.lineCap = 'round';   // Golgi stacks
  for (let j = 0; j < 3; j++) { c.beginPath(); c.arc(0, h * .02 + j * 2.4, w * (.2 - j * .03), Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
  c.beginPath(); c.ellipse(0, -h * .2, w * .25, h * .2, 0, 0, TAU); c.fillStyle = rgb(pal.nuc, .9); c.fill();
  c.strokeStyle = rgb(mix(pal.nuc, [0, 0, 0], .3), .45); c.lineWidth = .7; c.stroke();
  circle(c, -w * .07, -h * .25, w * .045, rgb(pal.fil, .5));
  if (secrete) for (let j = 0; j < 3; j++) {   // secretory vesicles: Golgi → basal membrane
    const u = loopT(t * .35 + j / 3 + seed * .17, 1);
    circle(c, (hash(seed * 9 + j) - .5) * w * .5, lerp(h * .08, h * .45, u), 1.25, rgb(NP.osteoid.body, .95), rgb(NP.osteoid.rim, .6 * Math.sin(u * Math.PI)));
  }
  c.restore();
}

/** Matrix vesicle (the catalogue platelet shape): a small membrane bud seeding hydroxyapatite needles. */
function matrixVesicle(c, x, y, r, t, seed, a = 1, crystal = .6) {
  if (a <= .01) return;
  const pts = []; for (let i = 0; i < 9; i++) { const an = i / 9 * TAU, k = 1 + (hash(seed * 13 + i) - .5) * .32 + .04 * Math.sin(t + i); pts.push(Math.cos(an) * r * 1.15 * k, Math.sin(an) * r * .85 * k); }
  c.save(); c.globalAlpha *= a; shape(c, x, y, pts, NP.osteoid, r, Math.max(.5, r * .14));
  c.translate(x, y); c.strokeStyle = rgb(thLine(NP.matrix.rim)); c.lineWidth = Math.max(.5, r * .12); c.lineCap = 'round';
  const nN = 1 + Math.round(crystal * 3);
  for (let i = 0; i < nN; i++) { const an = hash(seed + i * 2.1) * TAU, l = r * (.35 + crystal * .4); c.beginPath(); c.moveTo(-Math.cos(an) * l, -Math.sin(an) * l); c.lineTo(Math.cos(an) * l, Math.sin(an) * l); c.stroke(); }
  c.restore();
}
GLYPHS.mv = (c, s, a) => matrixVesicle(c, 0, 0, s * .45, 0, 3, a, .7);

const OB = { ys: 104, seam: 18, v: 3.4, w: 45, h: 40, slots: 5, cycle: 12, order: [2, 0, 4, 1, 3] };
const EMBED = OB.order.map((_, i) => osteocyte(9300 + i * 17, .36, { drift: .2 }));

registerSpecimen('osteoblast-scene', 200, (c, t) => {
  const { ys, seam, v, w, h, slots, cycle, order } = OB, ym = ys + seam, M = NP.matrix, O = NP.osteoid;
  const front = x => ym + 1.4 * Math.sin(x * .07 + t * .2);
  // mineralized bone and the osteoid seam above it
  c.beginPath(); c.moveTo(-8, 208); for (let x = -8; x <= 268; x += 4) c.lineTo(x, front(x)); c.lineTo(268, 208); c.closePath();
  c.fillStyle = rgb(th(M.body)); c.fill();
  c.beginPath(); c.moveTo(-8, ys); c.lineTo(268, ys); for (let x = 268; x >= -8; x -= 4) c.lineTo(x, front(x)); c.closePath();
  c.fillStyle = rgb(th(O.body)); c.fill();
  // collagen laid down at the surface moves down: banded fibrils in the osteoid, lamellae once mineralized
  const S = 5.4, span = 208 - ys, n = Math.ceil(span / S);
  for (let k = 0; k < n; k++) {
    const raw = v * t + k * S, y = ys + loopT(raw, span), id = Math.floor(raw / span) * 31 + k;
    const fade = clamp((y - ys) / 4);
    c.beginPath();
    for (let x = -8; x <= 268; x += 5) { const yy = y + 1.2 * Math.sin(x * .05 + id); x === -8 ? c.moveTo(x, yy) : c.lineTo(x, yy); }
    if (y < ym) { c.setLineDash([5, 1.6]); c.strokeStyle = rgb(thLine(O.fil), .9 * fade); }
    else { c.setLineDash([]); c.strokeStyle = rgb(thLine(M.fil), .95); }
    c.lineWidth = .7; c.stroke(); c.setLineDash([]);
  }
  // mineralization front: hydroxyapatite needles
  c.strokeStyle = rgb(thLine(M.rim), .8); c.lineWidth = .7;
  for (let i = 0; i < 46; i++) { const x = i * 5.8 + hash(i) * 3, y = front(x) + (hash(i * 3) - .5) * 2.4, an = hash(i * 7) * Math.PI; c.beginPath(); c.moveTo(x - Math.cos(an) * 1.6, y - Math.sin(an) * 1.6); c.lineTo(x + Math.cos(an) * 1.6, y + Math.sin(an) * 1.6); c.stroke(); }
  c.beginPath(); c.moveTo(-8, ys); c.lineTo(268, ys); c.strokeStyle = rgb(thLine(O.rim), .7); c.lineWidth = .8; c.stroke();

  // osteoblasts being buried: each cycle one slot's cell is left behind and becomes an osteocyte
  const ci = Math.floor(t / cycle), slotX = k => 26 + k * (w + 6);
  for (let back = 3; back >= 0; back--) {
    const cj = ci - back; if (cj < 0) continue;
    const age = t - cj * cycle, k = order[((cj % slots) + slots) % slots], depth = v * age;
    const x = slotX(k), m = sstep((age - 2) / 9);
    if (ys + depth - h > 214) continue;
    drawCell(c, EMBED[k], x, ys - h * .4 + depth + 6, { t: t * 1.2, sprout: m, a: sstep((age - 1.5) / 5), lcn: 2.4, lcnCol: lcnCol(), gK: .7 });
    drawOsteoblast(c, t, x, ys + depth, w * (1 - .4 * m), h * (1 - .45 * m), 0, k + 1, 1 - sstep((age - 3) / 7), false);
  }
  // matrix vesicles budding from the cells' bases and drifting to the front
  for (let i = 0; i < 7; i++) {
    const u = loopT(t * .09 + hash(i * 4.2), 1), x = 20 + hash(i * 6.6) * 220;
    matrixVesicle(c, x, lerp(ys + 3, ym + 1, u), 2.6, t, i, Math.sin(u * Math.PI) * .95, u);
  }
  // the surface layer (the embedding slot is refilled by a new osteoblast)
  const cur = order[((ci % slots) + slots) % slots], age = t - ci * cycle;
  for (let k = 0; k < slots; k++) {
    if (k === cur) {
      const r = sstep((age - 6.5) / 4.5);
      drawOsteoblast(c, t, slotX(k), ys - (1 - r) * 18, w * lerp(.6, 1, r), h * lerp(.6, 1, r), 0, k + 11, r);
    } else drawOsteoblast(c, t, slotX(k), ys, w, h, 0, k + 1, 1);
  }
  lab(c, 'OSTEOBLASTS', 130, 52, { mono: true, size: 6.8 });
  lab(c, 'OSTEOID', 236, ys + 9, { mono: true, size: 6.2, color: '#b49a62' });
  lab(c, 'MINERALIZED BONE', 214, 192, { mono: true, size: 6.4 });
});

/* ---------------------------------------------------------------- remodeling unit */
const RM = { y0: 114, xc: 198, half: 40, H: 48, v: 4, dm: 20 };
registerSpecimen('remodeling', 200, (c, t) => {
  const { y0, xc, half, H, v, dm } = RM, shift = v * t;
  const carved = x => sstep((xc + 24 - x) / 56);
  const filled = x => .93 * sstep((132 - x) / 104);
  const cement = x => y0 + dm * (.7 + .3 * bay(x + shift)) * carved(x);
  const surf = x => cement(x) - (cement(x) - y0) * filled(x);
  drawBone(c, surf, y0, shift, { clip: cement });
  lacunarOsteocytes(c, t, shift, 166);
  // new bone between the cement line and the surface: lamellae parallel to the cement line, osteoid on top
  c.save(); slabPath(c, surf); c.clip();
  c.beginPath(); c.moveTo(-8, y0 - 2); for (let x = -8; x <= 268; x += 2) c.lineTo(x, cement(x)); c.lineTo(268, y0 - 2); c.closePath();
  c.fillStyle = rgb(th(mix(NP.matrix.body, NP.osteoid.body, .55))); c.fill();
  c.strokeStyle = rgb(thLine(NP.osteoid.fil), .9); c.lineWidth = .65;
  for (let k = 1; k < 7; k++) { c.beginPath(); for (let x = -8; x <= 268; x += 3) { const y = cement(x) - k * 3.1; x === -8 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); }
  c.beginPath(); for (let x = -8; x <= 268; x += 2) { const y = surf(x); x === -8 ? c.moveTo(x, y) : c.lineTo(x, y); }
  c.lineWidth = 6; c.strokeStyle = rgb(th(NP.osteoid.body), .95); c.stroke();
  c.restore();
  // cement (reversal) line: scalloped, where resorption stopped and formation began
  c.beginPath(); for (let x = -8; x <= xc - half; x += 2) { const y = cement(x); x === -8 ? c.moveTo(x, y) : c.lineTo(x, y); }
  c.strokeStyle = rgb(thLine(NP.matrix.nuc), .85); c.lineWidth = 1; c.stroke();
  // osteoblasts on the new surface, lining cells where formation is done
  for (let i = 0; i < 9; i++) {
    const x = 18 + i * 14.5, slope = (surf(x + 2) - surf(x - 2)) / 4, act = sstep((x - 10) / 30);
    drawOsteoblast(c, t, x, surf(x), lerp(14, 13.5, act), lerp(5, 13, act), Math.atan(slope), i + 3, 1, act > .5);
  }
  REV_SMALL.forEach((cell, k) => onSurface(c, cell, 138 + k * 14, surf, { t: t * 1.3 }, 2.5));
  drawOsteoclast(c, t, xc, half, H, surf);
  resorption(c, t, xc, half, H, surf);
  lab(c, 'FORMATION', 62, 82, { mono: true, size: 6.6 }); lab(c, 'REVERSAL', 150, 82, { mono: true, size: 6.6 }); lab(c, 'RESORPTION', 200, 58, { mono: true, size: 6.6 });
  lab(c, 'CEMENT LINE', 92, 150, { mono: true, size: 6.2 }); line(c, 92, 145, 96, cement(96) + 1.5, '#c6b98f', .6);
});

/* ---------------------------------------------------------------- close-ups and reversal cells */
registerSpecimen('osteoclast-b', 200, (c, t) => {
  const y0 = 134, xc = 130, half = 82, H = 94;
  const pit = x => { const u = (x - xc) / (half + 4); return Math.abs(u) < 1 ? 18 * Math.pow(1 - u * u, .8) * (.82 + .18 * bay(x * 1.4)) : 0; };
  const surf = x => y0 + pit(x);
  drawBone(c, surf, y0, 0);
  lacunarOsteocytes(c, 0, 40, 180);
  drawOsteoclast(c, t, xc, half, H, surf);
  resorption(c, t, xc, half, H, surf);
  lab(c, 'RUFFLED BORDER', 130, 196, { mono: true, size: 6.6 });
  lab(c, 'SEALING ZONE', 34, 124, { mono: true, size: 6.4 }); lab(c, 'HOWSHIP’S LACUNA', 214, 160, { mono: true, size: 6.4 });
});

function tripleHelix(c, x, y, len, ang, t, a) {      // procollagen: three intertwined α chains
  if (a <= .01) return;
  c.save(); c.translate(x, y); c.rotate(ang); c.globalAlpha *= a; c.lineWidth = .75;
  const cols = [NP.osteoid.rim, NP.osteoid.nuc, NP.matrix.rim];
  for (let k = 0; k < 3; k++) {
    c.beginPath(); for (let i = 0; i <= 16; i++) { const u = i / 16, xx = (u - .5) * len, yy = 1.3 * Math.sin(u * TAU * 2.2 + k * TAU / 3 + t * 1.5); i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
    c.strokeStyle = rgb(thLine(cols[k]), .95); c.stroke();
  }
  c.restore();
}
const OB_CLOSE_OCY = osteocyte(9411, .5, { drift: .2 });
registerSpecimen('osteoblast-b', 200, (c, t) => {
  const ys = 118, ym = 146, M = NP.matrix, O = NP.osteoid, v = 1.4;
  c.fillStyle = rgb(th(M.body)); c.fillRect(-8, ym, 276, 70);
  c.fillStyle = rgb(th(O.body)); c.fillRect(-8, ys, 276, ym - ys);
  const span = 216 - ys, S = 5;
  for (let k = 0; k < Math.ceil(span / S); k++) {
    const raw = v * t + k * S, y = ys + loopT(raw, span), id = Math.floor(raw / span) * 31 + k;
    c.beginPath(); for (let x = -8; x <= 268; x += 5) { const yy = y + 1 * Math.sin(x * .05 + id); x === -8 ? c.moveTo(x, yy) : c.lineTo(x, yy); }
    if (y < ym) { c.setLineDash([5, 1.6]); c.strokeStyle = rgb(thLine(O.fil), .9 * clamp((y - ys) / 4)); } else { c.setLineDash([]); c.strokeStyle = rgb(thLine(M.fil), .95); }
    c.lineWidth = .7; c.stroke(); c.setLineDash([]);
  }
  drawCell(c, OB_CLOSE_OCY, 130, 180, { t: t * 1.2, lcn: 2.6, lcnCol: lcnCol(), gK: .7, onStrands: shearFlow(t, 3) });
  [48, 130, 212].forEach((x, k) => {
    for (let j = 0; j < 4; j++) {                    // procollagen leaving the base and joining fibrils
      const u = loopT(t * .16 + j / 4 + k * .3, 1);
      tripleHelix(c, x - 24 + j * 15 + Math.sin(u * 4 + j) * 2, lerp(ys - 2, ym - 4, u), 13, lerp(1.2, 0, sstep(u * 1.4)), t + j, Math.sin(Math.PI * Math.min(1, u * 1.15)));
    }
    matrixVesicle(c, x + 18, lerp(ys + 2, ym, loopT(t * .07 + k * .4, 1)), 3, t, k, .9, loopT(t * .07 + k * .4, 1));
    drawOsteoblast(c, t, x, ys, 78, 74, 0, k + 1, 1, true, { p: 8 });
  });
  for (const x of [89, 171]) for (let j = 0; j < 4; j++) circle(c, x, ys - 18 - j * 11, 1.5, rgb(BP.cx43.body), rgb(BP.cx43.rim, .8));   // gap junctions between neighbours
  lab(c, 'OSTEOBLASTS · CUBOIDAL', 130, 30, { mono: true, size: 6.8 });
  lab(c, 'PROCOLLAGEN → FIBRILS', 60, ys + 22, { mono: true, size: 6.2, color: '#b49a62' });
  lab(c, 'GAP JUNCTIONS', 214, 34, { mono: true, size: 6.2 }); lab(c, 'OSTEOCYTE', 194, 190, { mono: true, size: 6.2 });
});

/* reversal cells: flattened, fibroblast-like osteoprogenitors that colonize the eroded surface */
Object.assign(NP, { reversal: { rim: [128, 136, 90], body: [214, 220, 180], fil: [246, 250, 230], nuc: [112, 120, 78] } });
function buildSpindle(R, o) {
  const prims = [];
  for (let i = 0; i < 2; i++) {
    const b = new Br({ ang: i * Math.PI + (R() - .5) * .12, len: (o.len || 30) * (.85 + R() * .3), w0: 6, w1: .6, curv: (R() - .5) * .25, ph: R() * TAU, freq: .3, amp: .04, kind: 'p' });
    if (R() < .8) b.kids.push(new Br({ at: .35 + R() * .3, ang: (R() < .5 ? -1 : 1) * (.35 + R() * .3), len: 8 + R() * 8, w0: 1.6, w1: .5, curv: (R() - .5) * .5, ph: R() * TAU, freq: .4, amp: .08, kind: 'k' }));
    prims.push(b);
  }
  return prims;
}
const revCell = (seed, sc) => new Cell('rev', 0, 0, seed, sc, { build: buildSpindle, pal: NP.reversal, R0: 5.2, elong: 2.5, drift: .3, len: 30 });
const REV = [0, 1, 2].map(i => revCell(9500 + i * 7, 1)), REV_SMALL = [0, 1].map(i => revCell(9520 + i * 7, .55));
function onSurface(c, cell, x, surf, P, lift = 4) {
  const slope = clamp((surf(x + 14) - surf(x - 14)) / 28, -.25, .25), y = (surf(x - 8) + surf(x) + surf(x + 8)) / 3;
  c.save(); c.translate(x, y - lift); c.rotate(Math.atan(slope)); cell.draw(c, P); c.restore();
}
registerSpecimen('reversal', 200, (c, t) => {
  const y0 = 122, surf = x => y0 + 14 * (.55 + .45 * bay(x + 9));
  drawBone(c, surf, y0, 0);
  lacunarOsteocytes(c, 0, 20, 176);
  const p = loopT(t / 16, 1), front = -10 + ease(clamp(p / .8)) * 280, fade = 1 - clamp((p - .9) / .1);
  // collagen remnants left by the osteoclast, picked up just ahead of the cement line
  for (let i = 0; i < 11; i++) {
    const x = 12 + i * 23 + hash(i) * 8, u = clamp((front - x + 34) / 26), a = (1 - u) * (p < .9 ? 1 : 1 - fade);
    c.save(); c.translate(x, surf(x) - 2 - u * 6); c.rotate(i); c.globalAlpha *= a; c.strokeStyle = rgb(thLine(NP.matrix.rim)); c.lineWidth = .8; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-3.5, 0); c.quadraticCurveTo(-1, -1.8, 0, 0); c.quadraticCurveTo(1.2, 1.8, 3.5, .4); c.moveTo(2, .8); c.lineTo(4, 2.2); c.stroke(); c.restore();
  }
  // cement line laid down along the eroded surface behind the cells
  c.save(); c.globalAlpha *= fade; c.beginPath();
  for (let x = -8; x <= Math.min(268, front); x += 2) { const y = surf(x) + 1.2; x === -8 ? c.moveTo(x, y) : c.lineTo(x, y); }
  c.strokeStyle = rgb(thLine(NP.matrix.nuc)); c.lineWidth = 1.8; c.stroke(); c.restore();
  REV.forEach((cell, k) => { const x = loopT(front - 30 - k * 82, 300) - 20; onSurface(c, cell, x, surf, { t: t * 1.3, gK: .6 }); });
  // canopy over the bone remodeling compartment
  for (let k = 0; k < 4; k++) drawOsteoblast(c, t, 34 + k * 64, 50, 62, 9, 0, k + 20, 1, false, { p: 4 });
  lab(c, 'CANOPY', 130, 36, { mono: true, size: 6.4 }); lab(c, 'BONE REMODELING COMPARTMENT', 130, 80, { mono: true, size: 6, alpha: .7 });
  lab(c, 'REVERSAL CELLS', 60, 104, { mono: true, size: 6.6 }); lab(c, 'CEMENT LINE', 200, 160, { mono: true, size: 6.4 });
});

/* ================================================================ isolated cells, drawn big */
/** Sample an absolute M/L/C/Z SVG path into flat outline points. */
function svgPts(d, nC = 14, nL = 6) {
  const tok = d.match(/[MLCZ]|-?\d*\.?\d+/g), pts = []; let i = 0, cx = 0, cy = 0, cmd = '';
  const num = () => +tok[i++];
  while (i < tok.length) {
    if (/[MLCZ]/.test(tok[i])) cmd = tok[i++];
    if (cmd === 'Z') break;
    if (cmd === 'M') { cx = num(); cy = num(); pts.push(cx, cy); cmd = 'L'; }
    else if (cmd === 'L') { const x = num(), y = num(); for (let k = 1; k <= nL; k++) pts.push(lerp(cx, x, k / nL), lerp(cy, y, k / nL)); cx = x; cy = y; }
    else if (cmd === 'C') {
      const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num();
      for (let k = 1; k <= nC; k++) { const u = k / nC, v = 1 - u; pts.push(v * v * v * cx + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x, v * v * v * cy + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y); }
      cx = x; cy = y;
    }
  }
  if (pts[0] === pts[pts.length - 2] && pts[1] === pts[pts.length - 1]) pts.length -= 2;
  return pts;
}
/** The catalogue osteoblast outline, verbatim. */
const OB_SHAPE = svgPts('M -66 32 L -62 -12 C -58 -44 -30 -58 4 -56 C 38 -54 66 -40 66 -8 L 66 36 C 66 50 56 56 42 56 L -46 56 C -60 56 -68 48 -66 32 Z');

registerSpecimen('osteoblast', 190, (c, t) => {
  c.save(); c.translate(130, 92); c.scale(.7, .7); c.translate(-130, -92);
  const P = NP.osteoblast, s = 1.3, br = .012 * Math.sin(t * .8), cx = 130, cy = 86;
  const pts = OB_SHAPE.map((v, i) => {
    if (i % 2) return v * s * (1 + br);
    const y = OB_SHAPE[i + 1]; return v * s * (1 - br * .6) + Math.sin(y * .06 + t * .7) * .8;
  });
  shape(c, cx, cy, pts, P, 70, 1.8);
  c.save(); c.translate(cx, cy);
  const nx = Math.sin(t * .3) * .8, ny = -20 + Math.cos(t * .27) * .6;                       // nucleus, away from the secretory base
  c.beginPath(); c.ellipse(nx, ny, 17, 13, .08, 0, TAU); c.fillStyle = rgb(P.nuc, .92); c.fill();
  c.strokeStyle = rgb(P.rim, .22); c.lineWidth = .7; c.stroke();
  circle(c, nx + 4, ny - 3, 2.6, rgb(P.fil, .55));
  for (let j = 0; j < 6; j++) {                                                             // secretory vesicles moving to the base
    const u = loopT(t * .18 + j / 6, 1), x = (hash(j * 3) - .5) * 64;
    circle(c, x, lerp(4, 66, u), 1.9, rgb(P.fil, .9 * Math.sin(u * Math.PI)));
  }
  c.restore();
  for (let j = 0; j < 5; j++) {                                                             // exocytosed procollagen leaving the base
    const u = loopT(t * .14 + j / 5, 1);
    tripleHelix(c, cx - 56 + j * 28 + Math.sin(u * 3 + j) * 3, cy + 76 + u * 26, 16, Math.sin(u * 2 + j) * .4, t + j, Math.sin(u * Math.PI));
  }
  matrixVesicle(c, cx + 62, cy + 80 + loopT(t * .1, 1) * 20, 4, t, 2, Math.sin(loopT(t * .1, 1) * Math.PI), loopT(t * .1, 1));
  c.restore();
  lab(c, 'PROCOLLAGEN · MATRIX VESICLE', 130, 170, { mono: true, size: 6.4 });
});

/** Osteoclast after the reference: a smooth dome, flared feet, and even, rounded ruffled-border fingers. */
function cubic(p0, p1, p2, p3, u) { const v = 1 - u; return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]]; }
function osteoclastIsoPts(t) {
  const pts = [], br = 1 + .018 * Math.sin(t * .8);
  for (let i = 0; i <= 44; i++) { const a = i / 44 * Math.PI; pts.push(84 * Math.cos(a), -12 - 80 * br * Math.pow(Math.sin(a), .8)); }
  const seg = (P, n = 10) => { for (let k = 1; k <= n; k++) pts.push(...cubic(P[0], P[1], P[2], P[3], k / n)); };
  seg([[-84, -12], [-88, 2], [-104, 4], [-108, 14]]); seg([[-108, 14], [-111, 24], [-94, 26], [-82, 18]], 8);    // left foot
  // ruffled border: a few irregular lobes, foot-sized, leaning in different directions (not a row of identical teeth)
  const LOBES = [[30, 17, -1.1], [22, 12, .4], [32, 19, -.3], [24, 13, .9], [28, 17, 1.25]];
  let xa = -80;
  LOBES.forEach(([w, L, tilt], i) => {
    const tl = tilt + .14 * Math.sin(t * .55 + i * 1.7), ll = L * (1 + .08 * Math.sin(t * .7 + i * 1.3));
    const xb = xa + w, dx = Math.sin(tl) * ll * 1.35, dy = Math.cos(tl) * ll * 1.35, yb = 17 + (i % 2) * 1.5;
    seg([[xa, yb], [xa + dx - w * .08, yb + dy], [xb + dx + w * .08, yb + dy], [xb, yb]], 12);
    if (i < LOBES.length - 1) { pts.push(xb + .6, yb - 5, xb + 1.5, yb - 9, xb + 2.4, yb - 5); xa = xb + 3; }   // a deep, narrow crack
  });
  seg([[82, 18], [94, 26], [111, 24], [108, 14]], 8); seg([[108, 14], [104, 4], [88, 2], [84, -12]]);          // right foot
  return pts;
}
const OC_NUCLEI = [[-54, -24], [-26, -50], [18, -56], [4, -28], [50, -28]];
registerSpecimen('osteoclast', 200, (c, t) => {
  const P = NP.osteoclast, cx = 130, cy = 132;
  // what the ruffled border secretes: protons and cathepsin K
  for (let i = 0; i < 12; i++) {
    const u = loopT(t * .3 + hash(i * 3.7), 1), x = cx - 76 + (i + .5) * 152 / 12;
    if (i % 3) lab(c, 'H⁺', x, cy + 34 + u * 26, { size: 5.4, color: rgb(P.rim), alpha: Math.sin(u * Math.PI) * .9, always: true });
    else { c.save(); c.translate(x, cy + 36 + u * 24); c.globalAlpha *= Math.sin(u * Math.PI); circle(c, -1.4, 0, 2.2, rgb(P.body), rgb(P.rim, .8)); circle(c, 1.6, .6, 1.6, rgb(P.body), rgb(P.rim, .8)); c.restore(); }
  }
  const pts = osteoclastIsoPts(t);
  shape(c, cx, cy, pts, P, 90, 1.8);
  c.save(); c.translate(cx, cy);
  for (let i = 0; i < 10; i++) circle(c, (hash(i * 3.3) - .5) * 130, -10 - hash(i * 5.1) * 50, 2.2, rgb(P.fil, .8), rgb(P.rim, .3));   // lysosomes
  OC_NUCLEI.forEach(([x, y], i) => {
    const nx = x + Math.sin(t * .35 + i) * .8, ny = y + Math.cos(t * .3 + i * 2) * .6;
    c.beginPath(); c.ellipse(nx, ny, 11.5, 8, (i % 2 ? .12 : -.1), 0, TAU); c.fillStyle = rgb(P.nuc, .92); c.fill();
    c.strokeStyle = rgb(P.rim, .22); c.lineWidth = .7; c.stroke();
  });
  // RANK on the surface, with RANKL trimers docking and leaving (the signal that makes and keeps osteoclasts)
  [[.3, 0], [.66, .5]].forEach(([a, ph]) => {
    const an = a * Math.PI, br = 1 + .018 * Math.sin(t * .8);
    const bx = 84 * Math.cos(an), by = -12 - 80 * br * Math.pow(Math.sin(an), .8);
    const nl = Math.hypot(bx, by + 30), ux = bx / nl, uy = (by + 30) / nl;               // outward from the dome's centre
    for (let j = 0; j < 4; j++) dom(c, bx + ux * (4 + j * 6), by + uy * (4 + j * 6), 2.8, 3.6, Math.atan2(uy, ux) - Math.PI / 2, NP.rank || NP.osteoblast, .6);
    const d = loopT(t / 7 + ph, 1), dock = ease(clamp(d / .35)) * (1 - ease(clamp((d - .75) / .25)));
    c.save(); c.globalAlpha *= Math.min(1, dock * 1.5 + .25);
    c.translate(bx + ux * (30 + (1 - dock) * 22), by + uy * (30 + (1 - dock) * 22));
    gTNF(c, 12, 1, (NP.rankl || BP.rankl).body); c.restore();
  });
  c.restore();
  lab(c, 'MULTINUCLEATED', 130, 18, { mono: true, size: 6.6 }); lab(c, 'RANK · RANKL', 40, 40, { mono: true, size: 6.4 });
  lab(c, 'RUFFLED BORDER', 216, 186, { mono: true, size: 6.4 }); lab(c, 'H⁺ · CATHEPSIN K', 52, 194, { mono: true, size: 6.2 });
});

/** One reversal cell: flattened, fibroblast-like, taking up collagen remnants. */
const REV_BIG = revCell(9555, 2.3);
registerSpecimen('reversal-cell', 170, (c, t) => {
  drawCell(c, REV_BIG, 130, 84, { t: t * 1.2, gK: .7 });
  for (let i = 0; i < 6; i++) {
    const u = loopT(t * .12 + i / 6, 1), x = 50 + i * 32, y = lerp(150, 92, ease(u));
    c.save(); c.translate(x + Math.sin(u * 4 + i) * 3, y); c.rotate(i + u); c.globalAlpha *= Math.sin(u * Math.PI) * .9;
    c.strokeStyle = rgb(thLine(NP.matrix.rim)); c.lineWidth = 1.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-6, 0); c.quadraticCurveTo(-2, -3, 0, 0); c.quadraticCurveTo(2, 3, 6, .5); c.stroke(); c.restore();
  }
  lab(c, 'COLLAGEN REMNANTS TAKEN UP', 130, 162, { mono: true, size: 6.4 });
});

export const BONE_KEYS = ['osteocyte', 'osteocyte-b', 'osteocyte-network', 'osteoclast', 'osteoclast-b', 'osteoblast', 'osteoblast-b', 'reversal', 'remodeling'];

/* shared with bone-v2.js */
export { caWaves, drawCell, drawBone, bay, drawOsteoclast, osteoclastPts, osteoclastIsoPts, OC, NUCLEI, OC_NUCLEI, onSurface, chevron, shearAt, SHEAR_W, tripleHelix };
