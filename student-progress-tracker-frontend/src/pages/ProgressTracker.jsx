import React, { useEffect, useState } from "react";
import RequirementsStatus from "../components/RequirementsStatus";
import ProgressTable from "../components/ProgressTable";
import DownloadProgressButton from "../components/DownloadProgressButton";
import FileUpload from "../components/FileUpload";
import ProgressToolbar from "../components/ProgressToolbar";
import { authFetch } from "../utils";
import { useLang } from "../context/LangContext"; // <-- ezt add hozzá
import { PROGRESS_TRACKER_LABELS } from "../translations";
import "../styles/ProgressTable.css";
import { apiUrl } from "../config";
import { getUserObject, getAccessToken } from "../authStorage";

export default function ProgressTracker() {
  const user = getUserObject();
  const [progressFull, setProgressFull] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [semester, setSemester] = useState("");
  const [points, setPoints] = useState("");
  const [open, setOpen] = useState(false);
  const [reqOpen, setReqOpen] = useState(false);

  const { lang } = useLang(); // <-- aktuális nyelv
  const t = PROGRESS_TRACKER_LABELS[lang] || PROGRESS_TRACKER_LABELS.hu;

  useEffect(() => {
    if (!user.id) return;
    authFetch(apiUrl(`/api/progress/${user.id}/full?lang=${lang}`), {
      headers: { Authorization: `Bearer ${getAccessToken()}` }
    })
      .then(res => res.json())
      .then(data => setProgressFull(data));
  }, [user.id, lang]);

  if (!user.id) {
    return <div className="auth-msg">{t.loginRequired}</div>;
  }

  const filtered = progressFull.filter(p =>
    (
      (p.course_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.course_code?.toLowerCase() || "").includes(search.toLowerCase())
    ) &&
    (category ? (p.category || "").toLowerCase() === category : true) &&
    (status ? (p.status || "") === status : true) &&
    (semester ? String(p.completed_semester || "") === semester : true) &&
    (points ? String(p.points || "") === points : true)
  );

  return (
    <div className="progress-tracker-container">
      <h2 className="panel-header-inline" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        {t.coursesTitle} <span className="toggle-icon">{open ? "▲" : "▼"}</span>
      </h2>
      {open && (
        <div style={{
            maxHeight: 600,
            overflowY: "auto",
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: 8,
            width: "90%",
            maxWidth: 1800, 
            margin: "0 auto",
            background: "#fff" 
        }}>
          <div className="progress-toolbar">
            <div className="progress-toolbar-left">
              <div className="progress-input-wrap">
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="progress-input"
                />
              </div>
              <div className="progress-filewrap">
                <FileUpload
                  userId={user.id}
                  lang={lang}
                  onUpload={async (file) => {
                    const formData = new FormData();
                    formData.append("file", file);
                    try {
                      const res = await fetch(
                        apiUrl(`/api/progress/${user.id}/import?lang=${lang}`),
                        {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${getAccessToken()}`,
                          },
                          body: formData,
                        }
                      );
                      const data = await res.json();
                      if (!res.ok) {
                        console.error("Import failed:", data);
                        alert(t.uploadFailed);
                        return;
                      }
                      // sikeres import után újra lekérdezzük a teljes előrehaladást és frissítjük a state-et
                      const fullRes = await authFetch(
                        apiUrl(`/api/progress/${user.id}/full?lang=${lang}`),
                        { headers: { Authorization: `Bearer ${getAccessToken()}` } }
                      );
                      const fullData = await fullRes.json();
                      setProgressFull(Array.isArray(fullData) ? fullData : []);
                      alert(t.uploadSuccess);
                    } catch (err) {
                      console.error("Upload error:", err);
                      alert(t.uploadFailed);
                    }
                  }}
                />
              </div>
            </div>

            <div className="progress-toolbar-actions">
              <div className="action-btn">
                <DownloadProgressButton userId={user.id} />
              </div>
            </div>
          </div>
          {filtered.length === 0 ? (
            <div>{t.noSaved}</div>
          ) : (
            <ProgressTable progressFull={filtered} />
          )}
        </div>
      )}
      <div style={{ marginTop: 32 }}>
        <h2
          className="panel-header-inline"
          onClick={() => setReqOpen(o => !o)}
          aria-expanded={reqOpen}
        >
          {t.requirementsTitle} <span className="toggle-icon">{reqOpen ? "▲" : "▼"}</span>
        </h2>
        {reqOpen && (
          <div style={{
            maxHeight: 600,
            overflowY: "auto",
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: 8,
            width: "90%",
            maxWidth: 1800, 
            margin: "0 auto",
            background: "#fff" 
          }}>
            <RequirementsStatus />
          </div>
        )}
      </div>
    </div>
  );
}