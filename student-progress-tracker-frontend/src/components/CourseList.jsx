import React from "react";
import "../styles/RequirementsStatus.css";

export default function CourseList({ courses, title, defaultOpen, setDefaultOpen }) {
  const [search, setSearch] = React.useState("");

  const filtered = (courses || []).filter(
    c =>
      c.course_code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
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
              placeholder="Keresés név vagy kód alapján..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {filtered.length === 0 ? (
            <div>Nincs elérhető kurzus.</div>
          ) : (
            <table className="course-table">
              <thead>
                <tr>
                  <th>Kód</th>
                  <th>Név</th>
                  <th>Kredit</th>
                  <th>Ajánlott félév</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={i}>
                    <td><b>{c.course_code}</b></td>
                    <td>{c.name}</td>
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