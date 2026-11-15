# Assets needed for the dual-hit model figure / animation

Working list of what the repo already draws and what the mechanism still needs.
Model reference: the Dual-hit mechanism narrative doc (sections 2, 3, 7, 8).

Conventions: new specimens go in via `registerSpecimen(key, height, draw)` plus a palette in `NP`,
which gets them styles, theme and colour editing for free. New glyphs go in `GLYPHS` and are then
usable anywhere via `glyph(c, type, x, y, size, rot, alpha)`. Molecules belong in `molecules.js`,
cells and scenes in `bone.js`, shared primitives in `kit.js`.

---

## Already there, do not rebuild

**Cells and scenes** (`bone.js`, `atlas.js`): osteocyte, osteocyte-b, osteocyte-network, osteoclast,
osteoclast-b, osteoclast-scene, osteoblast, osteoblast-b, osteoblast-scene, reversal, reversal-cell,
remodeling, msc, adipocyte.

**Molecules** (`molecules.js`, plus three drawn directly in `atlas.js`): casr, rankl, opg, casp3, pi, ca,
dkk1, fgf23, wnt, matrix-vesicle, lrp56, lrp56-wnt, integrin, integrin-states, cx43, er-alpha,
klotho-fgfr1, napi2ac, napi2b, pth1r, sclerostin, catk, ctx1. Piezo1 is its own engine with variants A to D.

That covers hit one (strain sensing, sclerostin, RANKL/OPG) and most of the endocrine arm. What is missing
is almost entirely the **execution** half of the model: the strut as a geometric object, the two cutting
routes, and the collagen chemistry that makes CTX-I blind.

---

## Tier 1: the model cannot be drawn without these

### `trabecula` — a strut with thickness as a parameter
The single most important missing asset. Everything in the model is about thin struts behaving differently
from thick ones, and there is currently no way to show a strut at all.

- Longitudinal slab of mineralised matrix, lamellar banding along its length, irregular scalloped margins,
  not a clean rectangle and **not a ladder rung**.
- Takes a thickness parameter, roughly 30 to 120 um at scale. Osteocytes embedded at realistic density so a
  thin strut visibly holds three or four cells and a thick one holds fifteen or twenty. The cell count
  difference is the argument; make it legible at a glance.
- Canaliculi radiating between lacunae and out to both surfaces.
- States: `intact`, `cavity` (a resorption pit part way in), `perforated`, `stub` (severed, two free ends).
- Slots: reuse `NP.matrix` (body / fil / rim) and `NP.osteocyte`.

### `strut-sever` — the perforation sequence
Timeline specimen, not a static one. Cavity deepens, reaches the far cortex of the strut, the strut parts,
both halves unload, stubs get cleaned back. End state has **fewer free ends than you would expect**, which is
the counterintuitive bit the fingerprint rests on. Worth a slow loop with a hold at the perforation moment.

### `osteocyte-plr` — perilacunar remodelling osteocyte
Route B, currently unrepresentable.

- Same arbor as `osteocyte` but the lacuna is visibly enlarged and the perilacunar matrix is eroded into a
  halo, margins ragged rather than smooth.
- Secreting into its own lacuna: proton efflux dots, MMP-13 and MMP-14 glyphs, cathepsin K, TRAP.
- Should read as alive and busy, in clear contrast to the apoptotic state, because the whole point of route B
  is that the cell is doing this deliberately rather than dying.
- Slots: new `NP.plr` palette, plus `NP.matrix` for the halo.

### `lacuna-states` — occupancy series
Four lacunae side by side in one specimen: occupied and healthy, occupied and apoptotic (condensed nucleus,
retracted processes), empty, and micropetrotic (infilled with mineral, bright ring). This is the readout the
histology is being bought for, so it needs to be drawable before the pitch.

### `collagen-cut` — type I collagen with both cut sites
The payoff of the enzyme section and the reason the flat CTX-I is not the end of the story.

- Triple helix shown as three coiled strands, with the N- and C-telopeptides sticking out at the ends and a
  pyridinoline crosslink tying neighbouring molecules together.
- Two cut sites marked distinctly: cathepsin K cutting the telopeptide and releasing **CTX-I**, MMPs cutting
  the helical domain and releasing **ICTP**. Different glyph shape and colour per fragment.
- Animated version: scissors land, fragment detaches, floats off toward a blood vessel. Two parallel runs,
  one per enzyme, so the viewer sees that only one of them reaches the assay.

### `ictp` — the other fragment
Sits beside the existing `ctx1`. Needs to be visually distinct from it at small size, since the entire
argument is that one is measured and the other is not.

