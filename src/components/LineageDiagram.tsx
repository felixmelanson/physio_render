import { ArrowDefs, Connector, Label, SelfRenewLoop } from "./Connectors";
import { Erythrocytes, Megakaryocyte, Platelets } from "./cells/BloodCells";
import { Basophil, Eosinophil, Macrophage, Neutrophil, Osteoclast } from "./cells/MyeloidCells";
import { CancerCells, NKCell, PlasmaCell } from "./cells/LymphoidCells";
import { Adipocyte, Chondrocyte, MSC, Osteoblast } from "./cells/MesenchymalCells";
import { BCell, CLP, CMP, LTHSC, MPP, Preadipocyte, Prechondrocyte, Preosteoblast, STHSC, TCell } from "./cells/NamedCells";

/**
 * Faithful SVG reconstruction of the haematopoietic (a) and mesenchymal (b)
 * stem-cell lineage figure (Nature Reviews Rheumatology).
 * Coordinate space mirrors the source raster (2100 × 1560).
 */
export default function LineageDiagram() {
  return (
    <svg
      viewBox="0 0 2100 1560"
      xmlns="http://www.w3.org/2000/svg"
      className="h-auto w-full"
      role="img"
      aria-label="Haematopoietic and mesenchymal stem cell differentiation diagram"
    >
      <ArrowDefs />
      <rect width="2100" height="1560" style={{ fill: "var(--bg)" }} />

      {/* ========================= PANEL A ========================= */}
      <Label x={6} y={36} anchor="start" weight={700} size={40}>a</Label>

      {/* ---- stem / progenitor column ---- */}
      <LTHSC x={643} y={95} />
      <SelfRenewLoop cx={643} cy={95} r={65} />
      <Label x={556} y={118} anchor="end">LT-HSC</Label>
      <Label x={772} y={56} anchor="start">Self-renewing</Label>

      <Connector d="M 643 166 L 643 256" />

      <STHSC x={643} y={330} />
      <SelfRenewLoop cx={643} cy={330} r={65} />
      <Label x={556} y={345} anchor="end">ST-HSC</Label>
      <Label x={772} y={282} anchor="start">Self-renewing</Label>

      <Connector d="M 643 401 L 643 491" />

      <MPP x={643} y={565} />
      <Label x={556} y={580} anchor="end">MPP</Label>

      {/* MPP -> CMP / CLP */}
      <Connector d="M 643 632 L 643 720" />
      <Connector d="M 640 672 L 915 672 L 915 720" />

      <CMP x={643} y={795} />
      <Label x={556} y={810} anchor="end">CMP</Label>

      <CLP x={915} y={795} />
      <Label x={1000} y={810} anchor="start">CLP</Label>

      {/* CMP -> two myeloid branches */}
      <Connector d="M 643 862 L 643 955" />
      <Connector d="M 646 900 L 290 900 L 290 955" />
      {/* CLP -> lymphoid */}
      <Connector d="M 915 862 L 915 890 L 1450 890 L 1450 955" />

      <Label x={275} y={1004}>Megakaryocyte and erythrocytes</Label>
      <Label x={835} y={1004}>Macrophage and granulocytes</Label>
      <Label x={1450} y={1004}>Lymphoid cells</Label>

      {/* ---- megakaryocyte / erythrocyte lineage ---- */}
      <Erythrocytes x={112} y={1092} />
      <Label x={125} y={1200}>Erythrocytes</Label>
      <Platelets x={362} y={1092} />
      <Label x={362} y={1200}>Platelets</Label>
      <Megakaryocyte x={222} y={1290} />
      <Label x={222} y={1397}>Megakaryocyte</Label>

      {/* ---- macrophage / granulocyte lineage ---- */}
      <Macrophage x={645} y={1090} />
      <Label x={645} y={1200}>Macrophage</Label>
      <Eosinophil x={858} y={1088} />
      <Label x={858} y={1200}>Eosinophil</Label>
      <Neutrophil x={1060} y={1088} />
      <Label x={1060} y={1200}>Neutrophil</Label>

      <Connector d="M 637 1216 L 637 1272" />
      <Osteoclast x={637} y={1345} />
      <Label x={640} y={1448}>Osteoclast</Label>

      <Basophil x={951} y={1290} />
      <Label x={951} y={1397}>Basophil</Label>

      {/* ---- lymphoid lineage ---- */}
      <BCell x={1275} y={1088} />
      <Label x={1275} y={1200}>B cell</Label>
      <TCell x={1447} y={1088} />
      <Label x={1447} y={1200}>T cell</Label>
      <NKCell x={1630} y={1088} />
      <Label x={1630} y={1200}>NK cell</Label>

      {/* B/T -> plasma cell and cancer cells */}
      <Connector d="M 1447 1214 L 1447 1240" arrow={false} />
      <Connector d="M 1275 1214 L 1275 1272" />
      <Connector d="M 1272 1237 L 1778 1237" />

      <PlasmaCell x={1278} y={1343} />
      <Label x={1280} y={1448}>Plasma cell</Label>

      <CancerCells x={1915} y={1330} />
      <Label x={1955} y={1432}>Cancer cells</Label>

      {/* ========================= PANEL B ========================= */}
      <Label x={1280} y={36} anchor="start" weight={700} size={40}>b</Label>

      <MSC x={1627} y={62} />
      <Label x={1524} y={64} anchor="end">MSC</Label>
      <Connector d="M 1724 60 L 1880 60" />
      <Label x={1894} y={74} anchor="start">Other cells?</Label>

      {/* MSC -> three precursors */}
      <Connector d="M 1628 106 L 1628 218" />
      <Connector d="M 1631 165 L 1370 165 L 1370 218" />
      <Connector d="M 1625 165 L 1885 165 L 1885 218" />

      <Preadipocyte x={1372} y={298} />
      <Label x={1380} y={412}>Preadipocyte</Label>

      <Preosteoblast x={1632} y={296} />
      <Label x={1638} y={412}>Preosteoblast</Label>

      <Prechondrocyte x={1900} y={296} />
      <Label x={1920} y={412}>Prechondrocyte</Label>

      <Connector d="M 1370 428 L 1370 498" />
      <Connector d="M 1630 428 L 1630 498" />
      <Connector d="M 1885 428 L 1885 498" />

      <Adipocyte x={1370} y={575} />
      <Label x={1370} y={680}>Adipocyte</Label>
      <Osteoblast x={1635} y={575} />
      <Label x={1635} y={680}>Osteoblast</Label>
      <Chondrocyte x={1887} y={578} />
      <Label x={1890} y={680}>Chondrocyte</Label>

    </svg>
  );
}
