import { RoundCell } from "./RoundCell";
import { StellateCell } from "./MesenchymalCells";

/**
 * The round progenitors / lymphocytes and the stellate precursors share a
 * generic drawing and differ only in palette and proportions. Each one is
 * defined here once, so the flowchart and the catalogue use identical artwork.
 */
type Pos = { x: number; y: number };

/* ---- haematopoietic stem / progenitor cells ---- */

export const LTHSC = ({ x, y }: Pos) => (
  <RoundCell id="lthsc" cx={x} cy={y} cyto={["#f0efe9", "#dcdbd1", "#c3c2b4"]} stroke="#a3a292" nuc={["#cfcdbf", "#b7b5a4", "#9e9c88"]} nr={42} />
);

export const STHSC = ({ x, y }: Pos) => (
  <RoundCell id="sthsc" cx={x} cy={y} cyto={["#e8eff2", "#cbd8de", "#afc2ca"]} stroke="#8ea4ae" nuc={["#c3d6dd", "#a8c2cb", "#8fadb8"]} nr={42} />
);

export const MPP = ({ x, y }: Pos) => (
  <RoundCell id="mpp" cx={x} cy={y} cyto={["#e6dfd0", "#d3c8b1", "#bcae8f"]} stroke="#9c8f72" nuc={["#cbbd9b", "#b5a47d", "#9b8862"]} nr={42} />
);

export const CMP = ({ x, y }: Pos) => (
  <RoundCell id="cmp" cx={x} cy={y} cyto={["#fff6d6", "#fde6a4", "#f8cf6c"]} stroke="#dcaa3c" nuc={["#fde07a", "#f7c84a", "#eeb12c"]} nr={42} />
);

export const CLP = ({ x, y }: Pos) => (
  <RoundCell id="clp" cx={x} cy={y} cyto={["#dff3ee", "#b9e4db", "#8fd0c3"]} stroke="#5cb3a1" nuc={["#9fdacd", "#72c4b2", "#52ad9a"]} nr={46} />
);

/* ---- lymphocytes ---- */

export const BCell = ({ x, y }: Pos) => (
  <RoundCell id="bcell" cx={x} cy={y} cyto={["#c2cde6", "#9aabd3", "#7488bd"]} stroke="#4b5f9c" nuc={["#7384bd", "#51649f", "#3b4c86"]} nr={50} />
);

export const TCell = ({ x, y }: Pos) => (
  <RoundCell id="tcell" cx={x} cy={y} cyto={["#f8d2cd", "#efa9a3", "#e2827b"]} stroke="#c3554c" nuc={["#ea8f88", "#d9655d", "#c3483f"]} nr={50} />
);

/* ---- mesenchymal precursors ---- */

export const Preadipocyte = ({ x, y }: Pos) => (
  <StellateCell
    id="preadi"
    x={x}
    y={y}
    tips={[86, 72, 84, 70, 80, 74]}
    inner={50}
    rotation={-0.55}
    pinch={0.62}
    body={["#fff2c4", "#fcdc84", "#f3c24e"]}
    stroke="#d59f2c"
    nuc={["#8dbbe8", "#5a97d4", "#3b78bb"]}
    nucStroke="#2f66a5"
    nucOffset={[6, 0]}
  />
);

export const Preosteoblast = ({ x, y }: Pos) => (
  <StellateCell
    id="preost"
    x={x}
    y={y}
    tips={[88, 70, 82, 76, 84, 68]}
    inner={50}
    rotation={0.35}
    pinch={0.62}
    body={["#c7dcf2", "#8fb6e0", "#5c8fc6"]}
    stroke="#38699f"
    nuc={["#fcc39c", "#f49a68", "#e3743f"]}
    nucStroke="#c45a2e"
    nucOffset={[-6, 2]}
  />
);

export const Prechondrocyte = ({ x, y }: Pos) => (
  <StellateCell
    id="prechon"
    x={x}
    y={y}
    tips={[80, 74, 82, 70, 78, 72]}
    inner={50}
    rotation={1.0}
    pinch={0.62}
    body={["#b4cdeb", "#7ca7d8", "#4b7cbd"]}
    stroke="#2f5f9a"
    nuc={["#6c7ab8", "#4a5a9c", "#36457f"]}
    nucStroke="#2b375f"
    nucOffset={[4, 2]}
  />
);
