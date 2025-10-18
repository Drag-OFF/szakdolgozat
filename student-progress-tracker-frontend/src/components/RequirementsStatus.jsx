import React, { useEffect, useState } from "react";
import CourseList from "./CourseList";
import useAuthFetch from "../hooks/useAuthFetch";
import "../styles/RequirementsStatus.css";
import { useLang } from "../context/LangContext";
import { REQUIREMENTS_LABELS } from "../translations";

function CreditRow({ title, data }) {
  return (
    <tr>
      <td>{title}</td>
      <td>{data.completed}</td>
      <td>{data.required}</td>
      <td>{data.missing}</td>
    </tr>
  );
}

export default function RequirementsStatus() {
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);

  // Minden szekcióhoz külön open state, alapból false
  const [openRequired, setOpenRequired] = useState(false);
  const [openCore, setOpenCore] = useState(false);
  const [openInfoCore, setOpenInfoCore] = useState(false);
  const [openNonCore, setOpenNonCore] = useState(false);
  const [openOptional, setOpenOptional] = useState(false);
  const [openPE, setOpenPE] = useState(false);
  const [openPractice, setOpenPractice] = useState(false);
  const [openThesis1, setOpenThesis1] = useState(false);
  const [openThesis2, setOpenThesis2] = useState(false);
  const { lang } = useLang();
  const { fetchJson } = useAuthFetch();

  useEffect(() => {
    if (!user.id) return;
    (async () => {
      const { res, body } = await fetchJson(`/api/requirements/${user.id}`);
      setReq(body || {});
    })();
  }, [user.id, fetchJson]);

  if (!user.id) return <div className="auth-msg">Jelentkezz be a követelmények megtekintéséhez!</div>;
  if (loading) return <div>Betöltés...</div>;
  if (!req) return <div>Nem sikerült lekérni a követelményeket.</div>;

  return (
    <div className="requirements-status">
      <h2>{lang === "en" ? "Requirements status" : "Követelmények állapota"}</h2>
      <table>
        <thead>
          <tr>
            {REQUIREMENTS_LABELS.tableHeaders[lang].map(h => <th key={h}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          <CreditRow title={REQUIREMENTS_LABELS.sectionTitles[lang].total} data={req.total_credits} />
          <CreditRow title={REQUIREMENTS_LABELS.sectionTitles[lang].required} data={req.required_credits} />
          <CreditRow title={REQUIREMENTS_LABELS.sectionTitles[lang].elective} data={req.elective_credits} />
          <CreditRow title={REQUIREMENTS_LABELS.sectionTitles[lang].optional} data={req.optional_credits} />
          <CreditRow title={REQUIREMENTS_LABELS.sectionTitles[lang].pe} data={req.pe_semesters} />
          <CreditRow title={REQUIREMENTS_LABELS.sectionTitles[lang].practice} data={req.practice_hours} />
        </tbody>
      </table>

      <CourseList
        courses={req.required_credits.available_courses}
        title={REQUIREMENTS_LABELS.courseListTitles[lang].required}
        defaultOpen={openRequired}
        setDefaultOpen={setOpenRequired}
      />
      <CourseList
        courses={req.elective_credits.core.available_courses}
        title={REQUIREMENTS_LABELS.courseListTitles[lang].core}
        defaultOpen={openCore}
        setDefaultOpen={setOpenCore}
      />
      <CourseList
        courses={req.elective_credits.core.info_core.available_courses}
        title={REQUIREMENTS_LABELS.courseListTitles[lang].info_core}
        defaultOpen={openInfoCore}
        setDefaultOpen={setOpenInfoCore}
      />
      <CourseList
        courses={req.elective_credits.non_core.available_courses}
        title={REQUIREMENTS_LABELS.courseListTitles[lang].non_core}
        defaultOpen={openNonCore}
        setDefaultOpen={setOpenNonCore}
      />
      <CourseList
        courses={req.optional_credits.available_courses}
        title={REQUIREMENTS_LABELS.courseListTitles[lang].optional}
        defaultOpen={openOptional}
        setDefaultOpen={setOpenOptional}
      />
      <CourseList
        courses={req.pe_semesters.available_courses}
        title={REQUIREMENTS_LABELS.courseListTitles[lang].pe}
        defaultOpen={openPE}
        setDefaultOpen={setOpenPE}
      />
      <CourseList
        courses={req.practice_hours.available_courses}
        title={REQUIREMENTS_LABELS.courseListTitles[lang].practice}
        defaultOpen={openPractice}
        setDefaultOpen={setOpenPractice}
      />
      <CourseList
        courses={req.available_thesis1}
        title={REQUIREMENTS_LABELS.courseListTitles[lang].thesis1}
        defaultOpen={openThesis1}
        setDefaultOpen={setOpenThesis1}
      />
      <CourseList
        courses={req.available_thesis2}
        title={REQUIREMENTS_LABELS.courseListTitles[lang].thesis2}
        defaultOpen={openThesis2}
        setDefaultOpen={setOpenThesis2}
      />
    </div>
  );
}