// @ts-nocheck
/* Semantic colour system (REVISION.md §1, §2).

   Hue carries identity, value carries state, treatment carries evidence level.
   - Lineage decides hue: mesenchymal cells share one blue family (MSC palest → osteoblast most saturated →
     osteocyte darkest); osteoclasts are haematopoietic and stay rust.
   - Dead is desaturated whatever the lineage, with a 10% cast of the parent hue (apoOf).
   - Signals are coloured by function, not by molecule. Phosphate violet-magenta is reserved for phosphate.
   - Fragments inherit the colour of the enzyme that cut them: CTX-I crimson from cathepsin K, ICTP bronze from MMPs.

   Nothing here edits an existing palette. Every colour is a new NP.<name>V2 key, and existing tiles are
   re-registered as '<key>-v2' copies that swap the V2 palettes in only while they draw (withPalettes). */
import './bone.js';
import './molecules.js';
import { E, NP, registerSpecimen, renderOriginal, specimenHeight } from './atlas.js';
import { th, thLine, dom } from './kit.js';

const { TAU, mix, rgb, lab } = E;

/* ---------------------------------------------------------------- builders */
function hsl(h, s, l) {
  h = (((h % 360) + 360) % 360) / 360;
  const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map(v => Math.round(v * 255));
}
/** A cell / molecule palette from hue (identity), chroma and value (state). */
export function fam(h, s, l) {
  return { rim: hsl(h, s, l), body: hsl(h, Math.min(.75, s * 1.5), l + (1 - l) * .68), fil: hsl(h, Math.min(.8, s * 1.5), l + (1 - l) * .9), nuc: hsl(h, s, l * .86) };
}
const copy = p => ({ rim: [...p.rim], body: [...p.body], fil: [...p.fil], nuc: [...p.nuc] });
/** Rule 3: the apoptotic treatment, keeping a 10% cast of the parent lineage's hue. */
export const apoOf = (parent, k = .1) => ({ rim: mix(NP.apoptotic.rim, parent.rim, k), body: mix(NP.apoptotic.body, parent.body, k), fil: mix(NP.apoptotic.fil, parent.fil, k), nuc: mix(NP.apoptotic.nuc, parent.nuc, k) });

/* ---------------------------------------------------------------- the palettes */
Object.assign(NP, {
  /* mesenchymal lineage: one blue family, value darkens with maturity, chroma peaks in the active osteoblast */
  mscV2: fam(212, .16, .60),
  liningV2: fam(208, .08, .62),
  osteoblastV2: fam(214, .48, .46),
  osteocyteV2: fam(197, .34, .30),
  reversalV2: copy(NP.reversal),
  adipocyteV2: fam(42, .24, .56),
  /* haematopoietic lineage: rust, kept, a touch deeper for contrast with the warm signals */
  osteoclastV2: { rim: [172, 90, 68], body: [242, 196, 172], fil: [255, 241, 230], nuc: [160, 98, 78] },
  osteoclastPreV2: fam(16, .30, .64),

  /* matrix: mineral recedes (cool, grey, low chroma); osteoid is clearly warmer and lighter */
  matrixV2: { rim: [146, 148, 144], body: [224, 225, 221], fil: [202, 203, 198], nuc: [104, 106, 102] },
  osteoidV2: { rim: [204, 156, 78], body: [254, 238, 202], fil: [232, 200, 138], nuc: [182, 134, 58] },

  /* phosphate: reserved violet-magenta, used for nothing else */
  piV2: fam(300, .52, .44),
  napiV2: fam(290, .40, .48),          // SLC34 (NaPi-IIa/b/c)
  pitV2: fam(312, .58, .36),           // SLC20 (PiT1/2): same family, deeper, so the two transporter families differ
  /* calcium: cool green, kept */
  caV2: copy(NP.ca),
  casrV2: fam(142, .28, .42),
  /* mechanical: ice cyan, pushed away from the osteocyte's teal-slate by value and chroma */
  fluidV2: fam(188, .62, .50),
  piezoV2: fam(190, .42, .46),
  itgaV2: fam(186, .36, .40),
  itgbV2: fam(196, .22, .54),
  cx43V2: fam(184, .20, .46),
  /* pro-resorptive: amber → red ramp, all more saturated than the osteoclast's dull rust */
  fgf23V2: fam(46, .70, .46),
  sostV2: fam(38, .72, .46),
  dkk1V2: fam(32, .62, .56),
  ranklV2: fam(24, .80, .50),
  pthV2: fam(356, .58, .48),
  /* their receptors: the ligand's hue at low chroma */
  rankV2: fam(14, .22, .58),
  pth1rV2: fam(356, .16, .56),
  fgfrV2: fam(46, .18, .54),
  klothoV2: fam(34, .16, .48),
  /* protective / anabolic: green-teal, kept clear of calcium green (hue 140) */
  opgV2: fam(166, .34, .42),
  wntV2: fam(172, .46, .38),
  bcatV2: fam(160, .36, .48),
  e2V2: fam(176, .54, .36),
  erV2: fam(170, .26, .50),
  h12V2: fam(170, .42, .32),
  coactV2: fam(154, .22, .50),
  lrpV2: fam(164, .24, .52),
  fzdV2: fam(168, .30, .46),
  bcl2V2: fam(162, .30, .44),
  /* apoptosis machinery: violet-grey, the colour family of the dead-cell treatment */
  casp3V2: fam(266, .20, .42),
  baxV2: fam(276, .16, .50),
  cytcV2: fam(256, .20, .38),
  /* neutrals for things that carry no argument */
  mitoV2: fam(28, .12, .56),
  talinV2: fam(40, .08, .50),
  gsV2: fam(52, .10, .50),
  naV2: fam(48, .08, .56),
  signalV2: fam(50, .24, .54),
  /* enzymes, and the fragments that inherit their colour */
  catkV2: fam(344, .68, .32),          // deep crimson, the acid route
  mmpV2: fam(30, .44, .36),            // bronze, metalloproteinases
  trapV2: fam(318, .18, .42),          // neutral plum, shared by both routes so it belongs to neither
  zincV2: { rim: [150, 170, 188], body: [226, 238, 248], fil: [255, 255, 255], nuc: [120, 140, 160] },
});
NP.ctxV2 = NP.catkV2;                  // the same object: edit cathepsin K and CTX-I follows
NP.ictpV2 = NP.mmpV2;
NP.osteocyteApoV2 = apoOf(NP.osteocyteV2);
NP.osteoclastApoV2 = apoOf(NP.osteoclastV2);

