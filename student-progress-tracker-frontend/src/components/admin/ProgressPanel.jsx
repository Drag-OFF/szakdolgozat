import React, { useEffect, useState, useRef } from "react";
import useAuthFetch from "../../hooks/useAuthFetch";
import useFileDownload from "../../hooks/useFileDownload";
import "../../styles/ProgressTable.css";
import "../../styles/AdminPanels.css";
import { useLang } from "../../context/LangContext";
import { PROGRESS_LABELS } from "../../translations";
import { API_BASE } from "../../config";
import { getAccessToken } from "../../authStorage";

export default function ProgressPanel() {
  const { fetchJson, authFetch } = useAuthFetch();
  const { download } = useFileDownload();
  const { lang } = useLang();
  const t = PROGRESS_LABELS[lang] || PROGRESS_LABELS.hu;

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [file, setFile] = useState(null);
  const [fileOwner, setFileOwner] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [uploading, setUploading] = useState(false);

  const dropRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingUsers(true);
      setLoadError(null);
      try {
        const jsonRes = await fetchJson("/api/users");
        const list = Array.isArray(jsonRes?.body) ? jsonRes.body : (Array.isArray(jsonRes?.body?.users) ? jsonRes.body.users : []);
        if (mounted && list.length > 0) {
          setUsers(list.filter(u => u?.role !== "admin"));
          setLoadingUsers(false);
          return;
        }
        const res = await authFetch(`${API_BASE}/api/users`);
        const body = await res.json().catch(() => null);
        const fallbackList = Array.isArray(body) ? body : (Array.isArray(body?.users) ? body.users : []);
        if (mounted && fallbackList.length > 0) {
          setUsers(fallbackList.filter(u => u?.role !== "admin"));
          setLoadingUsers(false);
          return;
        }
        if (mounted) {
          setUsers([]);
          setLoadError(t.loadErrorPrefix);
        }
      } catch (e) {
        if (mounted) {
          setUsers([]);
          setLoadError(e?.message || String(e));
        }
      } finally {
        if (mounted) setLoadingUsers(false);
      }
    })();
    return () => { mounted = false; };
  }, [fetchJson, authFetch, t.loadErrorPrefix]);

  const filtered = users.filter(u => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return true;
    return [
      u?.name,
      u?.uid,
      u?.email,
      u?.major,
      u?.id,
      u?.user_id
    ].some(f => {
      try { return f !== undefined && f !== null && String(f).toLowerCase().includes(q); } catch { return false; }
    });
  });

  const selectRow = (id) => {
    setSelectedId(prev => (String(prev) === String(id) ? "" : String(id)));
  };

  const handleFileChange = (f) => {
    setFile(f || null);
    setFileOwner(f ? (selectedId || null) : null);
  };

  const downloadTemplateFor = async (userId) => {
    if (!userId) return alert(t.chooseUser);
    setLoadingTemplate(true);
    try {
      const token = getAccessToken();
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      headers.Accept = "application/octet-stream";

      const url = `${API_BASE}/api/progress/${encodeURIComponent(userId)}/template-xlsx?lang=${lang}`;
      const res = await fetch(url, { method: "GET", headers: new Headers(headers), mode: "cors" });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        alert(`${t.templateDownloadFailed}\nStatus: ${res.status}` + (text ? `\nMessage: ${text}` : ""));
        return;
      }

      const blob = await res.blob();
      const cd = res.headers.get("content-disposition") || "";
      const fnMatch = cd.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/i);
      const filename = fnMatch?.[1] ? decodeURIComponent(fnMatch[1]) : `${userId}-template.xlsx`;
      const urlObj = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlObj;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(urlObj);
    } catch (e) {
      alert(t.templateDownloadFailed);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFileChange(f);
    dropRef.current?.classList.remove("drag-over");
  };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); dropRef.current?.classList.add("drag-over"); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); dropRef.current?.classList.remove("drag-over"); };

  const handleUpload = async () => {
    if (!selectedId) return alert(t.chooseUser);
    if (!file) return alert(t.chooseFile);
    if (fileOwner && String(fileOwner) !== String(selectedId)) {
      return alert(t.fileAssignedOther.replace("{id}", fileOwner));
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await authFetch(`${API_BASE}/api/progress/${encodeURIComponent(selectedId)}/import?lang=${lang}`, {
        method: "POST",
        body: fd
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        console.error("[ProgressPanel] upload failed", err);
        alert(t.uploadFailed + (err?.detail ? `: ${err.detail}` : ""));
        return;
      }
      alert(t.uploadSuccess);
      setFile(null);
      setFileOwner(null);
      window.dispatchEvent(new Event("refresh-progress"));
    } catch (e) {
      console.error("[ProgressPanel] upload error", e);
      alert(t.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  const fmtDate = (iso) => { try { return iso ? new Date(iso).toLocaleString() : ""; } catch { return iso; } };

  return (
    <div className="admin-panel" style={{ padding: 12 }}>
      <h3>{t.title}</h3>

      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 12, flexWrap: "wrap" }}>
        <div className="admin-form-field" style={{ flex: 1, minWidth: 240 }}>
          <label className="admin-form-label">
            {t.searchLabel}
            <span className="admin-form-col-hint">{t.searchHint}</span>
          </label>
          <input
            className="progress-input"
            placeholder={t.searchPlaceholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { if (!selectedId) return alert(t.chooseUser); downloadTemplateFor(selectedId); }} disabled={!selectedId || loadingTemplate}>
            {loadingTemplate ? t.downloading : t.downloadTemplate}
          </button>
          <button onClick={() => { setSelectedId(""); }}>{t.clearSelection}</button>
        </div>
      </div>

      <div style={{ border: "1px solid #eee", maxHeight: 300, overflowY: "auto", marginBottom: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ position: "sticky", top: 0, background: "#fafafa" }}>
            <tr>
              <th style={{ textAlign: "left", padding: 8, width: 60 }}>#</th>
              <th style={{ textAlign: "left", padding: 8 }}>{lang === "hu" ? "Név" : "Name"}</th>
              <th style={{ textAlign: "left", padding: 8, width: 140 }}>{lang === "hu" ? "Neptun" : "Neptun"}</th>
              <th style={{ textAlign: "left", padding: 8, width: 160 }}>{lang === "hu" ? "Szak" : "Major"}</th>
              <th style={{ textAlign: "left", padding: 8 }}>{lang === "hu" ? "Email" : "Email"}</th>
              <th style={{ textAlign: "left", padding: 8, width: 160 }}>{lang === "hu" ? "Létrehozva" : "Created"}</th>
            </tr>
          </thead>
          <tbody>
            {loadingUsers ? (
              <tr><td colSpan={6} style={{ padding: 8 }}>{t.loadingUsers}</td></tr>
            ) : loadError ? (
              <tr><td colSpan={6} style={{ padding: 8, color: "darkred" }}>{t.loadErrorPrefix} {String(loadError)}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 8 }}>{t.noResults}</td></tr>
            ) : filtered.map((u, i) => {
              const id = u?.id ?? u?.user_id ?? String(i);
              const isSel = String(id) === String(selectedId);
              return (
                <tr
                  key={id}
                  className={isSel ? "row-selected" : ""}
                  onClick={() => selectRow(id)}
                  style={{ cursor: "pointer" }}
                >
                  <td style={{ padding: 8 }}>{id}</td>
                  <td style={{ padding: 8 }}>{u?.name || "-"}</td>
                  <td style={{ padding: 8 }}>{u?.uid || "-"}</td>
                  <td style={{ padding: 8 }}>{u?.major || "-"}</td>
                  <td style={{ padding: 8 }}>{u?.email || "-"}</td>
                  <td style={{ padding: 8 }}>{fmtDate(u?.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          border: "2px dashed #ccc",
          borderRadius: 8,
          padding: 18,
          textAlign: "center",
          background: "#fafafa",
          marginBottom: 12,
          cursor: "pointer"
        }}
        title={t.dropHint}
        onClick={() => document.getElementById("progress-file-input")?.click()}
      >
        {file ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <strong>{file.name}</strong>
              <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); setFileOwner(null); }} style={{ marginLeft: 12 }}>{t.removeFile}</button>
            </div>
            {fileOwner ? (
              <div style={{ fontSize: 12, color: fileOwner === selectedId ? "#080" : "#a00" }}>
                {fileOwner === selectedId ? t.fileAssignedTo.replace("{id}", fileOwner) : t.fileAssignedOther.replace("{id}", fileOwner)}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "#666" }}>{selectedId ? t.dropSubSelected : t.dropSubNoSelect}</div>
            )}
            {fileOwner && String(fileOwner) !== String(selectedId) && (
              <div style={{ marginTop: 6 }}>
                <button onClick={(e) => { e.stopPropagation(); setFileOwner(selectedId); }}>{t.assignToSelected}</button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 6 }}>{t.dropHint}</div>
            <div style={{ fontSize: 12, color: "#666" }}>{selectedId ? t.dropSubSelected : t.dropSubNoSelect}</div>
          </div>
        )}
        <input id="progress-file-input" type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={e => handleFileChange(e.target.files?.[0] ?? null)} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handleUpload} disabled={!selectedId || !file || uploading || (fileOwner && String(fileOwner) !== String(selectedId))}>
          {uploading ? t.uploading : t.upload}
        </button>
        <button onClick={() => { setFile(null); setFileOwner(null); }} disabled={!file}>{t.cancel}</button>
      </div>
    </div>
  );
}