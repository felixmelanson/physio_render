type DrawOpts = { style?: string; dark?: boolean; evidence?: string; colors?: Record<string, number[] | string> };
declare module "*/engines/atlas.js" {
  export function drawSpecimen(c: CanvasRenderingContext2D, key: string, t: number, w: number, h: number, o?: DrawOpts): void;
  export function getColor(path: string): number[] | null;
  export function setLabels(on: boolean): void;
  export function setActivityCues(on: boolean): void;
}
declare module "*/engines/lab.js" {
  export function drawProp(c: CanvasRenderingContext2D, key: string, t: number, w: number, h: number, o?: DrawOpts): void;
  export function getColor(path: string, dark?: boolean): number[] | null;
  export const PROP_KEYS: string[];
}
declare module "*/engines/piezo.js" {
  export function drawPiezo(c: CanvasRenderingContext2D, shape: string, t: number, w: number, h: number, o?: DrawOpts): void;
  export const PIEZO_DEFAULTS: { blade1: string; blade2: string; blade3: string; ink: string };
  export const PIEZO_SHAPES: string[];
  export function piezoOpen(t: number): number;
}
declare module "*/engines/semantic.js" {
  export const V2_REMAP: Record<string, string>;
}
declare module "*/engines/bone-v2.js";
