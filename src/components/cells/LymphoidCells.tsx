import { blob } from "./shapes";
import { useIdPrefix } from "./ids";

/* ------------------------------------------------------------------ */
/* NK cell – red/orange cell with indented nucleus and granules        */
/* ------------------------------------------------------------------ */
export function NKCell({ x, y }: { x: number; y: number }) {
  const idp = useIdPrefix();
  const granules: [number, number][] = [
    [-44, -8], [-36, -24], [-30, 6], [-44, 14], [-22, -10], [-36, 26], [-24, 22],
    [-14, 32], [-30, -36], [-18, -30], [-10, 14], [-48, 2],
  ];
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`${idp}nk-body`} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#fbc4a8" />
          <stop offset="50%" stopColor="#f3896a" />
          <stop offset="100%" stopColor="#e2583a" />
        </radialGradient>
        <radialGradient id={`${idp}nk-nuc`} cx="45%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#ef7a5c" />
          <stop offset="60%" stopColor="#dd4b32" />
          <stop offset="100%" stopColor="#bf3520" />
        </radialGradient>
      </defs>
      <circle r={65} fill={`url(#${idp}nk-body)`} stroke="#bf452a" strokeWidth={2.2} />
      {/* kidney-shaped nucleus */}
      <path
        d="M 4 -44 C 30 -46 50 -26 50 0 C 50 26 30 46 4 44 C -8 43 -12 34 -6 26 C 4 12 4 -12 -6 -26 C -12 -34 -8 -43 4 -44 Z"
        fill={`url(#${idp}nk-nuc)`}
        stroke="#a83020"
        strokeWidth={1.4}
      />
      <path d="M 14 -30 C 28 -30 36 -18 34 -6" fill="none" stroke="#f8b19c" strokeWidth={4} strokeLinecap="round" opacity={0.65} />
      {granules.map(([gx, gy], i) => (
        <circle key={i} cx={gx} cy={gy} r={3.4 + (i % 2) * 0.8} fill="#fde7dc" stroke="#e58b70" strokeWidth={0.6} />
      ))}
      <ellipse cx={-26} cy={-40} rx={16} ry={8} fill="#fff" opacity={0.35} transform="rotate(-35 -26 -40)" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Plasma cell – oval purple cell, eccentric nucleus, RER cisternae    */
/* ------------------------------------------------------------------ */
export function PlasmaCell({ x, y }: { x: number; y: number }) {
  const idp = useIdPrefix();
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`${idp}pc-body`} cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#c9b8e2" />
          <stop offset="50%" stopColor="#9f86c8" />
          <stop offset="100%" stopColor="#765ba8" />
        </radialGradient>
        <radialGradient id={`${idp}pc-nuc`} cx="40%" cy="36%" r="70%">
          <stop offset="0%" stopColor="#8e74b8" />
          <stop offset="60%" stopColor="#6a509c" />
          <stop offset="100%" stopColor="#543c86" />
        </radialGradient>
      </defs>
      <g transform="rotate(-6)">
        <ellipse rx={96} ry={66} fill={`url(#${idp}pc-body)`} stroke="#55408f" strokeWidth={2.2} />
        {/* eccentric nucleus with cartwheel chromatin */}
        <circle cx={-34} cy={0} r={46} fill="#4a357c" opacity={0.3} />
        <circle cx={-34} cy={0} r={42} fill={`url(#${idp}pc-nuc)`} stroke="#4a357c" strokeWidth={1.4} />
        <g stroke="#b7a4d6" strokeWidth={3} strokeLinecap="round" opacity={0.55} fill="none">
          <path d="M -34 -30 L -34 -12" />
          <path d="M -60 -10 L -46 -4" />
          <path d="M -8 -10 L -22 -4" />
          <path d="M -34 30 L -34 12" />
          <path d="M -56 20 L -46 10" />
          <path d="M -12 20 L -22 10" />
        </g>
        <circle cx={-34} cy={0} r={9} fill="#c5b3e0" opacity={0.6} />
        {/* stacked rough ER cisternae */}
        <g fill="none" stroke="#8c3d52" strokeWidth={4.2} strokeLinecap="round">
          <path d="M 2 -48 C 26 -30 26 30 2 48" />
          <path d="M 16 -44 C 40 -26 40 26 16 44" />
          <path d="M 30 -36 C 52 -20 52 20 30 36" />
        </g>
        {/* secretory vesicles */}
        <circle cx={56} cy={-22} r={6} fill="#b9a5d8" stroke="#5a4593" strokeWidth={1.2} />
        <circle cx={68} cy={0} r={6} fill="#b9a5d8" stroke="#5a4593" strokeWidth={1.2} />
        <circle cx={58} cy={22} r={6} fill="#b9a5d8" stroke="#5a4593" strokeWidth={1.2} />
        <ellipse cx={-40} cy={-46} rx={20} ry={9} fill="#fff" opacity={0.3} transform="rotate(-25 -40 -46)" />
      </g>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Cancer cells – two pleomorphic cyan cells and one purple cell       */
