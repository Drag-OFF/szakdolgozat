import React from "react";
import { useLang } from "../context/LangContext";


export default function ProgressTable({ progressFull }) {
  const { lang } = useLang();

  const HEADERS = {
    hu: ["Kód", "Név", "Kategória", "Ajánlott félév", "Kredit", "Teljesítés szemesztere", "Státusz", "Pontszám"],
    en: ["Code", "Name", "Category", "Recommended semester", "Credit", "Completed semester", "Status", "Points"]
  };

  return (
    <table className="progress-table" style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {HEADERS[lang].map(h => <th key={h}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {progressFull.map(p => (
          <tr key={p.id}>
            <td>{p.course_code || "?"}</td>
            <td>{p.course_name || "?"}</td>
            <td>{p.category || "?"}</td>
            <td>
              {p.recommended_semester !== null && p.recommended_semester !== undefined
                ? p.recommended_semester > 0
                  ? p.recommended_semester
                  : (lang === "en" ? "No recommended semester" : "Nincs ajánlott félév")
                : "?"}
            </td>
            <td>
              {p.credit !== null && p.credit !== undefined
                ? p.credit > 30
                  ? `${p.credit} ${lang === "en" ? "hours" : "óra"}`
                  : p.credit
                : "?"}
            </td>
            <td>{p.completed_semester || "-"}</td>
            <td>{p.status || "?"}</td>
            <td>{p.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}