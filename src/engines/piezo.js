// @ts-nocheck
/* Piezo1 trimer glyph. Geometry (blade paths, polar uncurling, pore iris) is copied verbatim
   from the replicate-piezo1-protein-code lab; the SVG rendering is ported to canvas so it shares
   the page clock, theme and render styles. Four shapes: specimen, softened, swept, hybrid. */
const CX = 552;
const CY = 465;

function getPoreRadius(open) {
  const clamped = Math.min(1.08, Math.max(0, open));
  const t = -0.22 + clamped * 1.14;
  return 34.5 + t * 37.5;
}

function rotatePoint(x, y, deg, cx = CX, cy = CY) {
  if (deg === 0) return [x, y];
  const rad = (deg * Math.PI) / 180;
  const dx = x - cx;
  const dy = y - cy;
  return [
    cx + dx * Math.cos(rad) - dy * Math.sin(rad),
    cy + dx * Math.sin(rad) + dy * Math.cos(rad),
  ];
}

// Polar uncurling + radial iris dilation around pore center (CX, CY)
function deformPoint(x, y, open, shadeBellyPull = 0) {
  const clamped = Math.min(1.08, Math.max(0, open));
  const t = -0.22 + clamped * 1.14;

  const dx = x - CX;
  const dy = y - CY;
  const r = Math.hypot(dx, dy);
  const theta = Math.atan2(dy, dx);
  const rn = Math.min(1.25, r / 420);

  // 1. Radial iris opening near the pore + in-plane blade flattening
  const porePush = 38 * Math.exp(-Math.pow((r - 38) / 76, 2));
  const bladeStretch = 68 * Math.pow(rn, 1.1);
  const bellyFlatten = shadeBellyPull * clamped * 18;
  const dr = t * (porePush + bladeStretch) + bellyFlatten;

  // 2. Angular uncurling along the C-blade
  const rootPivot = -0.09;
  const tipUncurl = -0.45 * Math.pow(rn, 1.25);
  const dTheta = t * (rootPivot + tipUncurl) - shadeBellyPull * clamped * 0.04;

  const nr = Math.max(8, r + dr);
  const nTheta = theta + dTheta;

  return [CX + nr * Math.cos(nTheta), CY + nr * Math.sin(nTheta)];
}

function transformPathWithIndex(pathStr, fn) {
  const tokens = pathStr.trim().split(/([MCZ])/i).filter(Boolean);
  let out = "";
  let cmdIndex = 0;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i].trim();
    if (/^[MCZ]$/i.test(t)) {
      out += t + " ";
      if (t.toUpperCase() === "Z") continue;
      const nums = (tokens[++i] || "").trim().split(/[\s,]+/).filter(Boolean).map(Number);
      const pairs = [];
      for (let j = 0; j < nums.length; j += 2) {
        const pairIdx = j / 2;
        const [nx, ny] = fn(nums[j], nums[j + 1], cmdIndex, pairIdx);
        pairs.push(`${nx.toFixed(1)},${ny.toFixed(1)}`);
      }
      out += pairs.join(" ") + " ";
      cmdIndex++;
    }
  }
  return out.trim();
}