### `mmp13`, `mmp14`
MMP-13 secreted and soluble; MMP-14 membrane-tethered, drawn in a bilayer, since that distinction matters
mechanistically. Catalytic domain plus hemopexin domain, zinc in the active site.

### `label-strut` — calcein and alizarin on a trabecula
Needed for the histology pitch, not the mechanism.

- A strut carrying three fluorescent lines: alizarin at the baseline surface, two calcein lines 6 days apart
  nearer the current surface, on a dark field.
- Two versions side by side, which is the actual test: **apposition** (calcein bands sitting on a thick
  survivor's surface) against **selection** (a thick survivor with no new label on it, because it was always
  thick). This one image is the pitch to Adams, so it should be the best-looking thing in the deck.

---

## Tier 2: needed for a complete mechanism panel

- **`vatpase`**, **`clc7`** — the acidification machinery in the osteoclast sealing zone. Proton pump as a
  rotary stalk, ClC-7 as a dimeric channel, both in the ruffled border membrane.
- **`trap`** — TRAP / ACP5, in both the osteoclast and the PLR osteocyte, since the shared enzyme set is the
  reason route B is plausible at all.
- **`pannexin1`** + ATP release — the dying-osteocyte signal that recruits the response.
- **`pit1-pit2`** — SLC20A1/2. Distinct from the existing `napi2ac` / `napi2b` (SLC34 family), and it is the
  direct route for phosphate into bone cells, so it should not be conflated with the renal and gut transporters.
- **`p1np`**, **`alp`**, **`opn`** — the three other markers actually measured. With `ctx1` and `ictp` this
  gives a complete "what the blood can and cannot see" panel.
- **`tgfb`**, **`yap-taz`** — the transcriptional route to osteocyte MMP expression.
- **`hdac4-runx2`** — PTH to MMP-13 transcription. Could be one small nuclear inset: PKA phosphorylates
  HDAC4, HDAC4 releases from Runx2, promoter opens.
- **`osteoclast-fusion`** — mononuclear precursors fusing into the multinucleated cell. Useful because one
  claim is that event *number* did not change, and showing recruitment makes that visible.

---

## Tier 3: context, only if the figure has room

- **`growth-plate`** — chondrocyte columns with the depth axis below. Carries bone age, which is what the
  depth-resolved method assumes and what the alizarin line tests.
- **`vessel-typeh`** — CD31/Emcn type H vessel near the plate, for the vascular hypothesis.
- **`proximal-tubule`** — nephron segment for the FGF23 / Klotho axis and the kidney phosphate load readout.
- **`enterocyte`** — gut cell with NaPi-IIb, to close the dietary phosphate path.
- **`parathyroid-cell`** — PTH source, pairs with the existing CaSR.
- **`myofiber`** — soleus fibre, for the muscle arm.

---

## Scenes, which are the actual deliverable

Individual assets are only worth building in service of these.

1. **Two hits converge on one cell.** Left input unloading (Piezo1 quiet, SOST up), right input estrogen loss
   or phosphate (PiT transport, PTH/FGF23). Both arrows land on the same osteocyte. Each alone leaves it
   alive, together it crosses a threshold. The threshold should be a visible line, not a vibe.
2. **Why thin struts.** Two struts side by side, same number of osteocyte deaths in each. The thick one loses
   a fraction and carries on, the thin one loses its whole population and is flagged.
3. **Route A against route B.** Split screen, same strut. Left: osteoclast lands on the surface, acidifies,
   cathepsin K cuts, CTX-I leaves. Right: osteocyte enlarges its own lacuna from inside with MMP-13 and
   MMP-14, ICTP leaves. Both end with the strut severed. Same outcome, different enzyme, different fragment.
4. **Why the blood test missed it.** The severed strut's collagen entering circulation as a thin trickle
   beside the whole-skeleton background, plus the fragment that the CTX-I assay does not detect. This is the
   one that makes the flat CTX-I an interesting result rather than a negative one.
5. **Depth gradient.** Growth plate at the top, damage worst in the first 0.5 mm, fading with depth. Pairs
   with the labelled strut, since depth and label are two readouts of the same thing.

Build order: `trabecula` first, because scenes 2, 3 and 5 all need it, then `collagen-cut` and `ictp`,
then `osteocyte-plr`, then `label-strut` for the pitch.

---

## Style rules, carried over

No ladder-shaped trabecular networks. No BioRender beige, no flowchart look. Measured data and mechanistic
hypothesis must be visually separable, so pick one treatment (fill, outline weight, opacity) that marks
everything hypothetical and use it consistently. AMB is "AMB", never "walking". No colons in titles, no em
dashes. Shape carries intervention, colour carries diet, per Eric's note on the serum figures; keep the same
mapping here so the deck reads as one set.
