import { memo } from "react";
import { closeSpan, gridSpan, type CatalogueItem } from "../data/catalogue";
import { IdPrefixContext } from "./cells/ids";

interface CellFigureProps {
  item: CatalogueItem;
  /** Keeps this instance's gradient ids separate from every other instance. */
  scope: string;
  /** "shared": the grid's common magnification. "close": framed tightly, for the popup. */
  fit?: "shared" | "close";
  style?: "atlas" | "clay";
}

/** One catalogue illustration, centred in a square viewport. */
export const CellFigure = memo(function CellFigure({ item, scope, fit = "shared", style = "clay" }: CellFigureProps) {
  const { Art, bounds } = item;
  const [cx, cy] = bounds;
  const span = fit === "close" ? closeSpan(item) : gridSpan(item);
  return (
    <svg
      className={`cell-figure cell-figure--${style}`}
      viewBox={`${cx - span / 2} ${cy - span / 2} ${span} ${span}`}
      aria-hidden="true"
      focusable="false"
    >
      <IdPrefixContext.Provider value={`${scope}-`}>
        <Art x={0} y={0} />
      </IdPrefixContext.Provider>
    </svg>
  );
});
