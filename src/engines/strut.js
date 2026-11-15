// @ts-nocheck
/* Struts (ASSETS-TODO.md tier 1, REVISION.md step 5).
   - trabecula: a longitudinal strut with thickness as a parameter, lamellae along its length, irregular scalloped
     margins, osteocytes at one realistic density (so thin holds 3 to 4 and thick 15 to 20), canaliculi between
     lacunae and out to both surfaces. States: intact, cavity, perforated, stub.
   - label-strut: calcein and alizarin on a dark field. Apposition against selection.
   - osteocyte-network-v2 and the thin-strut network: the same eight-cell network in an open field and in a 40 µm strut.
   Geometry is in micrometres; a strut is drawn at K screen units per µm. */
import { E, NP, registerSpecimen, isDark } from './atlas.js';
import { th, thLine } from './kit.js';
import { ocyV2, ocyNetwork } from './bone-v2.js';

const { TAU, clamp, lerp, hash, mix, rgb, lab, rng } = E;
const L = (c, s, x, y, o = {}) => lab(c, s, x, y, { mono: true, size: 6, ...o });

/** Osteocytes per µm² of section: 3 to 4 in a 30 µm strut, 15 to 20 in a 120 µm one (440 µm long). */
export const OCY_DENSITY = 3.1e-4;
/** One osteocyte in cell units → µm: a lacuna about 16 µm long. */
const CELL_UM = .32;

/* ---------------------------------------------------------------- geometry */
/**
 * o: { len, th (µm), seed, cavity: { at, w, depth }, stub: { at, w } }.
 * cavity digs down from the top surface (depth > th perforates); stub removes a span and rounds the two free ends.
 */
export function strutGeom(o) {
  const { len, th: T, seed = 1 } = o, R = rng(seed * 31 + 7), ph = Array.from({ length: 8 }, () => R() * TAU);
  const bend = x => 4 * Math.sin(x / len * Math.PI * 1.2 + ph[0]) + 2 * Math.sin(x * .021 + ph[1]);
  const rough = (x, k) => T * .035 * Math.sin(x * .037 + ph[2 + k]) + 1.3 * Math.abs(Math.sin(x * .085 + ph[4 + k])) + .8 * Math.sin(x * .19 + ph[6 + k]);
  const top0 = x => bend(x) - T / 2 + rough(x, 0), bot0 = x => bend(x) + T / 2 - rough(x, 1);
  const cav = o.cavity, stub = o.stub;
  const dig = x => {
    if (!cav) return 0; const u = (x - cav.at) / (cav.w / 2); if (Math.abs(u) >= 1) return 0;
    return cav.depth * Math.pow(1 - u * u, .55) * (.86 + .14 * Math.abs(Math.sin(x * .3 + ph[3])));   // Howship's scallops
  };
  const capK = x => {
    if (!stub) return 1; const d = Math.abs(x - stub.at) - stub.w / 2; if (d <= 0) return 0;
    const r = T * .55; return d >= r ? 1 : Math.sqrt(1 - (1 - d / r) ** 2);
  };
  const half = x => (bot0(x) - top0(x)) / 2 * capK(x), mid = x => (bot0(x) + top0(x)) / 2;
  const top = x => mid(x) - half(x) + dig(x), bot = x => mid(x) + half(x);
  const pieces = []; let a = null;
  for (let x = 0; x <= len; x += .5) {
    const ok = bot(x) - top(x) > .3;
    if (ok && a === null) a = x;
    if ((!ok || x + .5 > len) && a !== null) { pieces.push([a, ok ? x : x - .5]); a = null; }
  }
  const inside = (x, y, m = 0) => pieces.some(([p, q]) => x > p + m && x < q - m) && y > top(x) + m && y < bot(x) - m;
  let area = 0; for (const [p, q] of pieces) for (let x = p; x < q; x += 1) area += Math.max(0, bot(x) - top(x));
  return { len, T, top, bot, top0, bot0, pieces, inside, area, seed };
}

