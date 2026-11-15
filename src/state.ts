import { useEffect, useState, useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ */
/* Tiny store helper                                                   */
/* ------------------------------------------------------------------ */

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private mode / blocked storage: settings just won't persist
  }
}

function createStore<T>(key: string, initial: T) {
  let value = load(key, initial);
  const subs = new Set<() => void>();
  return {
    get: () => value,
    set(next: T) {
      value = next;
      save(key, value);
      subs.forEach((s) => s());
    },
    subscribe(fn: () => void) {
      subs.add(fn);
      return () => {
        subs.delete(fn);
      };
    },
  };
}

/* ------------------------------------------------------------------ */
/* Theme: light, or pure-black dark                                    */
/* ------------------------------------------------------------------ */

export type Theme = "light" | "dark";

const systemDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
export const themeStore = createStore<Theme>("physio-render:theme", systemDark ? "dark" : "light");

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export const isDark = () => themeStore.get() === "dark";

export function useTheme(): [Theme, (t: Theme) => void] {
  const theme = useSyncExternalStore(themeStore.subscribe, themeStore.get);
  useEffect(() => applyTheme(theme), [theme]);
  return [theme, themeStore.set];
}

/* ------------------------------------------------------------------ */
/* Per-item settings: render style and colour overrides                */
/* ------------------------------------------------------------------ */

export type StyleKey = "atlas" | "ink" | "clay" | "glass" | "wire" | "gloss" | "cel" | "engrave" | "glow";

export const STYLES: { id: StyleKey; label: string }[] = [
  { id: "atlas", label: "Atlas" },
  { id: "ink", label: "Ink" },
  { id: "clay", label: "Clay" },
  { id: "glass", label: "Glass" },
  { id: "wire", label: "Wire" },
  { id: "gloss", label: "Gloss" },
  { id: "cel", label: "Cel" },
  { id: "engrave", label: "Engraving" },
  { id: "glow", label: "Fluorescence" },
];

export interface ItemSettings {
  style?: StyleKey;
  /** slot path → #rrggbb */
  colors?: Record<string, string>;
  /** Shift applied to every colour of the item: hue in degrees, saturation and lightness in -100…100. */
  shift?: { h: number; s: number; l: number };
  /** Evidence treatment (REVISION.md §1): measured = full, literature = 70% fill, hypothesis = 35% fill + dashed outline. */
  evidence?: EvidenceKey;
}

export type EvidenceKey = "measured" | "literature" | "hypothesis";
export const EVIDENCE_LEVELS: { id: EvidenceKey | undefined; label: string }[] = [
  { id: undefined, label: "Not set" },
  { id: "measured", label: "Measured" },
  { id: "literature", label: "Literature" },
  { id: "hypothesis", label: "Hypothesis" },
];

export const hasShift = (x?: ItemSettings["shift"]) => !!x && (x.h !== 0 || x.s !== 0 || x.l !== 0);

export const settingsStore = createStore<Record<string, ItemSettings>>("physio-render:items", {});

export const getItemSettings = (id: string): ItemSettings => settingsStore.get()[id] ?? {};

export function updateItemSettings(id: string, patch: (s: ItemSettings) => ItemSettings | null) {
  const all = { ...settingsStore.get() };
  const next = patch(all[id] ?? {});
  if (next && (next.style || next.evidence || (next.colors && Object.keys(next.colors).length) || hasShift(next.shift))) all[id] = next;
  else delete all[id];
  settingsStore.set(all);
}

export function useItemSettings(id: string): ItemSettings {
  const all = useSyncExternalStore(settingsStore.subscribe, settingsStore.get);
  return all[id] ?? {};
}

/** Re-render whenever any store changes (used to repaint paused canvases). */
export function useStoresVersion() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const bump = () => setV((n) => n + 1);
    const a = themeStore.subscribe(bump);
    const b = settingsStore.subscribe(bump);
    return () => {
      a();
      b();
    };
  }, []);
  return v;
}

/* ------------------------------------------------------------------ */
/* Colour conversion                                                   */
/* ------------------------------------------------------------------ */

export const rgbToHex = (c: number[]) => "#" + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
/** Shift a colour's hue, saturation and lightness (HSL). */
export function shiftColor(rgb: number[], sh: { h: number; s: number; l: number }): number[] {
  const [r, g, b] = rgb.map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  const H = (((h + sh.h) % 360) + 360) % 360;
  const S = Math.min(1, Math.max(0, s * (1 + sh.s / 100)));
  const L = Math.min(1, Math.max(0, sh.l >= 0 ? l + (1 - l) * (sh.l / 100) : l * (1 + sh.l / 100)));
  const C = (1 - Math.abs(2 * L - 1)) * S, X = C * (1 - Math.abs(((H / 60) % 2) - 1)), m = L - C / 2;
  const [r1, g1, b1] = H < 60 ? [C, X, 0] : H < 120 ? [X, C, 0] : H < 180 ? [0, C, X] : H < 240 ? [0, X, C] : H < 300 ? [X, 0, C] : [C, 0, X];
  return [(r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255];
}

export const hexToRgb = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
