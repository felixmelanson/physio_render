import { drawSpecimen, getColor as atlasColor } from "../engines/atlas.js";
import "../engines/bone.js";
import "../engines/molecules.js";
import { V2_REMAP } from "../engines/semantic.js";
import "../engines/bone-v2.js";
import "../engines/strut.js";
import { drawProp, getColor as labColor } from "../engines/lab.js";
import { drawPiezo, PIEZO_DEFAULTS } from "../engines/piezo.js";
import type { DrawFn } from "../components/LiveCanvas";
import { getItemSettings, hasShift, hexToRgb, isDark, rgbToHex, shiftColor, type ItemSettings, type StyleKey } from "../state";

export interface ColorSlot {
  /** Path into the engine's palettes, e.g. "TP.astro.rim". */
  path: string;
  label: string;
  /** Slots sharing a group are shown together under its name. */
  group: string;
}

export interface LiveItem {
  id: string;
  name: string;
  draw: DrawFn;
  /** Shows a render-style picker. */
  styles: boolean;
  /** The styles offered, when not all of them apply (items without procedural membranes get Atlas and Clay only). */
  styleIds?: StyleKey[];
  /** Offers the evidence treatment (measured / literature / hypothesis). */
  evidence?: boolean;
  slots: ColorSlot[];
  /** The engine's own colour for a slot, in the current theme. */
  defaultColor: (path: string) => string | null;
}

export interface LiveSection {
  id: string;
  title: string;
  items: LiveItem[];
}

/* ---- colour slots ---- */

const PAL_FIELDS: [string, string][] = [
  ["rim", "Outline"],
  ["body", "Fill"],
  ["fil", "Highlight"],
  ["nuc", "Nucleus"],
];
/** The four colours of a cell palette (outline, fill, highlight, nucleus). */
const pal = (root: string, group: string): ColorSlot[] => PAL_FIELDS.map(([k, label]) => ({ path: `${root}.${k}`, label, group }));
const one = (path: string, label: string, group = "Colours"): ColorSlot[] => [{ path, label, group }];

/**
 * The colours to draw with: each slot's saved override (or the engine default), then the item-wide
 * hue / saturation / lightness shift applied to all of them together. rgb arrays, as the engines want.
 */
function effectiveColors(s: ItemSettings, slots: ColorSlot[], def: (path: string) => string | null) {
  const out: Record<string, number[]> = {};
  if (s.colors) for (const [k, v] of Object.entries(s.colors)) out[k] = hexToRgb(v);
  if (hasShift(s.shift)) for (const slot of slots) {
    const base = s.colors?.[slot.path] ?? def(slot.path);
    if (base) out[slot.path] = shiftColor(hexToRgb(base), s.shift!);
  }
  return Object.keys(out).length ? out : undefined;
}
const hexOverrides = (o?: Record<string, number[]>) => (o ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, rgbToHex(v)])) : undefined);

const BONE: ColorSlot[] = [
  { path: "NP.matrix.body", label: "Mineral", group: "Bone" },
  { path: "NP.matrix.fil", label: "Lamellae", group: "Bone" },
  { path: "NP.matrix.rim", label: "Surface", group: "Bone" },
  { path: "NP.osteoid.body", label: "Osteoid", group: "Bone" },
];
const IONS: ColorSlot[] = [
  { path: "NP.pi.body", label: "Pi", group: "Ions" },
  { path: "NP.ca.body", label: "Ca²⁺", group: "Ions" },
  { path: "NP.na.body", label: "Na⁺", group: "Ions" },
];
const LIPID: ColorSlot[] = [
  { path: "NP.lipid.body", label: "Head groups", group: "Membrane" },
  { path: "NP.lipid.rim", label: "Outline", group: "Membrane" },
];

