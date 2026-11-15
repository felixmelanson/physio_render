// @ts-nocheck
/* Added molecules and membrane proteins, in the atlas drawing language.
   Each registers a specimen (tile) and, where it makes sense, a glyph usable anywhere via glyph(c, type, …). */
import { E, NP, registerSpecimen } from './atlas.js';
import { th, thLine, polyPath, shape, dom, tube, rod, helix, propeller, bilayer, ion, loopT, win } from './kit.js';

const { TAU, clamp, lerp, sstep, ease, hash, mix, rgb, lab, circle, GLYPHS, BP, gIL1 } = E;

Object.assign(NP, {
  wnt: { rim: [56, 126, 150], body: [166, 212, 224], fil: [236, 250, 252], nuc: [44, 104, 126] },
  bcat: { rim: [146, 106, 168], body: [214, 194, 230], fil: [246, 240, 252], nuc: [124, 88, 148] },
  dkk1: { rim: [176, 94, 120], body: [238, 192, 206], fil: [255, 240, 244], nuc: [150, 74, 100] },
  fzd: { rim: [90, 138, 100], body: [190, 222, 192], fil: [240, 252, 240], nuc: [70, 118, 82] },
  itga: { rim: [64, 136, 122], body: [174, 218, 204], fil: [238, 252, 246], nuc: [50, 116, 102] },
  itgb: { rim: [124, 108, 170], body: [204, 196, 232], fil: [244, 240, 255], nuc: [104, 90, 150] },
  talin: { rim: [176, 138, 66], body: [238, 214, 160], fil: [255, 248, 226], nuc: [150, 116, 50] },
  ecm: { rim: [156, 140, 112], body: [224, 214, 192], fil: [248, 242, 228], nuc: [132, 118, 92] },
  e2: { rim: [190, 88, 66], body: [250, 214, 200], fil: [255, 244, 238], nuc: [160, 70, 50] },
  er: { rim: [88, 116, 170], body: [198, 210, 238], fil: [242, 246, 255], nuc: [70, 96, 150] },
  h12: { rim: [204, 122, 52], body: [248, 204, 150], fil: [255, 244, 226], nuc: [180, 100, 36] },
  coact: { rim: [112, 146, 84], body: [208, 226, 182], fil: [246, 252, 236], nuc: [92, 124, 66] },
  fgf23: { rim: [186, 104, 56], body: [244, 198, 160], fil: [255, 242, 230], nuc: [160, 86, 40] },
  klotho: { rim: [86, 138, 118], body: [188, 222, 206], fil: [240, 252, 246], nuc: [66, 116, 98] },
  fgfr: { rim: [100, 118, 176], body: [200, 208, 240], fil: [244, 246, 255], nuc: [80, 96, 154] },
  napi: { rim: [112, 124, 168], body: [204, 210, 236], fil: [244, 246, 255], nuc: [92, 104, 148] },
  villus: { rim: [172, 150, 128], body: [238, 226, 212], fil: [252, 246, 238], nuc: [150, 128, 104] },
  pth: { rim: [188, 86, 92], body: [244, 196, 196], fil: [255, 240, 240], nuc: [160, 66, 72] },
  pth1r: { rim: [84, 128, 160], body: [190, 214, 232], fil: [240, 248, 255], nuc: [64, 108, 140] },
  gs: { rim: [150, 138, 86], body: [228, 222, 182], fil: [252, 250, 234], nuc: [126, 116, 66] },
});

const L = (c, s, x, y, o = {}) => lab(c, s, x, y, { mono: true, size: 6.4, ...o });

/* ================================================================ glyphs */
/** Inorganic phosphate / ions: spheres with their symbol. */
GLYPHS.pi = (c, s, a) => ion(c, 0, 0, s * .45, NP.pi, 'Pi', a);
GLYPHS.ca = (c, s, a) => ion(c, 0, 0, s * .42, NP.ca, 'Ca', a);
GLYPHS.na = (c, s, a) => ion(c, 0, 0, s * .32, NP.na, 'Na', a);

/** Wnt: "thumb and index finger" fold; the thumb carries the palmitoleate lipid (Janda et al. 2012). */
function gWnt(c, s, a = 1) {
  const P = NP.wnt; c.save(); c.globalAlpha *= a;
  tube(c, [-s * .1, -s * .12, -s * .28, -s * .36, -s * .42, -s * .52], [s * .13, s * .1, s * .07], P, .8);           // thumb (NTD)
  tube(c, [s * .14, s * .1, s * .42, s * .12, s * .62, -s * .04, s * .64, -s * .3], [s * .12, s * .09, s * .07, s * .055], P, .8);   // index finger (CTD hairpin)
  dom(c, 0, 0, s * .3, s * .25, -.3, P);                                                                                       // helical core
  c.strokeStyle = rgb(thLine(mix(P.rim, [200, 170, 60], .5))); c.lineWidth = Math.max(.6, s * .028); c.lineCap = 'round'; c.beginPath();
  let x = -s * .42, y = -s * .52; c.moveTo(x, y);
  for (let k = 0; k < 6; k++) { x -= s * .06; y += (k % 2 ? 1 : -1) * s * .04 - s * .02; c.lineTo(x, y); }              // palmitoleoyl chain
  c.stroke(); c.restore();
}
GLYPHS.wnt = gWnt;

/** β-catenin: 12 armadillo repeats in a right-handed superhelix, with disordered N and C tails. */
function gBcat(c, s, a = 1) {
  const P = NP.bcat; c.save(); c.globalAlpha *= a;
  const R = s * .5, cy = s * .32;
  c.strokeStyle = rgb(P.rim, .8); c.lineWidth = Math.max(.6, s * .025); c.lineCap = 'round';
  const tail = (x, y, dx) => { c.beginPath(); c.moveTo(x, y); for (let k = 1; k <= 5; k++) c.lineTo(x + dx * k * s * .05, y + Math.sin(k * 1.7) * s * .04 + k * s * .02); c.stroke(); };
  for (let k = 0; k < 12; k++) {
    const an = -2.55 + k / 11 * 1.95, x = Math.cos(an) * R, y = cy + Math.sin(an) * R;
    dom(c, x, y, s * .062, s * .12, an, P, .55);
  }
  tail(Math.cos(-2.55) * R, cy + Math.sin(-2.55) * R, -1); tail(Math.cos(-.6) * R, cy + Math.sin(-.6) * R, 1);
  c.restore();
}
GLYPHS.bcat = gBcat;

/** Dkk1: N-terminal CRD1 – flexible linker – C-terminal CRD2 (colipase fold, three finger loops). */
function gDkk1(c, s, a = 1, t = 0) {
  const P = NP.dkk1; c.save(); c.globalAlpha *= a;
  c.strokeStyle = rgb(P.rim); c.lineWidth = Math.max(.7, s * .035); c.lineCap = 'round'; c.beginPath();
  c.moveTo(-s * .32, -s * .05);
  for (let k = 1; k <= 8; k++) c.lineTo(-s * .32 + k * s * .07, -s * .05 + Math.sin(k * 1.4 + t * 1.3) * s * .06);
  c.stroke();
  dom(c, -s * .42, -s * .08, s * .13, s * .11, .4, P);                                   // CRD1 (DKK_N)
  c.save(); c.translate(s * .36, 0);
  for (let k = 0; k < 3; k++) { const an = -1.1 + k * 1.1; tube(c, [0, 0, Math.cos(an) * s * .26, Math.sin(an) * s * .26], [s * .1, s * .06], P, .7); }
  dom(c, 0, 0, s * .15, s * .13, 0, P);                                                  // CRD2 core
  c.restore(); c.restore();
}
GLYPHS.dkk1 = gDkk1;