/** Osteocyte positions at OCY_DENSITY, placed on geometry G (dart throwing, min spacing). */
export function placeCells(G, seed = 1, density = OCY_DENSITY) {
  const R = rng(seed * 97 + 3), N = Math.round(G.area * density), pts = [], minD = Math.min(46, Math.sqrt(G.area / Math.max(1, N)) * .75);
  for (let i = 0; i < 6000 && pts.length < N; i++) {
    const x = R() * G.len, y = lerp(G.top(x), G.bot(x), R());
    if (!G.inside(x, y, 6.5) || x < 10 || x > G.len - 10) continue;
    if (pts.every(p => Math.hypot((p.x - x) * .8, p.y - y) > minD)) pts.push({ x, y });
  }
  return pts;
}
/** Shared canaliculi: each cell to its two nearest neighbours within reach. */
export function nearLinks(pts, reach = 75) {
  const out = [], key = new Set();
  pts.forEach((p, i) => {
    pts.map((q, j) => [j, Math.hypot(q.x - p.x, q.y - p.y)]).filter(([j, d]) => j !== i && d < reach).sort((a, b) => a[1] - b[1]).slice(0, 2)
      .forEach(([j]) => { const k = i < j ? `${i}-${j}` : `${j}-${i}`; if (!key.has(k)) { key.add(k); out.push([i, j, (hash(i * 7 + j) - .5) * .12]); } });
  });
  return out;
}
const POOL = [];
const poolCell = i => POOL[i] || (POOL[i] = ocyV2(9600 + i * 7, { n: 30 }));

/** The strut outline (all pieces) in µm. */
function strutPath(c, G) {
  c.beginPath();
  for (const [a, b] of G.pieces) {
    c.moveTo(a, G.top(a));
    for (let x = a; x <= b; x += 1.5) c.lineTo(x, G.top(x));
    c.lineTo(b, G.top(b));
    for (let x = b; x >= a; x -= 1.5) c.lineTo(x, G.bot(x));
    c.lineTo(a, G.bot(a)); c.closePath();
  }
}
/**
 * Draw strut G with its centreline start at (x, y), K screen units per µm, rotated by rot.
 * cells: µm positions (filtered to G), links between them, states: per-cell osteocyte state.
 */
export function drawStrut(c, G, o) {
  const K = o.K, M = NP.matrixV2, t = o.t || 0;
  c.save(); c.translate(o.x, o.y); if (o.rot) c.rotate(o.rot); c.scale(K, K);
  strutPath(c, G); c.fillStyle = rgb(th(M.body)); c.fill();
  c.save(); strutPath(c, G); c.clip();
  // lamellae along the length, following the intact surfaces: a cavity cuts across them
  const n = Math.max(3, Math.round(G.T / 5));
  c.strokeStyle = isDark() ? rgb(th(M.fil, .45), .85) : rgb(M.fil, .9); c.lineWidth = .55 / K;
  for (let k = 1; k < n; k++) {
    const f = k / n; c.beginPath();
    for (let x = 0; x <= G.len; x += 3) { const y = lerp(G.top0(x), G.bot0(x), f) + .5 * Math.sin(x * .05 + k * 1.7); x ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
  }
  // an old remodelling packet: a scalloped cement line
  if (o.cement !== false) {
    const R = rng(G.seed * 13 + 1), cx = G.len * (.25 + R() * .5), w = Math.min(170, G.len * .4), d = G.T * .38;
    c.beginPath();
    for (let x = cx - w / 2; x <= cx + w / 2; x += 1.5) { const u = (x - cx) / (w / 2), y = G.bot0(x) - d * Math.sqrt(Math.max(0, 1 - u * u)) * (.9 + .1 * Math.abs(Math.sin(x * .28))); x === cx - w / 2 ? c.moveTo(x, y) : c.lineTo(x, y); }
    c.strokeStyle = rgb(thLine(M.nuc), .7); c.lineWidth = .7 / K; c.stroke();
  }
  // osteocytes in their lacunae, sharing canaliculi, canaliculi running out to both surfaces
  const cells = (o.cells || []).map((p, i) => ({ ...p, i })).filter(p => G.inside(p.x, p.y, 7));
  if (cells.length) {
    const idx = new Map(cells.map((p, k) => [p.i, k]));
    const links = (o.links || []).filter(([a, b]) => idx.has(a) && idx.has(b)).map(([a, b, s]) => [idx.get(a), idx.get(b), s]);
    const nodes = cells.map(p => ({ cell: poolCell(p.i), x: p.x, y: p.y, st: o.states?.[p.i] || o.state || 'plain' }));
    ocyNetwork(c, nodes, links, CELL_UM, t, { ext: .35, px: 1 / (CELL_UM * K), glyphK: o.glyphK });
  }
  c.restore();
  strutPath(c, G); c.strokeStyle = rgb(thLine(M.rim)); c.lineWidth = .9 / K; c.lineJoin = 'round'; c.stroke();
  c.restore();
  return cells.length;
}

/* ---------------------------------------------------------------- trabecula */
const LEN = 440, KT = .55;
const T_THICK = strutGeom({ len: LEN, th: 120, seed: 3 }), T_THIN = strutGeom({ len: LEN, th: 30, seed: 5 });
const C_THICK = placeCells(T_THICK, 11), C_THIN = placeCells(T_THIN, 12);
const L_THICK = nearLinks(C_THICK), L_THIN = nearLinks(C_THIN);
function scaleBar(c, x, y, K, um = 100) {
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + um * K, y); c.strokeStyle = rgb(thLine([120, 124, 120])); c.lineWidth = 1.2; c.stroke();
  L(c, `${um} µm`, x + um * K / 2, y + 7, { size: 5.4 });
}
registerSpecimen('trabecula', 236, (c, t) => {
  const n1 = drawStrut(c, T_THICK, { x: 10, y: 74, K: KT, t, cells: C_THICK, links: L_THICK });
  const n2 = drawStrut(c, T_THIN, { x: 10, y: 182, K: KT, t, cells: C_THIN, links: L_THIN });
  L(c, `120 µm · ${n1} OSTEOCYTES`, 12, 20, { align: 'left' });
  L(c, `30 µm · ${n2} OSTEOCYTES`, 12, 160, { align: 'left' });
  scaleBar(c, 196, 222, KT);
});

