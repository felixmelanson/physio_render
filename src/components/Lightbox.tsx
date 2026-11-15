import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, SyntheticEvent } from "react";
import { closeSpan, gridSpan, type CatalogueItem } from "../data/catalogue";
import { CellFigure } from "./CellFigure";

interface LightboxProps {
  items: CatalogueItem[];
  index: number;
  style: "atlas" | "clay";
  /** The tile stage the popup grows out of and settles back onto. */
  getOrigin: (index: number) => HTMLElement | null;
  onNavigate: (index: number) => void;
  /** Called once the popup has finished closing, with the item last shown. */
  onClose: (index: number) => void;
}

const EASE_OUT = "cubic-bezier(0.2, 0.75, 0.25, 1)";
const EASE_IN_OUT = "cubic-bezier(0.45, 0, 0.4, 1)";

function prefersReducedMotion() {
  return typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The transform that lays the panel's square stage exactly over `origin`.
 *
 * The stage is the top square of the panel, so its centre sits half a panel
 * width below the panel's top edge. Layout offsets are used for the panel
 * (rather than its client rect) so a transform that is still animating cannot
 * skew the measurement. The dialog is fixed to the viewport, which makes those
 * offsets viewport coordinates.
 */
function transformOnto(panel: HTMLElement, origin: HTMLElement | null): string | null {
  if (!origin) return null;
  const from = origin.getBoundingClientRect();
  const width = panel.offsetWidth;
  if (!from.width || !width) return null;
  const dx = from.left + from.width / 2 - (panel.offsetLeft + width / 2);
  const dy = from.top + from.height / 2 - (panel.offsetTop + width / 2);
  panel.style.transformOrigin = `50% ${width / 2}px`;
  return `translate(${dx}px, ${dy}px) scale(${from.width / width})`;
}

/**
 * The popup frames its artwork closer than a tile does. This is how much
 * smaller the artwork has to be drawn for the popup to look like the tile, so
 * the two can be matched at the start and end of the zoom.
 */
const tileScale = (item: CatalogueItem) => closeSpan(item) / gridSpan(item);

/** Arrow drawn the way the flowchart draws its connectors: a square-cut line with a solid head. */
function ArrowIcon({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 26 18" width="26" height="18" aria-hidden="true" focusable="false" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M1 9H16" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M14 2.5 25 9 14 15.5Z" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="M3 3 15 15M15 3 3 15" fill="none" stroke="currentColor" strokeWidth="2.6" />
    </svg>
  );
}

export function Lightbox({ items, index, style, getOrigin, onNavigate, onClose }: LightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openedAt = useRef(index);
  const closing = useRef(false);
  const [direction, setDirection] = useState<-1 | 0 | 1>(0);
  const titleId = useId();

  const count = items.length;
  const item = items[index];
  const previous = items[(index - 1 + count) % count];
  const next = items[(index + 1) % count];

  // Open: show the modal, then grow the panel out of the tile that was chosen.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    if (!dialog || !panel) return;

    // Lock the page behind the popup, padding out the scrollbar so nothing shifts sideways.
    const root = document.documentElement;
    root.style.setProperty("--scroll-gutter", `${window.innerWidth - root.clientWidth}px`);
    root.classList.add("has-lightbox");

    if (!dialog.open) dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });

    if (!prefersReducedMotion() && typeof panel.animate === "function") {
      const from = transformOnto(panel, getOrigin(openedAt.current));
      panel.animate(
        [
          { transform: from ?? "scale(0.94)", opacity: from ? 1 : 0 },
          { transform: "none", opacity: 1 },
        ],
        { duration: 320, easing: EASE_OUT },
      );
      if (from) {
        panel
          .querySelector(".lightbox__art")
          ?.animate([{ transform: `scale(${tileScale(items[openedAt.current])})` }, { transform: "none" }], { duration: 320, easing: EASE_OUT });
      }
      scrimRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: "ease-out" });
      // the name and controls arrive once the artwork is most of the way there
      panel.querySelectorAll("[data-chrome]").forEach((el) => {
        el.animate([{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }], { duration: 320 });
      });
    }

    return () => {
      root.classList.remove("has-lightbox");
      root.style.removeProperty("--scroll-gutter");
      if (dialog.open) dialog.close();
    };
  }, [getOrigin, items]);

  // Close: settle the panel back onto the tile of whichever item is showing now.
  const requestClose = useCallback(() => {
    if (closing.current) return;
    closing.current = true;

    const panel = panelRef.current;
    if (!panel || prefersReducedMotion() || typeof panel.animate !== "function") {
      onClose(index);
      return;
    }

    const origin = getOrigin(index);
    // after browsing with the arrows the tile may have scrolled out of view
    origin?.parentElement?.scrollIntoView({ block: "nearest", inline: "nearest" });
    const onto = transformOnto(panel, origin);

    panel.querySelectorAll("[data-chrome]").forEach((el) => {
      el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 110, fill: "forwards" });
    });
    scrimRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 240, easing: "ease-in", fill: "forwards" });
    const exit = panel.animate(
      [
        { transform: "none", opacity: 1 },
        { transform: onto ?? "scale(0.96)", opacity: onto ? 0.4 : 0 },
      ],
      { duration: 250, easing: EASE_IN_OUT, fill: "forwards" },
    );
    if (onto) {
      panel
        .querySelector(".lightbox__art")
        ?.animate([{ transform: "none" }, { transform: `scale(${tileScale(items[index])})` }], { duration: 250, easing: EASE_IN_OUT, fill: "forwards" });
    }
    const done = () => onClose(index);
    exit.finished.then(done, done);
  }, [getOrigin, index, items, onClose]);

  const step = useCallback(
    (delta: -1 | 1) => {
      if (closing.current) return;
      setDirection(delta);
      onNavigate((index + delta + count) % count);
    },
    [count, index, onNavigate],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
  };

  // Esc: run the same animated close instead of the browser's instant one.
  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    requestClose();
  };

  // If the browser closes the dialog on its own, bring state back in step with it.
  const handleNativeClose = () => {
    if (!closing.current && !dialogRef.current?.open) onClose(index);
  };

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
      onCancel={handleCancel}
      onClose={handleNativeClose}
    >
      <div ref={scrimRef} className="lightbox__scrim" onClick={requestClose} />

      <div ref={panelRef} className="lightbox__panel lightbox__panel--static">
        <button ref={closeRef} type="button" className="icon-button lightbox__close" aria-label="Close" onClick={requestClose} data-chrome>
          <CloseIcon />
        </button>

        <div className="lightbox__stage lightbox__stage--static" onClick={requestClose}>
          <div key={item.id} className="lightbox__art" data-dir={direction}>
            <CellFigure item={item} scope="zoom" fit="close" style={style} />
          </div>
        </div>

        <div className="lightbox__bar" data-chrome>
          <button type="button" className="icon-button" aria-label={`Previous: ${previous.name}`} onClick={() => step(-1)}>
            <ArrowIcon flip />
          </button>
          <h2 id={titleId} className="lightbox__name">
            {item.name}
          </h2>
          <button type="button" className="icon-button" aria-label={`Next: ${next.name}`} onClick={() => step(1)}>
            <ArrowIcon />
          </button>
        </div>

        <p className="sr-only" aria-live="polite">{`${item.name}, ${index + 1} of ${count}`}</p>
      </div>
    </dialog>
  );
}