/** 17β-estradiol, skeletal formula: aromatic A ring (3-OH), B, C, five-membered D ring (17β-OH), C18 methyl. */
function gE2(c, s, a = 1) {
  const P = NP.e2, l = s * .14, hex = (cx, cy) => { c.beginPath(); for (let k = 0; k < 6; k++) { const an = Math.PI / 6 + k * Math.PI / 3; k ? c.lineTo(cx + l * Math.cos(an), cy + l * Math.sin(an)) : c.moveTo(cx + l * Math.cos(an), cy + l * Math.sin(an)); } c.closePath(); };
  c.save(); c.globalAlpha *= a; c.translate(-2.1 * l, .75 * l);
  c.strokeStyle = rgb(thLine(P.rim)); c.lineWidth = Math.max(.7, s * .03); c.lineJoin = 'round'; c.lineCap = 'round';
  const A = [0, 0], B = [1.732 * l, 0], C = [2.598 * l, -1.5 * l], D = [C[0] + .866 * l + .688 * l, C[1]];
  c.fillStyle = rgb(th(P.body, .7), .55);
  for (const r of [A, B, C]) { hex(r[0], r[1]); c.fill(); c.stroke(); }
  c.beginPath(); for (let k = 0; k < 5; k++) { const an = (144 + k * 72) * Math.PI / 180, x = D[0] + .851 * l * Math.cos(an), y = D[1] + .851 * l * Math.sin(an); k ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.arc(A[0], A[1], .55 * l, 0, TAU); c.stroke();                         // aromatic A ring
  const v13 = [D[0] - .688 * l, D[1] - .5 * l]; c.beginPath(); c.moveTo(v13[0], v13[1]); c.lineTo(v13[0], v13[1] - .8 * l); c.stroke();   // C18 methyl
  const a17 = 288 * Math.PI / 180, v17 = [D[0] + .851 * l * Math.cos(a17), D[1] + .851 * l * Math.sin(a17)];
  const o17 = [v17[0] + .62 * l * Math.cos(a17), v17[1] + .62 * l * Math.sin(a17)]; c.beginPath(); c.moveTo(v17[0], v17[1]); c.lineTo(o17[0], o17[1]); c.stroke();
  const v3 = [-.866 * l, .5 * l], o3 = [v3[0] - .55 * l, v3[1] + .32 * l]; c.beginPath(); c.moveTo(v3[0], v3[1]); c.lineTo(o3[0], o3[1]); c.stroke();
  c.fillStyle = rgb(thLine(P.rim)); c.font = `600 ${l * .78}px "DM Sans",Arial,sans-serif`; c.textBaseline = 'middle';
  c.textAlign = 'left'; c.fillText('OH', o17[0] + l * .08, o17[1] - l * .1);
  c.textAlign = 'right'; c.fillText('HO', o3[0] - l * .05, o3[1] + l * .1);
  c.restore();
}
GLYPHS.e2 = gE2;

/** FGF23: β-trefoil core (FGF family) + long C-terminal tail with the R176XXR179 furin site and the GALNT3 O-glycan at T178. */
function gFGF23(c, s, a = 1, t = 0, cut = 0) {
  const P = NP.fgf23; c.save(); c.globalAlpha *= a;
  const tail = [s * .16, s * .1, s * .38, s * .3, s * .64, s * .28, s * .86, s * .46 + Math.sin(t) * s * .04, s * 1.1, s * .4];
  const site = [s * .36, s * .28];
  if (cut > 0) { c.save(); c.translate(cut * s * .14, cut * s * .1); tube(c, tail.slice(4), [s * .05, s * .045, s * .04], P, .6); c.restore(); tube(c, tail.slice(0, 6), [s * .07, s * .06, s * .05], P, .6); }
  else tube(c, tail, [s * .08, s * .07, s * .06, s * .055, s * .05], P, .6);
  gIL1(c, s * .62, 1, P.body);
  c.strokeStyle = rgb(thLine(P.nuc)); c.lineWidth = Math.max(.6, s * .02);                 // furin cleavage site
  c.beginPath(); c.moveTo(site[0] - s * .05, site[1] + s * .06); c.lineTo(site[0] + s * .05, site[1] - s * .06); c.stroke();
  if (!cut) { c.beginPath(); c.moveTo(site[0] + s * .02, site[1] + s * .01); c.lineTo(site[0] + s * .04, site[1] + s * .1); c.stroke(); hexSugar(c, site[0] + s * .05, site[1] + s * .14, s * .045); }
  c.restore();
}
function hexSugar(c, x, y, r) { c.beginPath(); for (let k = 0; k < 6; k++) { const an = k * Math.PI / 3; k ? c.lineTo(x + r * Math.cos(an), y + r * Math.sin(an)) : c.moveTo(x + r, y); } c.closePath(); c.fillStyle = rgb(th(NP.e2.fil, .4)); c.fill(); c.stroke(); }
GLYPHS.fgf23 = gFGF23;

/** cAMP: the cyclic nucleotide as a small ribose pentagon with its cyclic phosphate. */
function gCAMP(c, s, a = 1) {
  const P = NP.signal || NP.pi; c.save(); c.globalAlpha *= a; c.strokeStyle = rgb(thLine(P.rim)); c.lineWidth = Math.max(.6, s * .08); c.fillStyle = rgb(P.body, .7);
  c.beginPath(); for (let k = 0; k < 5; k++) { const an = -Math.PI / 2 + k * TAU / 5; k ? c.lineTo(Math.cos(an) * s * .3, Math.sin(an) * s * .3) : c.moveTo(Math.cos(an) * s * .3, Math.sin(an) * s * .3); } c.closePath(); c.fill(); c.stroke();
  circle(c, s * .32, s * .26, s * .14, rgb(NP.pi.body), rgb(NP.pi.rim, .8)); c.restore();
}
GLYPHS.camp = gCAMP;

/* ================================================================ single-molecule tiles */
/** The atlas cytokine layout: a soft halo, the molecule bobbing in the middle, two faint copies. */
function molTile(c, t, draw, col, size) {
  const x = 130 + Math.sin(t * .55 + 1) * 4, y = 70 + Math.cos(t * .65) * 4;
  circle(c, 130, 71, 36, rgb(col, .065));
  c.save(); c.setLineDash([1.5, 5]); c.strokeStyle = rgb(col, .15); c.lineWidth = .7; c.beginPath(); c.arc(130, 71, 49, 0, TAU); c.stroke(); c.restore();
  const at = (px, py, s, r, a) => { c.save(); c.translate(px, py); c.rotate(r); draw(c, s, a); c.restore(); };
  at(x, y, size, Math.sin(t * .3) * .12, 1);
  at(65 + Math.sin(t * .42 + 3) * 6, 41 + Math.cos(t * .5) * 7, size * .3, -.5 + t * .08, .22);
  at(194 + Math.sin(t * .4) * 6, 102 + Math.cos(t * .55 + 1) * 7, size * .24, t * .1 + 1, .23);
}
registerSpecimen('pi', 145, (c, t) => { molTile(c, t, GLYPHS.pi, NP.pi.rim, 46); L(c, 'INORGANIC PHOSPHATE · HPO₄²⁻', 130, 132); });
registerSpecimen('ca', 145, (c, t) => { molTile(c, t, GLYPHS.ca, NP.ca.rim, 46); L(c, 'CALCIUM ION', 130, 132); });
registerSpecimen('dkk1', 145, (c, t) => { molTile(c, t, (cc, s, a) => gDkk1(cc, s, a, t), NP.dkk1.rim, 64); L(c, 'CRD1 · LINKER · CRD2', 130, 132); });
registerSpecimen('fgf23', 145, (c, t) => {
  c.save(); c.translate(-12, -6); molTile(c, t, (cc, s, a) => gFGF23(cc, s, a, t, s < 30 ? 1 : 0), NP.fgf23.rim, 66); c.restore();
  L(c, 'β-TREFOIL CORE · C-TAIL · FURIN SITE', 130, 132);
});
registerSpecimen('wnt', 145, (c, t) => {
  for (const [x, col] of [[78, NP.wnt.rim], [186, NP.bcat.rim]]) circle(c, x, 66, 34, rgb(col, .065));
  c.save(); c.translate(78 + Math.sin(t * .5) * 3, 66 + Math.cos(t * .6) * 3); c.rotate(Math.sin(t * .3) * .1); gWnt(c, 64); c.restore();
  c.save(); c.translate(186 + Math.sin(t * .45 + 2) * 3, 58 + Math.cos(t * .55) * 3); c.rotate(Math.sin(t * .28 + 1) * .08); gBcat(c, 66); c.restore();
  L(c, 'WNT · PALMITOLEATE', 78, 128); L(c, 'β-CATENIN · 12 ARM REPEATS', 186, 128);
});
registerSpecimen('matrix-vesicle', 145, (c, t) => {
  const mv = GLYPHS.mv;
  circle(c, 130, 71, 40, rgb(NP.osteoid.rim, .07));
  [[112, 62, 34], [156, 58, 24], [138, 96, 20]].forEach(([x, y, s], i) => {
    c.save(); c.translate(x + Math.sin(t * .4 + i) * 3, y + Math.cos(t * .5 + i * 2) * 3); c.rotate(Math.sin(t * .2 + i) * .2); mv(c, s, 1); c.restore();
  });
  L(c, 'MATRIX VESICLES · HYDROXYAPATITE SEEDS', 130, 132);
});

/* ================================================================ LRP5/6 */
/** Ectodomain from the membrane up: LA ×3, then E4…E1 (each a β-propeller with its EGF-like domain). */
function lrp6(c, t, x, yM, s = 1, o = {}) {
  const P = BP.lrp, flex = Math.sin(t * .5) * .05;
  c.save(); c.translate(x, yM); c.scale(s, s);
  // TM helix + cytoplasmic tail with five PPPSPxS motifs
  rod(c, 0, -6, 0, 18, 3.6, P);
  const tl = []; for (let k = 0; k <= 8; k++) tl.push(Math.sin(k * 1.3 + t * .6) * 3.5, 18 + k * 5);
  c.strokeStyle = rgb(P.rim, .8); c.lineWidth = 1.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(tl[0], tl[1]); for (let k = 1; k <= 8; k++) c.lineTo(tl[k * 2], tl[k * 2 + 1]); c.stroke();
  for (let k = 0; k < 5; k++) {
    const px = tl[(k + 3) * 2], py = tl[(k + 3) * 2 + 1], ph = o.phos ? clamp(o.phos * 5 - k) : 0;
    circle(c, px + 3.2, py, 2.1, rgb(mix(P.body, NP.signal.body, ph)), rgb(mix(P.rim, NP.signal.rim, ph), .9));
    if (ph > .5) lab(c, 'P', px + 3.2, py + .2, { size: 2.6, color: rgb(NP.signal.nuc), always: true, weight: 700 });
  }
  // the ectodomain as one chain, membrane → N-terminus: LA ×3, EGF4, P4, EGF3, P3, EGF2 (hinge), P2, EGF1, P1
  const rot = (p, h, a) => { const dx = p[0] - h[0], dy = p[1] - h[1]; return [h[0] + dx * Math.cos(a) - dy * Math.sin(a), h[1] + dx * Math.sin(a) + dy * Math.cos(a)]; };
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const LA = [[-1, -12], [-1.8, -18.8], [-2.6, -25.6]], P4 = [6, -50], P3 = [-17, -74], E2 = mid(P3, [-4, -104]);
  const P2 = rot([-4, -104], E2, flex), P1 = rot([-28, -126], E2, flex);
  const d4 = Math.hypot(LA[2][0] - P4[0], LA[2][1] - P4[1]), E4 = [P4[0] + (LA[2][0] - P4[0]) / d4 * 15, P4[1] + (LA[2][1] - P4[1]) / d4 * 15];
  const E3 = mid(P4, P3), E1 = mid(P2, P1);
  const chain = [[0, -6], ...LA, E4, P4, E3, P3, E2, P2, E1, P1];
  c.strokeStyle = rgb(P.rim, .9); c.lineWidth = 3.2; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); chain.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke();
  c.strokeStyle = rgb(P.body); c.lineWidth = 1.6; c.stroke();
  LA.forEach(p => dom(c, p[0], p[1], 3.4, 2.9, 0, P, .6));
  const egf = (e, a, b) => dom(c, e[0], e[1], 5, 3.4, Math.atan2(b[1] - a[1], b[0] - a[0]), P, .6);
  egf(E4, LA[2], P4); egf(E3, P4, P3); egf(E2, P3, P2); egf(E1, P2, P1);
  [P4, P3, P2, P1].forEach(p => propeller(c, p[0], p[1], 12.5, P));
  if (o.dkk) o.dkk(P1, P3);
  c.restore();
  return { P1: [x + P1[0] * s, yM + P1[1] * s], P3: [x + P3[0] * s, yM + P3[1] * s], P4: [x + P4[0] * s, yM + P4[1] * s] };
}
registerSpecimen('lrp56', 200, (c, t) => {
  bilayer(c, 138, 30, 230);
  lrp6(c, t, 132, 140);
  L(c, 'E1', 86, 18); L(c, 'E2', 150, 40); L(c, 'E3', 96, 68); L(c, 'E4', 158, 92);
  L(c, 'LA ×3', 108, 120); L(c, 'TM', 150, 146); L(c, '5 × PPPSPxS', 176, 178);
  L(c, 'LRP5 / 6 · Wnt CO-RECEPTOR', 130, 196, { size: 6.6 });
});
/** Alternative: the signalosome cycle. Wnt bridges Frizzled's CRD and LRP6 → the tail's PPPSP motifs are phosphorylated
    and Axin docks. Then Dkk1 binds E1 and E3 instead and the tail stays silent. */