/* the same strut through its four states; the cells are placed once on the intact strut and lost where bone is lost */
const ST_T = 50, ST_SEED = 8, ST_CAV = { at: 220, w: 96 };
const STATES = [
  ['INTACT', strutGeom({ len: LEN, th: ST_T, seed: ST_SEED })],
  ['CAVITY · RESORPTION PIT PART WAY IN', strutGeom({ len: LEN, th: ST_T, seed: ST_SEED, cavity: { ...ST_CAV, depth: ST_T * .55 } })],
  ['PERFORATED · CAVITY REACHES THE FAR SURFACE', strutGeom({ len: LEN, th: ST_T, seed: ST_SEED, cavity: { ...ST_CAV, depth: ST_T * 1.3 } })],
  ['STUB · SEVERED, ENDS CLEANED BACK', strutGeom({ len: LEN, th: ST_T, seed: ST_SEED, stub: { at: 220, w: 120 } })],
];
const C_ST = placeCells(STATES[0][1], 21), L_ST = nearLinks(C_ST);
registerSpecimen('trabecula-states', 250, (c, t) => {
  STATES.forEach(([label, G], k) => {
    const y = 40 + k * 60;
    drawStrut(c, G, { x: 10, y, K: KT, t, cells: C_ST, links: L_ST });
    L(c, label, 12, y - 24, { align: 'left', size: 5.6 });
  });
});