const OCY_SLOTS: ColorSlot[] = [
  ...pal("NP.osteocyte", "Osteocyte"),
  ...pal("NP.apoptotic", "Apoptotic"),
  { path: "NP.fluid.rim", label: "Shear arrows", group: "Fluid / signals" },
  { path: "NP.fluid.body", label: "LCN fluid", group: "Fluid / signals" },
  { path: "NP.ca.rim", label: "Ca²⁺ wave", group: "Fluid / signals" },
];
const FLUID: ColorSlot[] = [{ path: "NP.fluid.rim", label: "Fluid shear", group: "Signals" }];

const OCY_V2_SLOTS: ColorSlot[] = [
  ...pal("NP.osteocyteV2", "Osteocyte"),
  ...pal("NP.osteocyteApoV2", "Apoptotic"),
  { path: "NP.fluidV2.body", label: "LCN fluid", group: "Fluid / signals" },
  { path: "NP.fluidV2.rim", label: "Flow band", group: "Fluid / signals" },
  { path: "NP.ca.rim", label: "Ca²⁺ wave", group: "Fluid / signals" },
  { path: "NP.sostV2.body", label: "Sclerostin", group: "Fluid / signals" },
  { path: "NP.ranklV2.body", label: "RANKL", group: "Fluid / signals" },
  { path: "NP.matrixV2.body", label: "Mineral", group: "Bone" },
  { path: "NP.matrixV2.fil", label: "Lamellae", group: "Bone" },
  { path: "NP.matrixV2.rim", label: "Lacunar edge", group: "Bone" },
  { path: "NP.osteoidV2.body", label: "Demineralised halo", group: "Bone" },
  ...pal("NP.catkV2", "Cathepsin K"),
  ...pal("NP.mmpV2", "MMP"),
];
const BONE_V2: ColorSlot[] = [
  { path: "NP.matrixV2.body", label: "Mineral", group: "Bone" },
  { path: "NP.matrixV2.fil", label: "Lamellae", group: "Bone" },
  { path: "NP.matrixV2.rim", label: "Surface", group: "Bone" },
  { path: "NP.osteoidV2.body", label: "Osteoid", group: "Bone" },
];
const RESORB_V2: ColorSlot[] = [
  ...pal("NP.osteoclastV2", "Osteoclast"),
  ...pal("NP.catkV2", "Cathepsin K → CTX-I"),
  ...pal("NP.mmpV2", "MMP → ICTP"),
  ...one("NP.zincV2.fil", "Zinc", "MMP → ICTP"),
  ...one("NP.piV2.body", "Pi", "Ions"),
  ...BONE_V2,
];

/* ---- item factories ---- */

const atlasDefault = (path: string) => {
  const c = atlasColor(path);
  return c ? rgbToHex(c) : null;
};
const labDefault = (path: string) => {
  const c = labColor(path, isDark());
  return c ? rgbToHex(c) : null;
};
const piezoDefault = (path: string) => (PIEZO_DEFAULTS as Record<string, string>)[path] ?? null;

/** Clay works on any drawing (see engines/clay.js); the other looks need procedural membranes. */
const DEFAULT_STYLE: StyleKey = "clay";
const CLAY_ONLY: StyleKey[] = ["atlas", "clay"];
const allowed = (style: StyleKey | undefined, ids?: StyleKey[]) =>
  style && (!ids || ids.includes(style)) ? style : ids?.includes(DEFAULT_STYLE) ? DEFAULT_STYLE : "atlas";

const spec = (id: string, name: string, slots: ColorSlot[] = [], membranes = false): LiveItem => {
  const styleIds = membranes ? undefined : CLAY_ONLY;
  return {
    id,
    name,
    styles: true,
    styleIds,
    evidence: true,
    slots,
    defaultColor: atlasDefault,
    draw: (c, t, w, h) => {
      const s = getItemSettings(id);
      drawSpecimen(c, id, t, w, h, { style: allowed(s.style, styleIds), evidence: s.evidence, dark: isDark(), colors: effectiveColors(s, slots, atlasDefault) });
    },
  };
};
/** A cell built from the procedural membrane engine: render styles apply. */
const cell = (id: string, name: string, slots: ColorSlot[]) => spec(id, name, slots, true);

