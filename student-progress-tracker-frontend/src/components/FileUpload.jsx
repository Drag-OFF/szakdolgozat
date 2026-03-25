import React, { useRef, useState } from "react";
import { useLang } from "../context/LangContext";
import useFileDownload from "../hooks/useFileDownload";
import useFileUpload from "../hooks/useFileUpload.js";
import { apiUrl } from "../config";

/**
 * Egységes kinézetű fájlfeltöltő komponens, magyar és angol feliratokkal.
 * - Nincs külső padding/margin, csak a belső elemek stílusa van itt.
 * - Megjeleníti a kiválasztott fájl nevét.
 * - A feltöltés gomb csak akkor aktív, ha van kiválasztott fájl.
 * - onUpload: (file) => void callback prop.
 */
export default function FileUpload({ onUpload, accept = ".csv,.xlsx,.xls", userId }) {
  const { lang } = useLang ? useLang() : { lang: "hu" };
  const fileInputRef = useRef();
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const { download } = useFileDownload();
  const { upload } = useFileUpload();

  const texts = {
    hu: {
      select: "Fájl kiválasztása",
      browse: "Tallózás",
      noFile: "Nincs kiválasztva fájl",
      upload: "Feltöltés",
      template: "Szakos sablon letöltése"
    },
    en: {
      select: "Select file",
      browse: "Browse",
      noFile: "No file selected",
      upload: "Upload",
      template: "Download template"
    }
  };

  const handleFileChange = e => {
    const f = e.target.files[0];
    setFile(f || null);
    setFileName(f ? f.name : "");
  };

  const handleUpload = () => {
    if (!file) return;
    if (onUpload) {
      onUpload(file);
      return;
    }
    // fallback: használjuk a hook-ot
    (async () => {
      try {
        const res = await upload({ endpoint: "/api/progress/{userId}/import", file, userId, lang });
        if (!res.ok) {
          const cnt = res.body?.errors?.length ?? 0;
          alert(lang === "en" ? `Upload completed with errors (${cnt})` : `Feltöltés hibákkal (${cnt})`);
          console.table(res.body?.errors || []);
          return;
        }
        alert(lang === "en" ? "Upload successful!" : "Sikeres feltöltés!");
        window.dispatchEvent(new Event("refresh-progress"));
      } catch (e) {
        console.error(e);
        alert(lang === "en" ? "Upload failed!" : "Hiba történt a feltöltés során!");
      }
    })();
  };

  const handleTemplateDownload = async () => {
    if (!userId) return;
    try {
      await download(apiUrl(`/api/progress/${userId}/template-xlsx?lang=${lang}`));
    } catch (e) {
      console.error(e);
      alert(lang === "en" ? "Failed to download the template!" : "Nem sikerült letölteni a sablont!");
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <label
        style={{
          background: "#1976d2",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          padding: "0.3rem 0.9rem",
          fontWeight: 500,
          fontSize: "1rem",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 8
        }}
      >
        {texts[lang]?.select || "Fájl kiválasztása"}
        <input
          type="file"
          accept={accept}
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </label>
      <span>
        {fileName || texts[lang]?.noFile || "Nincs fájl"}
        {fileName && (
          <button
            type="button"
            onClick={() => {
              setFile(null);
              setFileName("");
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            style={{
              marginLeft: 6,
              background: "transparent",
              border: "none",
              color: "#d32f2f",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "1.1em"
            }}
            aria-label="Fájl törlése"
            title="Fájl törlése"
          >
            ×
          </button>
        )}
      </span>
      <button
        type="button"
        onClick={handleUpload}
        disabled={!file}
        style={{
          background: "#1976d2",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          padding: "0.3rem 0.9rem",
          fontWeight: 500,
          fontSize: "1rem",
          cursor: file ? "pointer" : "not-allowed"
        }}
      >
        {texts[lang]?.upload || "Feltöltés"}
      </button>
      {/* Sablon letöltő gomb */}
      {userId && (
        <button
          type="button"
          onClick={handleTemplateDownload}
          style={{
            marginLeft: 8,
            background: "#eee",
            color: "#1976d2",
            border: "1px solid #1976d2",
            borderRadius: "6px",
            padding: "0.3rem 0.9rem",
            fontWeight: 500,
            fontSize: "1rem",
            cursor: "pointer"
          }}
        >
          {texts[lang]?.template || "Szakos sablon letöltése"}
        </button>
      )}
    </div>
  );
}