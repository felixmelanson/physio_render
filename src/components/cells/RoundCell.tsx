import { useIdPrefix } from "./ids";

/**
 * Generic round progenitor / lymphocyte cell with layered radial gradients,
 * soft nuclear edge and a specular highlight – matches the Nature Reviews style.
 */
export interface RoundCellProps {
  id: string;
  cx: number;
  cy: number;
  r?: number;
  nr?: number;
  /** cytoplasm: [highlight, mid, edge] */
  cyto: [string, string, string];
  stroke: string;
  /** nucleus: [highlight, mid, edge] */
  nuc: [string, string, string];
  nucleusOffset?: [number, number];
}

export function RoundCell({
  id,
  cx,
  cy,
  r = 65,
  nr = 40,
  cyto,
  stroke,
  nuc,
  nucleusOffset = [0, 0],
}: RoundCellProps) {
  const idp = useIdPrefix();
  const cytoId = `${idp}${id}-cyto`;
  const nucId = `${idp}${id}-nuc`;
  const haloId = `${idp}${id}-halo`;
  const [nx, ny] = nucleusOffset;
  return (
    <g>
      <defs>
        <radialGradient id={cytoId} cx="38%" cy="32%" r="75%" fx="34%" fy="28%">
          <stop offset="0%" stopColor={cyto[0]} />
          <stop offset="55%" stopColor={cyto[1]} />
          <stop offset="100%" stopColor={cyto[2]} />
        </radialGradient>
        <radialGradient id={nucId} cx="40%" cy="36%" r="70%">
          <stop offset="0%" stopColor={nuc[0]} />
          <stop offset="60%" stopColor={nuc[1]} />
          <stop offset="100%" stopColor={nuc[2]} />
        </radialGradient>
        <radialGradient id={haloId} cx="50%" cy="50%" r="50%">
          <stop offset="78%" stopColor={nuc[2]} stopOpacity="0.55" />
          <stop offset="100%" stopColor={nuc[2]} stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* cytoplasm */}
      <circle cx={cx} cy={cy} r={r} fill={`url(#${cytoId})`} stroke={stroke} strokeWidth={2.2} />
      {/* soft nuclear halo */}
      <circle cx={cx + nx} cy={cy + ny} r={nr * 1.18} fill={`url(#${haloId})`} />
      {/* nucleus */}
      <circle cx={cx + nx} cy={cy + ny} r={nr} fill={`url(#${nucId})`} />
      {/* specular highlights */}
      <ellipse
        cx={cx - r * 0.33}
        cy={cy - r * 0.42}
        rx={r * 0.28}
        ry={r * 0.16}
        fill="#fff"
        opacity={0.35}
        transform={`rotate(-35 ${cx - r * 0.33} ${cy - r * 0.42})`}
      />
      <ellipse
        cx={cx + nx - nr * 0.3}
        cy={cy + ny - nr * 0.38}
        rx={nr * 0.3}
        ry={nr * 0.17}
        fill="#fff"
        opacity={0.22}
        transform={`rotate(-35 ${cx + nx - nr * 0.3} ${cy + ny - nr * 0.38})`}
      />
    </g>
  );
}
