import { createContext, useContext, useState, useEffect } from "react";

const STORAGE_KEY = "spt-theme";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* private mode */
    }
  }, [theme]);

  const toggleTheme = () =>
    setThemeState((t) => (t === "dark" ? "light" : "dark"));

  const setTheme = (next) =>
    setThemeState(next === "light" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "dark",
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return ctx;
}
