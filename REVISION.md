# Revision spec: accuracy pass and semantic colour system

For Claude Code. Companion to `ASSETS-TODO.md`, which covers assets that do not exist yet.
This file covers what is already drawn: what is anatomically off, and a colour system where
colour carries meaning instead of taste.

---

## 0. Ground rules

**Never edit an existing specimen in place. Always register a copy.**

`-b` is already taken (`osteocyte-b`, `osteoclast-b`, `osteoblast-b` are existing variants), so use a
`-v2` suffix for revisions:

```js
registerSpecimen('osteocyte-v2', 190, (c, t) => osteocyteStates(c, t, OCY_V2, {...}));
```

Add every `-v2` to `src/data/animated.ts` directly after its original in the same section, named
`"<Name> (v2)"`, so the gallery shows old and new side by side and the comparison is one scroll rather
than a git diff. Keep the originals untouched and working until a v2 is signed off.

Palette additions go into `NP` as new keys (`NP.osteocyteV2`), not as edits to existing keys, for the
same reason: `NP.osteocyte` is referenced by the network, lacunar and remodeling scenes, so changing it
moves things nobody asked to move.

---

## 1. The colour system

Palettes were chosen per asset, so the same colour means different things in different places and the
same thing has different colours in different engines. Three rules fix that.

**Rule 1: hue carries identity, value carries state, treatment carries evidence level.** A cell's hue
says what lineage it belongs to. How light or desaturated it is says what state it is in. Whether it is
filled solid or dashed says whether it was measured or is being hypothesised.

**Rule 2: lineage decides hue.** Mesenchymal cells (MSC, osteoblast, osteocyte, lining cell) share one
hue family because they are one lineage. Osteoclasts are haematopoietic and get a different family
entirely. That is a real biological division and the figure should encode it, so a viewer can see at a
glance that the cell doing the cutting came from somewhere else.

**Rule 3: dead is desaturated, whatever the lineage.** One apoptotic treatment: pull saturation toward
zero and value toward mid-grey, keeping a faint cast of the parent hue so you can still tell what it was.

### Cells

| Asset | Family | Current | Proposed | Why |
|---|---|---|---|---|
| MSC | Mesenchymal, palest | `TP.oligo`, borrowed | Pale slate-blue, low chroma | Undifferentiated, so the least saturated member |
| Osteoblast | Mesenchymal, mid | `NP` blue `[82,122,170]`, `BP` green `[123,155,100]` | One blue, mid value, highest chroma in the family | Active synthesiser, so the most saturated. **The two engines disagree on this cell's colour and must be reconciled first** |
| Osteocyte | Mesenchymal, deep | `NP` teal `[70,128,150]`, `BP` = `TP.astro` | Deep teal-slate, pushed away from both the osteoblast blue and the fluid cyan | Mature and embedded, so the darkest. `BP.osteocyte` being literally the astrocyte palette is the root of the resemblance problem |
| Lining cell | Mesenchymal, flattest | not drawn | Palest blue, near-grey | Quiescent |
| Reversal cell | Mesenchymal, olive | `NP.reversal` `[128,136,90]` | Keep | Distinct and correct |
| Adipocyte | Mesenchymal, diverged | `BP.adipocyte` ochre | Keep ochre, desaturate | MSC-derived but a different fate; the warm shift reads as divergence |
| Osteoclast | Haematopoietic | rust `[184,100,74]` / `[196,118,94]` | Keep rust, raise contrast against FGF23 and RANKL | Already right and already consistent across engines |
| Osteoclast precursor | Haematopoietic, pale | not drawn | Pale rust | Same family, immature |
| Apoptotic, any | Desaturated | `NP.apoptotic` neutral grey | Keep, tint 10% toward the parent hue | So a dead osteocyte still reads as having been an osteocyte |

### Matrix

