// @ts-nocheck
/* Shared drawing kit for the added specimens (bone.js, molecules.js).
   Everything paints through the atlas engine's paintMembrane(), so render styles, the theme and
   colour overrides apply exactly as they do to the original cells. */
import { E, NP, isDark } from './atlas.js';

const { TAU, mix, rgb, lerp, addStrand, paintMembrane, circle } = E;

/* ---- palettes shared across the added specimens ---- */
Object.assign(NP, {
  lipid: { rim: [170, 182, 160], body: [226, 233, 216], fil: [200, 210, 190], nuc: [150, 162, 140] },
  na: { rim: [128, 104, 178], body: [204, 190, 236], fil: [246, 240, 255], nuc: [110, 88, 160] },
  pi: { rim: [196, 124, 48], body: [248, 204, 142], fil: [255, 244, 224], nuc: [170, 100, 30] },
  ca: { rim: [82, 150, 104], body: [184, 226, 190], fil: [240, 252, 240], nuc: [60, 128, 84] },
});

/** Big-area fills (matrix, membranes) are darkened in dark mode so they don't glare on black. */
export const th = (col, k = .62) => isDark() ? mix(col, [0, 0, 0], k) : col;
export const thLine = (col, k = .35) => isDark() ? mix(col, [255, 255, 255], k * .4) : col;

/**
 * Closed smooth outline through flat points [x0,y0,x1,y1,…], pushed outward by ex.
 * Quadratic curves through the edge midpoints keep it organic; the winding is detected so
 * "outward" is always outward.
 */
export function polyPath(c, pts, ex = 0) {
  const n = pts.length / 2;
  let area = 0;
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; area += pts[i * 2] * pts[j * 2 + 1] - pts[j * 2] * pts[i * 2 + 1]; }
  const sgn = area > 0 ? 1 : -1, q = new Array(n * 2);
  for (let i = 0; i < n; i++) {
    const a = (i - 1 + n) % n, b = (i + 1) % n;
    let tx = pts[b * 2] - pts[a * 2], ty = pts[b * 2 + 1] - pts[a * 2 + 1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    q[i * 2] = pts[i * 2] + ty * ex * sgn; q[i * 2 + 1] = pts[i * 2 + 1] - tx * ex * sgn;
  }
  c.beginPath();
  c.moveTo((q[0] + q[(n - 1) * 2]) / 2, (q[1] + q[(n - 1) * 2 + 1]) / 2);
  for (let i = 0; i < n; i++) { const j = (i + 1) % n; c.quadraticCurveTo(q[i * 2], q[i * 2 + 1], (q[i * 2] + q[j * 2]) / 2, (q[i * 2 + 1] + q[j * 2 + 1]) / 2); }
  c.closePath();
}

/** A membrane-style shape from outline points (relative to x, y), gradient sized by R. */
export function shape(c, x, y, pts, pal, R = 30, ex = 1.3, gk = .28) {
  c.save(); c.translate(x, y); paintMembrane(c, e => polyPath(c, pts, e), ex, pal, R * .15, R * 1.6, gk, Math.max(.8, R * .045)); c.restore();
}

/** Outline points of a wobbling blob: radius fn(theta) sampled n times. */
export function blobPts(n, fn) { const p = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, r = fn(a); p.push(Math.cos(a) * r[0], Math.sin(a) * r[1]); } return p; }

/** A protein domain: an ellipse painted like a membrane. */
export function dom(c, x, y, rx, ry, rot, pal, ex = .9) {
  c.save(); c.translate(x, y); c.rotate(rot);
  paintMembrane(c, e => { c.beginPath(); c.ellipse(0, 0, rx + e, ry + e, 0, 0, TAU); }, ex, pal, Math.min(rx, ry) * .2, Math.max(rx, ry) * 1.5, .22, Math.max(.45, Math.min(rx, ry) * .22));
  c.restore();
}

/** A tapered tube through flat points with per-point widths. */
export function tube(c, pts, ws, pal, ex = 1) {
  const s = { pts, ws, n: ws.length - 1 };
  paintMembrane(c, e => { c.beginPath(); addStrand(c, s, e); }, ex, pal, 0, 0, 0, Math.max(.45, Math.min(...ws) * .2));
}

/** A rounded rod (α-helix / TM helix) from (x0,y0) to (x1,y1). */
export function rod(c, x0, y0, x1, y1, w, pal, ex = .8) { tube(c, [x0, y0, x1, y1], [w, w], pal, ex); }