registerSpecimen('lrp56-wnt', 200, (c, t) => {
  const lt = loopT(t, 18), wntIn = win(lt, .5, 3, 7, 9), phos = win(lt, 3, 6, 7.5, 9), dkkIn = win(lt, 10, 12.5, 16, 17.8);
  bilayer(c, 138, 20, 240);
  // Frizzled: 7 TM helices, linker, cysteine-rich domain (CRD)
  const fx = 186, F = NP.fzd;
  for (let k = 0; k < 7; k++) rod(c, fx - 15 + k * 5, 132 + (k % 2) * 2, fx - 15 + k * 5 + (k % 2 ? 1.5 : -1.5), 156, 3.6, F, .7);
  c.strokeStyle = rgb(F.rim, .85); c.lineWidth = 1.6; c.beginPath(); c.moveTo(fx - 12, 132); c.quadraticCurveTo(fx - 18, 118, fx - 10, 104); c.stroke();
  dom(c, fx - 8, 96, 12, 9, -.3, F);
  // Dishevelled under Frizzled
  dom(c, fx, 172 + Math.sin(t) * .6, 10, 6.5, .1, F, .7);
  const ends = lrp6(c, t, 98, 140, .92, {
    phos,
    dkk: (P1, P3) => {
      if (dkkIn <= .01) return;
      c.save(); c.globalAlpha *= dkkIn; c.translate((1 - dkkIn) * -30, (1 - dkkIn) * -24);
      const D = NP.dkk1;
      c.strokeStyle = rgb(D.rim); c.lineWidth = 1.5; c.beginPath(); c.moveTo(P1[0] - 12, P1[1] - 6);
      c.quadraticCurveTo(P1[0] - 40, (P1[1] + P3[1] + 50) / 2, P3[0] - 14, P3[1] + 4); c.stroke();
      dom(c, P1[0] - 12, P1[1] - 7, 5, 4, .3, D);                                      // N-terminal region on E1
      c.save(); c.translate(P3[0] - 14, P3[1] + 5); for (let k = 0; k < 3; k++) { const an = 2 + k * 1; tube(c, [0, 0, Math.cos(an) * 9, Math.sin(an) * 9], [3.4, 2], D, .6); } dom(c, 0, 0, 5.5, 4.8, 0, D); c.restore();   // CRD2 on E3
      c.restore();
    },
  });
  // Wnt pinches the Frizzled CRD (thumb + index finger) and contacts LRP6
  if (wntIn > .01) {
    c.save(); c.globalAlpha *= wntIn; c.translate(lerp(214, 150, ease(wntIn)), lerp(20, 80, ease(wntIn))); c.rotate(.5); gWnt(c, 40); c.restore();
  }
  // Axin docks on the phosphorylated tail; β-catenin is spared and accumulates
  if (phos > .01) {
    dom(c, 118 + (1 - phos) * 14, 176, 8, 5.5, 0, NP.bcat, .6);
    c.save(); c.globalAlpha *= phos; c.translate(70, 178 - phos * 4); c.rotate(-.3); gBcat(c, 26); c.restore();
  }
  L(c, 'LRP6', 52, 52); L(c, 'FZD', 214, 112); L(c, 'DVL', 214, 184);
  L(c, 'WNT ON · PPPSP PHOSPHORYLATED · AXIN DOCKS', 130, 196, { size: 6, alpha: wntIn, always: true });
  L(c, 'DKK1 ON · E1 + E3 BLOCKED · TAIL SILENT', 130, 196, { size: 6, alpha: dkkIn, always: true });
});