| Asset | Current | Proposed | Why |
|---|---|---|---|
| Mineralised matrix | `NP.matrix` tan | Cooler, greyer, lower chroma | It is the substrate and should recede behind every cell drawn on it. Right now it competes |
| Osteoid | `NP.osteoid` tan, very close to matrix | Clearly warmer and lighter | The mineralisation front has to be a visible boundary. It is one of the few things histology sees that uCT cannot, so the figure should make a point of it |
| Cement line | drawn | Thin, darker than both | Reversal boundary, keep readable |
| Fluorochrome labels | not drawn | Calcein true green, alizarin true red-orange, on dark | These are photographs of real dyes. Do not stylise them; match the actual emission colours or the histology figure stops being credible |

### Signals, coloured by function rather than by molecule

| Function | Members | Proposed | Note |
|---|---|---|---|
| **Phosphate** | Pi ion, PiT1/2, NaPi-IIa/c, NaPi-IIb, dietary P | **Violet-magenta, reserved, used for nothing else** | The study's independent variable, and currently invisible: `napi` is grey-blue `[112,124,168]` and reads as background. Phosphate should be the most identifiable colour in the set. Use the same violet for HP groups in the data figures so the two visual languages agree |
| Calcium | Ca²⁺, CaSR | Cool green | Conventional, keep |
| Mechanical | Piezo1, fluid shear, strain arrows | Ice cyan | Push away from the osteocyte teal so cell and fluid separate |
| Pro-resorptive | RANKL, PTH, sclerostin, Dkk1, FGF23 | Warm amber to red ramp | Keep warm, but see the collisions table; these currently clash with the osteoclast itself |
| Protective, anabolic | OPG, Wnt, estrogen, beta-catenin | Green-teal | OPG is already green `[92,146,118]`, which is correct; extend the logic |
| Apoptosis machinery | caspase-3, Bax, cytochrome c | Violet-grey | Should belong visually with the dead-cell treatment. Caspase-3 is currently amber `[196,138,36]`, which reads as a signal rather than as death |

### Enzymes and fragments, the one that matters most

The central argument is that **which enzyme cut the collagen decides which fragment reaches the blood,
and the assay only sees one of them.** Colour should carry that before any label does.

| Item | Proposed | Note |
|---|---|---|
| Cathepsin K | Deep crimson | The acid route |
| MMP-13, MMP-14 | Bronze, with a bright zinc ion visible in the active site | Metalloproteinase, so the metal is both accurate and a mnemonic |
| **CTX-I** | **Crimson, inherited from cathepsin K** | Currently an anonymous tan squiggle inside `resorption()` |
| **ICTP** | **Bronze, inherited from MMPs** | Does not exist yet |
| TRAP | Neutral plum | Shared by both routes, so it should belong to neither |

A viewer looking at the blood panel then sees two fragment colours and knows, without reading anything,
that the assay catches one of them. That inheritance rule does more explanatory work than any arrow.

### Evidence level, by treatment rather than colour

Applies to cells and molecules alike:

- **Measured in this study**: full opacity fill, solid outline.
- **Established in the literature, not measured here**: 70% fill, solid outline.
- **Hypothesis**: 35% fill, dashed outline.

One rule, applied everywhere, so the measured and the hypothesised are separable from across the room
instead of by a judgement call per figure.

---

## 2. Palette collisions in the current code

Each row is two things with near-identical colour doing unrelated jobs.

| Collision | Current RGB | Problem |
|---|---|---|
| `BP.osteocyte` = `TP.astro` | the astrocyte palette | The osteocyte literally inherits the astrocyte's colours. Root cause of the resemblance |
| `BP.integrin` = `TP.astro` | the astrocyte palette | Same borrow, different asset |
| `NP.osteoblast` vs `BP.osteoblast` | `[82,122,170]` blue vs `[123,155,100]` green | **The same cell is blue in one engine and green in the other** |
| `NP.osteocyte` vs `NP.osteoblast` | `[70,128,150]` vs `[82,122,170]` | Right as lineage, too close to tell apart. Separate by value |
| `fgf23` vs `NP.osteoclast` | `[186,104,56]` vs `[184,100,74]` | An endocrine signal and a cell type, same colour |
| `rankl` vs `osteoclast` vs `mito` | `[186,116,96]`, `[184,100,74]`, `[188,118,94]` | Three near-identical warms across three categories |
| `dkk1` vs `pth` vs `bax` vs `e2` | `[176,94,120]`, `[188,86,92]`, `[190,84,104]`, `[190,88,66]` | Four reds: an inhibitor, a hormone, an apoptosis protein and estrogen |
| `casp3` vs `talin` vs `h12` vs `NP.signal` | `[196,138,36]`, `[176,138,66]`, `[204,122,52]`, `[212,146,38]` | Amber overloaded four ways |
| `NP.matrix` vs `NP.osteoid` | `[238,228,202]` vs `[251,241,214]` | Nearly identical, so the mineralisation front is invisible |
| `napi` | `[112,124,168]` | Phosphate transport rendered in background grey-blue |

