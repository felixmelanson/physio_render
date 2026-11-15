import type { MouseEvent } from "react";
import { useTheme } from "../state";

export type PageId = "flowchart" | "static" | "animated" | "lab";

export const PAGES: { id: PageId; label: string }[] = [
  { id: "animated", label: "Animated" },
  { id: "lab", label: "Lab" },
  { id: "static", label: "Static (Old)" },
  { id: "flowchart", label: "Flowchart" },
];

interface SiteNavProps {
  current: PageId;
  onNavigate: (page: PageId) => void;
}

/** The page tabs. Real links (so they can be opened in a new tab), switched in place on a plain click. */
export function SiteNav({ current, onNavigate }: SiteNavProps) {
  const handleClick = (page: PageId) => (event: MouseEvent<HTMLAnchorElement>) => {
    // leave new-tab / new-window gestures to the browser
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(page);
  };

  const [theme, setTheme] = useTheme();

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Pages">
        {PAGES.map((page, i) => (
          <a
            key={page.id}
            href={`#/${page.id}`}
            aria-current={current === page.id ? "page" : undefined}
            onClick={handleClick(page.id)}
          >
            <b aria-hidden="true">{i + 1}</b>
            {page.label}
          </a>
        ))}
      </nav>
      <button
        type="button"
        className="theme-toggle"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={theme === "dark" ? "Light mode" : "Dark mode"}
      >
        {theme === "dark" ? (
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor" /><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 9 9 0 1 0 20.5 14.5z" fill="currentColor" /></svg>
        )}
      </button>
    </header>
  );
}
