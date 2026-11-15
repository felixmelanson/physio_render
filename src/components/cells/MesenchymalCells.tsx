import { stellate } from "./shapes";
import { useIdPrefix } from "./ids";

/* ------------------------------------------------------------------ */
/* MSC – flattened fibroblast-like grey cell                           */
/* ------------------------------------------------------------------ */
export function MSC({ x, y }: { x: number; y: number }) {
  const idp = useIdPrefix();
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`${idp}msc-body`} cx="40%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#e5e4da" />
          <stop offset="50%" stopColor="#c9c8bb" />
          <stop offset="100%" stopColor="#a8a796" />
        </radialGradient>
        <radialGradient id={`${idp}msc-nuc`} cx="42%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#a8c6d0" />
          <stop offset="60%" stopColor="#86adb9" />
          <stop offset="100%" stopColor="#6c95a3" />
        </radialGradient>
      </defs>
      <path
        d="M -92 -14 C -98 -34 -70 -46 -46 -40 C -22 -52 6 -48 26 -40 C 50 -50 86 -42 94 -24 C 102 -8 88 12 66 20 C 48 34 20 42 -4 34 C -30 44 -62 38 -78 24 C -96 14 -100 -2 -92 -14 Z"
        fill={`url(#${idp}msc-body)`}
        stroke="#8d8c7b"
        strokeWidth={2.2}
      />
      <ellipse cx={0} cy={-2} rx={46} ry={14} fill={`url(#${idp}msc-nuc)`} stroke="#6a8e9b" strokeWidth={1.2} />
      <ellipse cx={-14} cy={-6} rx={16} ry={4} fill="#fff" opacity={0.3} />
      <ellipse cx={-56} cy={-26} rx={18} ry={6} fill="#fff" opacity={0.4} transform="rotate(-12 -56 -26)" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Stellate precursor (preadipocyte / preosteoblast / prechondrocyte) */
/* ------------------------------------------------------------------ */
interface StellateProps {
  id: string;
  x: number;
  y: number;
  tips: number[];
  inner?: number;
  rotation?: number;
  pinch?: number;
  body: [string, string, string];
  stroke: string;
  nuc: [string, string, string];
  nucStroke: string;
  nr?: number;
  nucOffset?: [number, number];
}