---

## 3. Per-asset revisions

### 3.1 `osteocyte` to `osteocyte-v2`, highest priority

`OCY_A` is `new Cell('astro', ...)` with a recoloured palette, so version A is an astrocyte by
construction. `OCY_B` uses `buildOsteo`, which is closer but still astrocyte-shaped. Copy `buildOsteo`
to `buildOsteoV2` and change these parameters.

| Parameter | Current | Target | Why |
|---|---|---|---|
| `n`, primary processes | 12 | **36 to 48** | A real osteocyte has 40 to 60. The dense radial burst is the visual identity, and it is what makes the thin-strut cell-count argument land later |
| `w0`, base width | `2.6 + R()*1.1` | **about 1.0, little variance** | Processes are 0.1 to 0.5 um against a 10 to 20 um body. Hairs, not branches |
| `w1`, tip width | `0.65` | **about 0.55** | Near-uniform width along the length. Tapering is the astrocyte tell |
| `forks` | 1 to 2 at `at: .3 + R()*.45` | **0 to 1 at `at: .75+`** | Processes leave the soma straight and radial and branch only distally where they meet neighbours. Branching at 30% of the length is the astrocyte pattern |
| `kind: 't'` twigs | present at `R() < .55` | **remove entirely** | These read as dendritic spines, the most neuronal-looking feature in the current render |
| `curv` | `(R()-.5)*.9` | **about `(R()-.5)*.35`** | Canaliculi are near-straight channels through mineral; processes cannot meander |
| `elong` | 1.55 | **1.9 to 2.2** | The cell body is a flattened ellipsoid with its long axis parallel to the lamellae, not a star with a round centre |

**Then add the thing that is actually missing: the lacuna and the canaliculi.** The cells currently
float against white with a soft blue glow that reads as a drop shadow. An osteocyte is *defined* by
being embedded, so drawn free-floating it can only read as a neural cell.

- A lens-shaped lacuna hugging the body, following `elong`, with a defined edge rather than a gradient.
- Canalicular channels that the processes run through, slightly wider than the process, visible as a sleeve.
- `lcnCol()` already builds a radial fluid gradient. Keep it as the fluid inside, but give it a boundary.

This single change does more for accuracy than any recolouring, and it unlocks `lacuna-states` and the
micropetrosis asset in `ASSETS-TODO.md`.

**States.** The current set is `RESTING · SHEAR`, `LOADED · Ca²⁺`, `APOPTOTIC · RETRACTED`. Two problems:
resting with shear is self-contradictory, since shear is the stimulus, and there is no unloaded state at
all, which means hit one of the model cannot be drawn. Replace with four:

1. **LOADED** — fluid moving in the canaliculi, Ca²⁺ transients, sclerostin low.
2. **UNLOADED** — fluid static, sclerostin up, RANKL up, morphology still intact. *This is hit one and it does not currently exist.*
3. **APOPTOTIC** — condensed nucleus, retracted processes, and critically the **empty canaliculi left behind**, which is what the histology actually shows.
4. **PERILACUNAR REMODELLING** — see `ASSETS-TODO.md`. Alive and busy, enlarged lacuna, eroded halo. Route B.

**Scale.** `osteocyteStates` hard-codes a different scale per cell (`sc` 0.96, 0.62, 0.5). Readers will
take that as a morphological claim, and osteocytes do not shrink when loaded. One scale for all states;
carry the difference in colour and annotation only.

**Layout.** In the blue render the `LOADED · Ca²⁺` label sits directly above the apoptotic cell, so the
label-to-cell mapping is ambiguous. Use the pink version's label placement.