/** Evidence level is a treatment, not a colour: one rule for cells and molecules alike. */
export const EVIDENCE = {
  measured: { fill: 1, dash: null, label: 'MEASURED HERE' },
  literature: { fill: .7, dash: null, label: 'LITERATURE' },
  hypothesis: { fill: .35, dash: [3, 2.4], label: 'HYPOTHESIS' },
};
/** Paint a shape at an evidence level: fill(…) fills the current path, path() builds it. */
export function evidencePaint(c, level, pal, path) {
  const E_ = EVIDENCE[level] || EVIDENCE.measured;
  c.save();
  path(); c.fillStyle = rgb(th(pal.body, .5), E_.fill); c.fill();
  path(); c.setLineDash(E_.dash || []); c.lineWidth = 1.1; c.strokeStyle = rgb(thLine(pal.rim)); c.stroke();
  c.restore();
}

/* ---------------------------------------------------------------- swapping into existing tiles */
/** Existing palette → its V2 replacement. Aliases (BP.osteocyte is TP.astro) are swapped field by field, so only list what a tile uses. */
export const V2_REMAP = {
  'NP.osteocyte': 'NP.osteocyteV2', 'BP.osteocyte': 'NP.osteocyteV2',
  'NP.osteoblast': 'NP.osteoblastV2', 'BP.osteoblast': 'NP.osteoblastV2',
  'BP.msc': 'NP.mscV2', 'BP.adipocyte': 'NP.adipocyteV2',
  'NP.osteoclast': 'NP.osteoclastV2', 'BP.osteoclast': 'NP.osteoclastV2',
  'NP.apoptotic': 'NP.osteocyteApoV2',
  'NP.matrix': 'NP.matrixV2', 'NP.osteoid': 'NP.osteoidV2',
  'NP.pi': 'NP.piV2', 'NP.napi': 'NP.napiV2', 'NP.na': 'NP.naV2', 'NP.ca': 'NP.caV2',
  'NP.casr': 'NP.casrV2', 'BP.casr': 'NP.casrV2',
  'NP.fluid': 'NP.fluidV2', 'BP.piezo': 'NP.piezoV2',
  'NP.itga': 'NP.itgaV2', 'NP.itgb': 'NP.itgbV2', 'NP.talin': 'NP.talinV2', 'BP.cx43': 'NP.cx43V2',
  'NP.fgf23': 'NP.fgf23V2', 'NP.klotho': 'NP.klothoV2', 'NP.fgfr': 'NP.fgfrV2',
  'NP.rankl': 'NP.ranklV2', 'BP.rankl': 'NP.ranklV2', 'NP.rank': 'NP.rankV2',
  'NP.opg': 'NP.opgV2', 'BP.opg': 'NP.opgV2',
  'NP.pth': 'NP.pthV2', 'NP.pth1r': 'NP.pth1rV2', 'NP.gs': 'NP.gsV2',
  'NP.dkk1': 'NP.dkk1V2', 'BP.sost': 'NP.sostV2',
  'NP.wnt': 'NP.wntV2', 'NP.bcat': 'NP.bcatV2', 'NP.fzd': 'NP.fzdV2', 'BP.lrp': 'NP.lrpV2',
  'NP.e2': 'NP.e2V2', 'NP.er': 'NP.erV2', 'NP.h12': 'NP.h12V2', 'NP.coact': 'NP.coactV2',
  'NP.casp3': 'NP.casp3V2', 'NP.bax': 'NP.baxV2', 'NP.cytc': 'NP.cytcV2', 'NP.mito': 'NP.mitoV2', 'NP.bcl2': 'NP.bcl2V2',
  'NP.signal': 'NP.signalV2',
};
const ROOTS = { NP, BP: E.BP, TP: E.TP, CORAL: E.CORAL, GRAYP: E.GRAYP };
const palAt = path => { const [r, k] = path.split('.'); return k ? ROOTS[r]?.[k] : ROOTS[r]; };
const FIELDS = ['rim', 'body', 'fil', 'nuc'];
/**
 * Run fn with existing palettes temporarily holding their V2 colours. Entries are a path from V2_REMAP or
 * a [from, to] pair. Colour edits made in the gallery land on the V2 keys first, so they carry through.
 */
