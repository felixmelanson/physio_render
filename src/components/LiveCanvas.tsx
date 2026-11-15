import { useEffect, useRef } from "react";
import { settingsStore, themeStore } from "../state";

export type DrawFn = (c: CanvasRenderingContext2D, t: number, w: number, h: number) => void;

/* ------------------------------------------------------------------ */
/* One clock and one requestAnimationFrame loop for every live canvas. */
/* ------------------------------------------------------------------ */

const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const clock = { time: 0, playing: !reduced, last: 0 };
const painters = new Set<() => void>();
const listeners = new Set<(playing: boolean) => void>();
let raf = 0;
let lastPaint = 0;

function tick(now: number) {
  if (!clock.last) clock.last = now;
  const dt = Math.min((now - clock.last) / 1000, 0.1);
  clock.last = now;
  if (clock.playing) clock.time += dt;
  // ~30 fps, like the originals
  if (now - lastPaint > 31) {
    lastPaint = now;
    if (clock.playing) painters.forEach((p) => p());
  }
  raf = painters.size ? requestAnimationFrame(tick) : 0;
}

function register(p: () => void) {
  painters.add(p);
  if (!raf) {
    clock.last = 0;
    raf = requestAnimationFrame(tick);
  }
  return () => {
    painters.delete(p);
  };
}

export const animationClock = {
  get playing() {
    return clock.playing;
  },
  setPlaying(on: boolean) {
    clock.playing = on;
    listeners.forEach((l) => l(on));
    if (!on) painters.forEach((p) => p());
  },
  subscribe(l: (playing: boolean) => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

/* ------------------------------------------------------------------ */

interface LiveCanvasProps {
  draw: DrawFn;
  className?: string;
}

/** A canvas that fills its box, redraws with the shared clock while on screen, and stays crisp at any DPR. */
export function LiveCanvas({ draw, className }: LiveCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const c = canvas.getContext("2d");
    if (!c) return;
    let visible = false;
    let unregister: (() => void) | null = null;

    const paint = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w < 1 || h < 1) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.round(w * dpr);
      const H = Math.round(h * dpr);
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, w, h);
      try {
        drawRef.current(c, clock.time, w, h);
      } catch (err) {
        console.error(err);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          visible = e.isIntersecting;
          if (visible && !unregister) {
            paint();
            unregister = register(paint);
          } else if (!visible && unregister) {
            unregister();
            unregister = null;
          }
        }
      },
      { rootMargin: "140px" },
    );
    io.observe(canvas);
    const ro = new ResizeObserver(() => visible && paint());
    ro.observe(canvas);
    // repaint straight away (even while paused) when the theme or an item's settings change
    const repaint = () => visible && paint();
    const offTheme = themeStore.subscribe(repaint);
    const offSettings = settingsStore.subscribe(repaint);

    return () => {
      io.disconnect();
      ro.disconnect();
      offTheme();
      offSettings();
      unregister?.();
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
