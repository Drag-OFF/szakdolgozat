import useAuthFetch from "./useAuthFetch";
import { API_BASE } from "../config";

/**
 * Általános fájlfeltöltő hook auth támogatással.
 * Bemenet: endpoint/file/userId/lang, kimenet: HTTP státusz + parsed body.
 */
export default function useFileUpload(baseUrl = API_BASE) {
  const { authFetch, fetchJson } = useAuthFetch();

  const upload = async ({ endpoint, file, userId, lang = "hu" }) => {
    const fd = new FormData();
    fd.append("file", file);
    const url = `${baseUrl}${endpoint.replace("{userId}", String(userId))}?lang=${encodeURIComponent(lang)}`;
    const resp = await authFetch(url, { method: "POST", body: fd });
    let body = null;
    try { body = await resp.json(); } catch (e) { body = null; }
    return { ok: resp.ok, status: resp.status, body };
  };

  return { upload, fetchJson };
}