// 1. SPECIMEN (Reference trace with all projections and inner shaded sweeps)
const SPECIMEN_BLADES = [
  {
    path: `M 522,438 C 512,456 516,482 536,498 C 554,510 576,506 590,492
      C 614,501 640,498 663,489 C 674,485 684,484 696,487
      C 716,489 732,495 745,508 C 754,518 761,517 770,508 C 782,495 797,482 809,479
      C 817,477 820,481 818,494 C 817,516 810,537 798,553 C 790,564 791,572 799,585
      C 811,604 817,624 817,645 C 817,658 812,669 815,677 C 819,686 831,689 841,692
      C 852,695 856,705 857,720 C 859,747 850,774 835,798 C 821,820 801,837 784,848
      C 776,853 776,857 783,861 C 792,866 790,872 782,877 C 768,886 750,889 734,887
      C 722,886 716,890 707,899 C 698,908 686,916 681,925 C 675,935 678,946 680,958
      C 682,971 677,978 665,982 C 642,988 612,981 587,970 C 570,963 554,953 547,942
      C 541,932 545,923 552,915 C 558,909 558,906 552,901 C 541,892 532,883 530,872
      C 527,860 531,850 539,845 C 547,840 556,843 565,845 C 580,848 595,843 610,836
      C 591,828 575,824 563,825 C 555,824 552,817 551,809 C 548,803 541,801 537,796
      C 533,790 539,785 544,780 C 550,775 550,768 552,761 C 554,754 560,751 565,755
      C 572,761 576,768 584,769 C 592,767 598,769 603,773 C 609,778 616,777 623,779
      C 635,782 645,789 657,790 C 661,774 661,754 657,736 C 652,715 641,699 629,692
      C 621,687 614,687 611,692 C 609,696 610,702 605,705 C 599,709 589,707 578,706
      C 568,705 557,703 547,704 C 536,704 530,709 527,717 C 524,725 518,726 512,721
      C 504,714 499,704 498,695 C 497,687 502,680 504,673 C 506,666 505,660 510,657
      C 516,652 522,657 528,660 C 536,664 543,662 548,656 C 552,651 551,647 552,644
      C 531,644 510,637 495,624 C 480,610 471,589 469,566 C 466,538 474,506 487,481
      C 497,462 509,446 522,438 Z`,
    shade: `M 552,644 C 575,645 598,640 620,636 C 646,630 667,634 681,647
      C 694,660 697,679 697,704 C 698,742 685,777 663,801 C 647,819 629,830 610,836
      C 591,828 575,824 563,825 C 555,824 552,817 551,809 C 548,803 541,801 537,796
      C 533,790 539,785 544,780 C 550,775 550,768 552,761 C 554,754 560,751 565,755
      C 572,761 576,768 584,769 C 592,767 598,769 603,773 C 609,778 616,777 623,779
      C 635,782 645,789 657,790 C 661,774 661,754 657,736 C 652,715 641,699 629,692
      C 621,687 614,687 611,692 C 609,696 610,702 605,705 C 599,709 589,707 578,706
      C 568,705 557,703 547,704 C 536,704 530,709 527,717 C 524,725 518,726 512,721
      C 504,714 499,704 498,695 C 497,687 502,680 504,673 C 506,666 505,660 510,657
      C 516,652 522,657 528,660 C 536,664 543,662 548,656 C 552,651 551,647 552,644 Z`,
  },
  {
    path: `M 44,297 C 50,279 66,260 85,246 C 103,233 123,224 137,226
      C 148,227 153,234 156,244 C 158,252 162,253 170,250 C 181,245 194,243 204,247
      C 215,251 223,260 224,269 C 225,280 218,288 211,296 C 204,306 201,318 198,331
      C 197,337 196,342 196,347 C 202,337 211,326 217,315 C 222,305 228,301 238,302
      C 247,305 254,302 262,298 C 269,295 272,299 274,307 C 275,317 281,322 286,328
      C 292,335 288,340 281,342 C 272,344 266,344 263,351 C 261,360 256,365 247,368
      C 242,377 236,386 227,394 C 222,398 217,402 215,407 C 229,416 243,426 259,431
      C 278,438 298,435 312,428 C 321,424 326,416 321,410 C 316,406 313,401 314,394
      C 315,386 321,378 326,370 C 333,359 339,347 340,339 C 340,333 334,328 332,322
      C 330,315 334,312 341,311 C 351,309 361,311 368,312 C 376,314 379,321 384,326
      C 389,331 395,335 395,341 C 395,347 389,351 383,355 C 377,359 375,364 377,370
      C 379,376 385,379 389,382 C 401,356 421,339 443,334 C 465,328 488,334 507,343
      C 542,359 567,390 581,423 C 585,433 588,442 590,451 C 574,432 557,424 541,430
      C 514,440 492,471 480,504 C 470,532 467,560 470,585 C 456,585 447,594 437,603
      C 427,612 417,615 407,618 C 400,620 399,626 402,634 C 407,646 412,659 412,671
      C 412,683 409,690 403,690 C 394,690 379,679 367,668 C 356,657 351,646 348,635
      C 345,625 338,622 327,622 C 304,623 280,617 262,608 C 248,601 241,590 232,586
      C 223,583 216,590 208,597 C 201,603 194,606 184,604 C 163,600 143,583 128,564
      C 111,542 103,517 100,492 C 98,480 100,470 96,465 C 92,461 88,466 83,465
      C 77,464 75,457 76,448 C 77,434 84,423 89,413 C 95,401 94,393 91,382
      C 87,369 86,357 83,348 C 79,338 70,333 59,328 C 48,323 41,317 42,307
      C 42,303 43,300 44,297 Z`,
    shade: `M 196,347 C 198,380 208,411 229,435 C 251,461 282,479 313,490
      C 332,496 348,487 358,473 C 368,458 372,438 377,418 C 381,402 384,391 389,382
      C 385,379 379,376 377,370 C 375,364 377,359 383,355 C 389,351 395,347 395,341
      C 395,335 389,331 384,326 C 379,321 376,314 368,312 C 361,311 351,309 341,311
      C 334,312 330,315 332,322 C 334,328 340,333 340,339 C 339,347 333,359 326,370
      C 321,378 315,386 314,394 C 313,401 316,406 321,410 C 326,416 321,424 312,428
      C 298,435 278,438 259,431 C 243,426 229,416 215,407 C 217,402 222,398 227,394
      C 236,386 242,377 247,368 C 256,365 261,360 263,351 C 266,344 272,344 281,342
      C 288,340 292,335 286,328 C 281,322 275,317 274,307 C 272,299 269,295 262,298
      C 254,302 247,305 238,302 C 228,301 222,305 217,315 C 211,326 202,337 196,347 Z`,
  },
  {
    path: `M 604,95 C 615,75 654,58 687,54 C 721,50 752,55 773,65
      C 784,71 779,75 777,66 C 775,59 780,55 786,56 C 806,59 819,75 829,91
      C 838,104 847,105 862,107 C 879,109 888,117 899,116 C 913,114 925,97 934,94
      C 946,89 956,97 965,112 C 974,130 977,153 976,175 C 976,198 971,216 962,225
      C 955,232 946,229 939,227 C 933,225 931,228 930,237 C 929,250 924,263 914,271
      C 902,281 887,279 878,272 C 869,264 871,248 863,236 C 855,225 844,217 831,211
      C 833,221 834,229 838,239 C 842,250 849,258 849,269 C 849,278 839,283 838,291
      C 837,298 838,307 830,308 C 822,309 817,303 809,305 C 802,307 793,311 789,306
      C 785,301 790,293 791,284 C 791,276 783,271 784,263 C 786,255 785,250 779,242
      C 774,232 774,217 771,206 C 745,211 722,223 709,245 C 701,259 697,278 701,291
      C 703,297 708,298 715,295 C 722,295 727,299 731,308 C 738,323 745,342 758,348
      C 768,353 774,347 780,350 C 785,352 785,364 780,374 C 774,387 766,392 752,394
      C 744,397 734,402 729,395 C 725,389 727,377 724,371 C 719,366 709,366 703,370
      C 710,387 717,407 716,426 C 715,455 699,479 674,493 C 647,509 609,514 576,509
      C 566,508 557,506 549,503 C 570,505 586,493 591,477 C 597,458 589,440 581,423
      C 567,390 542,359 507,343 C 502,340 498,337 494,333 C 491,316 482,307 482,291
      C 481,280 487,269 483,264 C 478,258 464,260 451,255 C 440,251 429,245 424,237
      C 421,231 428,224 437,220 C 449,214 463,208 478,208 C 489,208 499,213 508,210
      C 517,207 521,200 525,191 C 537,166 554,146 579,140 C 594,137 603,133 605,122
      C 608,110 600,103 604,95 Z`,
    shade: `M 831,211 C 799,194 761,191 724,198 C 675,207 644,232 638,261
      C 629,295 654,318 678,343 C 690,356 699,367 703,370 C 709,366 719,366 724,371
      C 727,377 725,389 729,395 C 734,402 744,397 752,394 C 766,392 774,387 780,374
      C 785,364 785,352 780,350 C 774,347 768,353 758,348 C 745,342 738,323 731,308
      C 727,299 722,295 715,295 C 708,298 703,297 701,291 C 697,278 701,259 709,245
      C 722,223 745,211 771,206 C 774,217 774,232 779,242 C 785,250 786,255 784,263
      C 783,271 791,276 791,284 C 790,293 785,301 789,306 C 793,311 802,307 809,305
      C 817,303 822,309 830,308 C 838,307 837,298 838,291 C 839,283 849,278 849,269
      C 849,258 842,250 838,239 C 834,229 833,221 831,211 Z`,
  },
];

