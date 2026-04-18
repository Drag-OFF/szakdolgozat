import React, { useState } from "react";
import { Link } from "react-router-dom";
import UsersPanel from "./UsersPanel";
import CoursesPanel from "./CoursesPanel";
import CourseMajorPanel from "./CourseMajorPanel";
import CourseEquivalencesPanel from "./CourseEquivalencesPanel";
import ProgressPanel from "./ProgressPanel";
import MajorRequirementsPanel from "./MajorRequirementsPanel";
import MajorsPanel from "./MajorsPanel";
import "../../styles/ProgressTable.css";
import "../../styles/AdminPanels.css"; // <-- import the card styles globally for admin
import "../../styles/AdminDashboard.css";
import { useLang } from "../../context/LangContext";

export default function AdminDashboard() {
  const { lang } = useLang();
  const [open, setOpen] = useState({
    users: false,
    courses: false,
    majors: false,
    courseMajor: false,
    equivalences: false,
    majorRequirements: false,
    progress: false
  });
  const toggle = (k) => setOpen(o => ({ ...o, [k]: !o[k] }));

  return (
    <div className="admin-dashboard">
      <h1 className="panel-header-inline admin-title">
        {lang === "en" ? "Admin panel" : "Admin felület"}
      </h1>

      <section className="admin-card" style={{ marginBottom: 12 }}>
        <div className="admin-card-body admin-quick-card-body">
          <Link to="/admin/pdf-import" className="admin-quick-link admin-quick-link--teal">
            {lang === "en" ? "Neptun curriculum import (PDF / tanterv)" : "Neptun mintatanterv import (PDF / tanterv)"}
          </Link>
          <p className="admin-quick-hint">
            {lang === "en"
              ? "Expand the public Neptun table (+ rows) and import courses & requirement rules into the database."
              : "Nyilvános Neptun tanterv lenyitása („+” sorok), kurzusok és követelmény szabályok importálása."}
          </p>
        </div>
      </section>

      <section className="admin-card" style={{ marginBottom: 12 }}>
        <div className="admin-card-body admin-quick-card-body">
          <Link to="/admin/progress-pdf-check" className="admin-quick-link admin-quick-link--blue">
            {lang === "en" ? "PDF what-if progress check" : "PDF mi-lenne-ha progress ellenőrzés"}
          </Link>
          <p className="admin-quick-hint">
            {lang === "en"
              ? "Analyze one or more student PDFs without saving, and see whether diploma requirements would be complete."
              : "Egy vagy több hallgatói PDF elemzése mentés nélkül: teljesülnének-e a diploma követelményei."}
          </p>
        </div>
      </section>

      <section className="admin-card" style={{ marginBottom: 12 }}>
        <div className="admin-card-body">
          <header
            className="panel-header-inline"
            onClick={() => toggle("majors")}
            aria-expanded={open.majors}
          >
            {lang === "en" ? "Majors" : "Szakok"} <span className="toggle-icon">{open.majors ? "▲" : "▼"}</span>
          </header>
          {open.majors && <MajorsPanel />}
        </div>
      </section>

      <section className="admin-card" style={{ marginBottom: 12 }}>
        <div className="admin-card-body">
          <header
            className="panel-header-inline"
            onClick={() => toggle("users")}
            aria-expanded={open.users}
          >
            {lang === "en" ? "Users" : "Felhasználók"} <span className="toggle-icon">{open.users ? "▲" : "▼"}</span>
          </header>
          {open.users && <UsersPanel />}
        </div>
      </section>

      <section className="admin-card" style={{ marginBottom: 12 }}>
        <div className="admin-card-body">
          <header
            className="panel-header-inline"
            onClick={() => toggle("courses")}
            aria-expanded={open.courses}
          >
            {lang === "en" ? "Courses" : "Kurzusok"} <span className="toggle-icon">{open.courses ? "▲" : "▼"}</span>
          </header>
           {open.courses && (
             <div className="admin-courses-nested">
               <CoursesPanel />
               <div className="admin-spacer-h12" />
              <header
                className="panel-header-inline"
                onClick={() => toggle("courseMajor")}
                aria-expanded={open.courseMajor}
              >
                {lang === "en" ? "Course-major mappings" : "Kurzus-szak kapcsolatok"} <span className="toggle-icon">{open.courseMajor ? "▲" : "▼"}</span>
              </header>
               {open.courseMajor && <CourseMajorPanel />}
               <div className="admin-spacer-h12" />
              <header
                className="panel-header-inline"
                onClick={() => toggle("equivalences")}
                aria-expanded={open.equivalences}
              >
                {lang === "en" ? "Equivalences" : "Ekvivalenciák"} <span className="toggle-icon">{open.equivalences ? "▲" : "▼"}</span>
              </header>
               {open.equivalences && <CourseEquivalencesPanel />}
             </div>
           )}
         </div>
       </section>
 
      <section className="admin-card" style={{ marginBottom: 12 }}>
        <div className="admin-card-body">
          <header
            className="panel-header-inline"
            onClick={() => toggle("progress")}
            aria-expanded={open.progress}
          >
            {lang === "en" ? "Progress (manual edit)" : "Progress (kézi módosítás)"} <span className="toggle-icon">{open.progress ? "▲" : "▼"}</span>
          </header>
          {open.progress && <ProgressPanel />}
        </div>
      </section>

      <section className="admin-card" style={{ marginBottom: 12 }}>
        <div className="admin-card-body">
          <header
            className="panel-header-inline"
            onClick={() => toggle("majorRequirements")}
            aria-expanded={open.majorRequirements}
          >
            {lang === "en" ? "Major requirement rules" : "Szak követelmény szabályok"}{" "}
            <span className="toggle-icon">{open.majorRequirements ? "▲" : "▼"}</span>
          </header>
          {open.majorRequirements && <MajorRequirementsPanel />}
        </div>
      </section>

        {/* Extra space to prevent footer overlap */}
        <div className="admin-footer-spacer" />
      
    </div>
  );
}