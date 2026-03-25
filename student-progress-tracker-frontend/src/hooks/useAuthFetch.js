export default function useAuthFetch() {
  const authFetch = async (url, options = {}) => {
    const token = localStorage.getItem("access_token");
    console.log("[useAuthFetch] token present:", Boolean(token));
    const headers = Object.assign({}, options.headers || {});
    if (token) headers.Authorization = `Bearer ${token}`;
    const opts = Object.assign({}, options, { headers });
    return fetch(url, opts);
  };

  const fetchJson = async (url, options = {}) => {
    const res = await authFetch(url, options);
    let body = null;
    try { body = await res.json(); } catch (e) { body = null; }
    return { res, body };
  };

  return { authFetch, fetchJson };
}