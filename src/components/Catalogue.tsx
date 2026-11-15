import { memo, useCallback, useEffect, useRef, useState } from "react";
import { CATALOGUE, type CatalogueItem } from "../data/catalogue";
import { CellFigure } from "./CellFigure";
import { Lightbox } from "./Lightbox";

interface TileProps {
  item: CatalogueItem;
  index: number;
  style: "atlas" | "clay";
  onOpen: (index: number) => void;
  register: (index: number, node: HTMLButtonElement | null) => void;
}

const Tile = memo(function Tile({ item, index, style, onOpen, register }: TileProps) {
  return (
    <li>
      <button
        type="button"
        className="tile"
        aria-haspopup="dialog"
        ref={(node) => {
          register(index, node);
        }}
        onClick={() => onOpen(index)}
      >
        <span className="tile__stage">
          <CellFigure item={item} scope="grid" style={style} />
        </span>
        <span className="tile__name">{item.name}</span>
      </button>
    </li>
  );
});

/** Page 2: every illustration from the flowchart as a grid; click one to see it large. */
export default function Catalogue() {
  const [active, setActive] = useState<number | null>(null);
  const [style, setStyle] = useState<"atlas" | "clay">("clay");
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const returnFocusTo = useRef<number | null>(null);

  const register = useCallback((index: number, node: HTMLButtonElement | null) => {
    tiles.current[index] = node;
  }, []);

  const open = useCallback((index: number) => setActive(index), []);

  const getOrigin = useCallback(
    (index: number) => tiles.current[index]?.querySelector<HTMLElement>(".tile__stage") ?? null,
    [],
  );

  const close = useCallback((index: number) => {
    returnFocusTo.current = index;
    setActive(null);
  }, []);

  // Once the popup is gone, leave focus on the tile that was last being viewed
  // (which may not be the one that was originally clicked).
  useEffect(() => {
    if (active !== null || returnFocusTo.current === null) return;
    tiles.current[returnFocusTo.current]?.focus({ preventScroll: true });
    returnFocusTo.current = null;
  }, [active]);

  return (
    <div className="catalogue catalogue--static">
      <h1 className="sr-only">Static cell illustrations</h1>

      <div className="static__tools" role="group" aria-label="Static render style">
        <span className="controls__label">Style</span>
        <div className="seg">
          {(["atlas", "clay"] as const).map((option) => (
            <button
              key={option}
              type="button"
              className="seg__btn"
              aria-pressed={style === option}
              onClick={() => setStyle(option)}
            >
              {option[0].toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <ul className="catalogue__grid" role="list">
        {CATALOGUE.map((item, index) => (
          <Tile key={item.id} item={item} index={index} style={style} onOpen={open} register={register} />
        ))}
      </ul>

      {active !== null && (
        <Lightbox items={CATALOGUE} index={active} style={style} getOrigin={getOrigin} onNavigate={setActive} onClose={close} />
      )}
    </div>
  );
}
