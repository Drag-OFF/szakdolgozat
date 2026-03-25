/**
 * JWT + user JSON tárolása.
 * Alapértelmezés: sessionStorage — új böngésző-munkamenet = nincs bejelentkezve (régi localStorage token nem marad).
 * Ha maradandó bejelentkezést akarsz: VITE_AUTH_PERSIST=local a .env-ben (localStorage).
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

/** Token + user törlése mindkét tárolóból (váltás / kijelentkezés / 401). */
export function clearAuth() {
  const s = getStore();
  s?.removeItem(TOKEN_KEY);
  s?.removeItem(USER_KEY);
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (_) {}
}