**Keep:** the Ca²⁺ bead treatment in `caWaves` reads instantly and is the best thing in either render.
Do not change it.

**Deprecate rather than delete version A.** Rename its gallery entry to
`"Osteocyte (astrocyte-derived, not anatomical)"` so nobody reaches for it in a figure by accident.

### 3.2 `osteocyte-network`

The strongest existing asset: lamellae, shared canaliculi, moving fluid, and a `LOADING` / `UNLOADING`
label, which is the unloaded concept the single-cell version lacks.

- Rebuild on `buildOsteoV2` once it lands.
- Three cells is thin for a network. Six to eight makes the point that the network is the sensing unit.
- Add a thin-strut version: the same network inside a 40 um strut instead of an open field, where the
  cells nearly fill the available bone. That is scene 2 in `ASSETS-TODO.md` and the clearest way to show
  why thin struts are vulnerable.

### 3.3 `osteoclast`, `osteoclast-b`, `osteoclast-scene`

Anatomically the best work in the repo: ruffled border as finger-like folds, sealing zone as podosome
rings, multiple nuclei clustered away from the bone, lysosomes, H⁺ transcytosis, Howship's scalloping.
Leave the geometry alone. Three changes:

- **The collagen fragment in `resorption()` is an anonymous tan squiggle**, commented as "CTX-type
  telopeptide". Replace it with a real CTX-I glyph in crimson and add an ICTP sibling in bronze leaving
  by a different route, so the two-enzyme story is visible inside the resorption scene itself.
- **Separate the osteoclast rust from the RANKL and FGF23 warms.** Right now the cell and the signal
  that recruited it are the same colour.
- `NUCLEI` is a fixed array of 7. Fine, but vary the count across instances; a uniform 7 everywhere
  reads as a motif rather than a cell.

### 3.4 `osteoblast`, `osteoblast-b`, `osteoblast-scene`

Accurate: cuboidal, polarised with the nucleus away from the bone, Golgi, rough ER, secretory vesicles,
matrix vesicles, an osteoid seam, one cell buried per cycle to become an osteocyte.

- **Reconcile the blue-versus-green disagreement** between `NP.osteoblast` and `BP.osteoblast` first.
- On an actively forming surface osteoblasts are a tight palisade of tall cuboidal cells, nearly
  touching. The current spacing is sparser than that.
- The buried-cell-becomes-osteocyte transition is the best teaching moment in the repo and is currently
  incidental. Give it its own scene with a hold at the burial.

### 3.5 `reversal`, `reversal-cell`

Canopy, bone remodelling compartment, cement line, collagen remnant uptake. Accurate, underused, and
directly relevant: the reversal phase is where MMP cleanup of demineralised collagen happens, which is
inflection 3 of the model. Add MMP glyphs in bronze to the remnant-uptake step and this asset starts
carrying argument instead of merely being correct.

### 3.6 `remodeling`

The BMU scene with formation, reversal and resorption labelled. Keep. Once `trabecula` exists, make a
second version on a thin strut rather than a flat surface, where the same cavity perforates instead of
healing. Same cells, same cavity, different outcome, driven only by thickness. That is the whole model
in one frame.

### 3.7 Molecules generally

- Apply the function-based families above.
- Move `napi` to the phosphate violet, and add PiT1/PiT2 as a distinct transporter. SLC20 and SLC34 are
  different families doing different jobs and should not look alike.
- Move `casp3` out of amber into the violet-grey death family.
- Give every metalloproteinase a visible zinc ion as a bright highlight in the active site.

---

## 4. Order of work

1. `buildOsteoV2` plus the lacuna and canaliculi, registered as `osteocyte-v2`. Everything downstream depends on it.
2. The colour system as one commit across both engines, including the osteoblast reconciliation and the phosphate violet.
3. CTX-I and ICTP glyphs with enzyme-inherited colour, dropped into `resorption()`.
4. The four osteocyte states, including the missing UNLOADED.
5. `osteocyte-network` rebuilt on v2, then the thin-strut version.

Steps 1 to 3 are what the Adams pitch needs. The rest can follow.
