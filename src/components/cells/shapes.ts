// Deterministic pseudo-random generator so shapes are stable across renders
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Pt = [number, number];

/** Smooth closed Catmull-Rom spline through the given points, as an SVG path. */
export function smoothClosed(points: Pt[], tension = 0.5): string {
  const n = points.length;
  if (n < 3) return "";
  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const c1x = p1[0] + ((p2[0] - p0[0]) * tension) / 3;
    const c1y = p1[1] + ((p2[1] - p0[1]) * tension) / 3;
    const c2x = p2[0] - ((p3[0] - p1[0]) * tension) / 3;
    const c2y = p2[1] - ((p3[1] - p1[1]) * tension) / 3;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d + " Z";
}

/**
 * Organic blob centred at origin.
 * rx / ry: base radii, n: number of control points, amp: radial jitter (0-1), seed: determinism.
 */
export function blob(rx: number, ry: number, n: number, amp: number, seed: number, rotation = 0): string {
  const rnd = mulberry32(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rotation;
    const k = 1 + (rnd() * 2 - 1) * amp;
    pts.push([Math.cos(a) * rx * k, Math.sin(a) * ry * k]);
  }
  return smoothClosed(pts, 0.9);
}

/**
 * Stellate (star-shaped) cell with concave sides between pointed processes.
 * tips: array of tip lengths, inner: body radius, rotation in radians.
 */
export function stellate(tips: number[], inner: number, rotation = 0, pinch = 0.55): string {
  const k = tips.length;
  const tipPts: Pt[] = tips.map((len, i) => {
    const a = (i / k) * Math.PI * 2 + rotation;
    return [Math.cos(a) * len, Math.sin(a) * len];
  });
  let d = `M ${tipPts[0][0].toFixed(2)} ${tipPts[0][1].toFixed(2)}`;
  for (let i = 0; i < k; i++) {
    const next = tipPts[(i + 1) % k];
    const a = ((i + 0.5) / k) * Math.PI * 2 + rotation;
    const cx = Math.cos(a) * inner * pinch;
    const cy = Math.sin(a) * inner * pinch;
    d += ` Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${next[0].toFixed(2)} ${next[1].toFixed(2)}`;
  }
  return d + " Z";
}

/** Scattered points inside an ellipse (for granules/dots). */
export function scatter(count: number, rx: number, ry: number, seed: number, minR = 0): Pt[] {
  const rnd = mulberry32(seed);
  const pts: Pt[] = [];
  let guard = 0;
  while (pts.length < count && guard < count * 50) {
    guard++;
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd());
    const x = Math.cos(a) * rx * r;
    const y = Math.sin(a) * ry * r;
    if (Math.hypot(x / rx, y / ry) * Math.max(rx, ry) < minR) continue;
    pts.push([x, y]);
  }
  return pts;
}
