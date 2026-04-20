/**
 * Központi auth tároló segédek:
 * token/user olvasás-írás és biztonságos kijelentkeztető átirányítás.
 */
const TOKEN_KEY = "access_token";
const USER_KEY = "user";

function useLocalPersistence() {
  return typeof import.meta !== "undefined" && import.meta.env?.VITE_AUTH_PERSIST === "local";
}

function getStore() {
  if (typeof window === "undefined") return null;
  return useLocalPersistence() ? localStorage : sessionStorage;
}

export function getAccessToken() {
  return getStore()?.getItem(TOKEN_KEY) ?? null;
}

export function setAccessToken(token) {
  getStore()?.setItem(TOKEN_KEY, token);
}

export function getUserObject() {
  const raw = getStore()?.getItem(USER_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

export function setUserJson(obj) {
  getStore()?.setItem(USER_KEY, JSON.stringify(obj));
}

export function clearAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch (_) {}
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-changed"));
    }
  } catch (_) {}
}

/**
 * Törli az auth állapotot, majd opcionálisan a `next` útvonalra
 * visszahozható login oldalra navigál.
 */
export function redirectToLogin(next) {
  clearAuth();
  if (typeof window === "undefined") return;
  let path = typeof next === "string" ? next : "";
  if (!path) {
    path = window.location.pathname + window.location.search;
  }
  const safe =
    path.startsWith("/") && !path.startsWith("//") && !path.includes("://") ? path : "";
  const q = safe && safe !== "/login" ? `?next=${encodeURIComponent(safe)}` : "";
  window.location.assign(`/login${q}`);
}