const prop = (id: string, name: string, slots: ColorSlot[] = []): LiveItem => ({
  id,
  name,
  styles: true,
  styleIds: CLAY_ONLY,
  slots,
  defaultColor: labDefault,
  draw: (c, t, w, h) => {
    const s = getItemSettings(id);
    drawProp(c, id, t, w, h, { style: allowed(s.style, CLAY_ONLY), dark: isDark(), colors: effectiveColors(s, slots, labDefault) });
  },
});

/**
 * The REVISION.md v2 of an item: '<id>-v2', drawn by the engine with the semantic palettes swapped in.
 * Its colour slots point at the V2 palettes, so edits there carry through.
 */
const v2 = (orig: LiveItem, extra: ColorSlot[] = []): LiveItem => {
  const slots = orig.slots.map((s) => {
    const root = s.path.split(".").slice(0, 2).join(".");
    const to = (V2_REMAP as Record<string, string>)[root];
    return to ? { ...s, path: to + s.path.slice(root.length) } : s;
  });
  return spec(`${orig.id}-v2`, `${orig.name} (v2)`, [...slots, ...extra], !orig.styleIds);
};
/** An item followed directly by its v2, so the gallery compares them in one scroll. */
const withV2 = (orig: LiveItem, extra: ColorSlot[] = []): LiveItem[] => [orig, v2(orig, extra)];

const PIEZO_SLOTS: ColorSlot[] = [
  { path: "blade1", label: "Blade 1", group: "Blades" },
  { path: "blade2", label: "Blade 2", group: "Blades" },
  { path: "blade3", label: "Blade 3", group: "Blades" },
  { path: "ink", label: "Ink outline", group: "Blades" },
];

const piezo = (shape: string, variant: string): LiveItem => {
  const id = `piezo1-${variant.toLowerCase()}`;
  return {
    id,
    name: `Piezo1 (variant ${variant})`,
    styles: true,
    slots: PIEZO_SLOTS,
    defaultColor: piezoDefault,
    draw: (c, t, w, h) => {
      const s = getItemSettings(id);
      drawPiezo(c, shape, t, w, h, { style: s.style ?? DEFAULT_STYLE, dark: isDark(), colors: hexOverrides(effectiveColors(s, PIEZO_SLOTS, piezoDefault)) });
    },
  };
};

/* ------------------------------------------------------------------ */