// 2. SOFTENED LOBES (Flared hammer-tip and organic waves, inner finger projections removed)
const SOFTENED_MAIN = `
  M 552,500
  C 573,500 589,484 589,463
  C 589,441 577,418 559,392
  C 537,360 509,336 487,310
  C 472,292 466,272 474,254
  C 482,236 504,224 522,204
  C 544,180 564,148 594,120
  C 626,90 670,66 720,58
  C 766,50 810,58 842,78
  C 868,94 888,108 912,106
  C 932,104 946,92 960,102
  C 976,114 982,146 978,178
  C 974,208 960,228 942,234
  C 926,240 920,262 902,272
  C 884,282 866,268 854,248
  C 838,222 810,204 776,200
  C 738,196 698,210 676,240
  C 654,270 656,310 674,348
  C 690,382 710,410 708,442
  C 706,474 682,496 648,504
  C 614,512 578,500 552,500 Z
`;
const SOFTENED_SHADE = `
  M 836,226
  C 802,196 756,186 712,198
  C 666,210 636,240 634,276
  C 632,312 656,344 680,374
  C 694,392 704,412 708,432
  C 706,404 688,378 674,348
  C 656,310 654,270 676,240
  C 698,210 738,196 776,200
  C 800,203 820,212 836,226 Z
`;

