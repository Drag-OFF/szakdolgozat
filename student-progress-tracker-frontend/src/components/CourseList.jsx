import React from "react";
import "../styles/RequirementsStatus.css";
import "../styles/ProgressTable.css";
import { useLang } from "../context/LangContext";
import Button from "./Button";

const PAGE_SIZE = 10;
const EMPTY_COURSES = [];

export default function CourseList({ courses, title, defaultOpen, setDefaultOpen }) {
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(0);
  const { lang } = useLang();
  const list = Array.isArray(courses) ? courses : EMPTY_COURSES;
  const t = lang === "en"
    ? {
        search: "Search by course name or code...",
        empty: "No available courses.",
        code: "Code",
        name: "Name",
        credit: "Credits",
        semester: "Recommended semester",
        prev: "Prev",
        pageLabel: "Page",
        next: "Next",
        total: "records total"
      }
    : {
        search: "Keresés név vagy kód alapján...",
        empty: "Nincs elérhető kurzus.",
        code: "Kód",
        name: "Név",
        credit: "Kredit",
        semester: "Ajánlott félév",
        prev: "Előző",
        pageLabel: "Oldal",
        next: "Következő",
        total: "rekord összesen"
      };

  const filtered = list.filter(
    c =>
      String(c.course_code || "").toLowerCase().includes(search.toLowerCase()) ||
      (lang === "en"
        ? String(c.name_en || c.name || "").toLowerCase().includes(search.toLowerCase())
        : String(c.name || c.name_en || "").toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  React.useEffect(() => {
    setPage(0);
  }, [search]);

  React.useEffect(() => {
    setPage((p) => (p >= totalPages ? Math.max(0, totalPages - 1) : p));
  }, [filtered.length, totalPages]);

  const displayed = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="user-courselist-card user-courselist-card--paged">
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
                <div className="progress-toolbar-group progress-toolbar-group--search">
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
            </div>
            {filtered.length === 0 ? (
              <div className="user-courselist-empty">{t.empty}</div>
            ) : (
              <>
                <div className="progress-table-wrapper user-courselist-table-wrap">
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
                      {displayed.map((c, i) => (
                        <tr key={`${c.course_code}-${page}-${i}`}>
                          <td><b>{c.course_code}</b></td>
                          <td>{lang === "en" ? (c.name_en || c.name) : (c.name || c.name_en)}</td>
                          <td>{c.credit}</td>
                          <td>{c.semester ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="progress-courses-pagination user-courselist-pagination">
                  <Button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page <= 0}
                    variant="ghost"
                    size="sm"
                  >
                    {t.prev}
                  </Button>
                  <div>{`${t.pageLabel} ${page + 1} / ${totalPages}`}</div>
                  <Button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    variant="ghost"
                    size="sm"
                  >
                    {t.next}
                  </Button>
                  <div className="progress-courses-pagination-total">
                    {`${filtered.length} ${t.total}`}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