export function StellateCell({
  id,
  x,
  y,
  tips,
  inner = 46,
  rotation = 0,
  pinch = 0.6,
  body,
  stroke,
  nuc,
  nucStroke,
  nr = 20,
  nucOffset = [0, 0],
}: StellateProps) {
  const idp = useIdPrefix();
  const [nx, ny] = nucOffset;
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`${idp}${id}-body`} cx="40%" cy="34%" r="70%">
          <stop offset="0%" stopColor={body[0]} />
          <stop offset="45%" stopColor={body[1]} />
          <stop offset="100%" stopColor={body[2]} />
        </radialGradient>
        <radialGradient id={`${idp}${id}-nuc`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor={nuc[0]} />
          <stop offset="60%" stopColor={nuc[1]} />
          <stop offset="100%" stopColor={nuc[2]} />
        </radialGradient>
      </defs>
      <path d={stellate(tips, inner, rotation, pinch)} fill={`url(#${idp}${id}-body)`} stroke={stroke} strokeWidth={2.2} strokeLinejoin="round" />
      <circle cx={nx} cy={ny} r={nr + 4} fill={nuc[2]} opacity={0.22} />
      <circle cx={nx} cy={ny} r={nr} fill={`url(#${idp}${id}-nuc)`} stroke={nucStroke} strokeWidth={1.2} />
      <ellipse cx={nx - 6} cy={ny - 8} rx={6} ry={3.5} fill="#fff" opacity={0.4} transform={`rotate(-35 ${nx - 6} ${ny - 8})`} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Adipocyte – lipid-filled sphere with thin rim & flattened nucleus   */
/* ------------------------------------------------------------------ */
export function Adipocyte({ x, y }: { x: number; y: number }) {
  const idp = useIdPrefix();
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`${idp}adi-fat`} cx="40%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#fff3cf" />
          <stop offset="55%" stopColor="#fde2a0" />
          <stop offset="100%" stopColor="#f6c766" />
        </radialGradient>
        <radialGradient id={`${idp}adi-rim`} cx="40%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#e9e8e0" />
          <stop offset="100%" stopColor="#c4c3b6" />
        </radialGradient>
        <radialGradient id={`${idp}adi-nuc`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#8db7e4" />
          <stop offset="60%" stopColor="#5a95d2" />
          <stop offset="100%" stopColor="#3b78bb" />
        </radialGradient>
        <clipPath id={`${idp}adi-clip`}>
          <circle r={65} />
        </clipPath>
      </defs>
      <circle r={66} fill={`url(#${idp}adi-rim)`} stroke="#9e9d90" strokeWidth={2} />
      <circle r={58} fill={`url(#${idp}adi-fat)`} stroke="#d9b45a" strokeWidth={1} />
      <g clipPath={`url(#${idp}adi-clip)`}>
        <ellipse cx={0} cy={-60} rx={24} ry={12} fill={`url(#${idp}adi-nuc)`} stroke="#2f66a5" strokeWidth={1.4} />
        <ellipse cx={-6} cy={-62} rx={8} ry={3} fill="#fff" opacity={0.4} />
      </g>
      <ellipse cx={-26} cy={-30} rx={18} ry={9} fill="#fff" opacity={0.45} transform="rotate(-35 -26 -30)" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Osteoblast – cuboidal blue cell with orange nucleus                 */
/* ------------------------------------------------------------------ */
export function Osteoblast({ x, y }: { x: number; y: number }) {
  const idp = useIdPrefix();
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`${idp}ob-body`} cx="38%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#b3d4ef" />
          <stop offset="50%" stopColor="#71a8d9" />
          <stop offset="100%" stopColor="#3d7cb8" />
        </radialGradient>
        <radialGradient id={`${idp}ob-nuc`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fbc19a" />
          <stop offset="60%" stopColor="#f29462" />
          <stop offset="100%" stopColor="#dd6f3c" />
        </radialGradient>
      </defs>
      <path
        d="M -66 32 L -62 -12 C -58 -44 -30 -58 4 -56 C 38 -54 66 -40 66 -8 L 66 36 C 66 50 56 56 42 56 L -46 56 C -60 56 -68 48 -66 32 Z"
        fill={`url(#${idp}ob-body)`}
        stroke="#2d5f99"
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      <ellipse cx={-2} cy={14} rx={26} ry={20} fill="#1f4b80" opacity={0.25} />
      <ellipse cx={-2} cy={14} rx={22} ry={17} fill={`url(#${idp}ob-nuc)`} stroke="#c45a2e" strokeWidth={1.2} />
      <ellipse cx={-9} cy={7} rx={7} ry={3.5} fill="#fff" opacity={0.4} transform="rotate(-30 -9 7)" />
      <ellipse cx={-30} cy={-34} rx={18} ry={8} fill="#fff" opacity={0.4} transform="rotate(-30 -30 -34)" />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Chondrocyte – blue ellipsoid with purple lacunar nucleus            */
/* ------------------------------------------------------------------ */
export function Chondrocyte({ x, y }: { x: number; y: number }) {
  const idp = useIdPrefix();
  return (
    <g transform={`translate(${x} ${y})`}>
      <defs>
        <radialGradient id={`${idp}ch-body`} cx="38%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#9fc3e6" />
          <stop offset="50%" stopColor="#5f94cf" />
          <stop offset="100%" stopColor="#3367ab" />
        </radialGradient>
        <radialGradient id={`${idp}ch-nuc`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#c9a6d8" />
          <stop offset="55%" stopColor="#a477bd" />
          <stop offset="100%" stopColor="#80559f" />
        </radialGradient>
        <radialGradient id={`${idp}ch-nucleolus`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#5f6fb0" />
          <stop offset="100%" stopColor="#30407e" />
        </radialGradient>
      </defs>
      <ellipse rx={86} ry={56} fill={`url(#${idp}ch-body)`} stroke="#27538f" strokeWidth={2.2} />
      <ellipse cx={6} cy={2} rx={52} ry={36} fill="#1f3f78" opacity={0.25} />
      <ellipse cx={6} cy={2} rx={48} ry={32} fill={`url(#${idp}ch-nuc)`} stroke="#6b4a8e" strokeWidth={1.4} />
      <circle cx={30} cy={2} r={13} fill={`url(#${idp}ch-nucleolus)`} stroke="#273568" strokeWidth={1.2} />
      <ellipse cx={-14} cy={-14} rx={14} ry={6} fill="#fff" opacity={0.3} transform="rotate(-25 -14 -14)" />
      <ellipse cx={-46} cy={-30} rx={20} ry={8} fill="#fff" opacity={0.4} transform="rotate(-20 -46 -30)" />
    </g>
  );
}