// 3. SWEPT FIN (Zero side projections, pure sleek tapered hooked fin tip)
const SWEPT_MAIN = `
  M 552,500
  C 573,500 589,484 589,463
  C 589,440 575,416 556,390
  C 526,350 492,306 490,254
  C 488,198 518,140 570,98
  C 624,54 702,38 780,52
  C 856,66 926,108 962,168
  C 980,198 986,232 972,248
  C 958,264 934,250 912,232
  C 882,208 844,190 802,186
  C 752,182 702,198 676,232
  C 650,266 652,310 672,350
  C 688,384 708,412 708,444
  C 708,476 684,496 648,504
  C 614,512 578,500 552,500 Z
`;
const SWEPT_SHADE = `
  M 862,204
  C 818,178 762,168 712,184
  C 662,200 630,236 630,278
  C 630,318 656,356 682,388
  C 696,406 706,424 708,444
  C 708,412 688,384 672,350
  C 652,310 650,266 676,232
  C 702,198 752,182 802,186
  C 824,188 844,194 862,204 Z
`;

// 4. HYBRID: Specimen undulating lobed shoulders combined with the sleek, swept, tapered fin tip
const HYBRID_MAIN = `
  M 552,500
  C 573,500 589,484 589,463
  C 589,441 577,418 559,392
  C 537,360 509,336 487,310
  C 472,292 466,270 476,252
  C 486,234 506,220 524,200
  C 544,178 564,148 594,118
  C 628,84 676,58 732,50
  C 784,42 836,52 878,74
  C 912,92 936,108 962,126
  C 984,142 994,170 990,200
  C 984,232 960,256 932,258
  C 908,260 882,238 860,214
  C 836,188 798,176 758,176
  C 720,176 684,196 664,230
  C 644,264 648,308 668,348
  C 686,382 708,410 708,442
  C 706,474 682,496 648,504
  C 614,512 578,500 552,500 Z
`;
const HYBRID_SHADE = `
  M 860,214
  C 820,178 770,166 720,178
  C 670,192 638,230 634,274
  C 630,314 654,352 680,384
  C 696,404 706,422 708,442
  C 708,410 686,382 668,348
  C 648,308 644,264 664,230
  C 684,196 720,176 758,176
  C 798,176 836,188 860,214 Z
`;

