import useAuthFetch from "./useAuthFetch";

/** Fájl letöltése auth kéréssel, szerver oldali fájlnév támogatással. */
export default function useFileDownload() {
  const { authFetch } = useAuthFetch();

  /** URL -> böngészős letöltés; visszatér: `{ success, filename }`. */
  const download = async (url) => {
    const resp = await authFetch(url, { method: "GET" });
    if (!resp.ok) throw new Error(`Download failed: ${resp.status}`);
    let filename = "download.bin";
    const disposition = resp.headers.get("content-disposition");
    if (disposition) {
      const m1 = disposition.match(/filename\*=UTF-8''([^;]+)/);
      const m2 = disposition.match(/filename="?([^";]+)"?/);
      if (m1 && m1[1]) filename = decodeURIComponent(m1[1]);
      else if (m2 && m2[1]) filename = m2[1];
    }
    const blob = await resp.blob();
    const urlObj = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = urlObj;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(urlObj);
    return { success: true, filename };
  };

  return { download };
}