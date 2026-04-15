/**
 * Környezetfüggő frontend konfiguráció:
 * API alap URL feloldása és egységes endpoint építés.
 */
const trimEndSlash = (s) => String(s || "").replace(/\/+$/, "");

const apiPort = String(import.meta.env.VITE_API_PORT ?? "8000").trim() || "8000";

function resolveApiBase() {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv != null && String(fromEnv).trim() !== "") {
    return trimEndSlash(fromEnv);
  }
  if (import.meta.env.DEV) {
    return "";
  }
  if (typeof window !== "undefined" && window.location?.hostname) {
    const h = window.location.hostname;
    if (h && h !== "localhost" && h !== "127.0.0.1") {
      return trimEndSlash(`${window.location.protocol}//${h}:${apiPort}`);
    }
  }
  return `http://localhost:${apiPort}`;
}

export const API_BASE = resolveApiBase();

/** API útvonal normalizálása (mindig /-sel kezdődik). */
export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!API_BASE) return p;
  return `${API_BASE}${p}`;
}

export const PHPMYADMIN_URL = trimEndSlash(import.meta.env.VITE_PHPMYADMIN_URL ?? "");