export function withPalettes(entries, fn) {
  const undo = [];
  for (const e of entries) {
    const [from, to] = Array.isArray(e) ? e : [e, V2_REMAP[e]];
    const dst = palAt(from), src = to && palAt(to);
    if (!dst || !src) continue;
    for (const f of FIELDS) if (src[f]) { undo.push([dst, f, dst[f]]); dst[f] = src[f]; }
  }
  try { fn(); } finally { for (let i = undo.length - 1; i >= 0; i--) undo[i][0][undo[i][1]] = undo[i][2]; }
}
/** Register '<key>-v2': the original drawing, recoloured. */
export function recolour(key, entries) {
  registerSpecimen(`${key}-v2`, specimenHeight(key), (c, t, h) => withPalettes(entries, () => renderOriginal(c, key, t, h)));
}

recolour('osteoblast', ['NP.osteoblast', 'NP.osteoid', 'NP.matrix']);
recolour('matrix-vesicle', ['BP.lrp', 'NP.osteoid', 'NP.signal', 'NP.matrix']);
recolour('msc', ['BP.msc', 'BP.osteoblast']);
recolour('adipocyte', ['BP.adipocyte']);
recolour('casr', ['NP.ca', 'NP.casr', 'NP.e2', 'NP.gs', 'NP.rank', 'NP.rankl']);
recolour('lrp56', ['BP.lrp', 'NP.signal']);
recolour('lrp56-wnt', ['BP.lrp', 'NP.bcat', 'NP.dkk1', 'NP.fzd', 'NP.itga', 'NP.itgb', 'NP.signal', 'NP.talin', 'NP.wnt']);
recolour('integrin', ['NP.itga', 'NP.itgb', 'NP.signal', 'NP.talin']);
recolour('integrin-states', ['NP.itga', 'NP.itgb', 'NP.signal', 'NP.talin']);
recolour('cx43', ['BP.cx43', 'NP.ca']);
recolour('klotho-fgfr1', ['NP.e2', 'NP.fgf23', 'NP.fgfr', 'NP.klotho', 'NP.na', 'NP.pi', 'NP.signal']);
recolour('pth1r', ['NP.ca', 'NP.casr', 'NP.e2', 'NP.gs', 'NP.pth', 'NP.pth1r']);
recolour('napi2ac', ['NP.napi', 'NP.pi', 'NP.na']);
recolour('napi2b', ['NP.napi', 'NP.pi', 'NP.na']);
recolour('casp3', ['NP.bax', 'NP.bcl2', 'NP.casp3', 'NP.cytc', 'NP.gs', 'NP.matrix', 'NP.mito']);
recolour('wnt', ['NP.wnt', 'NP.bcat']);
recolour('dkk1', ['NP.dkk1']);
recolour('er-alpha', ['NP.er', 'NP.h12', 'NP.e2', 'NP.coact']);
recolour('fgf23', ['NP.e2', 'NP.fgf23', 'NP.pi', 'NP.signal']);
recolour('pi', ['NP.pi']);
recolour('opg', ['NP.bax', 'NP.mito', 'NP.opg', 'NP.rank', 'NP.rankl', 'NP.signal', 'BP.opg', 'BP.rankl']);
recolour('rankl', ['NP.gs', 'NP.opg', 'NP.rank', 'NP.rankl', 'NP.signal', 'BP.rankl']);
recolour('sclerostin', ['BP.sost']);
recolour('catk', [['CORAL', 'NP.catkV2']]);

