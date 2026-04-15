import { createContext, useContext, useState } from "react";
const LangContext = createContext();

/** Alkalmazás szintű nyelvi állapot (HU/EN) biztosítása. */
export function LangProvider({ children }) {
  const [lang, setLang] = useState("hu");
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}
/** Nyelvi context egyszerű elérése komponensekből. */
export function useLang() {
  return useContext(LangContext);
}