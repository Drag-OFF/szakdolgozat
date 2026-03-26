import React from "react";
import "../styles/RequirementsStatus.css";
import "../styles/ProgressTable.css";
import { useLang } from "../context/LangContext";

export default function CourseList({ courses, title, defaultOpen, setDefaultOpen }) {
  const [search, setSearch] = React.useState("");
  const { lang } = useLang();
  const t = lang === "en"
    ? {
        search: "Search by course name or code...",
        empty: "No available courses.",
        code: "Code",
        name: "Name",
        credit: "Credits",
        semester: "Recommended semester"
      }
    : {
        search: "Keresés név vagy kód alapján...",
        empty: "Nincs elérhető kurzus.",
        code: "Kód",
        name: "Név",
        credit: "Kredit",
        semester: "Ajánlott félév"
      };

  const filtered = (courses || []).filter(
    c =>
      String(c.course_code || "").toLowerCase().includes(search.toLowerCase()) ||
      (lang === "en"
        ? String(c.name_en || c.name || "").toLowerCase().includes(search.toLowerCase())
        : String(c.name || c.name_en || "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="user-courselist-card">
      <div className="user-courselist-inner">
        <header
          className="user-courselist-header"
          onClick={() => setDefaultOpen(o => !o)}
          aria-expanded={!!defaultOpen}
        >
          <span>{title}</span>
          <span className="toggle-icon">{defaultOpen ? "▲" : "▼"}</span>
        </header>
        {defaultOpen && (
          <div className="user-courselist-body">
            <div className="progress-toolbar user-courselist-toolbar">
              <div className="progress-toolbar-left">
                <div className="progress-input-wrap">
                  <input
                    type="search"
                    className="progress-input"
                    placeholder={t.search}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    aria-label={t.search}
                  />
                </div>
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="user-courselist-empty">{t.empty}</div>
            ) : (
              <div className="progress-table-wrapper">
                <table className="progress-table">
                  <thead>
                    <tr>
                      <th>{t.code}</th>
                      <th>{t.name}</th>
                      <th>{t.credit}</th>
                      <th>{t.semester}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c, i) => (
                      <tr key={`${c.course_code}-${i}`}>
                        <td><b>{c.course_code}</b></td>
                        <td>{lang === "en" ? (c.name_en || c.name) : (c.name || c.name_en)}</td>
                        <td>{c.credit}</td>
                        <td>{c.semester ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
