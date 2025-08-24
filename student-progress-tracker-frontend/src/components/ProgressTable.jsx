import React from "react";


export default function ProgressTable({ progressFull }) {

const CATEGORY_LABELS = {
  required: "Kötelező",
  elective: "Kötelezően választható",
  "szabadon választható": "Szabadon választható"
};

const STATUS_LABELS = {
  completed: "Teljesített",
  in_progress: "Folyamatban"
};

  return (
    <table className="progress-table" style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th>Kód</th>
          <th>Név</th>
          <th>Kategória</th>
          <th>Ajánlott félév</th>
          <th>Kredit</th>
          <th>Teljesítés szemesztere</th>
          <th>Státusz</th>
          <th>Pontszám</th>
        </tr>
      </thead>
      <tbody>
        {progressFull.map(p => (
          <tr key={p.id}>
            <td>{p.course_code || "?"}</td>
            <td>{p.course_name || "?"}</td>
            <td>{CATEGORY_LABELS[p.category] || p.category || "?"}</td>
            <td>
              {p.recommended_semester !== null && p.recommended_semester !== undefined
                ? p.recommended_semester > 0
                  ? p.recommended_semester
                  : "Nincs ajánlott félév"
                : "?"}
            </td>
            <td>
              {p.credit !== null && p.credit !== undefined
                ? p.credit > 30
                  ? `${p.credit} óra`
                  : p.credit
                : "?"}
            </td>
            <td>{p.completed_semester || "-"}</td>
            <td>{STATUS_LABELS[p.status] || p.status || "?"}</td>
            <td>{p.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}