const makeSym = (p, s) =>
  [120, 240, 0].map((rotation) => ({
    path: p,
    shade: s,
    rotation,
    isSymmetric: true,
  }));

const SHAPES_DATA = {
  specimen: SPECIMEN_BLADES,
  softened: makeSym(SOFTENED_MAIN, SOFTENED_SHADE),
  swept: makeSym(SWEPT_MAIN, SWEPT_SHADE),
  hybrid: makeSym(HYBRID_MAIN, HYBRID_SHADE),
};

function getDeformedBlades(shape, open) {
  const blades = SHAPES_DATA[shape];
  return blades.map((blade) => {
    const angle = blade.rotation ?? 0;
    const rotMain =
      angle === 0 ? blade.path : transformPathWithIndex(blade.path, (x, y) => rotatePoint(x, y, angle));
    const defMain = transformPathWithIndex(rotMain, (x, y) => deformPoint(x, y, open, 0));

    let defShade;
    if (blade.shade) {
      const rotShade =
        angle === 0 ? blade.shade : transformPathWithIndex(blade.shade, (x, y) => rotatePoint(x, y, angle));
      defShade = transformPathWithIndex(rotShade, (x, y, cmdIdx, pairIdx) => {
        const isInnerLip =
          blade.isSymmetric && ((cmdIdx >= 1 && cmdIdx <= 3) || (cmdIdx === 4 && pairIdx < 2));
        return deformPoint(x, y, open, isInnerLip ? 1 : 0);
      });
    }

    return { main: defMain, shade: defShade };
  });
}


const hex = h => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const shadeOf = (c, k) => c.map(v => v * k);
const mixc = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

import { LOOKS, paintLook } from './looks.js';

export const PIEZO_DEFAULTS = { blade1: '#b1cdbc', blade2: '#8fb29e', blade3: '#628b75', ink: '#1e392b' };
export const PIEZO_SHAPES = ['specimen', 'softened', 'swept', 'hybrid'];
const BOX = [-115, -145, 1334, 1278];            // the original viewBox

/** Gate cycle: closed → open → closed every 4.2 s (the original's ping-pong, eased). */
export const piezoOpen = t => .5 - .5 * Math.cos(t / 4.2 * Math.PI * 2);