/* ================================================================ integrin */
/** α/β integrin at (cx, membrane yM). e: 0 bent → 1 extended; o: hybrid swing-out (open); lig / tal: ligand and talin occupancy. */
function integrin(c, cx, yM, e, o, lig, tal, t) {
  const A = NP.itga, B = NP.itgb, sep = o * 7;
  const xa = cx - 9 - sep * .4, xb = cx + 9 + sep;
  if (tal > .01) { c.save(); c.globalAlpha *= tal; dom(c, xb + 8 + (1 - tal) * 22, yM + 34 + (1 - tal) * 22, 9, 6.5, .4, NP.talin); c.restore(); }   // talin F3 on the β tail
  rod(c, xa, yM - 4, xa - sep * .4, yM + 24, 3.4, A, .7);
  rod(c, xb, yM - 4, xb + sep * .6, yM + 36, 3.4, B, .7);
  const aK = [xa - 2, yM - 44], bK = [xb + 1, yM - 40];
  dom(c, xa, yM - 14, 4.4, 8.6, .05, A); dom(c, xa - 1, yM - 32, 4.6, 8.8, .05, A);                  // calf-2, calf-1
  dom(c, xb, yM - 11, 4.2, 5.4, 0, B);                                                                 // β-tail domain
  for (let k = 0; k < 3; k++) dom(c, xb + .3 * k, yM - 20 - k * 6.4, 3.4, 3.1, 0, B, .55);            // I-EGF 4, 3, 2
  const phi = lerp(2.62, -Math.PI / 2, ease(e)), ux = Math.cos(phi), uy = Math.sin(phi), px = -uy, py = ux;
  const head = [aK[0] + ux * 27, aK[1] + uy * 27], bI = [head[0] + px * 14, head[1] + py * 14];
  const sw = o * .95, dx = -ux * Math.cos(sw) + px * Math.sin(sw), dy = -uy * Math.cos(sw) + py * Math.sin(sw);
  const hyb = [bI[0] + dx * 13, bI[1] + dy * 13], psi = [hyb[0] + dx * 10, hyb[1] + dy * 10];
  tube(c, [xb, yM - 34, bK[0], bK[1], psi[0], psi[1], hyb[0], hyb[1]], [2.6, 2.6, 2.4, 2.2], B, .6);
  dom(c, psi[0], psi[1], 3.4, 3.1, 0, B, .55);                                                        // PSI / I-EGF1
  dom(c, hyb[0], hyb[1], 6.6, 5.2, Math.atan2(dy, dx), B);                                            // hybrid
  tube(c, [xa - 1, yM - 40, aK[0], aK[1], aK[0] + ux * 12, aK[1] + uy * 12], [2.8, 2.8, 3], A, .6);
  dom(c, aK[0] + ux * 11, aK[1] + uy * 11, 7.6, 5, phi, A);                                          // thigh (knee = genu below it)
  propeller(c, head[0], head[1], 12.5, A, 7, phi);                                                    // α β-propeller
  dom(c, bI[0], bI[1], 8.4, 7.4, phi, B);                                                             // βI domain (MIDAS)
  if (lig > .01) {                                                                                    // fibronectin III modules with the RGD loop
    const site = [head[0] + px * 7 + ux * 13, head[1] + py * 7 + uy * 13];
    c.save(); c.globalAlpha *= lig; c.translate(site[0] + (1 - lig) * 10, site[1] - (1 - lig) * 30);
    dom(c, 0, -6, 6, 5, .3, NP.ecm, .7); dom(c, 9, -14, 6, 5, .3, NP.ecm, .7); circle(c, -1, -.6, 1.7, rgb(NP.signal.body), rgb(NP.signal.rim, .8));
    c.restore();
  }
}
const intCycle = t => { const lt = loopT(t, 14); return { tal: win(lt, .4, 2.4, 10.6, 12.6), e: win(lt, 2.4, 5, 10, 12.4), o: win(lt, 5, 6.6, 9.4, 11), lig: win(lt, 5.6, 7.6, 9, 10.6) }; };
registerSpecimen('integrin', 200, (c, t) => {
  const s = intCycle(t);
  bilayer(c, 146, 30, 230);
  integrin(c, 130, 148, s.e, s.o, s.lig, s.tal, t);
  L(c, 'α', 104, 166, { size: 9, mono: false }); L(c, 'β', 154, 132, { size: 9, mono: false });
  L(c, 'TALIN', 178, 192, { alpha: s.tal, always: true }); L(c, 'RGD LIGAND', 178, 34, { alpha: s.lig, always: true });
  const state = s.e < .35 ? 'BENT · CLOSED' : s.o < .5 ? 'EXTENDED · CLOSED' : 'EXTENDED · OPEN · LIGAND BOUND';
  L(c, state, 130, 14, { size: 6.6 });
});
registerSpecimen('integrin-states', 200, (c, t) => {
  bilayer(c, 146, 6, 254);
  const b = .03 * Math.sin(t * .5);
  [[0 + b, 0, 0, 0], [1, b + .02, 0, .9], [1, 1, 1, 1]].forEach(([e, o, lig, tal], i) => {
    c.save(); c.translate(48 + i * 82, 148); c.scale(.82, .82); c.translate(-130, -148); integrin(c, 130, 148, e, o, lig, tal, t); c.restore();
  });
  L(c, 'BENT · CLOSED', 48, 194, { size: 6 }); L(c, 'EXTENDED · CLOSED', 130, 194, { size: 6 }); L(c, 'EXTENDED · OPEN', 212, 194, { size: 6 });
});

/* ================================================================ Cx43 gap junction */
registerSpecimen('cx43', 180, (c, t) => {
  const P = BP.cx43, lt = loopT(t, 10), g = win(lt, 3, 4.6, 7.4, 9);
  const yA = 60, yB = 88;                              // the two bilayers (cell 1 above, cell 2 below)
  bilayer(c, yA, 8, 200); bilayer(c, yB, 8, 200);
  const channel = (x, gate) => {
    const pr = lerp(4.2, 1.1, gate);
    c.fillStyle = rgb(th(P.body, .6), .35); c.fillRect(x - pr - 3, 50, 2 * pr + 6, 60);                 // back subunits
    c.fillStyle = rgb(th(mix(P.fil, [255, 255, 255], .4), .8), .9); c.beginPath(); c.roundRect(x - pr, 46, 2 * pr, 68, pr); c.fill();   // aqueous pore
    for (const side of [-1, 1]) for (const [y0, y1, nt] of [[52, 79, 47], [81, 108, 113]]) {
      for (let k = 0; k < 2; k++) { const xx = x + side * (pr + 3.4 + k * 5); rod(c, xx, y0, xx + side * .8, y1, 4, P, .65); }   // two of the four TM helices
      rod(c, x + side * (pr + 3), y0 === 52 ? 52 : 108, x + side * (pr + .6 - gate * 1.4), nt, 2.6, P, .55);              // NT helix lining the pore mouth
    }
    for (const side of [-1, 1]) for (let k = 0; k < 2; k++) circle(c, x + side * (pr + 4 + k * 5), 79.6 + (k ? 1.2 : -1.2), 2.4, rgb(mix(P.body, P.fil, .3)), rgb(P.rim, .7));   // E1/E2 loops docking in the gap
  };
  const tail = (x, side, plug) => {                    // Cx43's long C-terminal tail (cell 1 side)
    const end = [lerp(x + side * 22, x, plug), lerp(18 + Math.sin(t * .8 + side) * 3, 44, plug)];
    c.strokeStyle = rgb(P.rim, .8); c.lineWidth = 1.4; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + side * 9, 52);
    c.bezierCurveTo(x + side * 14, 40, end[0] + side * 10, end[1] + 10 * (1 - plug), end[0], end[1]); c.stroke();
    circle(c, end[0], end[1], 2.6, rgb(P.body), rgb(P.rim, .8));
  };
  // small molecules passing between the cells (Ca²⁺, IP₃, cAMP)
  const pass = (x, open) => { for (let i = 0; i < 6; i++) { const u = loopT(t * .1 + i / 6, 1), y = lerp(6, 172, u), inPore = y > 44 && y < 116;
    const xx = x + (inPore ? 0 : Math.sin(u * 20 + i) * (6 + Math.abs(y - 80) * .12)); const a = Math.min(1, Math.sin(u * Math.PI) * 2) * open;
    if (i % 2) ion(c, xx, y, 3.3, NP.ca, '', a); else { c.save(); c.translate(xx, y); GLYPHS.camp(c, 11, a); c.restore(); } } };
  channel(78, 0); channel(146, g);
  pass(78, 1); pass(146, 1 - g);
  tail(78, -1, 0); tail(146, 1, g);
  // top view: six connexins around the pore; the ring twists and narrows as the channel closes
  c.save(); c.translate(228, 42);
  circle(c, 0, 0, 20, rgb(th(NP.lipid.body, .5), .6));
  for (let k = 0; k < 6; k++) { const an = k * TAU / 6 + g * .4; dom(c, Math.cos(an) * 10, Math.sin(an) * 10, 4.4, 6.6, an + g * .5, P, .6); }
  circle(c, 0, 0, lerp(4.4, 1.4, g), rgb(th(mix(P.fil, [255, 255, 255], .4), .8)), rgb(P.rim, .4));
  c.restore();
  L(c, 'CELL 1', 24, 30); L(c, 'CELL 2', 24, 140); L(c, 'TOP VIEW', 228, 72);
  L(c, 'C-TERMINAL TAIL GATE', 196, 112, { alpha: .4 + .6 * g, always: true }); L(c, 'CONNEXON × 2 = ONE CHANNEL', 110, 174, { size: 6.2 });
});

/* ================================================================ estradiol / ERα */
registerSpecimen('er-alpha', 180, (c, t) => {
  const lt = loopT(t, 14), inn = win(lt, 0, 4, 10.5, 13.5), close = win(lt, 4.6, 6.4, 9.6, 11), co = win(lt, 6.4, 8, 9, 10.4);
  const P = NP.er, ox = 150, oy = 92;
  // ligand-binding domain: a three-layer α-helical sandwich (drawn as packed helices) with the ligand pocket
  const pts = []; for (let i = 0; i < 26; i++) { const an = i / 26 * TAU, r = 1 + .06 * Math.sin(an * 3 + 1) + .03 * Math.sin(an * 5 + t * .4); pts.push(Math.cos(an) * 46 * r, Math.sin(an) * 36 * r); }
  shape(c, ox, oy, pts, P, 40, 1.4);
  for (let k = 0; k < 6; k++) { const an = -.9 + k * .38; rod(c, ox - 30 + k * 10, oy - 22 + (k % 2) * 4, ox - 26 + k * 10 + Math.cos(an) * 6, oy + 18 - (k % 2) * 6, 5.2, P, .5); }
  c.beginPath(); c.ellipse(ox - 4, oy + 2, 15, 10, -.2, 0, TAU); c.fillStyle = rgb(th(mix(P.fil, [255, 255, 255], .3), .7), .95); c.fill();
  // estradiol drifts in and settles in the pocket
  const ex = lerp(48, ox - 4, ease(inn)), ey = lerp(30, oy + 2, ease(inn));
  c.save(); c.translate(ex, ey); c.rotate(lerp(-.6, -.15, inn)); gE2(c, lerp(50, 30, inn), Math.min(1, inn * 3)); c.restore();
  // helix 12: open (hanging away) → closed over the pocket, forming the AF-2 surface
  const hinge = [ox + 28, oy + 28], ang = lerp(.9, -2.25, ease(close));
  rod(c, hinge[0], hinge[1], hinge[0] + Math.cos(ang) * 24, hinge[1] + Math.sin(ang) * 24, 6, NP.h12, .8);
  // coactivator LXXLL helix docks on AF-2
  if (co > .01) { c.save(); c.globalAlpha *= co; rod(c, ox + 18 + (1 - co) * 24, oy - 40 - (1 - co) * 20, ox + 38 + (1 - co) * 24, oy - 30 - (1 - co) * 20, 5, NP.coact, .7); c.restore(); }
  L(c, 'ERα LBD', ox, oy + 50); L(c, 'H12', hinge[0] + 18, hinge[1] + 14); L(c, 'E2', 40, 58, { alpha: 1 - inn, always: true });
  L(c, 'COACTIVATOR · LXXLL', ox + 40, oy - 52, { alpha: co, always: true });
  L(c, inn > .6 && close > .5 ? 'AGONIST CONFORMATION · H12 CLOSED' : 'APO · H12 OPEN', 130, 172, { size: 6.4 });
});

