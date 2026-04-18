import React, { useRef, useState } from "react";
import { useLang } from "../context/LangContext";
import useFileUpload from "../hooks/useFileUpload.js";
import Button from "./Button";

export default function FileUpload({ onUpload, accept = ".csv,.xlsx,.xls", userId }) {
  const { lang } = useLang ? useLang() : { lang: "hu" };
  const fileInputRef = useRef();
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const { upload } = useFileUpload();

  const texts = {
    hu: {
      select: "Fájl kiválasztása",
      browse: "Tallózás",
      noFile: "Nincs kiválasztva fájl",
      upload: "Feltöltés"
    },
    en: {
      select: "Select file",
      browse: "Browse",
      noFile: "No file selected",
      upload: "Upload"
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

  return (
    <div className="progress-upload-inner">
      <label className="file-btn progress-upload-browse">
        {texts[lang]?.select || "Fájl kiválasztása"}
        <input
          type="file"
          accept={accept}
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </label>
      <span className="progress-upload-filename">
        {fileName || texts[lang]?.noFile || "Nincs fájl"}
        {fileName && (
          <Button
            type="button"
            onClick={() => {
              setFile(null);
              setFileName("");
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="progress-upload-clear"
            variant="danger"
            size="sm"
            aria-label="Fájl törlése"
            title="Fájl törlése"
          >
            ×
          </Button>
        )}
      </span>
      <Button
        type="button"
        onClick={handleUpload}
        disabled={!file}
        variant="success"
        size="md"
        className="progress-upload-submit"
      >
        {texts[lang]?.upload || "Feltöltés"}
      </Button>
    </div>
  );
}