/** Draw Piezo1 `shape` at time t into a w×h CSS-pixel area. o: { style, dark, colors } */
export function drawPiezo(c, shape, t, w, h, o = {}) {
  const style = o.style || 'atlas', dark = !!o.dark, col = { ...PIEZO_DEFAULTS, ...(o.colors || {}) };
  const blades3 = [hex(col.blade1), hex(col.blade2), hex(col.blade3)];
  let ink = hex(col.ink); if (dark && !(o.colors && o.colors.ink)) ink = [214, 232, 222];
  const open = piezoOpen(t), poreR = getPoreRadius(open), blades = getDeformedBlades(shape, open);
  const sc = Math.min(w / BOX[2], h / BOX[3]) * .96;
  c.save(); c.translate(w / 2, h / 2); c.scale(sc, sc); c.translate(-(BOX[0] + BOX[2] / 2), -(BOX[1] + BOX[3] / 2));
  c.lineCap = 'round'; c.lineJoin = 'round';
  const twist = (open - .3) * 2.2 * Math.PI / 180;
  const trimer = () => { c.translate(CX, CY); c.rotate(twist); c.translate(-CX, -CY); };
  const paths = blades.map(b => ({ main: new Path2D(b.main), shade: b.shade && new Path2D(b.shade) }));

  if (style === 'wire') {           // alignment guides
    c.save(); c.strokeStyle = css(ink, .16); c.lineWidth = 1.4;
    c.beginPath(); c.arc(CX, CY, 430 + open * 48, 0, Math.PI * 2); c.stroke();
    c.setLineDash([4, 8]); c.beginPath(); c.arc(CX, CY, 140 + open * 34, 0, Math.PI * 2); c.stroke();
    c.setLineDash([3, 11]); c.beginPath(); c.moveTo(CX, -80); c.lineTo(CX, 1080); c.moveTo(-60, CY); c.lineTo(1164, CY); c.stroke();
    c.restore();
  }
  if (style === 'clay') {           // soft drop shadow
    c.save(); c.filter = 'blur(12px)'; c.globalAlpha = dark ? .6 : .22; c.translate(10, 16); trimer();
    c.fillStyle = dark ? '#000' : '#1e293b'; paths.forEach(p => c.fill(p.main)); c.restore();
  }
  // blades, with the central pore cut out
  c.save();
  c.beginPath(); c.rect(-200, -200, 1520, 1460); c.arc(CX, CY, poreR, 0, Math.PI * 2); c.clip('evenodd');
  trimer();
  paths.forEach((p, i) => {
    const fill = blades3[i % 3], shade = shadeOf(fill, .78);
    if (LOOKS.includes(style)) {          // the shared render looks, on Path2D shapes
      const sh = q => ({ fill: e => { c.fill(q); if (e > 0) { c.strokeStyle = c.fillStyle; c.lineWidth = e * 2; c.lineJoin = 'round'; c.stroke(q); } }, clip: (dx, dy) => { c.translate(dx, dy); c.clip(q); c.translate(-dx, -dy); } });
      const pal = f => ({ rim: shadeOf(f, .62), body: f, fil: mixc(f, [255, 255, 255], .5) });
      paintLook(c, sh(p.main), style, pal(fill), dark, { ex: 3.4, a: 9, R: 330 });
      if (p.shade) paintLook(c, sh(p.shade), style, pal(shade), dark, { ex: 2.6, a: 6, R: 200 });
      return;
    }
    const rim = style === 'atlas' ? shadeOf(fill, .62) : ink;
    const lw = style === 'wire' ? [4.2, 2.4] : style === 'ink' ? [5.2, 4.4] : style === 'atlas' ? [4, 3] : [3.6, 3];
    c.strokeStyle = css(rim);
    if (style === 'glass') {
      c.fillStyle = css(fill, .55); c.fill(p.main);
    } else if (style !== 'wire') {
      if (style === 'atlas') {      // the atlas membrane treatment: lighter core, darker edge
        const g = c.createRadialGradient(CX, CY, 60, CX, CY, 520);
        g.addColorStop(0, css(mixc(fill, rim, .3))); g.addColorStop(1, css(fill)); c.fillStyle = g;
      } else c.fillStyle = css(fill);
      c.fill(p.main);
    }
    c.lineWidth = lw[0]; c.stroke(p.main);
    if (p.shade) {
      if (style !== 'wire') { c.fillStyle = style === 'glass' ? css(shade, .5) : css(shade); c.fill(p.shade); }
      c.lineWidth = lw[1]; c.stroke(p.shade);
    }
    if (style === 'glass') {
      const g = c.createRadialGradient(CX + 30, CY - 120, 20, CX, CY, 560);
      g.addColorStop(0, `rgba(255,255,255,${dark ? .35 : .65})`); g.addColorStop(.45, 'rgba(255,255,255,.06)'); g.addColorStop(1, css(ink, .22));
      c.fillStyle = g; c.fill(p.main);
      c.strokeStyle = `rgba(255,255,255,${dark ? .5 : .9})`; c.lineWidth = 2.4; c.stroke(p.main);
    }
  });
  c.restore();
  // co-moving pore rim
  c.beginPath(); c.arc(CX, CY, poreR, 0, Math.PI * 2);
  c.strokeStyle = css(style === 'atlas' ? shadeOf(blades3[2], .62) : ink); c.lineWidth = style === 'wire' ? 3.6 : 4.6; c.stroke();
  c.restore();
}
