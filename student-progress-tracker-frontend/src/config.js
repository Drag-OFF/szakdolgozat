/**
 * Környezetfüggő beállítások (Vite: .env fájlban VITE_* prefix).
 * API_BASE: backend origin perjel nélkül — pl. http://localhost:8000 vagy https://api.example.com
 *
 * Figyelem: VITE_API_BASE_URL=http://localhost:8000 a .env-ben + `npm run build` = a localhost beég
 * a bundle-be; az éles (DDNS) oldal minden látogatónál a saját gépére hív — login elromlik.
 *
 * Ha nincs VITE_API_BASE_URL:
 * - npm run dev → üres (relatív /api/... URL) — a Vite proxy továbbítja :8000-ra
 * - éles build, böngészőben nem localhost host → ugyanaz a host + :8000 (DDNS + XAMPP)
 */

const trimEndSlash = (s) => String(s || "").replace(/\/+$/, "");

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
      return trimEndSlash(`${window.location.protocol}//${h}:8000`);
    }
  }
  return "http://localhost:8000";
}

/** Backend API alap URL (perjel nélkül). */
export const API_BASE = resolveApiBase();

/**
 * Teljes API URL összerakása. path "/" jellel kezdődjön (pl. "/api/users/login").
 * @param {string} path
 */
export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!API_BASE) return p;
  return `${API_BASE}${p}`;
}

/**
 * Opcionális: phpMyAdmin vagy más admin URL (üres string ha nincs beállítva).
 * Pl. http://localhost/phpmyadmin — később linkelhető admin/debug felületről.
 */
export const PHPMYADMIN_URL = trimEndSlash(import.meta.env.VITE_PHPMYADMIN_URL ?? "");
