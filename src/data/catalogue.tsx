import type { ReactElement } from "react";
import { Erythrocytes, Megakaryocyte, Platelets } from "../components/cells/BloodCells";
import { Basophil, Eosinophil, Macrophage, Neutrophil, Osteoclast } from "../components/cells/MyeloidCells";
import { CancerCells, NKCell, PlasmaCell } from "../components/cells/LymphoidCells";
import { Adipocyte, Chondrocyte, MSC, Osteoblast } from "../components/cells/MesenchymalCells";
import { BCell, CLP, CMP, LTHSC, MPP, Preadipocyte, Prechondrocyte, Preosteoblast, STHSC, TCell } from "../components/cells/NamedCells";

export interface CatalogueItem {
  /** Stable key. */
  id: string;
  /** Name exactly as it is labelled in the flowchart. */
  name: string;
  /** The coded illustration, drawn around its own origin. */
  Art: (pos: { x: number; y: number }) => ReactElement;
  /** Measured bounds of the artwork relative to that origin: centre x, centre y, width, height. */
  bounds: [cx: number, cy: number, width: number, height: number];
}

/**
 * Shared viewport for the grid: every illustration is shown at the
 * magnification it has in the flowchart, so line weights and relative sizes
 * stay true from tile to tile.
 */
const FRAME = 232;

const longestSide = (item: CatalogueItem) => Math.max(item.bounds[2], item.bounds[3]);

/** Grid viewport: the shared frame, widened only for artwork that would not fit it (the three-cell cluster). */
export const gridSpan = (item: CatalogueItem) => Math.max(FRAME, longestSide(item) / 0.86);

/** Popup viewport: closer in, so the artwork fills most of the stage. Never further out than the grid's. */
export const closeSpan = (item: CatalogueItem) => Math.min(gridSpan(item), longestSide(item) / 0.78);

/**
 * One entry per illustration, in the flowchart's reading order
 * (panel a top to bottom, then panel b).
 *
 * To add an item (another cell, a molecule, anything): draw it as a component
 * taking { x, y }, then add one line here with its name and measured bounds.
 * The grid and the popup pick it up from this list.
 */
export const CATALOGUE: CatalogueItem[] = [
  // haematopoietic stem and progenitor cells
  { id: "lt-hsc", name: "LT-HSC", Art: LTHSC, bounds: [0, 0, 132, 132] },
  { id: "st-hsc", name: "ST-HSC", Art: STHSC, bounds: [0, 0, 132, 132] },
  { id: "mpp", name: "MPP", Art: MPP, bounds: [0, 0, 132, 132] },
  { id: "cmp", name: "CMP", Art: CMP, bounds: [0, 0, 132, 132] },
  { id: "clp", name: "CLP", Art: CLP, bounds: [0, 0, 132, 132] },

  // megakaryocyte and erythrocytes
  { id: "erythrocytes", name: "Erythrocytes", Art: Erythrocytes, bounds: [-3, -1, 170, 158] },
  { id: "platelets", name: "Platelets", Art: Platelets, bounds: [-0.5, -9, 155, 140] },
  { id: "megakaryocyte", name: "Megakaryocyte", Art: Megakaryocyte, bounds: [-3.5, -5, 191, 162] },

  // macrophage and granulocytes
  { id: "macrophage", name: "Macrophage", Art: Macrophage, bounds: [-1, -1.5, 162, 127] },
  { id: "eosinophil", name: "Eosinophil", Art: Eosinophil, bounds: [0, 0, 132, 132] },
  { id: "neutrophil", name: "Neutrophil", Art: Neutrophil, bounds: [-2.5, 0.5, 135, 131] },
  { id: "osteoclast", name: "Osteoclast", Art: Osteoclast, bounds: [1, -2, 172, 130] },
  { id: "basophil", name: "Basophil", Art: Basophil, bounds: [0, 0, 132, 132] },

  // lymphoid cells
  { id: "b-cell", name: "B cell", Art: BCell, bounds: [0, 0, 132, 132] },
  { id: "t-cell", name: "T cell", Art: TCell, bounds: [0, 0, 132, 132] },
  { id: "nk-cell", name: "NK cell", Art: NKCell, bounds: [0, 0, 132, 132] },
  { id: "plasma-cell", name: "Plasma cell", Art: PlasmaCell, bounds: [0, 0, 194, 136] },
  { id: "cancer-cells", name: "Cancer cells", Art: CancerCells, bounds: [10, -97, 288, 278] },

  // mesenchymal lineage
  { id: "msc", name: "MSC", Art: MSC, bounds: [0.5, -4.5, 195, 89] },
  { id: "preadipocyte", name: "Preadipocyte", Art: Preadipocyte, bounds: [1.5, 5, 147, 160] },
  { id: "preosteoblast", name: "Preosteoblast", Art: Preosteoblast, bounds: [5.5, -7, 157, 154] },
  { id: "prechondrocyte", name: "Prechondrocyte", Art: Prechondrocyte, bounds: [-5, -1, 156, 140] },
  { id: "adipocyte", name: "Adipocyte", Art: Adipocyte, bounds: [0, 0, 134, 134] },
  { id: "osteoblast", name: "Osteoblast", Art: Osteoblast, bounds: [-0.5, -0.5, 135, 115] },
  { id: "chondrocyte", name: "Chondrocyte", Art: Chondrocyte, bounds: [0, 0, 174, 114] },
];
