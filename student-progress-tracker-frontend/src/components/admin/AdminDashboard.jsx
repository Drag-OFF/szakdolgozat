import React, { useState } from "react";
import UsersPanel from "./UsersPanel";
import CoursesPanel from "./CoursesPanel";
import CourseMajorPanel from "./CourseMajorPanel";
import CourseEquivalencesPanel from "./CourseEquivalencesPanel";
import ProgressPanel from "./ProgressPanel";
import MajorRequirementsPanel from "./MajorRequirementsPanel";
import MajorsPanel from "./MajorsPanel";
import "../../styles/ProgressTable.css";
import "../../styles/AdminPanels.css"; // <-- import the card styles globally for admin
import { useLang } from "../../context/LangContext";

export default function AdminDashboard() {
  const { lang } = useLang();
  const [open, setOpen] = useState({
    users: true,
    courses: false,
    majors: false,
    courseMajor: false,
    equivalences: false,
    majorRequirements: false,
    progress: false
  });
  const toggle = (k) => setOpen(o => ({ ...o, [k]: !o[k] }));

  return (
    <div style={{ padding: 12, marginBottom: 48 }}>
      <h1 className="panel-header-inline admin-title">
        {lang === "en" ? "Admin panel" : "Admin felület"}
      </h1>

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
             <div style={{ paddingLeft: 8 }}>
               <CoursesPanel />
               <div style={{ height: 12 }} />
              <header
                className="panel-header-inline"
                onClick={() => toggle("courseMajor")}
                aria-expanded={open.courseMajor}
              >
                {lang === "en" ? "Course-major mappings" : "Kurzus-szak kapcsolatok"} <span className="toggle-icon">{open.courseMajor ? "▲" : "▼"}</span>
              </header>
               {open.courseMajor && <CourseMajorPanel />}
               <div style={{ height: 12 }} />
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
        <div style={{ height: 64 }} />
      
    </div>
  );
}