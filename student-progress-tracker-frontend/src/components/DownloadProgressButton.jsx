import React from "react";
import Button from "./Button";
import { useLang } from "../context/LangContext";
import useFileDownload from "../hooks/useFileDownload";
import { apiUrl } from "../config";

export default function DownloadProgressButton({ userId }) {
  const { lang } = useLang();
  const { download } = useFileDownload();

  const handleDownload = async () => {
    try {
      await download(apiUrl(`/api/progress/${userId}/export-xlsx?lang=${lang}`));
    } catch (e) {
      console.error(e);
      alert(lang === "en" ? "Download failed!" : "Hiba történt a letöltés során!");
    }
  };

  return (
    <Button
      onClick={handleDownload}
      className="btn-compact progress-toolbar-download-btn"
      variant="primary"
      size="sm"
    >
      {lang === "en" ? "Download progress" : "Előrehaladás letöltése"}
    </Button>
  );
}