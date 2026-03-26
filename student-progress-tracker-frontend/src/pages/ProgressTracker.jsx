import React, { useEffect, useState } from "react";
import RequirementsStatus from "../components/RequirementsStatus";
import ProgressTable from "../components/ProgressTable";
import DownloadProgressButton from "../components/DownloadProgressButton";
import FileUpload from "../components/FileUpload";
import { authFetch } from "../utils";
import { useLang } from "../context/LangContext"; // <-- ezt add hozzá
import { PROGRESS_TRACKER_LABELS } from "../translations";
import "../styles/ProgressTable.css";
import "../styles/AdminPanels.css";
import { apiUrl } from "../config";
import { getUserObject, getAccessToken } from "../authStorage";

const COURSES_PAGE_SIZE = 10;

export default function ProgressTracker() {
  const user = getUserObject();
  const [progressFull, setProgressFull] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [semester, setSemester] = useState("");
  const [points, setPoints] = useState("");
  const [coursesPage, setCoursesPage] = useState(0);
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

  const coursesTotalPages = Math.max(1, Math.ceil(filtered.length / COURSES_PAGE_SIZE));
  const coursesDisplayed = filtered.slice(
    coursesPage * COURSES_PAGE_SIZE,
    (coursesPage + 1) * COURSES_PAGE_SIZE
  );

  useEffect(() => {
    setCoursesPage(0);
  }, [search, category, status, semester, points]);

  useEffect(() => {
    setCoursesPage(p =>
      p >= coursesTotalPages ? Math.max(0, coursesTotalPages - 1) : p
    );
  }, [filtered.length, coursesTotalPages]);

  return (
    <div className="progress-tracker-container progress-tracker-layout">
      <section className="admin-card">
        <div className="admin-card-body admin-panel">
          <h2 className="progress-section-title">{t.coursesTitle}</h2>
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
            <>
              <div className="progress-table-wrapper">
                <ProgressTable progressFull={coursesDisplayed} />
              </div>
              <div className="progress-courses-pagination">
                <button
                  type="button"
                  onClick={() => setCoursesPage(p => Math.max(0, p - 1))}
                  disabled={coursesPage === 0}
                >
                  {t.prev}
                </button>
                <div>{`${t.page} ${coursesPage + 1} / ${coursesTotalPages}`}</div>
                <button
                  type="button"
                  onClick={() =>
                    setCoursesPage(p => Math.min(coursesTotalPages - 1, p + 1))
                  }
                  disabled={coursesPage >= coursesTotalPages - 1}
                >
                  {t.next}
                </button>
                <div className="progress-courses-pagination-total">
                  {`${filtered.length} ${t.total}`}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-body">
          <h2 className="progress-section-title">{t.requirementsTitle}</h2>
          <RequirementsStatus embedded />
        </div>
      </section>
    </div>
  );
}