/* ---------------------------------------------------------------- label-strut */
/* Fluorochromes are photographs of real dyes: these are their emission colours, not a stylisation. */
const CALCEIN = [64, 240, 96], ALIZARIN = [255, 70, 38];
const LS_G = strutGeom({ len: 330, th: 110, seed: 14 });
/** A label line at `depth` µm under the top or bottom surface, over the spans where that surface was forming. */
function labelLine(c, G, side, depth, col, spans, K, t) {
  const y = x => side < 0 ? G.top(x) + depth : G.bot(x) - depth;
  c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
  for (const [a, b] of spans) {
    c.beginPath(); for (let x = a; x <= b; x += 2) { const yy = y(x) + .4 * Math.sin(x * .2); x === a ? c.moveTo(x, yy) : c.lineTo(x, yy); }
    c.shadowColor = rgb(col, .8); c.shadowBlur = 3; c.strokeStyle = rgb(col, .5); c.lineWidth = 2.4 / K; c.stroke();
    c.shadowBlur = 0; c.strokeStyle = rgb(mix(col, [255, 255, 255], .35)); c.lineWidth = 1.3 / K; c.stroke();
  }
  c.restore();
}
function fluorStrut(c, x, y, K, t, labels) {
  const G = LS_G;
  c.save(); c.translate(x, y); c.rotate(-Math.PI / 2); c.scale(K, K);
  strutPath(c, G); c.fillStyle = 'rgb(34,42,54)'; c.fill();          // unlabelled bone: dim autofluorescence
  c.save(); strutPath(c, G); c.clip();
  c.strokeStyle = 'rgba(70,84,104,.55)'; c.lineWidth = .5 / K;
  for (let k = 1; k < 22; k++) { const f = k / 22; c.beginPath(); for (let xx = 0; xx <= G.len; xx += 4) { const yy = lerp(G.top0(xx), G.bot0(xx), f); xx ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); }
  for (const [side, depth, col, spans] of labels) labelLine(c, G, side, depth, col, spans, K, t);
  c.restore(); c.restore();
}
registerSpecimen('label-strut', 246, (c, t) => {
  c.fillStyle = 'rgb(8,10,14)'; c.beginPath(); c.roundRect(4, 4, 252, 238, 10); c.fill();     // dark field, in either theme
  const K = .55, base = 22, gap = 10, tip = 2.5;  // µm under the surface; calcein pair 6 days apart at about 1.7 µm/day
  // apposition: alizarin marks the baseline surface, now buried under new bone carrying both calcein labels
  fluorStrut(c, 66, 214, K, t, [
    [-1, base, ALIZARIN, [[6, 324]]], [1, base, ALIZARIN, [[8, 322]]],
    [-1, tip + gap, CALCEIN, [[18, 300]]], [-1, tip, CALCEIN, [[24, 292]]],
    [1, tip + gap, CALCEIN, [[40, 316]]], [1, tip, CALCEIN, [[48, 310]]],
  ]);
  // selection: the same thickness, but alizarin still sits on the surface and there is no new label at all
  fluorStrut(c, 194, 214, K, t, [[-1, 1.2, ALIZARIN, [[6, 324]]], [1, 1.2, ALIZARIN, [[8, 322]]]]);
  const W = [226, 230, 236];
  L(c, 'APPOSITION', 66, 14, { color: rgb(W), size: 6.4, always: true });
  L(c, 'SELECTION', 194, 14, { color: rgb(W), size: 6.4, always: true });
  L(c, 'NEW BONE ON A SURVIVOR', 66, 23, { color: 'rgba(200,206,214,.7)', size: 4.8 });
  L(c, 'NO NEW LABEL · ALWAYS THICK', 194, 23, { color: 'rgba(200,206,214,.7)', size: 4.8 });
  c.fillStyle = rgb(ALIZARIN); c.beginPath(); c.arc(70, 230, 2.2, 0, TAU); c.fill();
  L(c, 'ALIZARIN · BASELINE', 76, 230, { color: rgb(mix(ALIZARIN, W, .4)), size: 4.8, align: 'left' });
  c.fillStyle = rgb(CALCEIN); c.beginPath(); c.arc(150, 230, 2.2, 0, TAU); c.fill();
  L(c, 'CALCEIN × 2 · 6 DAYS APART', 156, 230, { color: rgb(mix(CALCEIN, W, .4)), size: 4.8, align: 'left' });
});