/* ================================================================ FGF23 · αKlotho · FGFR1c */
function tim(c, x, y, r, P) {          // a TIM-barrel (glycosidase-like) domain seen end-on
  dom(c, x, y, r, r * .9, 0, P);
  for (let k = 0; k < 8; k++) { const an = k * TAU / 8; circle(c, x + Math.cos(an) * r * .5, y + Math.sin(an) * r * .45, r * .13, rgb(P.fil, .8), rgb(P.rim, .4)); }
}
function igDom(c, x, y, rx, ry, rot, P) {   // Ig-like β-sandwich
  dom(c, x, y, rx, ry, rot, P);
  c.save(); c.translate(x, y); c.rotate(rot); c.strokeStyle = rgb(P.rim, .3); c.lineWidth = .6;
  for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(k * rx * .4, -ry * .65); c.lineTo(k * rx * .4, ry * .65); c.stroke(); }
  c.restore();
}
registerSpecimen('klotho-fgfr1', 200, (c, t) => {
  const lt = loopT(t, 12), bind = ease(win(lt, 0, 3, 9.5, 11.5)), pY = win(lt, 3.5, 5.5, 9, 10.5);
  bilayer(c, 134, 8, 252);
  const half = (mirror) => {
    c.save(); if (mirror) { c.translate(260, 0); c.scale(-1, 1); }
    const K = NP.klotho, R = NP.fgfr;
    // αKlotho: KL1 and KL2 glycosidase-like domains, receptor-binding arm, single TM
    rod(c, 70, 128, 70, 156, 3.4, K, .7);
    c.strokeStyle = rgb(K.rim, .8); c.lineWidth = 1.6; c.beginPath(); c.moveTo(70, 128); c.lineTo(74, 118); c.stroke();
    tim(c, 76, 102, 16, K); tim(c, 60, 64, 16, K);
    tube(c, [88, 96, 102, 92, 110, 100], [3, 2.6, 2.2], K, .6);                                        // receptor-binding arm onto D3
    // FGFR1c: D2, D3 Ig domains, TM, split tyrosine kinase
    rod(c, 118, 126, 118, 154, 3.4, R, .7);
    igDom(c, 116, 104, 6.2, 12, .1, R); igDom(c, 112, 76, 6.2, 11.5, -.15, R);
    dom(c, 121, 166, 8, 6, 0, R); dom(c, 119, 182, 10, 7.2, 0, R);
    if (pY > .01) for (let k = 0; k < 2; k++) { circle(c, 127 + k * 2, 170 + k * 9, 2.2, rgb(NP.signal.body, pY), rgb(NP.signal.rim, pY)); }
    // FGF23: core on FGFR D2–D3, C-terminal tail into the KL1–KL2 groove
    c.save(); c.globalAlpha *= Math.min(1, bind * 2);
    const fx = lerp(118, 96, bind), fy = lerp(8, 86, bind);
    const P = NP.fgf23;
    tube(c, [fx - 4, fy + 2, fx - 14, fy - 2, lerp(fx - 20, 68, bind), lerp(fy - 6, 84, bind)], [2.8, 2.4, 2], P, .6);
    c.save(); c.translate(fx, fy); gIL1(c, 19, 1, P.body); c.restore();
    c.restore();
    c.restore();
  };
  half(false); half(true);
  // heparan sulfate bridging the two FGFR D2 domains
  c.save(); c.globalAlpha *= bind; c.strokeStyle = rgb(thLine(NP.ecm.rim), .9); c.lineWidth = 1.2; c.beginPath();
  for (let k = 0; k <= 10; k++) { const x = 112 + k * 3.6, y = 62 + Math.sin(k * 1.6) * 2; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
  for (let k = 0; k < 5; k++) hexSugar(c, 114 + k * 8, 62 + Math.sin(k * 3.2) * 2, 2);
  c.restore();
  L(c, 'αKLOTHO', 46, 30); L(c, 'FGFR1c', 130, 22); L(c, 'FGF23', 214, 30, { alpha: bind, always: true }); L(c, 'HS', 130, 54, { alpha: bind, always: true });
  L(c, 'KINASE TRANS-PHOSPHORYLATION · pY', 130, 196, { size: 6.2, alpha: .35 + .65 * pY, always: true });
});

/* ================================================================ NaPi transporters */
/** SLC34 transporter: two inverted-repeat halves; phase 0 open to the outside, 1 open to the cytoplasm. */
function transporter(c, x, y, s, phase, P) {
  const tilt = lerp(-.24, .24, phase), pts = []; for (let i = 0; i < 24; i++) { const an = i / 24 * TAU, ca = Math.cos(an), sa = Math.sin(an); pts.push(6 * s * Math.sign(ca) * Math.pow(Math.abs(ca), .55), 15 * s * Math.sign(sa) * Math.pow(Math.abs(sa), .55)); }
  for (const side of [-1, 1]) {
    c.save(); c.translate(x + side * 6.4 * s, y); c.rotate(-side * tilt);
    shape(c, 0, 0, pts, P, 14 * s, .9);
    c.strokeStyle = rgb(P.rim, .25); c.lineWidth = .6; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(k * 2.6 * s, -11 * s); c.lineTo(k * 2.6 * s, 11 * s); c.stroke(); }
    c.restore();
  }
}
/** One transport cycle at loop position u: n Na⁺ and one Pi enter from above and leave below. */
function cargo(c, x, y, s, u, nNa, spread = 1) {
  const items = [...Array(nNa).fill('na'), 'pi'];
  items.forEach((kind, i) => {
    const off = (i - (items.length - 1) / 2) * 4.4 * s * spread, k = i / items.length * .12;
    let px, py, a = 1;
    if (u < .38 + k) { const v = ease(clamp(u / (.38 + k))); px = x + off * (2 - v); py = lerp(y - 46 * s, y - 3 * s, v); a = clamp(u * 8); }
    else if (u < .55) { px = x + off * .35; py = y - 3 * s + (u - .38) * 10 * s; }
    else { const v = ease(clamp((u - .55) / .4)); px = x + off * (.35 + v * 1.6); py = lerp(y + 2 * s, y + 46 * s, v); a = 1 - clamp((u - .85) / .15); }
    if (kind === 'pi') ion(c, px, py, 4.4 * s, NP.pi, 'Pi', a); else ion(c, px, py, 2.6 * s, NP.na, '', a);
  });
}
const rock = u => sstep(clamp((u - .42) / .14)) * (1 - sstep(clamp((u - .82) / .14)));
registerSpecimen('napi2ac', 190, (c, t) => {
  bilayer(c, 92, 8, 252);
  [[74, 3, 0], [190, 2, .5]].forEach(([x, n, ph]) => { const u = loopT(t / 6 + ph, 1); transporter(c, x, 98, 1.45, rock(u), NP.napi); cargo(c, x, 98, 1.25, u, n); });
  L(c, 'TUBULAR LUMEN', 130, 14); L(c, 'CELL', 130, 120); L(c, 'LUMEN', 130, 80);
  L(c, 'NaPi-IIa · SLC34A1', 74, 172, { size: 6.2 }); L(c, '3 Na⁺ : 1 Pi · ELECTROGENIC', 74, 181, { size: 5.6 });
  L(c, 'NaPi-IIc · SLC34A3', 190, 172, { size: 6.2 }); L(c, '2 Na⁺ : 1 Pi · ELECTRONEUTRAL', 190, 181, { size: 5.6 });
});
/** Dietary phosphate absorbed through NaPi-IIb on the intestinal brush border. */
registerSpecimen('napi2b', 200, (c, t) => {
  const V = NP.villus, xs = [22, 58, 94, 130, 166, 202, 238];
  c.fillStyle = rgb(th(mix(V.body, V.fil, .4), .6)); c.fillRect(-8, 122, 276, 90);                   // enterocyte apical cytoplasm
  bilayer(c, 116, -8, 268, { a: .9 });
  for (const x of xs) {
    const sway = Math.sin(t * .5 + x * .07) * 2.5, tip = [x + sway, 48 + Math.sin(x) * 3];
    tube(c, [x, 124, x + sway * .4, 86, tip[0], tip[1]], [11, 10.5, 9.5], V, 1.1);                     // microvillus
    c.strokeStyle = rgb(V.rim, .22); c.lineWidth = .8; c.beginPath(); c.moveTo(x, 120); c.quadraticCurveTo(x + sway * .4, 86, tip[0], tip[1] + 6); c.stroke();   // actin core
    c.strokeStyle = rgb(thLine(V.rim), .3); c.lineWidth = .5; c.beginPath();                            // glycocalyx fuzz
    for (let k = 0; k < 7; k++) { const an = -Math.PI / 2 + (k - 3) * .32; c.moveTo(tip[0] + Math.cos(an) * 6, tip[1] + Math.sin(an) * 6); c.lineTo(tip[0] + Math.cos(an) * 9.5, tip[1] + Math.sin(an) * 9.5); }
    c.stroke();
  }
  xs.forEach((x, i) => {                                                                                // NaPi-IIb on the microvillus membrane
    if (i % 2 === 0 && i !== 6) return;
    const side = i % 4 === 1 ? 1 : -1, ty = 80 + (i % 3) * 8, u = loopT(t / 7 + i * .21, 1);
    c.save(); c.translate(x + side * 6.6, ty); c.rotate(side * Math.PI / 2);
    transporter(c, 0, 0, .55, rock(u), NP.napi); c.restore();
    // dietary Pi from the lumen → transporter → down the microvillus into the cell
    let px, py, a = 1;
    if (u < .45) { const v = ease(u / .45); px = lerp(x + side * 20, x + side * 12, v); py = lerp(6, ty, v); a = clamp(u * 6); }
    else if (u < .6) { px = lerp(x + side * 12, x, (u - .45) / .15); py = ty; }
    else { const v = (u - .6) / .4; px = x; py = lerp(ty, 186, v); a = 1 - clamp((v - .8) * 5); }
    ion(c, px, py, 4.2, NP.pi, 'Pi', a);
    ion(c, px + side * 5, py - 4, 2.2, NP.na, '', a * (u < .6 ? 1 : 0));
  });
  L(c, 'DIETARY Pi · INTESTINAL LUMEN', 130, 16); L(c, 'NaPi-IIb · SLC34A2', 130, 30, { size: 6 }); L(c, 'ENTEROCYTE', 130, 192);
});