/** Page 3: animated cells and molecules (cell atlas engine + Piezo1). */
export const ANIMATED: LiveSection[] = [
  {
    id: "neural-cells",
    title: "Neural cells",
    items: [
      cell("astro", "Astrocytes", [...pal("TP.astro", "Astrocyte"), ...pal("CORAL", "Reactive")]),
      cell("micro", "Microglia", [...pal("TP.micro", "Microglia"), ...pal("CORAL", "Reactive")]),
      cell("neuron", "Neurons", pal("TP.neuron", "Neuron")),
      cell("oligo", "Oligodendrocytes", pal("TP.oligo", "Oligodendrocyte")),
      cell("gfap", "GFAP filaments", [...pal("TP.astro", "Astrocyte"), ...pal("CORAL", "Reactive")]),
      cell("synapse", "Synaptic puncta", pal("TP.neuron", "Neuron")),
      cell("caspase", "Caspase-2 / -3", [...pal("TP.neuron", "Neuron"), ...pal("GRAYP", "Dying")]),
    ],
  },
  {
    id: "bone-cells",
    title: "Bone & marrow cells",
    items: [
      cell("osteocyte", "Osteocyte (astrocyte-derived, not anatomical)", OCY_SLOTS),
      cell("osteocyte-b", "Osteocytes (B)", OCY_SLOTS),
      cell("osteocyte-v2", "Osteocytes (v2)", OCY_V2_SLOTS),
      cell("osteocyte-death", "Osteocyte death · viable neighbours (v2)", OCY_V2_SLOTS),
      cell("osteocyte-network", "Osteocyte network · fluid shear", [...pal("NP.osteocyte", "Osteocyte"), ...FLUID, ...BONE]),
      cell("osteocyte-network-v2", "Osteocyte network (v2)", [...pal("NP.osteocyteV2", "Osteocyte"), ...one("NP.fluidV2.body", "LCN fluid", "Fluid"), ...one("NP.ca.rim", "Ca²⁺ wave", "Fluid"), ...BONE_V2]),
      cell("osteocyte-network-thin", "Osteocyte network in a 40 µm strut (v2)", [...pal("NP.osteocyteV2", "Osteocyte"), ...one("NP.fluidV2.body", "LCN fluid", "Fluid"), ...one("NP.ca.rim", "Ca²⁺ wave", "Fluid"), ...BONE_V2]),
      cell("trabecula", "Trabecula · 120 µm and 30 µm", [...pal("NP.osteocyteV2", "Osteocyte"), ...BONE_V2]),
      cell("trabecula-states", "Trabecula · intact, cavity, perforated, stub", [...pal("NP.osteocyteV2", "Osteocyte"), ...BONE_V2]),
      cell("strut-death", "Same deaths · thick vs thin strut", [...pal("NP.osteocyteV2", "Osteocyte"), ...pal("NP.osteocyteApoV2", "Apoptotic"), ...one("NP.ranklV2.body", "RANKL", "Signals"), ...BONE_V2]),
      spec("label-strut", "Calcein and alizarin · apposition vs selection"),
      ...withV2(cell("osteoblast", "Osteoblast", [...pal("NP.osteoblast", "Osteoblast"), ...pal("NP.osteoid", "Procollagen / vesicles")])),
      ...withV2(cell("osteoclast", "Osteoclast", [...pal("NP.osteoclast", "Osteoclast"), ...pal("NP.rank", "RANK"), ...pal("NP.rankl", "RANKL")]), pal("NP.catkV2", "Cathepsin K")),
      cell("osteoclast-scene", "Osteoclast resorbing", [...pal("NP.osteoclast", "Osteoclast"), ...BONE]),
      cell("osteoclast-scene-v2", "Osteoclast resorbing (v2)", RESORB_V2),
      cell("osteoclast-b", "Osteoclast close-up", [...pal("NP.osteoclast", "Osteoclast"), ...BONE]),
      cell("osteoclast-b-v2", "Osteoclast close-up (v2)", RESORB_V2),
      cell("reversal-cell", "Reversal cell", [...pal("NP.reversal", "Reversal cell"), ...one("NP.matrix.rim", "Collagen", "Reversal cell")]),
      ...withV2(cell("msc", "Mesenchymal stem cells", pal("BP.msc", "MSC"))),
      ...withV2(cell("adipocyte", "Marrow adipocytes", pal("BP.adipocyte", "Adipocyte"))),
    ],
  },
  {
    id: "membrane",
    title: "Receptors, channels & transporters",
    items: [
      ...withV2(cell("casr", "CaSR", [...pal("NP.casr", "CaSR"), ...pal("NP.ca", "Ca²⁺"), ...pal("NP.gs", "Gq")])),
      ...withV2(cell("lrp56", "LRP5 / 6", pal("BP.lrp", "LRP5/6"))),
      ...withV2(cell("lrp56-wnt", "LRP6 · Wnt vs Dkk1", [...pal("BP.lrp", "LRP6"), ...pal("NP.fzd", "Frizzled"), ...pal("NP.wnt", "Wnt"), ...pal("NP.dkk1", "Dkk1")])),
      ...withV2(cell("integrin", "Integrin activation", [...pal("NP.itga", "α subunit"), ...pal("NP.itgb", "β subunit"), ...pal("NP.talin", "Talin")])),
      ...withV2(cell("integrin-states", "Integrin · 3 states", [...pal("NP.itga", "α subunit"), ...pal("NP.itgb", "β subunit")])),
      ...withV2(cell("cx43", "Cx43 gap junction", [...pal("BP.cx43", "Connexin 43"), ...LIPID])),
      ...withV2(cell("klotho-fgfr1", "Klotho / FGFR1", [...pal("NP.klotho", "αKlotho"), ...pal("NP.fgfr", "FGFR1c"), ...pal("NP.fgf23", "FGF23")])),
      ...withV2(cell("pth1r", "PTH / PTH1R", [...pal("NP.pth", "PTH"), ...pal("NP.pth1r", "PTH1R"), ...pal("NP.gs", "Gs")])),
      ...withV2(cell("napi2ac", "NaPi-IIa / IIc", [...pal("NP.napi", "Transporter"), ...IONS, ...LIPID])),
      ...withV2(cell("napi2b", "Dietary Pi → NaPi-IIb", [...pal("NP.napi", "Transporter"), ...pal("NP.villus", "Microvilli"), ...IONS])),
    ],
  },
  {
    id: "colour-system",
    title: "Colour system (v2)",
    items: [spec("palette-v2", "Semantic palette"), spec("evidence-v2", "Evidence classification")],
  },
  {
    id: "channels",
    title: "Piezo1",
    items: [piezo("specimen", "A"), piezo("softened", "B"), piezo("swept", "C"), piezo("hybrid", "D")],
  },
  {
    id: "molecules",
    title: "Signals & molecules",
    items: [
      spec("il1", "IL-1α", one("PC.il1", "IL-1α")),
      spec("tnf", "TNF", one("PC.tnf", "TNF")),
      spec("c1q", "C1q", one("PC.c1q", "C1q")),
      spec("lps", "LPS", one("PC.lps", "LPS")),
      spec("other", "Other secreted", one("PC.other", "Secreted")),
      ...withV2(cell("casp3", "Caspase-3 · Bax / Bcl-2", [...pal("NP.casp3", "Caspase-3"), ...pal("NP.bax", "Bax"), ...pal("NP.bcl2", "Bcl-2"), ...pal("NP.mito", "Mitochondrion"), ...pal("NP.cytc", "Cytochrome c")])),
      ...withV2(cell("wnt", "Wnt / β-catenin", [...pal("NP.wnt", "Wnt"), ...pal("NP.bcat", "β-catenin")])),
      ...withV2(cell("dkk1", "Dkk1", pal("NP.dkk1", "Dkk1"))),
      ...withV2(cell("er-alpha", "Estradiol / ERα", [...pal("NP.er", "ERα"), ...pal("NP.h12", "Helix 12"), ...pal("NP.e2", "Estradiol"), ...pal("NP.coact", "Coactivator")])),
      ...withV2(cell("fgf23", "FGF23", pal("NP.fgf23", "FGF23"))),
      ...withV2(cell("pi", "Phosphate (Pi)", pal("NP.pi", "Phosphate"))),
      cell("ca", "Calcium (Ca²⁺)", pal("NP.ca", "Calcium")),
      ...withV2(cell("matrix-vesicle", "Matrix vesicles", [...pal("NP.osteoid", "Vesicle"), ...one("NP.matrix.rim", "Crystals", "Vesicle")])),
      spec("nabs", "Neutralizing antibodies", [
        ...one("PC.ab", "IgG"),
        ...one("PC.gray", "Bound ligand"),
      ]),
      ...withV2(cell("opg", "OPG · RANKL decoy", [...pal("NP.opg", "OPG"), ...pal("NP.rankl", "RANKL"), ...pal("NP.rank", "RANK")])),
      ...withV2(cell("rankl", "RANKL (Tnfsf11) · RANK", [...pal("NP.rankl", "RANKL"), ...pal("NP.rank", "RANK"), ...pal("NP.gs", "TRAF6")])),
      ...withV2(spec("sclerostin", "Sclerostin", pal("BP.sost", "Sclerostin"))),
      ...withV2(spec("catk", "Cathepsin K"), pal("NP.catkV2", "Cathepsin K")),
      spec("ctx1", "CTX-I"),
      spec("ctx1-v2", "CTX-I (v2)", [...pal("NP.ctxV2", "CTX-I (inherits cathepsin K)")]),
      cell("ictp", "ICTP", [...pal("NP.ictpV2", "ICTP (inherits MMP)"), ...pal("NP.ctxV2", "CTX-I")]),
      cell("mmp", "MMP-13 · MMP-14", [...pal("NP.mmpV2", "MMP"), ...one("NP.zincV2.fil", "Zinc", "MMP"), ...LIPID]),
    ],
  },
];

