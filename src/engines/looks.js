// @ts-nocheck
/* Extra render looks, shared by the atlas cell engine and Piezo1.
   A shape is described by two operations so the same painter works for procedural outlines and Path2D:
     shape.fill(ex)      fill the shape grown by ex px with the current fillStyle
     shape.clip(dx, dy)  intersect the clip with the shape shifted by (dx, dy)
   Edge bands come from clipping the shape against shifted copies of itself:
     shape − shape shifted up-left   = the lit / shaded edge on the lower right
     shape − shape shifted down-right = the edge on the upper left
   so every branch, however thin, gets its own lit side and shaded side. */

const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const W = [255, 255, 255], K = [0, 0, 0];
const BIG = 4000;
const flood = (c, style) => { c.fillStyle = style; c.fillRect(-BIG, -BIG, BIG * 2, BIG * 2); };

export const LOOKS = ['gloss', 'cel', 'engrave', 'glow'];

/** Cross-hatch pattern, cached per colour. */
const HATCH = new Map();
function hatch(c, col, dark) {
  const key = col.join(',') + dark;
  if (!HATCH.has(key)) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 5;
    const g = cv.getContext('2d'); g.strokeStyle = rgb(col, .9); g.lineWidth = .7; g.lineCap = 'square';
    g.beginPath(); g.moveTo(-1, 6); g.lineTo(6, -1); g.moveTo(-1, 1); g.lineTo(1, -1); g.moveTo(4, 6); g.lineTo(6, 4); g.stroke();
    HATCH.set(key, c.createPattern(cv, 'repeat'));
  }
  return HATCH.get(key);
}
function crossHatch(c, col, dark) {
  const key = 'x' + col.join(',') + dark;
  if (!HATCH.has(key)) {
    const cv = document.createElement('canvas'); cv.width = cv.height = 5;
    const g = cv.getContext('2d'); g.strokeStyle = rgb(col, .9); g.lineWidth = .65;
    g.beginPath(); g.moveTo(-1, 6); g.lineTo(6, -1); g.moveTo(-1, 1); g.lineTo(1, -1); g.moveTo(4, 6); g.lineTo(6, 4);
    g.moveTo(-1, -1); g.lineTo(6, 6); g.moveTo(-1, 4); g.lineTo(1, 6); g.moveTo(4, -1); g.lineTo(6, 1); g.stroke();
    HATCH.set(key, c.createPattern(cv, 'repeat'));
  }
  return HATCH.get(key);
}

/**
 * Paint `shape` in `look`. pal: { rim, body, fil } (rgb arrays). o.ex: outline thickness; o.a: edge-band width in
 * the shape's own units (keep it under half the thinnest feature); o.R: rough radius for gradients.
 */
export function paintLook(c, shape, look, pal, dark, o = {}) {
  const ex = o.ex ?? 1.2, a = o.a ?? .9, R = o.R ?? 30;
  const ink = dark ? mix(pal.rim, W, .35) : mix(pal.rim, K, .5);

  if (look === 'gloss') {
    // soft drop shadow and a darker rim; inside, stepped bands from the lower-right edge inward
    // (deep → mid → light shade), a bright lip on the upper-left edge, and a lit core with a sheen
    c.save(); c.shadowColor = dark ? 'rgba(0,0,0,.85)' : 'rgba(20,32,44,.28)'; c.shadowBlur = 6; c.shadowOffsetY = 2.5;
    c.fillStyle = rgb(mix(pal.rim, K, .12)); shape.fill(ex * .8); c.restore();
    const core = c.createRadialGradient(-R * .25, -R * .3, 0, 0, 0, R * 1.5);
    core.addColorStop(0, rgb(mix(pal.body, W, .5))); core.addColorStop(.6, rgb(pal.body)); core.addColorStop(1, rgb(mix(pal.body, pal.rim, .1)));
    c.save(); shape.clip(0, 0);
    flood(c, rgb(mix(pal.body, pal.rim, .66)));                                       // shape − shape⇖1.6a: deepest edge
    c.save(); shape.clip(-a * 1.6, -a * 1.6); flood(c, rgb(mix(pal.body, pal.rim, .4)));
    shape.clip(-a, -a); flood(c, rgb(mix(pal.body, pal.rim, .18)));
    shape.clip(-a * .5, -a * .5); c.globalAlpha = dark ? .45 : .85; flood(c, rgb(mix(pal.body, W, .7))); c.globalAlpha = 1;   // lip, shows on the upper-left edge only
    shape.clip(a * .45, a * .45); flood(c, core);
    c.restore(); c.restore();
    return;
  }

  if (look === 'cel') {
    // toon: bold ink outline; a hard shade band lower-right, a crisp lit sliver upper-left, flat base between
    c.fillStyle = rgb(ink); shape.fill(ex * 1.7 + .4);
    c.save(); shape.clip(0, 0);
    flood(c, rgb(mix(pal.body, pal.rim, .5)));
    c.save(); shape.clip(-a * 1.5, -a * 1.5); flood(c, rgb(mix(pal.body, W, .6)));
    shape.clip(a * .7, a * .7); flood(c, rgb(pal.body));
    c.restore(); c.restore();
    return;
  }

  if (look === 'engrave') {
    // pen-and-ink plate: fine ink line, paper body, hatching across the shaded band, cross-hatching in its deepest part
    const paper = dark ? mix(pal.body, K, .7) : mix(pal.body, W, .72), pen = mix(pal.rim, dark ? W : K, .3);
    c.fillStyle = rgb(ink); shape.fill(ex * .55 + .25);
    c.save(); shape.clip(0, 0);
    flood(c, rgb(paper)); flood(c, crossHatch(c, pen, dark));                         // shape − shape⇖a: cross-hatch
    c.save(); shape.clip(-a, -a); flood(c, rgb(paper)); flood(c, hatch(c, pen, dark)); // band a … 2.4a: single hatch
    shape.clip(-a * 2.4, -a * 2.4); flood(c, rgb(paper));                              // the rest: clean paper
    c.restore(); c.restore();
    return;
  }

  if (look === 'glow') {
    // fluorescence micrograph: a saturated, glowing membrane label over a faint, translucent cytoplasm
    const avg = (pal.rim[0] + pal.rim[1] + pal.rim[2]) / 3;
    const neon = pal.rim.map(v => Math.max(0, Math.min(255, v + (v - avg) * .9 + (dark ? 40 : 0))));
    c.save(); c.shadowColor = rgb(neon, dark ? 1 : .85); c.shadowBlur = dark ? 16 : 12;
    c.fillStyle = rgb(neon, .9); shape.fill(ex * .6); c.restore();
    c.save(); shape.clip(0, 0);
    flood(c, rgb(mix(neon, W, dark ? .35 : .1)));                                     // the labelled membrane
    c.save(); shape.clip(-a * .9, -a * .9); shape.clip(a * .9, a * .9);
    const base = dark ? K : W, g = c.createRadialGradient(0, 0, 0, 0, 0, R * 1.6);       // faint, diffuse cytoplasmic signal
    g.addColorStop(0, rgb(mix(base, neon, dark ? .45 : .3))); g.addColorStop(1, rgb(mix(base, neon, dark ? .2 : .12))); flood(c, g);
    c.restore(); c.restore();
    return;
  }
}
