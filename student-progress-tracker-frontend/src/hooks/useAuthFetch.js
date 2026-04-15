import { useCallback } from "react";
import { getAccessToken, redirectToLogin } from "../authStorage";
import { syntheticUnauthorizedResponse } from "../apiUnauthorizedResponse";

/**
 * Auth-tudatos fetch hook:
 * Bearer token hozzáadás, 401 kezelés és JSON segédfüggvény.
 */
export default function useAuthFetch() {
  /** Általános HTTP hívás auth fejléccel; 401-nél login redirect. */
  const authFetch = useCallback(async (url, options = {}) => {
    const token = getAccessToken();
    const headers = Object.assign({}, options.headers || {});
    if (token) headers.Authorization = `Bearer ${token}`;
    const opts = Object.assign({}, options, { headers });
    const res = await fetch(url, opts);
    if (res.status === 401) {
      redirectToLogin();
      return syntheticUnauthorizedResponse();
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-activity"));
    }
    return res;
  }, []);

  /** JSON válasz olvasása biztonságosan: `{ res, body }` formában. */
  const fetchJson = useCallback(async (url, options = {}) => {
    const res = await authFetch(url, options);
    let body = null;
    try {
      body = await res.json();
    } catch (e) {
      body = null;
    }
    return { res, body };
  }, [authFetch]);

  return { authFetch, fetchJson };
}