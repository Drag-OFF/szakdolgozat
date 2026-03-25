import React from "react";
import "../styles/RequirementsStatus.css";
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
      // ha van lokalizált név, használjuk azt
      (lang === "en"
        ? String(c.name_en || c.name || "").toLowerCase().includes(search.toLowerCase())
        : String(c.name || c.name_en || "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="course-table-section">
      <div
        className={`course-table-header${defaultOpen ? " open" : ""}`}
        onClick={() => setDefaultOpen(o => !o)}
      >
        {title}
        <span className="toggle-icon">{defaultOpen ? "▲" : "▼"}</span>
      </div>
      {defaultOpen && (
        <div>
          <div className="course-search-container">
            <input
              className="course-search-input"
              type="text"
              placeholder={t.search}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {filtered.length === 0 ? (
            <div>{t.empty}</div>
          ) : (
            <table className="course-table">
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
                  <tr key={i}>
                    <td><b>{c.course_code}</b></td>
                    <td>{lang === "en" ? (c.name_en || c.name) : (c.name || c.name_en)}</td>
                    <td>{c.credit}</td>
                    <td>{c.semester || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}