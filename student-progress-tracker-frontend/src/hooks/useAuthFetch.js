import { useCallback } from "react";

export default function useAuthFetch() {
  const authFetch = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem("access_token");
    const headers = Object.assign({}, options.headers || {});
    if (token) headers.Authorization = `Bearer ${token}`;
    const opts = Object.assign({}, options, { headers });
    return fetch(url, opts);
  }, []);

  const fetchJson = useCallback(async (url, options = {}) => {
    const res = await authFetch(url, options);
    let body = null;
    try { body = await res.json(); } catch (e) { body = null; }
    return { res, body };
  }, [authFetch]);

  return { authFetch, fetchJson };
}