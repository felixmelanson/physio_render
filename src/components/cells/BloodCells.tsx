import { blob, scatter } from "./shapes";
import { useIdPrefix } from "./ids";

/* ------------------------------------------------------------------ */
/* Erythrocytes – cluster of four biconcave discs                      */
/* ------------------------------------------------------------------ */
export function Erythrocytes({ x, y }: { x: number; y: number }) {
  const idp = useIdPrefix();
  const cells: [number, number][] = [
    [-30, -32],
    [36, -34],
    [-42, 32],
    [26, 32],
  ];
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`${idp}rbc-body`} cx="42%" cy="36%" r="70%">
          <stop offset="0%" stopColor="#fbdcea" />
          <stop offset="55%" stopColor="#f2b7d2" />
          <stop offset="100%" stopColor="#dd8db7" />
        </radialGradient>
        <radialGradient id={`${idp}rbc-dimple`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#efadd0" />
          <stop offset="45%" stopColor="#e596bf" />
          <stop offset="85%" stopColor="#d679a9" />
          <stop offset="100%" stopColor="#d679a9" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${idp}rbc-ring`} cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="#fff" stopOpacity="0" />
          <stop offset="78%" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {cells.map(([cx, cy], i) => (
        <g key={i} transform={`translate(${cx} ${cy})`}>
          <circle r={45} fill={`url(#${idp}rbc-body)`} stroke="#c76a9f" strokeWidth={2} />
          <circle r={41} fill={`url(#${idp}rbc-ring)`} />
          <circle r={27} fill={`url(#${idp}rbc-dimple)`} />
          <ellipse cx={-16} cy={-20} rx={12} ry={6} fill="#fff" opacity={0.4} transform="rotate(-35 -16 -20)" />
        </g>
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Platelets – scattered irregular fragments with granules             */
/* ------------------------------------------------------------------ */
export function Platelets({ x, y }: { x: number; y: number }) {
  const idp = useIdPrefix();
  const items: { cx: number; cy: number; rx: number; ry: number; rot: number; seed: number }[] = [
    { cx: -45, cy: -52, rx: 20, ry: 14, rot: 20, seed: 11 },
    { cx: 10, cy: -58, rx: 22, ry: 18, rot: -15, seed: 12 },
    { cx: 56, cy: -50, rx: 17, ry: 14, rot: 40, seed: 13 },
    { cx: -62, cy: -5, rx: 16, ry: 22, rot: 10, seed: 14 },
    { cx: -12, cy: -12, rx: 24, ry: 17, rot: -30, seed: 15 },
    { cx: 42, cy: -8, rx: 20, ry: 24, rot: 15, seed: 16 },
    { cx: -40, cy: 42, rx: 22, ry: 16, rot: 25, seed: 17 },
    { cx: 12, cy: 46, rx: 18, ry: 14, rot: -10, seed: 18 },
    { cx: 58, cy: 42, rx: 19, ry: 16, rot: 50, seed: 19 },
  ];
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`${idp}plt-body`} cx="40%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#fde6f0" />
          <stop offset="60%" stopColor="#f3bcd6" />
          <stop offset="100%" stopColor="#e39ac2" />
        </radialGradient>
        <radialGradient id={`${idp}plt-gran`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#e68fbc" />
          <stop offset="100%" stopColor="#cf5f9c" />
        </radialGradient>
      </defs>
      {items.map((p, i) => {
        const grains = scatter(3 + (i % 3), p.rx * 0.55, p.ry * 0.5, p.seed * 7);
        return (
          <g key={i} transform={`translate(${p.cx} ${p.cy}) rotate(${p.rot})`}>
            <path d={blob(p.rx, p.ry, 9, 0.16, p.seed)} fill={`url(#${idp}plt-body)`} stroke="#c76a9f" strokeWidth={1.8} />
            {grains.map(([gx, gy], j) => (
              <circle key={j} cx={gx} cy={gy} r={3.2 + ((j + i) % 2) * 0.8} fill={`url(#${idp}plt-gran)`} stroke="#c76a9f" strokeWidth={0.6} />
            ))}
          </g>
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Megakaryocyte – large ruffled cell with multilobed nucleus          */
/* ------------------------------------------------------------------ */
export function Megakaryocyte({ x, y }: { x: number; y: number }) {
  const idp = useIdPrefix();
  const lobes: [number, number, number][] = [
    [-18, -22, 24],
    [22, -4, 20],
    [-34, 16, 22],
    [8, 28, 17],
  ];
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`${idp}mk-body`} cx="40%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#fbe2ee" />
          <stop offset="50%" stopColor="#f2bdd7" />
          <stop offset="100%" stopColor="#e39cc3" />
        </radialGradient>
        <radialGradient id={`${idp}mk-lobe`} cx="38%" cy="34%" r="70%">
          <stop offset="0%" stopColor="#ef9fc9" />
          <stop offset="55%" stopColor="#dc6fa9" />
          <stop offset="100%" stopColor="#c7508f" />
        </radialGradient>
      </defs>
      <path d={blob(88, 76, 16, 0.14, 42)} fill={`url(#${idp}mk-body)`} stroke="#c0669b" strokeWidth={2.2} />
      {/* chromatin bridges */}
      <g stroke="#9a4f85" strokeWidth={5} strokeLinecap="round" fill="none">
        <path d="M -8 -14 Q 2 -12 10 -8" />
        <path d="M -24 -4 Q -28 6 -30 12" />
        <path d="M 14 10 Q 10 18 6 22" />
        <path d="M -16 20 Q -4 24 -2 28" />
      </g>
      {lobes.map(([cx, cy, r], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={r} fill={`url(#${idp}mk-lobe)`} stroke="#a9478a" strokeWidth={1.6} />
          <ellipse cx={cx - r * 0.3} cy={cy - r * 0.35} rx={r * 0.32} ry={r * 0.18} fill="#fff" opacity={0.35} transform={`rotate(-35 ${cx - r * 0.3} ${cy - r * 0.35})`} />
        </g>
      ))}
      <ellipse cx={-42} cy={-44} rx={18} ry={9} fill="#fff" opacity={0.35} transform="rotate(-30 -42 -44)" />
    </g>
  );
}
