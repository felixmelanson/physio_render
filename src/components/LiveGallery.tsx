import { useCallback, useEffect, useRef, useState } from "react";
import type { LiveItem, LiveSection } from "../data/animated";
import { LiveCanvas, animationClock } from "./LiveCanvas";
import { EVIDENCE_LEVELS, STYLES, hasShift, updateItemSettings, useItemSettings, useStoresVersion } from "../state";

function CloseIcon() {
  return (
    <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true" focusable="false">
      <path d="M3 3 15 15M15 3 3 15" fill="none" stroke="currentColor" strokeWidth="2.6" />
    </svg>
  );
}

function ArrowIcon({ flip = false }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 26 18" width="26" height="18" aria-hidden="true" focusable="false" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M1 9H16" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M14 2.5 25 9 14 15.5Z" fill="currentColor" />
    </svg>
  );
}

function PlayToggle() {
  const [playing, setPlaying] = useState(animationClock.playing);
  useEffect(() => animationClock.subscribe(setPlaying), []);
  return (
    <button type="button" className="live__toggle" onClick={() => animationClock.setPlaying(!playing)} aria-pressed={!playing}>
      {playing ? "Pause" : "Play"}
    </button>
  );
}

/** Render style buttons and colour pickers for one item. Changes save to this browser straight away. */
function Controls({ item }: { item: LiveItem }) {
  const settings = useItemSettings(item.id);
  useStoresVersion(); // defaults depend on the theme
  const [copied, setCopied] = useState(false);
  const style = settings.style ?? "clay";
  const colors = settings.colors ?? {};
  const groups = [...new Set(item.slots.map((s) => s.group))];
  const edited = Object.keys(colors).length > 0;
  const shift = settings.shift ?? { h: 0, s: 0, l: 0 };
  const setShift = (k: "h" | "s" | "l", v: number) => updateItemSettings(item.id, (s) => ({ ...s, shift: { ...(s.shift ?? { h: 0, s: 0, l: 0 }), [k]: v } }));

  const setColor = (path: string, hex: string) =>
    updateItemSettings(item.id, (s) => ({ ...s, colors: { ...(s.colors ?? {}), [path]: hex } }));
  const resetColor = (path: string) =>
    updateItemSettings(item.id, (s) => {
      const next = { ...(s.colors ?? {}) };
      delete next[path];
      return { ...s, colors: next };
    });

  const copy = async () => {
    const json = JSON.stringify({ id: item.id, style: item.styles ? style : undefined, evidence: settings.evidence, colors, shift: hasShift(settings.shift) ? shift : undefined }, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      window.prompt("Copy these settings:", json);
    }
  };

  if (!item.styles && !item.slots.length) return null;

  return (
    <div className="controls">
      {item.styles && (
        <div className="controls__block">
          <div className="controls__label">Style</div>
          <div className="seg" role="radiogroup" aria-label="Render style">
            {STYLES.filter((s) => !item.styleIds || item.styleIds.includes(s.id)).map((s) => (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={style === s.id}
                className="seg__btn"
                onClick={() => updateItemSettings(item.id, (cur) => ({ ...cur, style: s.id }))}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {item.evidence && (
        <div className="controls__block">
          <div className="controls__label">Evidence</div>
          <div className="seg" role="radiogroup" aria-label="Evidence level">
            {EVIDENCE_LEVELS.map((e) => (
              <button
                key={e.label}
                type="button"
                role="radio"
                aria-checked={settings.evidence === e.id}
                className="seg__btn"
                onClick={() => updateItemSettings(item.id, (cur) => ({ ...cur, evidence: e.id }))}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {item.slots.length > 0 && (
        <div className="controls__block">
          <div className="controls__label">
            Shift all colours
            {hasShift(settings.shift) && (
              <button type="button" className="controls__mini" onClick={() => updateItemSettings(item.id, (s) => ({ ...s, shift: undefined }))}>
                reset
              </button>
            )}
          </div>
          {(
            [
              ["h", "Hue", -180, 180, "hue"],
              ["s", "Saturation", -100, 100, "sat"],
              ["l", "Lightness", -100, 100, "light"],
            ] as const
          ).map(([k, label, min, max, track]) => (
            <label key={k} className="shift">
              <span className="shift__name">{label}</span>
              <input
                type="range"
                className={`shift__range shift__range--${track}`}
                min={min}
                max={max}
                value={shift[k]}
                onChange={(e) => setShift(k, +e.target.value)}
                onDoubleClick={() => setShift(k, 0)}
              />
              <span className="shift__val">{shift[k] > 0 ? `+${shift[k]}` : shift[k]}</span>
            </label>
          ))}
        </div>
      )}

      {groups.map((g) => (
        <div key={g} className="controls__block">
          <div className="controls__label">{g}</div>
          <div className="swatches">
            {item.slots
              .filter((s) => s.group === g)
              .map((slot) => {
                const value = colors[slot.path] ?? item.defaultColor(slot.path) ?? "#888888";
                const changed = slot.path in colors;
                return (
                  <label key={slot.path} className="swatch" data-changed={changed || undefined}>
                    <input type="color" value={value} onChange={(e) => setColor(slot.path, e.target.value)} />
                    <span className="swatch__name">{slot.label}</span>
                    {changed && (
                      <button
                        type="button"
                        className="swatch__reset"
                        aria-label={`Reset ${g} ${slot.label}`}
                        onClick={(e) => {
                          e.preventDefault();
                          resetColor(slot.path);
                        }}
                      >
                        ↺
                      </button>
                    )}
                  </label>
                );
              })}
          </div>
        </div>
      ))}

      <div className="controls__actions">
        <button
          type="button"
          className="pill"
          disabled={!edited && !settings.style && !hasShift(settings.shift)}
          onClick={() => updateItemSettings(item.id, () => null)}
        >
          Reset all
        </button>
        <button type="button" className="pill" onClick={copy}>
          {copied ? "Copied" : "Copy JSON"}
        </button>
      </div>
      <p className="controls__note">Saved in this browser automatically.</p>
    </div>
  );
}

/** Large view of one live item, with previous / next, Escape to close, and its style and colour controls. */
function Viewer({ items, index, onNavigate, onClose }: { items: LiveItem[]; index: number; onNavigate: (i: number) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const count = items.length;
  const item = items[index];
  const hasControls = item.styles || item.slots.length > 0;

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    document.documentElement.classList.add("has-lightbox");
    return () => document.documentElement.classList.remove("has-lightbox");
  }, []);

  const step = useCallback((dir: number) => onNavigate((index + dir + count) % count), [index, count, onNavigate]);

  return (
    <dialog
      ref={ref}
      className="lightbox"
      aria-label={item.name}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={(e) => {
        // arrows step between items, except while adjusting a control
        if ((e.target as HTMLElement).closest(".controls")) return;
        if (e.key === "ArrowRight") step(1);
        else if (e.key === "ArrowLeft") step(-1);
      }}
    >
      <div className="lightbox__scrim" onClick={onClose} />
      <div className={`lightbox__panel live__panel${hasControls ? " live__panel--controls" : ""}`}>
        <button type="button" className="icon-button lightbox__close" onClick={onClose} aria-label="Close">
          <CloseIcon />
        </button>
        <div className="live__main">
          <div className="lightbox__stage live__stage">
            <LiveCanvas key={item.id} draw={item.draw} className="live__canvas" />
          </div>
          <div className="lightbox__bar">
            <button type="button" className="icon-button" onClick={() => step(-1)} aria-label="Previous">
              <ArrowIcon flip />
            </button>
            <h2 className="lightbox__name">{item.name}</h2>
            <button type="button" className="icon-button" onClick={() => step(1)} aria-label="Next">
              <ArrowIcon />
            </button>
          </div>
        </div>
        {hasControls && <Controls key={item.id} item={item} />}
      </div>
    </dialog>
  );
}

/** A page of live (canvas-animated) illustrations, grouped into sections; click one to see it large. */
export default function LiveGallery({ title, sections }: { title: string; sections: LiveSection[] }) {
  const all = sections.flatMap((s) => s.items);
  const [active, setActive] = useState<number | null>(null);

  return (
    <div className="catalogue">
      <h1 className="sr-only">{title}</h1>
      <div className="live__tools">
        <PlayToggle />
      </div>
      {sections.map((section) => (
        <section key={section.id} className="live__section" aria-labelledby={`sec-${section.id}`}>
          <h2 id={`sec-${section.id}`} className="live__heading">
            {section.title}
          </h2>
          <ul className="catalogue__grid" role="list">
            {section.items.map((item) => {
              const index = all.indexOf(item);
              return (
                <li key={item.id}>
                  <button type="button" className="tile" aria-haspopup="dialog" onClick={() => setActive(index)}>
                    <span className="tile__stage live__stage">
                      <LiveCanvas draw={item.draw} className="live__canvas" />
                    </span>
                    <span className="tile__name">{item.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {active !== null && <Viewer items={all} index={active} onNavigate={setActive} onClose={() => setActive(null)} />}
    </div>
  );
}
