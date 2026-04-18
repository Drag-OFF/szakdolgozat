/** Első paint előtt: localStorage → html[data-theme], alap dark. */
const STORAGE_KEY = "spt-theme";

try {
  const v = localStorage.getItem(STORAGE_KEY);
  document.documentElement.setAttribute(
    "data-theme",
    v === "light" ? "light" : "dark"
  );
} catch {
  document.documentElement.setAttribute("data-theme", "dark");
}
