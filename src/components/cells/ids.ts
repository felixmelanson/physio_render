import { createContext, useContext } from "react";

/**
 * SVG gradient and clip-path ids are document-global.
 *
 * The flowchart draws every cell once with an empty prefix, so its markup is
 * exactly what it always was. The catalogue grid and the enlarged popup draw
 * the same artwork again; each of those scopes sets its own prefix so every
 * `url(#…)` reference resolves to the <defs> sitting right next to it.
 */
export const IdPrefixContext = createContext("");

export const useIdPrefix = () => useContext(IdPrefixContext);