/* ================================================================ PTH / PTH1R */
registerSpecimen('pth1r', 200, (c, t) => {
  const lt = loopT(t, 14), dock = ease(win(lt, .5, 3.5, 11, 13.5)), ins = ease(win(lt, 3.5, 5, 10.5, 12)), act = win(lt, 5, 6.5, 10, 11.5);
  const Rc = NP.pth1r, yM = 108;
  bilayer(c, yM, 8, 252);
  // Gs heterotrimer: Gβ propeller, Gγ, Gα (Ras-like + α-helical domain, which swings open on activation)
  const gx = (1 - act) * 18, gy = (1 - act) * 16;
  c.save(); c.translate(gx, gy);
  propeller(c, 108, 158, 11, NP.gs, 7); rod(c, 92, 146, 100, 152, 3.4, NP.gs, .6);
  dom(c, 140, 146, 13, 9, 0, NP.gs); dom(c, 156 + act * 6, 136 - act * 4, 7, 6, act * .6, NP.gs, .7);
  rod(c, 138, 139, 137, 128 - act * 4, 3.6, NP.gs, .6);                                                    // α5 helix into the receptor core
  c.restore();
  // 7 TM helix bundle (TM6 kinks outward intracellularly when active)
  for (let k = 0; k < 7; k++) { const x = 110 + k * 7, kink = k === 5 ? act * 8 : 0; rod(c, x + (k % 2 ? -1 : 1), yM - 10, x - (k % 2 ? -1 : 1) + kink, yM + 22, 4.2, Rc, .7); }
  // extracellular domain on a stalk from TM1
  c.strokeStyle = rgb(Rc.rim, .85); c.lineWidth = 1.6; c.beginPath(); c.moveTo(110, yM - 10); c.quadraticCurveTo(100, yM - 22, 98, yM - 30); c.stroke();
  dom(c, 94, 66, 17, 13, -.3, Rc); rod(c, 82, 58, 102, 70, 4.2, Rc, .5);
  // PTH(1–34): C-terminal half binds the ECD groove first, then the N-terminus inserts into the TM core
  const C1 = [lerp(214, 92, dock), lerp(16, 50, dock)];
  const N1 = [lerp(232, lerp(140, 132, ins), dock), lerp(52, lerp(80, yM - 4, ins), dock)];
  helix(c, C1[0], C1[1], N1[0], N1[1], 4.6, NP.pth);
  L(c, 'N', N1[0] + 7, N1[1] + 2, { size: 5.6, mono: false });
  // cAMP produced downstream (adenylyl cyclase)
  for (let i = 0; i < 6; i++) { const u = loopT(lt * .6 + i / 6, 1), an = -.2 + i * .5; if (act < .05) continue; c.save(); c.translate(168 + Math.cos(an) * u * 50, 160 + Math.sin(an) * u * 22); GLYPHS.camp(c, 9, act * Math.sin(u * Math.PI)); c.restore(); }
  L(c, 'PTH(1–34)', 214, 8, { alpha: 1 - dock, always: true }); L(c, 'ECD', 66, 46); L(c, 'PTH1R · CLASS B GPCR', 210, 98, { size: 6 });
  L(c, 'Gs', 76, 176); L(c, 'cAMP', 222, 186, { alpha: act, always: true });
});