/* ---------------------------------------------------------------- the network, open field and thin strut */
/* eight cells at the trabecular density; three lie on the midline, so a 40 µm strut through it keeps three */
const NET_PTS = [[36, 82], [124, 88], [214, 78], [70, 30], [160, 24], [236, 34], [78, 140], [176, 142]].map(([x, y]) => ({ x, y }));
const NET_LINKS = [...nearLinks(NET_PTS, 110).filter(([a, b]) => !((a < 3) && (b < 3))), [0, 1, .04], [1, 2, -.04]];   // the midline chain always connects
const NET_K = 1, NET_Y0 = 30;
const SHEAR = t => Math.max(0, -Math.sin(t * .9 - Math.PI / 2));
function loadArrows(c, t) {
  const load = SHEAR(t), M = NP.matrixV2;
  for (let k = 0; k < 3; k++) {
    const x = 70 + k * 60, y = 6 + load * 8;
    c.strokeStyle = rgb(thLine(M.nuc), .35 + .6 * load); c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x, y + 6); c.stroke();
    c.beginPath(); c.moveTo(x - 3.4, y + 3); c.lineTo(x, y + 7); c.lineTo(x + 3.4, y + 3); c.stroke();
  }
  L(c, load > .5 ? 'LOADING' : 'UNLOADING', 226, 12, { size: 6.2 });
}
registerSpecimen('osteocyte-network-v2', 210, (c, t) => {
  const M = NP.matrixV2, W = 248, H = 166;
  c.fillStyle = rgb(th(M.body)); c.beginPath(); c.roundRect(6, NET_Y0, W, H, 12); c.fill();
  c.save(); c.beginPath(); c.roundRect(6, NET_Y0, W, H, 12); c.clip();
  c.strokeStyle = isDark() ? rgb(th(M.fil, .45), .85) : rgb(M.fil, .9); c.lineWidth = .6;
  const load = SHEAR(t);
  for (let k = 0; k < 26; k++) { c.beginPath(); for (let x = 0; x <= 262; x += 5) { const y = NET_Y0 + 3 + k * 6.5 + 1.1 * Math.sin(x * .03 + k) + load * .9 * Math.sin(x * .02); x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
  c.translate(6, NET_Y0); c.scale(NET_K, NET_K);
  ocyNetwork(c, NET_PTS.map((p, i) => ({ cell: poolCell(40 + i), x: p.x, y: p.y, st: 'loaded' })), NET_LINKS, CELL_UM, t, { ext: .45, px: 1 / (CELL_UM * NET_K) });
  c.restore();
  loadArrows(c, t);
  L(c, 'LACUNOCANALICULAR NETWORK · 8 CELLS', 130, 204, { size: 6, color: rgb(thLine(NP.fluidV2.rim)) });
});
/* the same network inside a 40 µm strut: the network reaches both surfaces and keeps only the cells inside */
const NET_STRUT = strutGeom({ len: 248, th: 40, seed: 19 });
registerSpecimen('osteocyte-network-thin', 210, (c, t) => {
  const n = drawStrut(c, NET_STRUT, { x: 6, y: NET_Y0 + 84, K: NET_K, t, cells: NET_PTS.map(p => ({ x: p.x, y: p.y - 84 })), links: NET_LINKS, state: 'loaded', cement: false });
  // where the rest of the network would have been: marrow
  c.save(); c.setLineDash([2, 3]); c.strokeStyle = rgb(thLine([150, 150, 146]), .5); c.lineWidth = .7;
  NET_PTS.forEach(p => { if (!NET_STRUT.inside(p.x, p.y - 84, 4)) { c.beginPath(); c.ellipse(6 + p.x, NET_Y0 + p.y, 8, 3.6, 0, 0, TAU); c.stroke(); } });
  c.restore();
  L(c, 'MARROW', 130, 60, { size: 5.4, alpha: .6 }); L(c, 'MARROW', 130, 172, { size: 5.4, alpha: .6 });
  loadArrows(c, t);
  L(c, `SAME NETWORK · 40 µm STRUT · ${n} OF ${NET_PTS.length} CELLS`, 130, 204, { size: 6, color: rgb(thLine(NP.fluidV2.rim)) });
});

/* ---------------------------------------------------------------- why thin struts */
/**
 * The same number of osteocyte deaths in a thick and a thin strut. In the thick one the survivors linked to the
 * dying cells upregulate RANKL and run a local response; the thin one loses its whole population, with nobody left
 * to direct repair, so the whole element is flagged.
 */
const SD_THICK = strutGeom({ len: 250, th: 120, seed: 31 }), SD_THIN = strutGeom({ len: 250, th: 30, seed: 33 });
const SD_C1 = placeCells(SD_THICK, 41), SD_C2 = placeCells(SD_THIN, 43);
const SD_L1 = nearLinks(SD_C1, 90), SD_L2 = nearLinks(SD_C2, 200);
const DEATHS = Math.max(1, SD_C2.length);                 // as many deaths in the thick strut as the thin one has cells
function deathStates(cells, links, dying) {
  const st = cells.map(() => 'plain');
  dying.forEach(i => { st[i] = 'apoptotic'; });
  for (const [a, b] of links) { if (st[a] === 'apoptotic' && st[b] === 'plain') st[b] = 'viable'; if (st[b] === 'apoptotic' && st[a] === 'plain') st[a] = 'viable'; }
  return st;
}
const mid1 = SD_C1.map((p, i) => [i, Math.hypot(p.x - 125, p.y)]).sort((a, b) => a[1] - b[1]).slice(0, DEATHS).map(([i]) => i);
const SD_S1 = deathStates(SD_C1, SD_L1, mid1), SD_S2 = deathStates(SD_C2, SD_L2, SD_C2.map((_, i) => i));
registerSpecimen('strut-death', 250, (c, t) => {
  drawStrut(c, SD_THICK, { x: 5, y: 82, K: 1, t, cells: SD_C1, links: SD_L1, states: SD_S1, glyphK: 2.4 });
  drawStrut(c, SD_THIN, { x: 5, y: 208, K: 1, t, cells: SD_C2, links: SD_L2, states: SD_S2, glyphK: 2.4 });
  const ink = col => rgb(thLine(col));
  L(c, `120 µm · ${DEATHS} OF ${SD_C1.length} DIE · NEIGHBOURS SIGNAL RANKL`, 8, 12, { align: 'left', size: 5.6, color: ink(NP.ranklV2.rim) });
  L(c, `30 µm · ${SD_C2.length} OF ${SD_C2.length} DIE · NOBODY LEFT TO DIRECT REPAIR`, 8, 182, { align: 'left', size: 5.6, color: ink(NP.casp3V2.rim) });
});
