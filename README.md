# physio_render

Cell illustrations in four pages:

1. **Flowchart**: stem cell lineages (static SVG)
2. **Static**: every flowchart cell, click to enlarge
3. **Animated**: neural cells, bone & marrow cells, Piezo1 (variants A to D), signalling molecules (canvas, live)
4. **Lab**: tilted 3D petri dishes, immunopanning plates, pipette, tubes, spin filter, wells, timer

Light / dark (pure black) toggle in the top right. Click any animated item to open it: cells and Piezo1 have
render styles (Atlas, Ink, Clay, Glass, Wire), with Clay as the default, and every item with colour slots has colour pickers. Edits save
to this browser's localStorage automatically; "Copy JSON" copies an item's settings.

## Run locally

```
npm install
npm run dev        # http://localhost:5173
```

`npm run build` writes one self-contained file, `dist/index.html`, which also works opened straight from disk.

## Where things live

- `src/components/cells/`: SVG cells for the flowchart and catalogue
- `src/engines/atlas.js`: drawing engine from the cell atlas (`atlas-bone.html`): arbors, glyphs, bone cells. `drawSpecimen(ctx, key, t, w, h)`
- `src/engines/lab.js`: engine and lab props from `astrocyte_anim` (js/core plus the dish/plate/well/filter code from js/scenes). `drawProp(ctx, key, t, w, h)`. Props are listed in `PROPS` at the bottom of the file
- `src/engines/bone.js`: osteocyte (astrocyte arbor engine, custom builder), osteoclast / osteoblast / remodeling scenes
- `src/engines/molecules.js`: receptors, channels, transporters and molecule glyphs (LRP5/6, integrin, Cx43, Klotho/FGFR1, PTH1R, NaPi, Wnt, Dkk1, ERα, FGF23, Pi, Ca²⁺…)
- `src/engines/kit.js`: shared drawing helpers (outline offsetting, protein domains, bilayer, ions, helices)
- New specimens call `registerSpecimen(key, height, draw)` and add palettes to `NP`, so they get styles, theme and colour editing for free. New glyphs go in `GLYPHS` and become usable anywhere via `glyph(c, type, x, y, size, rot, alpha)`
- `src/engines/piezo.js`: Piezo1 trimer (geometry from the piezo1 lab, drawn on canvas). `drawPiezo(ctx, shape, t, w, h, opts)`
- Render styles live in `paintMembrane()` in `atlas.js`: every cell membrane goes through it
- `src/state.ts`: theme and per-item settings (style + colour overrides), stored in localStorage
- `src/data/animated.ts`: which items appear on the Animated and Lab pages, and their names
- `src/components/LiveCanvas.tsx`: the shared animation clock, which only redraws canvases that are on screen

The two engine files are the original code with only the UI removed, so they don't type-check (`// @ts-nocheck`).
