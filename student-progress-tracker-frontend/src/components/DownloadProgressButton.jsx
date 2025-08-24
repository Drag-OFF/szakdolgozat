import React from "react";
import Button from "./Button";

/**
 * Letöltés gomb, amely a felhasználó előrehaladását CSV-ben tölti le.
 * @param {object} props
 * @param {number|string} props.userId - A felhasználó azonosítója.
 */
export default function DownloadProgressButton({ userId }) {
  const handleDownload = async () => {
    try {
      const resp = await fetch(
        `http://enaploproject.ddns.net:8000/api/progress/${userId}/export-xlsx`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        }
      );
      if (!resp.ok) {
        alert("Hiba történt a letöltés során!");
        return;
      }
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `progress_${userId}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Hiba történt a letöltés során!");
    }
  };

  return (
    <Button onClick={handleDownload}>
      Előrehaladás letöltése (CSV)
    </Button>
  );
}