/* ---- lab colour slots (paths into astrocyte_anim's active palette) ---- */

const labPal = (root: string, group: string) => pal(root, group);
const DISH = one("ui.dish", "Dish", "Dish");

/** Page 4: lab equipment and cultures (astrocyte_anim engine). */
export const LAB: LiveSection[] = [
  {
    id: "dishes",
    title: "Petri dishes",
    items: [
      prop("petri-tilt", "Petri dish, tilting", [...labPal("tp.astro", "Astrocyte"), ...DISH]),
      prop("petri-astro", "Astrocytes, serum-free", [...labPal("tp.astro", "Astrocyte"), ...DISH]),
      prop("petri-serum", "Astrocytes + serum", [...labPal("tp.astro", "Astrocyte"), ...labPal("coral", "Reactive"), ...one("ui.serum", "Serum", "Dish")]),
      prop("petri-a1", "A1 astrocytes + ACM", [...labPal("tp.astro", "Astrocyte"), ...labPal("coral", "Reactive"), ...DISH]),
      prop("petri-micro", "Microglia, resting", [...labPal("tp.micro", "Microglia"), ...DISH]),
      prop("petri-micro-lps", "Microglia + LPS", [...labPal("tp.micro", "Microglia"), ...labPal("coral", "Reactive"), ...DISH]),
      prop("petri-rgc", "Retinal ganglion cells", [...labPal("tp.neuron", "Neuron"), ...DISH]),
      prop("petri-rgc-dying", "RGCs, dying", [...labPal("tp.neuron", "Neuron"), ...labPal("grayp", "Dying"), ...DISH]),
      prop("dish-flat", "Culture dish, top-down", [...labPal("tp.astro", "Astrocyte"), ...DISH]),
    ],
  },
  {
    id: "panning",
    title: "Immunopanning",
    items: [
      prop("plate-lectin", "BSL-1 lectin plate", [...one("ui.plate", "Plate", "Plate"), ...one("ui.grid", "Coating", "Plate")]),
      prop("plate-antibody", "Antibody plate", [...one("ui.plate", "Plate", "Plate"), ...one("ui.grid", "Coating", "Plate")]),
      prop("plate-kept", "Positive-selection plate", [...one("ui.plate", "Plate", "Plate"), ...one("col.coral", "Selection ring", "Plate")]),
      prop("round-cells", "Dissociated cells", [
        ...labPal("tp.astro", "Astrocyte"),
        ...labPal("tp.micro", "Microglia"),
        ...labPal("tp.oligo", "Oligodendrocyte"),
        ...labPal("tp.neuron", "Neuron"),
      ]),
    ],
  },
  {
    id: "equipment",
    title: "Equipment & assays",
    items: [
      prop("pipette", "Pipette", one("ui.rim", "Glass", "Glass")),
      prop("tube", "Microcentrifuge tube", one("ui.rim", "Glass", "Glass")),
      prop("tube-acm", "Tube, conditioned medium", one("ui.rim", "Glass", "Glass")),
      prop("spin-filter", "Spin filter (30 kDa)", [...one("ui.rim", "Glass", "Glass"), ...one("ui.filtrate", "Filtrate", "Glass")]),
      prop("nab-well", "Neutralization well", DISH),
      prop("dose-wells", "Dose-response wells", [...labPal("tp.neuron", "Neuron"), ...DISH]),
      prop("clock", "Incubation timer"),
    ],
  },
];