/* ================================================================ CaSR (class C GPCR homodimer) */
Object.assign(NP, {
  casr: { rim: [118, 108, 170], body: [204, 198, 236], fil: [244, 242, 255], nuc: [98, 88, 150] },
  rankl: { rim: [186, 116, 96], body: [234, 170, 146], fil: [255, 236, 226], nuc: [160, 96, 76] },
  rank: { rim: [96, 124, 172], body: [196, 210, 238], fil: [242, 246, 255], nuc: [76, 104, 152] },
  opg: { rim: [92, 146, 118], body: [184, 218, 198], fil: [240, 252, 244], nuc: [70, 124, 96] },
  mito: { rim: [188, 118, 94], body: [246, 214, 198], fil: [255, 242, 234], nuc: [166, 96, 74] },
  bcl2: { rim: [92, 150, 98], body: [190, 226, 190], fil: [240, 252, 240], nuc: [70, 128, 76] },
  bax: { rim: [190, 84, 104], body: [242, 190, 200], fil: [255, 240, 244], nuc: [168, 64, 84] },
  cytc: { rim: [156, 60, 48], body: [222, 130, 110], fil: [255, 220, 210], nuc: [130, 40, 30] },
  casp3: { rim: [196, 138, 36], body: [246, 214, 138], fil: [255, 246, 220], nuc: [170, 112, 20] },
});
function indole(c, x, y, s, P) {     // L-Trp side chain, a co-agonist in the VFT cleft
  c.save(); c.translate(x, y); c.strokeStyle = rgb(thLine(P.rim)); c.lineWidth = .7; c.fillStyle = rgb(P.body, .8);
  c.beginPath(); for (let k = 0; k < 6; k++) { const an = Math.PI / 6 + k * Math.PI / 3; k ? c.lineTo(Math.cos(an) * s, Math.sin(an) * s) : c.moveTo(Math.cos(an) * s, Math.sin(an) * s); } c.closePath(); c.fill(); c.stroke();
  c.beginPath(); for (let k = 0; k < 5; k++) { const an = (144 + k * 72) * Math.PI / 180; const px = s * .866 + s * .688 + Math.cos(an) * s * .851, py = Math.sin(an) * s * .851; k ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); c.fill(); c.stroke();
  c.restore();
}
/** One Venus-flytrap lobe: a curved, tapering arm from the hinge, cupped toward the cleft. upper: LB1, else LB2. */
function vftJaw(c, len, th0, upper, P) {
  const sg = upper ? -1 : 1, top = [], bot = [];
  for (let k = 0; k <= 16; k++) {
    const u = k / 16, cl = sg * len * .24 * Math.sin(Math.PI * u * .92), w = th0 * (1 - .55 * u) + 1.5;
    top.push(len * u, cl + sg * w / 2); bot.push(len * u, cl - sg * w / 2);
  }
  const pts = [...top]; for (let k = 16; k >= 0; k--) pts.push(bot[k * 2], bot[k * 2 + 1]);
  paintMembraneShape(c, pts, P);
  return u => [len * u, sg * len * .24 * Math.sin(Math.PI * u * .92) - sg * (th0 * (1 - .55 * u) + 1.5) / 2];   // point on the cleft face
}
function paintMembraneShape(c, pts, P) { shape(c, 0, 0, pts, P, 30, 1); }
registerSpecimen('casr', 200, (c, t) => {
  const lt = loopT(t, 12), ca = win(lt, .4, 2.6, 8.4, 10.8), act = ease(win(lt, 2.2, 4.4, 8, 10.4)), yM = 150, P = NP.casr;
  bilayer(c, yM, 8, 252);
  c.save(); c.globalAlpha *= .45 + .55 * act;                                                     // Gq/11
  propeller(c, 112 + (1 - act) * 14, 188 + (1 - act) * 5, 9, NP.gs, 7); dom(c, 148 + (1 - act) * 14, 182 + (1 - act) * 5, 12, 8, 0, NP.gs);
  rod(c, 142 + (1 - act) * 14, 176 + (1 - act) * 5, 136, 168 - act * 3, 3.4, NP.gs, .6); c.restore();
  const bound = [];
  for (const side of [-1, 1]) {
    const tmx = 130 + side * lerp(38, 24, act), hx = 130 + side * lerp(11, 6, act), hy = 70, oh = lerp(.42, .1, act);
    for (let k = 0; k < 7; k++) { const x = tmx + (k - 3) * 4.3; rod(c, x, yM - 8, x + (k % 2 ? 1 : -1), yM + 19, 3.8, P, .6); }   // 7TM
    // CRD: from under LB2 down to the TM bundle
    const crdTop = [hx + side * Math.cos(oh) * 14, hy + Math.sin(oh) * 14 + 14];
    rod(c, tmx, yM - 9, crdTop[0], crdTop[1], 5.6, P, .7);
    c.strokeStyle = rgb(P.rim, .45); c.lineWidth = .7;
    for (let k = 1; k <= 3; k++) { const u = k / 4, x = lerp(tmx, crdTop[0], u), y = lerp(yM - 9, crdTop[1], u); c.beginPath(); c.moveTo(x - 3, y); c.lineTo(x + 3, y); c.stroke(); }
    // the flytrap: LB2 (lower) and LB1 (upper) curving out from a shared hinge at the dimer interface
    c.save(); c.translate(hx, hy); c.scale(side, 1);
    c.save(); c.rotate(oh); const lb2 = vftJaw(c, 50, 17, false, P); c.restore();
    c.save(); c.rotate(-oh * .35); const lb1 = vftJaw(c, 50, 19, true, P); c.restore();
    circle(c, 0, 0, 7, rgb(mix(P.body, P.rim, .25)), rgb(P.rim, .8));                               // hinge
    const m2 = lb2(.62), m1 = lb1(.62), r2 = [m2[0] * Math.cos(oh) - m2[1] * Math.sin(oh), m2[0] * Math.sin(oh) + m2[1] * Math.cos(oh)];
    const a1 = -oh * .35, r1 = [m1[0] * Math.cos(a1) - m1[1] * Math.sin(a1), m1[0] * Math.sin(a1) + m1[1] * Math.cos(a1)];
    c.save(); c.globalAlpha *= ca; indole(c, 14, (r1[1] + r2[1]) / 2 * .45, 2.3, NP.e2); c.restore();   // L-Trp deep in the cleft
    c.restore();
    bound.push([hx + side * (r1[0] + r2[0]) / 2, hy + (r1[1] + r2[1]) / 2]);
  }
  // Ca²⁺: free above, then held between the jaws (and at the LB2–LB2 interface once active)
  const spots = [...bound, [130, 96]];
  spots.forEach(([x, y], i) => {
    const hx = 50 + i * 80 + Math.sin(t * .5 + i) * 6, hy = 18 + (i % 2) * 8 + Math.cos(t * .6 + i) * 4, k = i === 2 ? ca * act : ca;
    ion(c, lerp(hx, x, ease(k)), lerp(hy, y, ease(k)), 4.4, NP.ca, 'Ca', 1);
  });
  L(c, 'LB1', 60, 44); L(c, 'LB2', 58, 104); L(c, 'VENUS FLYTRAP', 214, 34); L(c, 'CRD', 84, 128); L(c, '7TM', 52, 162); L(c, 'Gq/11', 198, 194);
  L(c, act > .5 ? 'ACTIVE · JAWS CLOSED ON Ca²⁺ · TM6–TM6' : 'INACTIVE · JAWS OPEN', 130, 8, { size: 6.2 });
});

/* ================================================================ RANKL · RANK · OPG */
/** RANKL TNF-homology-domain trimer seen side-on: three jelly-roll subunits forming a bell. y = membrane-proximal top. */
function rankl3(c, x, y, s = 1, a = 1) {
  const P = NP.rankl; c.save(); c.globalAlpha *= a; c.translate(x, y); c.scale(s, s);
  c.save(); c.globalAlpha *= .75; dom(c, 0, 16, 7, 14.5, 0, P); c.restore();
  dom(c, -7.5, 17, 7.2, 15, .28, P); dom(c, 7.5, 17, 7.2, 15, -.28, P);
  c.strokeStyle = rgb(P.rim, .3); c.lineWidth = .6;
  for (const sx of [-1, 1]) for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(sx * 7.5 + k * 2.6 - sx * 2, 6); c.lineTo(sx * 7.5 + k * 2.6 + sx * 3, 28); c.stroke(); }
  c.restore();
}
function membraneRankl(c, x, yTop, stalk = 1) {     // type II TM: N-terminus inside the osteoblast, THD hanging into the gap
  const P = NP.rankl;
  rod(c, x, yTop - 4, x, yTop + 17, 3.4, P, .7);
  c.strokeStyle = rgb(P.rim, .85); c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, yTop - 4); c.quadraticCurveTo(x - 6, yTop - 10, x - 4, yTop - 16); c.stroke();
  c.lineWidth = 1.8; c.beginPath(); c.moveTo(x, yTop + 17); for (let k = 1; k <= 4; k++) c.lineTo(x + Math.sin(k * 1.9) * 1.6, yTop + 17 + k * 4.5 * stalk); c.stroke();
}
/** RANK / OPG ligand-binding arm: four cysteine-rich domains from base to tip along a gentle curve. */
function crdArm(c, x0, y0, x1, y1, P, bend = 10) {
  const mx = (x0 + x1) / 2 + bend, my = (y0 + y1) / 2;
  for (let k = 0; k < 4; k++) {
    const u = (k + .5) / 4, v = 1 - u, x = v * v * x0 + 2 * v * u * mx + u * u * x1, y = v * v * y0 + 2 * v * u * my + u * u * y1;
    const dx = 2 * v * (mx - x0) + 2 * u * (x1 - mx), dy = 2 * v * (my - y0) + 2 * u * (y1 - my);
    dom(c, x, y, 4.4, 6.2, Math.atan2(dy, dx) - Math.PI / 2, P, .7);
  }
}
function rankReceptor(c, x, yM, tip, a = 1, P = NP.rank) {
  c.save(); c.globalAlpha *= a; rod(c, x, yM - 6, x, yM + 18, 3.4, P, .7); crdArm(c, x, yM - 8, tip[0], tip[1], P, (tip[0] - x) * -.4); c.restore();
}
registerSpecimen('rankl', 200, (c, t) => {
  const lt = loopT(t, 12), bind = ease(win(lt, .8, 3.4, 9, 11.2)), sig = win(lt, 3.4, 5, 9, 10.6), cut = ease(win(lt, 2.5, 6, 10.5, 11.9));
  bilayer(c, 26, 8, 252); bilayer(c, 158, 8, 252);
  // membrane RANKL on the osteoblast / osteocyte, bound by RANK on the precursor
  membraneRankl(c, 96, 33); rankl3(c, 96, 52);
  rankReceptor(c, 96, 158, [96, 104], .4);
  for (const sd of [-1, 1]) { const bx = 96 + sd * lerp(42, 24, bind); rankReceptor(c, bx, 158, [lerp(bx + sd * 4, 96 + sd * 13, bind), lerp(124, 78, bind)]); }
  c.save(); c.globalAlpha *= sig; for (let k = 0; k < 3; k++) dom(c, 80 + k * 16, 184 + (k % 2) * 3, 6.5, 5, 0, NP.gs, .6); c.restore();   // TRAF6 trimer
  // shedding: ADAM17 / MMP cleave the stalk, releasing soluble RANKL
  membraneRankl(c, 200, 33, 1 - .55 * Math.min(1, cut * 3));
  rankl3(c, 200 + cut * 14 + Math.sin(t * .6) * cut * 3, 52 + cut * 48, 1);
  L(c, 'OSTEOBLAST · OSTEOCYTE', 70, 10); L(c, 'OSTEOCLAST PRECURSOR', 76, 196);
  L(c, 'mRANKL', 40, 66); L(c, 'RANK', 36, 136); L(c, 'TRAF6 → NF-κB · NFATc1', 172, 188, { alpha: sig, always: true });
  L(c, 'sRANKL · SHED BY ADAM17', 206, 148, { alpha: cut, always: true });
});
/** OPG: a soluble, disulfide-linked dimer. Each arm (CRD1–4) sits in a RANKL groove where RANK would bind. */
function opgDimer(c, x, yTip, a = 1) {
  const P = NP.opg; c.save(); c.globalAlpha *= a;
  for (const sd of [-1, 1]) {
    crdArm(c, x + sd * 7, yTip + 32, x + sd * 13, yTip, P, sd * 7);                        // CRD1–4 (tip = CRD1 in the groove)
    dom(c, x + sd * 7.5, yTip + 40, 6, 4.8, sd * .3, P, .7); dom(c, x + sd * 6, yTip + 50, 6, 4.8, -sd * .2, P, .7);   // death-domain homology regions DD1, DD2
    dom(c, x + sd * 3.6, yTip + 58, 4, 3.4, 0, P, .6);                                      // heparin-binding domain
  }
  c.strokeStyle = rgb(thLine(NP.signal.rim)); c.lineWidth = 1.4; c.beginPath(); c.moveTo(x - 1.6, yTip + 61); c.lineTo(x + 1.6, yTip + 61); c.stroke();   // Cys400 disulfide
  c.restore();
}
registerSpecimen('opg', 200, (c, t) => {
  const lt = loopT(t, 14), r = ease(win(lt, .4, 2.6, 4.8, 6.6)), o = ease(win(lt, 5.4, 8, 12, 13.8));
  bilayer(c, 26, 8, 252); bilayer(c, 166, 8, 252);
  membraneRankl(c, 130, 33); rankl3(c, 130, 52);
  for (const sd of [-1, 1]) {                                                               // RANK: binds, then is shut out once OPG caps the trimer
    const bx = 130 + sd * lerp(lerp(42, 24, r), 64, o);
    rankReceptor(c, bx, 166, [lerp(lerp(bx + sd * 4, 130 + sd * 13, r), bx - sd * 6, o), lerp(lerp(132, 78, r), 128, o)], 1 - .45 * o);
    if (o > .6) { const xx = bx - sd * 14, yy = 112; c.strokeStyle = rgb(NP.bax.rim, o); c.lineWidth = 1.4; c.beginPath(); c.moveTo(xx - 3, yy - 3); c.lineTo(xx + 3, yy + 3); c.moveTo(xx + 3, yy - 3); c.lineTo(xx - 3, yy + 3); c.stroke(); }
  }
  if (o > .01) opgDimer(c, 130 + (1 - o) * 70, 78 + (1 - o) * 40, Math.min(1, o * 1.6));
  L(c, 'RANKL', 82, 66); L(c, 'RANK', 34, 150);
  L(c, 'OPG DIMER · DECOY RECEPTOR', 200, 118, { alpha: o, always: true }); L(c, 'CRD1–4 · DD1 · DD2 · HBD · S–S', 200, 128, { size: 5.6, alpha: o, always: true });
  L(c, o > .5 ? 'OPG SEQUESTERS RANKL · RANK UNBOUND' : 'RANKL–RANK SIGNALLING', 130, 196, { size: 6.2 });
});