/* ---------------------------------------------------------------- the legend */
const ROWS = [
  ['MESENCHYMAL', [['mscV2', 'MSC'], ['liningV2', 'Lining'], ['osteoblastV2', 'Osteoblast'], ['osteocyteV2', 'Osteocyte'], ['reversalV2', 'Reversal'], ['adipocyteV2', 'Adipocyte']]],
  ['HAEMATOPOIETIC', [['osteoclastPreV2', 'Precursor'], ['osteoclastV2', 'Osteoclast'], ['osteocyteApoV2', 'Dead ocy'], ['osteoclastApoV2', 'Dead ocl']]],
  ['MATRIX', [['matrixV2', 'Mineral'], ['osteoidV2', 'Osteoid']]],
  ['PHOSPHATE', [['piV2', 'Pi'], ['napiV2', 'NaPi'], ['pitV2', 'PiT1/2']]],
  ['CALCIUM · MECH', [['caV2', 'Ca²⁺'], ['casrV2', 'CaSR'], ['fluidV2', 'Shear'], ['piezoV2', 'Piezo1']]],
  ['PRO-RESORPTIVE', [['fgf23V2', 'FGF23'], ['sostV2', 'SOST'], ['dkk1V2', 'Dkk1'], ['ranklV2', 'RANKL'], ['pthV2', 'PTH']]],
  ['PROTECTIVE', [['opgV2', 'OPG'], ['wntV2', 'Wnt'], ['bcatV2', 'β-cat'], ['e2V2', 'E2'], ['bcl2V2', 'Bcl-2']]],
  ['APOPTOSIS', [['casp3V2', 'Casp-3'], ['baxV2', 'Bax'], ['cytcV2', 'Cyt c']]],
  ['ENZYME → FRAGMENT', [['catkV2', 'Cat K'], ['ctxV2', 'CTX-I'], ['mmpV2', 'MMP'], ['ictpV2', 'ICTP'], ['trapV2', 'TRAP']]],
];
registerSpecimen('palette-v2', 232, c => {
  const L = (s, x, y, o = {}) => lab(c, s, x, y, { mono: true, size: 5, always: true, ...o });
  ROWS.forEach(([fam_, items], r) => {
    const y = 12 + r * 21.5;
    L(fam_, 6, y + 1, { align: 'left', size: 4.8 });
    items.forEach(([k, name], i) => {
      const x = 86 + i * 31, P = NP[k];
      dom(c, x, y, 7, 5.2, 0, P, .9);
      c.beginPath(); c.arc(x + 3.4, y - 1, 1.6, 0, TAU); c.fillStyle = rgb(P.nuc); c.fill();
      if (k === 'mmpV2' || k === 'ictpV2') { c.beginPath(); c.arc(x - 2.6, y - 1, 1.1, 0, TAU); c.fillStyle = rgb(NP.zincV2.fil); c.fill(); }
      L(name, x, y + 9.5, { size: 4.4 });
    });
  });
  // evidence treatments
  const y = 12 + ROWS.length * 21.5;
  L('EVIDENCE', 6, y + 1, { align: 'left', size: 4.8 });
  ['measured', 'literature', 'hypothesis'].forEach((lv, i) => {
    const x = 104 + i * 54;
    evidencePaint(c, lv, NP.osteocyteV2, () => { c.beginPath(); c.ellipse(x, y, 10, 5.5, 0, 0, TAU); });
    L(EVIDENCE[lv].label, x, y + 10, { size: 4.2 });
  });
});

/* ---------------------------------------------------------------- evidence classification */
/**
 * What each claim in the model rests on. Figures look a claim up (evidenceOf) and draw its elements with that
 * treatment, so the measured and the hypothesised are separable from across the room, not by a judgement per figure.
 * `caveat` adds a line to the legend.
 */