/* ------------------------------------------------------------------ */
export function CancerCells({ x, y }: { x: number; y: number }) {
  const idp = useIdPrefix();
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`${idp}ca-cyan`} cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#e3f4f7" />
          <stop offset="50%" stopColor="#b7e1ea" />
          <stop offset="100%" stopColor="#7ec5d6" />
        </radialGradient>
        <radialGradient id={`${idp}ca-cyan-nuc`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#7fd0e0" />
          <stop offset="60%" stopColor="#3fa9c2" />
          <stop offset="100%" stopColor="#2a8aa3" />
        </radialGradient>
        <radialGradient id={`${idp}ca-purple`} cx="38%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#c3aee0" />
          <stop offset="50%" stopColor="#9a7cc6" />
          <stop offset="100%" stopColor="#6f54a4" />
        </radialGradient>
        <radialGradient id={`${idp}ca-purple-nuc`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#8e73b9" />
          <stop offset="60%" stopColor="#6a4f9e" />
          <stop offset="100%" stopColor="#523985" />
        </radialGradient>
      </defs>

      {/* upper-right cyan cell */}
      <g transform="translate(70 -175)">
        <path
          d="M -70 -20 C -78 -50 -40 -62 -10 -56 C 30 -66 70 -52 78 -20 C 86 10 70 36 44 48 C 20 60 -4 52 -16 40 C -40 50 -74 36 -76 10 C -78 -4 -76 -12 -70 -20 Z"
          fill={`url(#${idp}ca-cyan)`}
          stroke="#4a9fb3"
          strokeWidth={2.2}
        />
        <circle cx={20} cy={-2} r={19} fill={`url(#${idp}ca-cyan-nuc)`} stroke="#2a7d94" strokeWidth={1.2} />
        <ellipse cx={13} cy={-9} rx={6} ry={3.5} fill="#fff" opacity={0.4} transform="rotate(-35 13 -9)" />
        <ellipse cx={-40} cy={-34} rx={16} ry={7} fill="#fff" opacity={0.4} transform="rotate(-20 -40 -34)" />
      </g>

      {/* lower-left cyan cell */}
      <g transform="translate(-68 -55)">
        <path
          d="M -60 -24 C -50 -62 10 -76 44 -52 C 70 -34 72 6 54 34 C 36 62 -2 72 -34 56 C -62 42 -70 6 -60 -24 Z"
          fill={`url(#${idp}ca-cyan)`}
          stroke="#4a9fb3"
          strokeWidth={2.2}
        />
        <circle cx={4} cy={4} r={21} fill={`url(#${idp}ca-cyan-nuc)`} stroke="#2a7d94" strokeWidth={1.2} />
        <ellipse cx={-3} cy={-4} rx={7} ry={4} fill="#fff" opacity={0.4} transform="rotate(-35 -3 -4)" />
        <ellipse cx={-30} cy={-40} rx={16} ry={7} fill="#fff" opacity={0.4} transform="rotate(-40 -30 -40)" />
      </g>

      {/* purple pleomorphic cell */}
      <g transform="translate(72 -28)">
        <path d={blob(70, 66, 14, 0.15, 23, 0.4)} fill={`url(#${idp}ca-purple)`} stroke="#4e3a85" strokeWidth={2.2} />
        <path
          d="M -30 -34 C -10 -52 22 -44 28 -20 C 32 -4 20 12 2 16 C -20 20 -40 6 -40 -12 C -40 -22 -36 -30 -30 -34 Z"
          fill={`url(#${idp}ca-purple-nuc)`}
          stroke="#43307a"
          strokeWidth={1.4}
        />
        <circle cx={34} cy={14} r={7} fill="#b8a4d6" stroke="#4e3a85" strokeWidth={1.2} />
        <circle cx={50} cy={34} r={6} fill="#b8a4d6" stroke="#4e3a85" strokeWidth={1.2} />
        <circle cx={28} cy={42} r={5.5} fill="#b8a4d6" stroke="#4e3a85" strokeWidth={1.2} />
        <ellipse cx={-14} cy={-24} rx={9} ry={4.5} fill="#fff" opacity={0.3} transform="rotate(-30 -14 -24)" />
        <ellipse cx={-30} cy={-52} rx={14} ry={6} fill="#fff" opacity={0.3} transform="rotate(-30 -30 -52)" />
      </g>
    </g>
  );
}