/* ================================================================ caspase-3 and the Bax / Bcl-2 balance */
function mitochondrion(c, x, y, t) {
  const P = NP.mito, pts = [];
  for (let i = 0; i < 30; i++) { const an = i / 30 * TAU, r = 1 - .1 * Math.max(0, Math.sin(an)) * Math.max(0, Math.cos(an * 2)) + .02 * Math.sin(an * 3 + t * .4); pts.push(Math.cos(an) * 58 * r, Math.sin(an) * 30 * r); }
  shape(c, x, y, pts, P, 40, 1.5);
  c.save(); c.translate(x, y); c.strokeStyle = rgb(P.rim, .55); c.lineWidth = 1.2; c.lineCap = 'round';
  for (let k = 0; k < 6; k++) { const cx = -42 + k * 17, top = k % 2 === 0; c.beginPath(); c.moveTo(cx - 4, top ? -26 : 26); c.quadraticCurveTo(cx, top ? 10 : -10, cx + 4, top ? -26 : 26); c.stroke(); }   // cristae
  c.restore();
}
const mitoTop = (x, cx = 72, cy = 92) => cy - 30 * Math.sqrt(Math.max(0, 1 - ((x - cx) / 58) ** 2));
registerSpecimen('casp3', 190, (c, t) => {
  const lt = loopT(t, 16), bax = ease(win(lt, 3.5, 6, 13, 15.5)), rel = win(lt, 6, 7.5, 12.5, 14.5), asm = ease(win(lt, 7.5, 9.5, 13.5, 15.5)), act = ease(win(lt, 9.8, 11.4, 13.6, 15.6));
  mitochondrion(c, 72, 92, t);
  // outer membrane: Bcl-2 holds Bax; when Bax wins it oligomerizes into a pore
  for (let i = 0; i < 3; i++) {
    const bx = 38 + i * 18, top = mitoTop(bx);
    dom(c, bx, top - 6, 5.5, 5, 0, NP.bcl2, .6); rod(c, bx, top - 2, bx, top + 4, 2.2, NP.bcl2, .5);
    const pair = [bx + 9, mitoTop(bx + 9) - 6], pore = [84 + (i - 1) * 9, mitoTop(84 + (i - 1) * 9) - 7];
    const px = lerp(pair[0], pore[0], bax), py = lerp(pair[1], pore[1], bax);
    dom(c, px, py, 5, 5.5, 0, NP.bax, .6); rod(c, px, py + 4, px, py + 9, 2.2, NP.bax, .5);
  }
  if (bax > .5) { c.save(); c.globalAlpha *= (bax - .5) * 2; circle(c, 84, mitoTop(84) - 1, 4, rgb(th(NP.mito.fil, .5)), rgb(NP.bax.rim, .8)); c.restore(); }
  // cytochrome c leaks out and seeds the apoptosome (Apaf-1 wheel + caspase-9)
  for (let i = 0; i < 7; i++) {
    const u = loopT(t * .22 + i / 7, 1), [x, y] = [lerp(84, 178, u), lerp(mitoTop(84) - 4, 46, u) - Math.sin(u * Math.PI) * 16];
    ion(c, x, y, 2.6, NP.cytc, '', rel * Math.sin(u * Math.PI));
  }
  c.save(); c.translate(178, 46); c.globalAlpha *= .25 + .75 * asm;
  for (let k = 0; k < 7; k++) { const an = k * TAU / 7 + t * .05; dom(c, Math.cos(an) * 13 * lerp(1.4, 1, asm), Math.sin(an) * 13 * lerp(1.4, 1, asm), 6.4, 3.6, an, NP.gs, .6); }
  dom(c, 0, 0, 5, 5, 0, NP.casp3, .6); c.restore();
  // procaspase-3 dimer → cleaved (p17/p12)₂ heterotetramer
  c.save(); c.translate(206, 128);
  if (act > .05) { const g = c.createRadialGradient(0, 0, 0, 0, 0, 34); g.addColorStop(0, rgb(NP.casp3.body, .55 * act)); g.addColorStop(1, rgb(NP.casp3.body, 0)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 34, 0, TAU); c.fill(); }
  for (const sd of [-1, 1]) {
    const spread = lerp(7, 0, act);
    dom(c, sd * (9 + spread * .4), -4, 9, 6.5, sd * .2, NP.casp3, .7);                    // large subunit (p17)
    dom(c, sd * (9 + spread), 9 + spread * .5, 6, 5, -sd * .3, NP.casp3, .7);              // small subunit (p12)
    c.save(); c.globalAlpha *= 1 - act;                                                     // prodomain + intersubunit linker
    c.strokeStyle = rgb(NP.casp3.rim, .8); c.lineWidth = 1.1; c.beginPath(); c.moveTo(sd * 12, 2); c.lineTo(sd * (12 + spread), 7); c.stroke();
    dom(c, sd * 20, -14 - (act * 10), 3.6, 3, 0, NP.casp3, .5); c.restore();
  }
  c.restore();
  // the balance: Bcl-2 vs Bax
  c.save(); c.translate(72, 166); const ang = lerp(-.2, .2, bax);
  c.fillStyle = rgb(thLine(NP.matrix.nuc), .55); c.beginPath(); c.moveTo(0, 0); c.lineTo(-6, 10); c.lineTo(6, 10); c.closePath(); c.fill();
  c.rotate(ang); c.strokeStyle = rgb(thLine(NP.matrix.nuc), .7); c.lineWidth = 1.6; c.beginPath(); c.moveTo(-34, 0); c.lineTo(34, 0); c.stroke();
  dom(c, -30, -6, 6, 5, -ang, NP.bcl2, .6); dom(c, 30, -6, 6, 5, -ang, NP.bax, .6);
  c.restore();
  L(c, 'Bcl-2', 38, 186); L(c, 'Bax', 106, 186); L(c, 'MITOCHONDRION', 72, 134);
  L(c, 'CYT c', 132, 28, { alpha: rel, always: true }); L(c, 'APOPTOSOME · CASPASE-9', 186, 74, { size: 5.8, alpha: .3 + .7 * asm, always: true });
  L(c, act > .5 ? 'ACTIVE CASPASE-3 · (p17/p12)₂' : 'PROCASPASE-3', 206, 160, { size: 6 });
});

export const MOLECULE_KEYS = ['casr', 'rankl', 'opg', 'casp3', 'pi', 'ca', 'dkk1', 'fgf23', 'wnt', 'matrix-vesicle', 'lrp56', 'lrp56-wnt', 'integrin', 'integrin-states', 'cx43', 'er-alpha', 'klotho-fgfr1', 'napi2ac', 'napi2b', 'pth1r'];
