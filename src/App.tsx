import { useCallback, useEffect, useRef, useState } from "react";
import Catalogue from "./components/Catalogue";
import LiveGallery from "./components/LiveGallery";
import { ANIMATED, LAB } from "./data/animated";
import LineageDiagram from "./components/LineageDiagram";
import { SiteNav, type PageId } from "./components/SiteNav";

const TITLES: Record<PageId, string> = {
  flowchart: "Flowchart · Stem cell lineages",
  static: "Static (Old) · Stem cell lineages",
  animated: "Animated · Stem cell lineages",
  lab: "Lab · Stem cell lineages",
};

const PAGE_IDS: PageId[] = ["animated", "lab", "static", "flowchart"];

function pageFromHash(hash: string): PageId {
  const id = hash.replace(/^#\/?/, "").split("/")[0] as PageId;
  if (id === "catalogue") return "static";
  return PAGE_IDS.includes(id) ? id : "flowchart";
}

/**
 * Both pages live in this one file and are addressed by hash (#/flowchart,
 * #/static), so back / forward and direct links work without a second
 * document or a router.
 */
function usePage(): [PageId, (page: PageId) => void] {
  const [page, setPage] = useState<PageId>(() => pageFromHash(window.location.hash));

  useEffect(() => {
    const sync = () => setPage(pageFromHash(window.location.hash));
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const navigate = useCallback((next: PageId) => {
    setPage(next);
    try {
      if (pageFromHash(window.location.hash) !== next) window.location.hash = `/${next}`;
    } catch {
      // Hash navigation can be refused inside a sandboxed frame; the page has still switched.
    }
  }, []);

  return [page, navigate];
}

export default function App() {
  const [page, navigate] = usePage();
  const isFirstRender = useRef(true);

  useEffect(() => {
    document.title = TITLES[page];
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
  }, [page]);

  return (
    <>
      <SiteNav current={page} onNavigate={navigate} />

      <main>
        {page === "static" ? (
          <Catalogue />
        ) : page === "animated" ? (
          <LiveGallery key="animated" title="Animated cells and molecules" sections={ANIMATED} />
        ) : page === "lab" ? (
          <LiveGallery key="lab" title="Lab equipment and cultures" sections={LAB} />
        ) : (
          <div className="mx-auto max-w-[2100px] px-4 py-6">
            <h1 className="sr-only">Flowchart of haematopoietic and mesenchymal stem cell lineages</h1>
            <LineageDiagram />
          </div>
        )}
      </main>
    </>
  );
}
