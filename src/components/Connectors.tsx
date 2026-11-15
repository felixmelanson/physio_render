export const LINE = "var(--line)";

export function ArrowDefs() {
  return (
    <defs>
      <marker id="arrowhead" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="4.2" markerHeight="4.2" orient="auto-start-reverse">
        <path d="M 0 0.5 L 10 5 L 0 9.5 Z" style={{ fill: LINE }} />
      </marker>
    </defs>
  );
}

interface LineProps {
  d: string;
  arrow?: boolean;
}

/** Polyline / path connector in the figure's slate colour. */
export function Connector({ d, arrow = true }: LineProps) {
  return (
    <path
      d={d}
      fill="none"
      style={{ stroke: LINE }}
      strokeWidth={6}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      markerEnd={arrow ? "url(#arrowhead)" : undefined}
    />
  );
}

/** Curved self-renewal loop that wraps around the right side of a cell. */
export function SelfRenewLoop({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const startX = cx + r + 6;
  const startY = cy + 26;
  const endX = cx + 16;
  const endY = cy - r + 4;
  const top = cy - r - 22;
  const d = `M ${startX} ${startY} C ${cx + r + 62} ${startY - 10} ${cx + r + 62} ${top - 2} ${cx + r - 2} ${top} C ${cx + r - 34} ${top + 2} ${cx + 38} ${cy - r - 18} ${endX} ${endY}`;
  return <path d={d} fill="none" style={{ stroke: LINE }} strokeWidth={5} markerEnd="url(#arrowhead)" />;
}

interface LabelProps {
  x: number;
  y: number;
  anchor?: "start" | "middle" | "end";
  children: React.ReactNode;
  size?: number;
  weight?: number | string;
  fill?: string;
}

export function Label({ x, y, anchor = "middle", children, size = 36, weight = 400, fill = "var(--ink)" }: LabelProps) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={size}
      fontWeight={weight}
      fontFamily='"Helvetica Neue", Helvetica, Arial, "Liberation Sans", sans-serif'
      style={{ letterSpacing: "0.2px", fill }}
    >
      {children}
    </text>
  );
}
