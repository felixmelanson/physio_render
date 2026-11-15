import { blob, scatter } from "./shapes";
import { useIdPrefix } from "./ids";

/* ------------------------------------------------------------------ */
/* Macrophage – amoeboid purple cell with granules                     */
/* ------------------------------------------------------------------ */
export function Macrophage({ x, y }: { x: number; y: number }) {
  const idp = useIdPrefix();
  const dots = scatter(34, 60, 48, 77, 0).filter(([dx, dy]) => Math.hypot(dx - 10, dy - 2) > 34);
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`${idp}mac-body`} cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#e3d2f0" />
          <stop offset="50%" stopColor="#c6a6dd" />
          <stop offset="100%" stopColor="#a47dc4" />
        </radialGradient>
        <radialGradient id={`${idp}mac-nuc`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#b48bd0" />
          <stop offset="60%" stopColor="#9265b8" />
          <stop offset="100%" stopColor="#7a4fa3" />
        </radialGradient>
      </defs>
      <path
        d="M -72 -8 C -80 -34 -62 -52 -40 -46 C -30 -64 -4 -70 14 -56 C 30 -68 58 -60 60 -40 C 80 -34 84 -10 70 4 C 82 22 70 44 50 42 C 46 60 22 66 8 52 C -8 66 -34 62 -42 46 C -62 50 -80 36 -72 18 C -84 10 -84 0 -72 -8 Z"
        fill={`url(#${idp}mac-body)`}
        stroke="#7c56a0"
        strokeWidth={2.2}
      />
      {dots.map(([dx, dy], i) => (
        <circle key={i} cx={dx} cy={dy} r={2.2 + (i % 3) * 0.6} fill="#f4ecfa" opacity={0.9} />
      ))}
      <circle cx={10} cy={2} r={28} fill={`url(#${idp}mac-nuc)`} stroke="#6a4394" strokeWidth={1.4} />
      <ellipse cx={0} cy={-9} rx={9} ry={5} fill="#fff" opacity={0.3} transform="rotate(-35 0 -9)" />
      <ellipse cx={-40} cy={-30} rx={14} ry={7} fill="#fff" opacity={0.35} transform="rotate(-30 -40 -30)" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Eosinophil – orange cell, bilobed purple nucleus, red granules      */
/* ------------------------------------------------------------------ */
export function Eosinophil({ x, y }: { x: number; y: number }) {
  const idp = useIdPrefix();
  const granules: [number, number][] = [
    [-44, -28], [-20, -48], [10, -52], [36, -40], [50, -14], [52, 14],
    [40, 38], [14, 50], [-16, 50], [-40, 36], [-52, 8], [-6, -24], [26, 22],
  ];
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`${idp}eos-body`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#fdd9bb" />
          <stop offset="50%" stopColor="#f6a977" />
          <stop offset="100%" stopColor="#e9784a" />
        </radialGradient>
        <radialGradient id={`${idp}eos-nuc`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#a284c6" />
          <stop offset="60%" stopColor="#7a5aa8" />
          <stop offset="100%" stopColor="#62458f" />
        </radialGradient>
        <radialGradient id={`${idp}eos-gran`} cx="38%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#f4826b" />
          <stop offset="100%" stopColor="#c93f2a" />
        </radialGradient>
      </defs>
      <circle r={65} fill={`url(#${idp}eos-body)`} stroke="#c75a2e" strokeWidth={2.2} />
      {/* bilobed nucleus: two lobes joined by a chromatin bridge */}
      <path d="M -10 -4 C -2 -8 4 -6 8 0" fill="none" stroke="#5b3f8c" strokeWidth={7} strokeLinecap="round" />
      <g transform="translate(-22 -2) rotate(18)">
        <ellipse rx={17} ry={25} fill={`url(#${idp}eos-nuc)`} stroke="#5b3f8c" strokeWidth={1.4} />
        <path d="M -8 -14 C -4 -22 4 -22 8 -14 C 4 -8 -4 -8 -8 -14 Z" fill="#dcd0ec" opacity={0.8} />
        <ellipse cx={-5} cy={-9} rx={5} ry={3} fill="#fff" opacity={0.3} />
      </g>
      <g transform="translate(20 0) rotate(-26)">
        <ellipse rx={16} ry={25} fill={`url(#${idp}eos-nuc)`} stroke="#5b3f8c" strokeWidth={1.4} />
        <path d="M -8 -12 C -4 -20 4 -20 8 -12 C 4 -6 -4 -6 -8 -12 Z" fill="#dcd0ec" opacity={0.8} />
        <path d="M -6 8 C -2 2 4 2 7 8 C 3 14 -3 14 -6 8 Z" fill="#dcd0ec" opacity={0.6} />
      </g>
      {granules.map(([gx, gy], i) => (
        <circle key={i} cx={gx} cy={gy} r={5.2} fill={`url(#${idp}eos-gran)`} stroke="#a9311f" strokeWidth={0.8} />
      ))}
      <ellipse cx={-26} cy={-38} rx={16} ry={8} fill="#fff" opacity={0.35} transform="rotate(-35 -26 -38)" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Neutrophil – beige cell, segmented (multilobed) nucleus             */
/* ------------------------------------------------------------------ */
export function Neutrophil({ x, y }: { x: number; y: number }) {
  const idp = useIdPrefix();
  const dots = scatter(26, 56, 56, 91, 30);
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`${idp}neu-body`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#f4efe1" />
          <stop offset="50%" stopColor="#e0d6bb" />
          <stop offset="100%" stopColor="#c6b891" />
        </radialGradient>
        <radialGradient id={`${idp}neu-nuc`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#c7b58a" />
          <stop offset="60%" stopColor="#a8945f" />
          <stop offset="100%" stopColor="#8d7a48" />
        </radialGradient>
      </defs>
      <path d={blob(66, 64, 18, 0.08, 7)} fill={`url(#${idp}neu-body)`} stroke="#9e8f66" strokeWidth={2.2} />
      {dots.map(([dx, dy], i) => (
        <circle key={i} cx={dx} cy={dy} r={2.2 + (i % 2)} fill="#fbf8ef" opacity={0.9} />
      ))}
      {/* segmented nucleus: three lobes connected by thin filaments */}
      <g stroke="#7f6c3c" strokeWidth={3} fill="none" strokeLinecap="round">
        <path d="M -14 -12 Q -4 -16 4 -10" />
        <path d="M 14 8 Q 10 18 2 24" />
      </g>
      <path d="M -40 -12 C -44 -30 -26 -40 -14 -30 C -6 -22 -10 -6 -22 -2 C -32 2 -40 -2 -40 -12 Z" fill={`url(#${idp}neu-nuc)`} stroke="#7f6c3c" strokeWidth={1.4} />
      <path d="M 4 -14 C 8 -30 30 -32 34 -16 C 38 -2 28 8 16 8 C 6 8 0 -2 4 -14 Z" fill={`url(#${idp}neu-nuc)`} stroke="#7f6c3c" strokeWidth={1.4} />
      <path d="M -10 24 C -14 10 4 8 10 18 C 18 30 8 44 -4 42 C -14 40 -12 32 -10 24 Z" fill={`url(#${idp}neu-nuc)`} stroke="#7f6c3c" strokeWidth={1.4} />
      <path d="M -32 -22 C -28 -30 -18 -28 -22 -18" fill="#ebe3cc" opacity={0.8} />
      <path d="M 14 -22 C 20 -28 28 -22 22 -14" fill="#ebe3cc" opacity={0.8} />
      <ellipse cx={-26} cy={-40} rx={16} ry={8} fill="#fff" opacity={0.4} transform="rotate(-35 -26 -40)" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Basophil – cyan cell, U-shaped nucleus, pale granules               */
/* ------------------------------------------------------------------ */
export function Basophil({ x, y }: { x: number; y: number }) {
  const idp = useIdPrefix();
  const dots = scatter(30, 58, 58, 55, 0);
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`${idp}bas-body`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#dff3f7" />
          <stop offset="50%" stopColor="#a9dbe6" />
          <stop offset="100%" stopColor="#6fbccf" />
        </radialGradient>
        <linearGradient id={`${idp}bas-nuc`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8ccbdb" />
          <stop offset="100%" stopColor="#4b9db5" />
        </linearGradient>
      </defs>
      <circle r={65} fill={`url(#${idp}bas-body)`} stroke="#3f8fa6" strokeWidth={2.2} />
      {dots.map(([dx, dy], i) => (
        <circle key={i} cx={dx} cy={dy} r={3 + (i % 3) * 0.8} fill="#f1fafc" stroke="#7fc3d3" strokeWidth={0.6} opacity={0.95} />
      ))}
      {/* U / C-shaped nucleus */}
      <path
        d="M 20 -28 C -8 -40 -38 -22 -36 4 C -34 28 -10 42 12 34 C 30 28 36 10 26 0"
        fill="none"
        stroke="#2f7f98"
        strokeWidth={22}
        strokeLinecap="round"
      />
      <path
        d="M 20 -28 C -8 -40 -38 -22 -36 4 C -34 28 -10 42 12 34 C 30 28 36 10 26 0"
        fill="none"
        stroke={`url(#${idp}bas-nuc)`}
        strokeWidth={18}
        strokeLinecap="round"
      />
      <path d="M 6 -30 C -14 -34 -30 -20 -30 -2" fill="none" stroke="#cfeaf1" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
      <ellipse cx={-26} cy={-40} rx={16} ry={8} fill="#fff" opacity={0.4} transform="rotate(-35 -26 -40)" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Osteoclast – dome-shaped multinucleated cell with ruffled border    */
/* ------------------------------------------------------------------ */
export function Osteoclast({ x, y }: { x: number; y: number }) {
  const idp = useIdPrefix();
  // ruffled bottom edge built from alternating arcs
  const ruffle: string[] = [];
  const left = -82;
  const right = 82;
  const steps = 9;
  const w = (right - left) / steps;
  for (let i = 0; i < steps; i++) {
    const x0 = right - i * w;
    const x1 = x0 - w;
    const mid = (x0 + x1) / 2;
    const depth = i % 2 === 0 ? 14 : 8;
    ruffle.push(`Q ${mid} ${58 + depth} ${x1} 52`);
  }
  const d = `M ${left} 52 C -90 10 -70 -40 -34 -58 C -10 -70 24 -68 46 -54 C 78 -36 92 8 ${right} 52 ${ruffle.join(" ")} Z`;

  const nuclei: [number, number, number][] = [
    [-42, -12, 16],
    [16, -34, 14],
    [38, -4, 13],
    [-8, 18, 14],
  ];
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`${idp}oc-body`} cx="38%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#f9c29f" />
          <stop offset="50%" stopColor="#ee8b5c" />
          <stop offset="100%" stopColor="#d4532e" />
        </radialGradient>
        <radialGradient id={`${idp}oc-nuc`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#7788c6" />
          <stop offset="60%" stopColor="#4f62ab" />
          <stop offset="100%" stopColor="#3b4b8e" />
        </radialGradient>
      </defs>
      <path d={d} fill={`url(#${idp}oc-body)`} stroke="#b7401e" strokeWidth={2.2} strokeLinejoin="round" />
      {nuclei.map(([cx, cy, r], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={r + 4} fill="#8a3a22" opacity={0.25} />
          <circle cx={cx} cy={cy} r={r} fill={`url(#${idp}oc-nuc)`} stroke="#33427f" strokeWidth={1.2} />
          <ellipse cx={cx - r * 0.3} cy={cy - r * 0.35} rx={r * 0.3} ry={r * 0.17} fill="#fff" opacity={0.3} transform={`rotate(-35 ${cx - r * 0.3} ${cy - r * 0.35})`} />
        </g>
      ))}
      <ellipse cx={-34} cy={-44} rx={18} ry={8} fill="#fff" opacity={0.35} transform="rotate(-30 -34 -44)" />
    </g>
  );
}