export const CLAIMS = {
  /* measured in this study: full opacity, solid outline */
  'connectivity-loss': ['measured', 'Connectivity loss at matched BV/TV'],
  'thicker-survivors': ['measured', 'Thicker survivors at matched density'],
  'depth-gradient': ['measured', 'Depth gradient', 'depth'],
  'cortex-spared': ['measured', 'Trabecular-only, cortex spared'],
  'flat-markers': ['measured', 'Flat CTX-I, P1NP and ALP'],
  'opn-kidney': ['measured', 'OPN as a kidney readout'],
  'male-pth-fgf23': ['measured', 'Male PTH +22%, FGF23 +37%'],
  'tmd-unchanged': ['measured', 'TMD and mineralisation unchanged'],
  'soleus-atrophy': ['measured', 'Equal soleus atrophy'],
  'intake-dose': ['measured', 'Intake dose relationship', 'cohort'],
  /* literature, not measured here: 70% fill, solid outline */
  'ocy-apoptosis-unloading': ['literature', 'Osteocyte apoptosis under unloading'],
  'ocy-death-selects-site': ['literature', 'Osteocyte death selects the resorption site'],
  'strain-sensing': ['literature', 'Piezo1, Cx43, integrin strain sensing'],
  'sost-rankl-regulation': ['literature', 'SOST and RANKL regulation'],
  'enzyme-fragments': ['literature', 'Cathepsin K → CTX, MMPs → ICTP'],
  'pth-mmp13': ['literature', 'PTH drives MMP-13'],
  'tgfb-yap-mmp': ['literature', 'TGF-β → YAP/TAZ → osteocyte MMPs'],
  'plr-pth1r': ['literature', 'Perilacunar remodelling is PTH1R-dependent'],
  'ovx-plr-micropetrosis': ['literature', 'PLR and micropetrosis in OVX cortex'],
  'pi-ocy-apoptosis-sost': ['literature', 'Phosphate raises osteocyte apoptosis and SOST'],
  'perforation-irreversible': ['literature', 'Perforation is irreversible'],
  'parfitt-removal': ['literature', 'Parfitt removal mode'],
  /* hypothesis, specific to this model: 35% fill, dashed outline */
  'hits-converge': ['hypothesis', 'Both hits converge on the same osteocytes'],
  'count-threshold': ['hypothesis', 'Thin struts cross a survival threshold by absolute cell count'],
  'route-b-here': ['hypothesis', 'Route B operates in these animals'],
  'pit-entry': ['hypothesis', 'Phosphate reaches the osteocyte through PiT'],
  'which-route': ['hypothesis', 'Which route executes the cut'],
  'thin-strut-targeting': ['hypothesis', 'Thin-strut targeting itself'],
  'stub-cleanup': ['hypothesis', 'Stub cleanup'],
};
export const CAVEATS = {
  cohort: 'Intake dose is measured but confounded with cohort.',
  depth: 'Anything resting on depth standing in for bone age inherits that assumption until the alizarin line tests it.',
};
export const evidenceOf = id => CLAIMS[id]?.[0] ?? 'measured';

registerSpecimen('evidence-v2', 330, c => {
  const L = (s, x, y, o = {}) => lab(c, s, x, y, { mono: true, size: 4.5, always: true, align: 'left', ...o });
  let y = 10;
  for (const lv of ['measured', 'literature', 'hypothesis']) {
    const E_ = EVIDENCE[lv];
    evidencePaint(c, lv, NP.osteocyteV2, () => { c.beginPath(); c.ellipse(16, y + 2, 9, 5, 0, 0, TAU); });
    L(E_.label + (lv === 'measured' ? ' · 100% · SOLID' : lv === 'literature' ? ' · 70% · SOLID' : ' · 35% · DASHED'), 32, y + 2, { size: 5.2 });
    y += 11;
    for (const [id, [level, text, cav]] of Object.entries(CLAIMS)) if (level === lv) { L('· ' + text + (cav ? ' *' : ''), 32, y); y += 7.2; }
    y += 5;
  }
  L('* ' + CAVEATS.cohort, 8, y, { size: 4.3 }); y += 7;
  const w = CAVEATS.depth.split(' '), half = Math.ceil(w.length / 2);
  L('* ' + w.slice(0, half).join(' '), 8, y, { size: 4.3 }); L('  ' + w.slice(half).join(' '), 8, y + 6, { size: 4.3 });
});
