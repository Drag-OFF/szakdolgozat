import React, { useEffect, useState } from "react";
import CourseList from "./CourseList";
import { authFetch } from "../utils";
import "../styles/RequirementsStatus.css";

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

  useEffect(() => {
    if (!user.id) return;
    setLoading(true);
    authFetch(`http://192.168.0.12:8000/api/progress/${user.id}/requirements`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` }
    })
      .then(res => res.json())
      .then(data => {
        setReq(data);
        setLoading(false);
      });
  }, [user.id]);

  if (!user.id) return <div className="auth-msg">Jelentkezz be a követelmények megtekintéséhez!</div>;
  if (loading) return <div>Betöltés...</div>;
  if (!req) return <div>Nem sikerült lekérni a követelményeket.</div>;

  return (
    <div className="requirements-status">
      <h2>Követelmények állapota</h2>
      <table>
        <thead>
          <tr>
            <th>Kategória</th>
            <th>Teljesített</th>
            <th>Szükséges</th>
            <th>Hiányzik</th>
          </tr>
        </thead>
        <tbody>
          <CreditRow title="Összes kredit" data={req.total_credits} />
          <CreditRow title="Kötelező" data={req.required_credits} />
          <CreditRow title="Kötelezően választható" data={req.elective_credits} />
          <CreditRow title="Szabadon választható" data={req.optional_credits} />
          <CreditRow title="Testnevelés félévek" data={req.pe_semesters} />
          <CreditRow title="Szakmai gyakorlat" data={req.practice_hours} />
        </tbody>
      </table>

      {/* Minden szekció külön lenyitható, alapból csukva */}
      <CourseList
        courses={req.required_credits.available_courses}
        title="Kötelező tárgyak – elérhető kurzusok"
        defaultOpen={openRequired}
        setDefaultOpen={setOpenRequired}
      />
      <CourseList
        courses={req.elective_credits.core.available_courses}
        title="Kötelezően választható – Tözsanyag (minimum 80 kredit informatikai törzsanyaggal együtt)"
        defaultOpen={openCore}
        setDefaultOpen={setOpenCore}
      />
      <CourseList
        courses={req.elective_credits.core.info_core.available_courses}
        title="Kötelezően választható – Tözsanyag informatikai (minimum 14 kredit)"
        defaultOpen={openInfoCore}
        setDefaultOpen={setOpenInfoCore}
      />
      <CourseList
        courses={req.elective_credits.non_core.available_courses}
        title="Kötelezően választható – Nem törzsanyag (Minimum 36 kredit)"
        defaultOpen={openNonCore}
        setDefaultOpen={setOpenNonCore}
      />
      <CourseList
        courses={req.optional_credits.available_courses}
        title="Szabadon választható – elérhető kurzusok (minimum 10 kredit)"
        defaultOpen={openOptional}
        setDefaultOpen={setOpenOptional}
      />
      <CourseList
        courses={req.pe_semesters.available_courses}
        title="Testnevelés – elérhető kurzusok (minimum 2 félév)"
        defaultOpen={openPE}
        setDefaultOpen={setOpenPE}
      />
      <CourseList
        courses={req.practice_hours.available_courses}
        title="Szakmai gyakorlat – elérhető kurzusok (minimum 320 óra)"
        defaultOpen={openPractice}
        setDefaultOpen={setOpenPractice}
      />
      <CourseList
        courses={req.available_thesis1}
        title="Szakdolgozat 1 – elérhető kurzusok"
        defaultOpen={openThesis1}
        setDefaultOpen={setOpenThesis1}
      />
      <CourseList
        courses={req.available_thesis2}
        title="Szakdolgozat 2 – elérhető kurzusok"
        defaultOpen={openThesis2}
        setDefaultOpen={setOpenThesis2}
      />
    </div>
  );
}