/** An α-helix: a rod with its helical turns drawn across it. */
export function helix(c, x0, y0, x1, y1, w, pal) {
  rod(c, x0, y0, x1, y1, w, pal, .8);
  const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, n = Math.floor(L / (w * .9));
  c.strokeStyle = rgb(pal.rim, .45); c.lineWidth = Math.max(.5, w * .14); c.lineCap = 'round'; c.beginPath();
  for (let k = 1; k < n; k++) { const cx = x0 + ux * k * w * .9, cy = y0 + uy * k * w * .9; c.moveTo(cx - uy * w * .42 - ux * w * .2, cy + ux * w * .42 - uy * w * .2); c.lineTo(cx + uy * w * .42 + ux * w * .2, cy - ux * w * .42 + uy * w * .2); }
  c.stroke();
}

/** A six- or seven-bladed β-propeller seen face-on. */
export function propeller(c, x, y, r, pal, blades = 6, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot);
  for (let k = 0; k < blades; k++) { const a = k * TAU / blades; c.save(); c.rotate(a); dom(c, r * .45, 0, r * .52, r * .24, .25, pal, .55); c.restore(); }
  circle(c, 0, 0, r * .22, rgb(mix(pal.body, pal.fil, .3)), rgb(pal.rim, .55));
  c.restore();
}

/** Lipid bilayer from x0 to x1: head-group beads on both leaflets with acyl tails between. */
export function bilayer(c, y, x0, x1, o = {}) {
  const pal = NP.lipid, gap = o.gap ?? 11, step = o.step ?? 5.2, a = o.a ?? 1;
  c.save(); c.globalAlpha *= a;
  c.fillStyle = rgb(th(mix(pal.body, pal.fil, .5), .7)); c.fillRect(x0, y + 2, x1 - x0, gap - 4);
  c.strokeStyle = rgb(thLine(pal.rim), .45); c.lineWidth = .55; c.beginPath();
  for (let x = x0 + step / 2; x < x1; x += step) { c.moveTo(x - .6, y + 2); c.lineTo(x - .3, y + gap / 2 - .5); c.moveTo(x + .6, y + 2); c.lineTo(x + .3, y + gap / 2 - .5); c.moveTo(x - .6, y + gap - 2); c.lineTo(x - .3, y + gap / 2 + .5); c.moveTo(x + .6, y + gap - 2); c.lineTo(x + .3, y + gap / 2 + .5); }
  c.stroke();
  for (const yy of [y, y + gap]) for (let x = x0 + step / 2; x < x1; x += step) circle(c, x, yy, step * .4, rgb(th(pal.body, .5)), rgb(thLine(pal.rim), .8));
  c.restore();
}

/** An ion / small-molecule sphere with its symbol (Pi, Ca²⁺, Na⁺…). */
export function ion(c, x, y, r, pal, label, a = 1) {
  if (a <= .01) return;
  c.save(); c.globalAlpha *= a; c.translate(x, y);
  paintMembrane(c, e => { c.beginPath(); c.arc(0, 0, r + e, 0, TAU); }, Math.max(.5, r * .12), pal, r * .1, r * 1.1, .25, Math.max(.4, r * .16));
  c.beginPath(); c.ellipse(-r * .32, -r * .38, r * .3, r * .16, -.6, 0, TAU); c.fillStyle = rgb(pal.fil, .7); c.fill();
  if (label && r >= 3.2) {
    c.fillStyle = rgb(mix(pal.rim, [0, 0, 0], .35)); c.font = `600 ${r * .95}px "DM Sans",Arial,sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(label, 0, r * .06);
  }
  c.restore();
}

/** Point along a quadratic path at u, for moving cargo. */
export const qpt = (x0, y0, cx, cy, x1, y1, u) => { const v = 1 - u; return [v * v * x0 + 2 * v * u * cx + u * u * x1, v * v * y0 + 2 * v * u * cy + u * u * y1]; };

/** Smooth 0→1→0 within a loop window: rises over [a,b], holds, falls over [c,d]. */
export const win = (t, a, b, c2, d) => E.clamp((t - a) / (b - a)) * (1 - E.clamp((t - c2) / (d - c2)));
export const loopT = (t, L) => ((t % L) + L) % L;
export { E };
