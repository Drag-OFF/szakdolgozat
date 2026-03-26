/**
 * Környezetfüggő beállítások — változók a repó gyökerében lévő `.env`-ből (Vite: VITE_*).
 *
 * VITE_API_PORT: backend HTTP port (ugyanaz, mint uvicorn --port).
 * VITE_API_BASE_URL: teljes API origin; ha meg van adva, felülírja a portos automatikát.
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

/** Backend API alap URL (perjel nélkül). Devben üres → relatív /api (Vite proxy). */
export const API_BASE = resolveApiBase();

/**
 * Teljes API URL. path "/" jellel kezdődjön (pl. "/api/users/login").
 * @param {string} path
 */
export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!API_BASE) return p;
  return `${API_BASE}${p}`;
}

/**
 * Opcionális: phpMyAdmin vagy más admin URL (üres string ha nincs beállítva).
 */
export const PHPMYADMIN_URL = trimEndSlash(import.meta.env.VITE_PHPMYADMIN_URL ?? "");
